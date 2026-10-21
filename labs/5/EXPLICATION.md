# COMP4537 — Lab 5 : explication complète

Ce document explique **tout** ce qui a été construit, fichier par fichier, avec le code
et le raisonnement. Objectif : que tu puisses répondre à n'importe quelle question en
personne (rappel : **-2 par question** à laquelle tu ne sais pas répondre).

---

## 1. Vue d'ensemble

Le lab demande une application **client / serveur sur DEUX origines différentes** :

```
Navigateur
   │
   │  (1) sert les fichiers statiques            (2) requêtes GET/POST (fetch)
   ▼                                                        │
server1  (CLIENT, statique, origine 1)                      ▼
  index.html + strings.js                        server2  (API Node.js, origine 2)
                                                   server.js  ──────►  MySQL (Aiven)
                                                                        table "patient"
```

- **server1** = juste des fichiers statiques (HTML/JS). Pas de base, pas de backend.
- **server2** = un serveur HTTP Node.js **sans Express** (interdit), qui parle à MySQL.
- Les deux doivent être **hébergés séparément** (sinon **-4** pour « même origine »).

Pourquoi deux origines ? C'est une contrainte pédagogique du cours : ça force à gérer
le **CORS** (Cross-Origin Resource Sharing) correctement, puisque le client appelle une
API qui n'est pas sur le même domaine.

### Arborescence finale

```
labs/5/
├── README.md              → résumé + instructions de déploiement
├── ATTRIBUTION.md         → crédits (ChatGPT, librairies)
├── EXPLICATION.md         → ce document
├── server1/               → CLIENT (origine 1)
│   ├── index.html         → la page (2 boutons + 1 textarea + zone de réponse)
│   └── strings.js         → TOUTES les chaînes texte (exigence du lab)
└── server2/               → API Node.js (origine 2)
    ├── server.js          → le serveur HTTP + logique DB
    ├── strings.js         → chaînes/messages côté serveur
    ├── setup-db.sql       → crée les 2 users DB (à lancer une fois)
    ├── .env               → secrets réels (NE PAS publier)
    ├── .env.example       → modèle sans secrets
    ├── .gitignore         → ignore .env et node_modules
    ├── package.json       → dépendances + script `start`
    └── node_modules/      → mysql2, dotenv
```

---

## 2. Le modèle de données

La table `patient` a 3 colonnes :

```sql
CREATE TABLE IF NOT EXISTS patient (
    patientid   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- clé auto-incrémentée
    name        VARCHAR(100) NOT NULL,
    dateOfBirth DATETIME     NOT NULL
) ENGINE=InnoDB
```

- `patientid` : généré tout seul par MySQL (1, 2, 3, …). On ne l'insère jamais.
- `CREATE TABLE IF NOT EXISTS` : ne crée la table que si elle n'existe pas déjà → on
  peut relancer sans erreur. La **note du lab** exige qu'on vérifie l'existence de la
  table **avant chaque insertion** (voir §5).

---

## 3. La sécurité : le point le plus important du lab

### Le problème
La textarea laisse **n'importe quel visiteur taper du SQL**. Rien n'empêche quelqu'un
d'écrire `DROP TABLE patient` ou `DELETE FROM patient`.

### La MAUVAISE solution (qui ferait perdre des points)
Filtrer avec du code genre « si la requête commence par DROP, je refuse ». Problème :
c'est contournable (`dRoP`, espaces, commentaires `/* */`, requêtes empilées…). Le lab
dit explicitement que **la seule méthode fiable est de restreindre les privilèges du
user DB**.

### La BONNE solution : le Principe du Moindre Privilège (Least Privilege)
On crée **DEUX utilisateurs de base de données** (c'est la réponse au « combien de
users DB faut-il ? ») :

| User DB        | Privilèges accordés        | Utilisé par | Peut DROP/DELETE/UPDATE ? |
|----------------|----------------------------|-------------|---------------------------|
| `lab5_writer`  | `SELECT, INSERT, CREATE`   | **POST**    | ❌ Non                    |
| `lab5_reader`  | `SELECT` uniquement        | **GET**     | ❌ Non                    |

Ainsi, quand un visiteur envoie `DROP TABLE patient` dans la textarea (chemin **GET**),
la requête part réellement vers MySQL **sous l'identité de `lab5_reader`**, et c'est
**MySQL lui-même qui la refuse** parce que ce user n'a pas le privilège. On a testé :

