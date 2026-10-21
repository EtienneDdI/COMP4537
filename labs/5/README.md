# COMP4537 — Lab 5

Two separate origins:

- **`server1/`** — the client (static files only: `index.html`, `strings.js`). Must be
  hosted on a **different origin** than server2 (e.g. a free static host with HTTPS:
  GitHub Pages, Netlify, Vercel, Render static site...).
- **`server2/`** — the Node.js API (no Express / no routing module). Talks to MySQL.

## Patient table

| column      | type                                   |
|-------------|----------------------------------------|
| patientid   | INT UNSIGNED AUTO_INCREMENT PRIMARY KEY |
| name        | VARCHAR(100)                            |
| dateOfBirth | DATETIME                                |

Created automatically (`CREATE TABLE IF NOT EXISTS`) on startup **and before every insert**.

## Endpoints (server2)

- `GET  /COMP4537/labs/5/api/v1/sql/<url-encoded SELECT>` → returns rows (JSON).
- `POST /COMP4537/labs/5/api/v1/sql/` with body `{ "query": "INSERT ..." }` → inserts.

Sample GET (paste in the browser address bar, already URL-encoded):

```
https://YOUR-API-DOMAIN/COMP4537/labs/5/api/v1/sql/select%20*%20from%20patient
```

## Security — Principle of Least Privilege (how many DB users?)

**Two** database users:

1. **`lab5_writer`** — `SELECT, INSERT, CREATE` → used by the **POST** path (Insert button).
2. **`lab5_reader`** — `SELECT` only → used by the **GET** path (SQL textarea).

Because the GET textarea runs under `lab5_reader`, any `DROP` / `DELETE` / `UPDATE` /
`CREATE` a visitor submits is **refused by MySQL itself** (no privilege). This is the
only reliable protection — it is enforced at the database, not by an app-level filter.

### Setup (run once as the Aiven admin)

1. Edit passwords in `server2/setup-db.sql` and `server2/.env` (keep them matching).
2. Run `server2/setup-db.sql` on the Aiven MySQL instance (web console or `mysql` client).

## Run server2 locally

```
cd server2
npm install
npm start      # listens on PORT (default 3000)
```

Then set the **API endpoint** field in the client to your server2 URL.

## Deliverable

Copy `server1/` and `server2/` into a folder `YourTeam#Lab5` (e.g. `D3Lab5`),
zip as `YourTeam#Lab5.zip`, upload to Learning Hub, and post the hosted URLs
(client URL, API URL + sample GET) hyperlinked in the comment section.