```
GET .../DROP%20TABLE%20patient
→ {"error":"DROP command denied to user 'lab5_reader'@'...' for table 'patient'"}
```

C'est exactement ce que le correcteur veut voir (évite le **-3**).

> Remarque : même le user `lab5_writer` (POST) n'a **pas** DROP/DELETE/UPDATE. On lui
> donne seulement ce dont le bouton Insert a besoin : INSERT (insérer), CREATE (créer la
> table si absente) et SELECT. C'est le principe du moindre privilège appliqué partout.

### Le script qui crée ces users : `server2/setup-db.sql`

```sql
-- Utilisateur en ÉCRITURE (POST / bouton Insert)
CREATE USER IF NOT EXISTS 'lab5_writer'@'%' IDENTIFIED BY '...';
GRANT SELECT, INSERT, CREATE ON defaultdb.* TO 'lab5_writer'@'%';  -- PAS de DROP/DELETE/UPDATE

-- Utilisateur en LECTURE SEULE (GET / textarea)
CREATE USER IF NOT EXISTS 'lab5_reader'@'%' IDENTIFIED BY '...';
GRANT SELECT ON defaultdb.* TO 'lab5_reader'@'%';                  -- lecture seule

FLUSH PRIVILEGES;
```

Ces deux users ont été **réellement créés sur ta base Aiven** (vérifié avec
`SHOW GRANTS`). Le user admin `avnadmin` n'est **plus utilisé** par l'application.

---

## 4. Le client : `server1/`

### 4.1 `server1/strings.js` — toutes les chaînes au même endroit

Le lab impose : **-2 si les user strings ne sont pas stockées séparément**. Donc tout le
texte affiché (titres, labels, messages) **et** la config (URL de l'API, lignes à
insérer) vivent dans un seul objet `STRINGS` :

```js
const STRINGS = {
    // URL de l'API server2 (AUTRE origine). À changer selon le déploiement.
    API_BASE: "http://localhost:3000/COMP4537/labs/5/api/v1/sql/",

    TITLE: "Lab 5 — Patient database",
    INSERT_BTN: "Insert",
    SUBMIT_BTN: "Submit",
    QUERY_PLACEHOLDER: "SELECT * FROM patient",
    // ... (messages d'état, erreurs, etc.)

    // Les 4 lignes à insérer à chaque clic (le devoir)
    ROWS: [
        ["Sara Brown", "1901-01-01"],
        ["John Smith", "1941-01-01"],
        ["Jack Ma",    "1961-01-30"],
        ["Elon Musk",  "1999-01-01"],
    ],
};
```

Avantage : pour traduire l'appli ou changer l'URL de l'API, on ne touche qu'à ce fichier.

### 4.2 `server1/index.html` — la page

**Structure HTML** (vide de texte : tout est injecté depuis `strings.js`) :

```html
<script src="strings.js"></script>   <!-- charge l'objet STRINGS avant notre code -->
...
<input type="text" id="apiBase">     <!-- champ pour l'URL de l'API -->

<!-- 1) INSERT (POST) -->
<button id="insertBtn"></button>

<!-- 2) QUERY (GET) -->
<textarea id="sqlQuery" rows="4"></textarea>
<button id="submitBtn"></button>

<!-- Réponse du serveur -->
<pre id="output"></pre>
```

**Injection des textes** depuis `STRINGS` (pourquoi ? pour respecter la règle « strings
séparées ») :

```js
document.getElementById("title").textContent = STRINGS.TITLE;
document.getElementById("insertBtn").textContent = STRINGS.INSERT_BTN;
apiBase.value = STRINGS.API_BASE;
// ... idem pour tous les éléments
```

**Construction de la requête INSERT** (une seule requête pour les 4 lignes) :

```js
function buildInsertQuery() {
    const values = STRINGS.ROWS
        .map(([name, dob]) => `('${name}', '${dob}')`)   // ('Sara Brown', '1901-01-01'), ...
        .join(", ");
    return `INSERT INTO patient (name, dateOfBirth) VALUES ${values}`;
}
```

On n'insère pas `patientid` → il est auto-généré. Comme il n'y a pas de contrainte
d'unicité sur `name`, **chaque clic ré-insère les 4 lignes** et la table grandit.

**Le bouton Insert → requête POST** :

```js
insertBtn.addEventListener("click", async () => {
    insertBtn.disabled = true;                    // évite les double-clics
    output.textContent = STRINGS.SENDING_POST;
    try {
        const res = await fetch(apiBase.value.trim(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: buildInsertQuery() })   // { "query": "INSERT ..." }
        });
        showResponse(res, await parseBody(res));  // affiche la réponse du serveur
    } catch (err) {
        output.textContent = STRINGS.REQUEST_FAILED + err.message;
    } finally {
        insertBtn.disabled = false;
    }
});
```

**Le bouton Submit → requête GET** (la requête SQL est **encodée dans l'URL**) :

```js
submitBtn.addEventListener("click", async () => {
    const query = sqlQuery.value.trim();
    if (!query) return;
    // encodeURIComponent transforme "select * from patient" en "select%20*%20from%20patient"
    const endpoint = apiBase.value.trim() + encodeURIComponent(query);

    const res = await fetch(endpoint, { method: "GET" });
    showResponse(res, await parseBody(res));
});
```

Pourquoi `encodeURIComponent` ? Les espaces, `*`, etc. ne sont pas valides tels quels
dans une URL. C'est aussi ce que demande l'énoncé pour le lien d'exemple :
`.../api/v1/sql/select%20*%20from%20patient`.

**Affichage de la réponse du serveur** (statut HTTP + corps JSON) :

```js
function showResponse(res, data) {
    output.textContent =
        `HTTP ${res.status} ${res.statusText}\n` +
        (typeof data === "string" ? data : JSON.stringify(data, null, 2));
}
```

> Aucune librairie (pas de jQuery, pas de framework) → on utilise uniquement `fetch`,
> `document.getElementById`, etc. C'est exigé (sinon **-4**).

---

## 5. Le serveur : `server2/`

### 5.1 `server2/strings.js`

Même logique que côté client : tous les messages/chemins au même endroit.

```js
module.exports = {
    BASE_PATH: "/COMP4537/labs/5/api/v1/sql/",
    LOG_LISTENING: (port) => `Server2 (API) en ecoute sur le port ${port}`,
    ERR_NOT_FOUND: "404 : route introuvable",
    ERR_POST_INSERT_ONLY: "Seules les requetes INSERT sont autorisees via POST",
    // ...
};
```

### 5.2 `server2/server.js`

C'est une **classe `Server`** (le cours est passé en POO, cf. le dernier commit git).

**(a) Les dépendances** :

```js
require("dotenv/config");                 // charge .env dans process.env
const http = require("http");             // serveur HTTP natif (PAS Express)
const mysql = require("mysql2/promise");  // driver MySQL (autorisé : module DB)
const STR = require("./strings");         // nos messages
```

**(b) Deux pools de connexions = deux users DB** :

```js
constructor(port) {
    this.port = port;
    // writePool → user lab5_writer (SELECT, INSERT, CREATE) → pour POST
    // readPool  → user lab5_reader (SELECT only)            → pour GET
    this.writePool = this.createPool(process.env.DB_WRITE_USER, process.env.DB_WRITE_PASSWORD);
    this.readPool  = this.createPool(process.env.DB_READ_USER,  process.env.DB_READ_PASSWORD);
}

createPool(dbUser, dbPassword) {
    if (!process.env.DB_HOST || !dbUser) throw new Error(STR.ERR_NO_DB_CONFIG);
    return mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: dbUser,
        password: dbPassword,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },  // Aiven impose le SSL
        waitForConnections: true,
    });
}
```

Un **pool** = un réservoir de connexions réutilisables (plus efficace que d'ouvrir/fermer
une connexion à chaque requête). C'est ici que se joue la sécurité : le choix du pool
(`readPool` vs `writePool`) détermine **sous quel user DB** la requête tourne.

**(c) Création de la table (via le writer)** :

```js
async ensureTable() {
    await this.writePool.query(`
        CREATE TABLE IF NOT EXISTS patient ( ... ) ENGINE=InnoDB
    `);
}
async init() { await this.ensureTable(); }   // appelé au démarrage
```

**(d) Démarrage du serveur** :

```js
async StartServer() {
    await this.init();                        // crée la table au boot
    http.createServer((req, res) => this.RequestHandler(req, res))
        .listen(this.port, () => console.log(STR.LOG_LISTENING(this.port)));
}
```

**(e) CORS** (indispensable car client et API sont sur des origines différentes) :

```js
setCors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");             // autorise toute origine
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
```

Le navigateur envoie d'abord une requête « preflight » `OPTIONS` avant un POST
cross-origin ; on y répond `204` (pas de contenu) :

```js
if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
```

**(f) Le routeur « maison »** (on n'a pas le droit à Express) :

```js
RequestHandler(req, res) {
    this.setCors(res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // tout doit commencer par /COMP4537/labs/5/api/v1/sql/
    if (!url.pathname.startsWith(BASE_PATH))
        return this.sendJson(res, 404, { error: STR.ERR_NOT_FOUND });

    if (req.method === "GET")  return this.handleGet(url, res);
    if (req.method === "POST") return this.handlePost(req, res);

    this.sendJson(res, 405, { error: STR.ERR_METHOD_NOT_ALLOWED });
}
```

**(g) GET = lecture, via le user LECTURE SEULE** :

```js
async handleGet(url, res) {
    // on récupère la partie après BASE_PATH et on la décode
    const query = decodeURIComponent(url.pathname.substring(BASE_PATH.length)).trim();
    if (!query) return this.sendJson(res, 400, { error: STR.ERR_EMPTY_QUERY });

    try {
        const [rows] = await this.readPool.query(query);   // ← user lab5_reader
        this.sendJson(res, 200, rows);                     // renvoie les lignes en JSON
    } catch (err) {
        // si c'est un DROP/DELETE/UPDATE → MySQL renvoie "command denied"
        this.sendJson(res, 403, { error: err.message });   // 403 = interdit
    }
}
```

👉 **Point clé** : on ne filtre pas le SQL ici. On laisse volontairement la requête
atteindre MySQL, car c'est le **privilège du user `lab5_reader`** qui bloque les
commandes dangereuses. L'erreur de MySQL est renvoyée au client (statut 403).

**(h) POST = insertion, via le user ÉCRITURE** :

```js
handlePost(req, res) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));   // on accumule le corps de la requête
    req.on("end", async () => {
        let query = body;
        try { const p = JSON.parse(body); if (p && p.query) query = p.query; } catch (_) {}

        // garde-fou : le POST ne sert qu'à INSERER
        if (!/^insert\b/i.test(query.trim()))
            return this.sendJson(res, 400, { error: STR.ERR_POST_INSERT_ONLY });

        try {
            await this.ensureTable();                      // NOTE DU LAB : on (re)crée
            const [result] = await this.writePool.query(query);  // la table si absente
            this.sendJson(res, 200, {
                affectedRows: result.affectedRows,         // combien de lignes insérées
                insertId: result.insertId,                 // 1er id généré
            });
        } catch (err) {
            this.sendJson(res, 500, { error: err.message });
        }
    });
}
```

👉 **La « note » du lab** (« vérifier que la table existe à chaque insert, sinon la
recréer ») est satisfaite par l'appel `await this.ensureTable();` **au début de chaque
POST**, avant l'INSERT.

**(i) Lancement** :

```js
const PORT = process.env.PORT || 3000;
const server = new Server(PORT);
server.StartServer().catch((err) => { console.error(STR.LOG_START_FAIL, err.message); process.exit(1); });
```

### 5.3 `server2/.env` — la configuration (secrets)

```
DB_HOST=mysql-....aivencloud.com
DB_PORT=10946
DB_NAME=defaultdb

DB_WRITE_USER=lab5_writer          # user POST
DB_WRITE_PASSWORD=...
DB_READ_USER=lab5_reader           # user GET
DB_READ_PASSWORD=...

PORT=3000                          # port du serveur HTTP (≠ port DB)
```

`dotenv` lit ce fichier et remplit `process.env`. Le `.env` est dans `.gitignore` :
**ne jamais le pousser sur un repo public** (il contient les mots de passe DB).

> Au passage, on a corrigé un bug de la version initiale : avant, le serveur HTTP
> écoutait sur `process.env.port` qui valait `10946` (le port **MySQL**). Maintenant le
> port HTTP (`PORT`) et le port DB (`DB_PORT`) sont bien séparés.

---

## 6. Le flux d'une requête, étape par étape

### 6.1 Flux GET — « lire des patients » (textarea + bouton Submit)

```
┌──────────┐  (1) clic "Submit"
│ Visiteur │─────────────────────────────┐
└──────────┘                             ▼
                              ┌───────────────────────────┐
                              │ index.html (server1)       │
                              │ query = "SELECT * FROM      │
                              │          patient"           │
                              │ (2) encodeURIComponent      │
                              │  → "SELECT%20*%20FROM%20..." │
                              │ (3) fetch(API_BASE + query) │
                              └───────────────────────────┘
                                           │ (4) GET /COMP4537/labs/5/api/v1/sql/SELECT%20*%20FROM%20patient
                                           ▼
                              ┌───────────────────────────┐
                              │ server.js (server2)        │
                              │ (5) RequestHandler          │
                              │     - setCors()             │
                              │     - vérifie BASE_PATH     │
                              │     - method === "GET"      │
                              │ (6) handleGet()             │
                              │     - decodeURIComponent    │
                              │       → "SELECT * FROM ..."  │
                              │ (7) readPool.query(...)     │  ← user lab5_reader (SELECT only)
                              └───────────────────────────┘
                                           │ (8) requête SQL sous l'identité lab5_reader
                                           ▼
                              ┌───────────────────────────┐
                              │ MySQL (Aiven)              │
                              │ (9) exécute le SELECT       │
                              │     → renvoie les lignes    │
                              └───────────────────────────┘
                                           │ (10) [ {patientid, name, dateOfBirth}, ... ]
                                           ▼
                              ┌───────────────────────────┐
                              │ server.js                  │
                              │ (11) sendJson(200, rows)    │
                              └───────────────────────────┘
                                           │ (12) HTTP 200 + JSON
                                           ▼
                              ┌───────────────────────────┐
                              │ index.html                 │
                              │ (13) showResponse()         │
                              │  → affiche dans <pre>       │
                              └───────────────────────────┘
```

### 6.2 Flux GET bloqué — « DROP TABLE » (attaque / erreur)

```
Visiteur tape "DROP TABLE patient" dans la textarea
   │
   ▼  (1) GET .../DROP%20TABLE%20patient
server.js → handleGet() → readPool.query("DROP TABLE patient")
   │
   ▼  (2) requête envoyée à MySQL SOUS lab5_reader (qui n'a QUE SELECT)
MySQL
   │
   ▼  (3) REFUS : "DROP command denied to user 'lab5_reader'@'...'"
      (la commande n'est JAMAIS exécutée — c'est le privilège qui bloque)
   │
   ▼  (4) le .query() lève une exception → catch(err)
server.js → sendJson(403, { error: "DROP command denied ..." })
   │
   ▼  (5) HTTP 403
index.html → affiche le message d'erreur dans <pre>
```

> 💡 C'est **l'étape (3)** qui vaut les points : le blocage se fait **dans MySQL grâce au
> privilège**, pas dans notre code JavaScript.

### 6.3 Flux POST — « insérer les 4 patients » (bouton Insert)

```
┌──────────┐  (1) clic "Insert"
│ Visiteur │─────────────────────────────┐
└──────────┘                             ▼
                              ┌───────────────────────────┐
                              │ index.html (server1)       │
                              │ (2) buildInsertQuery()      │
                              │  → "INSERT INTO patient     │
                              │     (name, dateOfBirth)     │
                              │     VALUES ('Sara Brown',   │
                              │     '1901-01-01'), ..."      │
                              │ (3) fetch(API_BASE, {        │
                              │       method:"POST",         │
                              │       body: { query } })     │
                              └───────────────────────────┘
                                           │ (4) OPTIONS (preflight CORS) → 204
                                           │ (5) POST + corps JSON { "query": "INSERT ..." }
                                           ▼
                              ┌───────────────────────────┐
                              │ server.js (server2)        │
                              │ (6) handlePost()            │
                              │   - accumule le body        │
                              │   - JSON.parse → query      │
                              │   - regex: doit commencer   │
                              │     par INSERT (sinon 400)  │
                              │ (7) ensureTable()           │  ← NOTE du lab : (re)crée la table
                              │ (8) writePool.query(INSERT) │  ← user lab5_writer (SELECT,INSERT,CREATE)
                              └───────────────────────────┘
                                           │ (9) INSERT sous l'identité lab5_writer
                                           ▼
                              ┌───────────────────────────┐
                              │ MySQL (Aiven)              │
                              │ (10) insère 4 lignes        │
                              │  (patientid auto-généré)    │
                              └───────────────────────────┘
                                           │ (11) { affectedRows: 4, insertId: N }
                                           ▼
                              ┌───────────────────────────┐
                              │ server.js                  │
                              │ (12) sendJson(200, {...})   │
                              └───────────────────────────┘
                                           │ (13) HTTP 200 + JSON
                                           ▼
                              ┌───────────────────────────┐
                              │ index.html                 │
                              │ (14) showResponse()         │
                              │  → "affectedRows": 4        │
                              └───────────────────────────┘
```

### Récapitulatif en une phrase

- **GET** → `readPool` → user `lab5_reader` → **lecture seule** (DROP/DELETE/UPDATE refusés par MySQL).
- **POST** → `writePool` → user `lab5_writer` → **INSERT** (+ `ensureTable` avant chaque insert).

---

## 7. Les contraintes du lab et comment on y répond

| Contrainte / déduction                                   | Comment c'est traité                                   |
|----------------------------------------------------------|--------------------------------------------------------|
| Empêcher DROP/DELETE/UPDATE (**-3**)                     | 2 users DB, GET en lecture seule (`lab5_reader`)       |
| Client et serveur même origine (**-4**)                  | `server1` (statique) et `server2` (API) séparés        |
| jQuery / Express / routing (**-4**)                      | `http` natif + `fetch` seulement ; aucun framework     |
| `var` interdit (**-2**)                                  | uniquement `const` / `let`                             |
| Strings non séparées (**-2**)                            | `strings.js` côté client ET serveur                    |
| URLs mal postées (**-3**)                                | à faire sur Learning Hub : `https` + espace + lien     |
| Attribution                                              | `ATTRIBUTION.md`                                       |
| Questions sans réponse (**-2 chacune**)                  | ← ce document                                          |

---

## 8. Comment lancer / tester en local

```bash
# 1) Démarrer l'API (server2)
cd server2
npm install          # installe mysql2 + dotenv
npm start            # → "Server2 (API) en ecoute sur le port 3000"

# 2) Servir le client (server1) sur un AUTRE port (autre origine)
cd ../server1
python3 -m http.server 8080
# puis ouvrir http://localhost:8080/index.html
```

Tests en ligne de commande (ceux qu'on a lancés) :

```bash
BASE="http://localhost:3000/COMP4537/labs/5/api/v1/sql/"

# POST insert
curl -X POST "$BASE" -H "Content-Type: application/json" \
  --data '{"query":"INSERT INTO patient (name, dateOfBirth) VALUES ('Sara Brown','1901-01-01')"}'
# → {"affectedRows":1,"insertId":...}

# GET select
curl "${BASE}select%20*%20from%20patient"
# → [ {...}, {...} ]

# GET drop (doit être refusé)
curl "${BASE}DROP%20TABLE%20patient"
# → {"error":"DROP command denied to user 'lab5_reader'@'...'"}
```

Résultats obtenus lors du test : POST → 4 lignes ; GET select → les lignes ;
GET COUNT après 2 inserts → 8 (la table grandit) ; GET DROP/DELETE/UPDATE → refusés. ✅

---

## 9. Ce qu'il reste à faire pour la remise

1. **Héberger** `server1` (statique, HTTPS) et `server2` (Node, HTTPS) sur **deux
   services différents**.
2. Mettre l'URL HTTPS de l'API dans `STRINGS.API_BASE` (`server1/strings.js`) ou dans
   le champ « API endpoint » de la page.
3. Zipper `server1/` + `server2/` dans `VotreTeam#Lab5` (ex. `D3Lab5.zip`).
4. Poster sur Learning Hub, en **hyperliens** (`https://…` + espace) :
   - l'URL du client (server1) ;
   - l'URL de l'API (server2) + le GET d'exemple :
     `https://TON-API/COMP4537/labs/5/api/v1/sql/select%20*%20from%20patient`
5. Compléter `ATTRIBUTION.md` selon ce que vous avez réellement utilisé.
```
