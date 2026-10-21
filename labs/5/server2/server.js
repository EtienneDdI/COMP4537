require("dotenv/config");
const http = require("http");
const mysql = require("mysql2/promise");
const STR = require("./strings");

// Endpoint de base du lab 5 (ex: /COMP4537/labs/5/api/v1/sql/)
const BASE_PATH = STR.BASE_PATH;

class Server {
    constructor(port) {
        this.port = port;
        // Deux pools correspondant a DEUX utilisateurs DB distincts :
        //  - writePool : user lab5_writer  (SELECT, INSERT, CREATE) -> POST
        //  - readPool  : user lab5_reader  (SELECT uniquement)      -> GET
        // C'est le PRIVILEGE de l'utilisateur DB qui bloque DROP/DELETE/UPDATE,
        // pas un simple filtre applicatif (principe du moindre privilege).
        this.writePool = this.createPool(process.env.DB_WRITE_USER, process.env.DB_WRITE_PASSWORD);
        this.readPool = this.createPool(process.env.DB_READ_USER, process.env.DB_READ_PASSWORD);
    }

    // Construit un pool de connexions MySQL pour un utilisateur donne.
    createPool(dbUser, dbPassword) {
        if (!process.env.DB_HOST || !dbUser) {
            throw new Error(STR.ERR_NO_DB_CONFIG);
        }

        return mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: dbUser,
            password: dbPassword,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
        });
    }

    // Cree la table patient si elle n'existe pas encore (via le user writer).
    async ensureTable() {
        await this.writePool.query(`
            CREATE TABLE IF NOT EXISTS patient (
                patientid INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                dateOfBirth DATETIME NOT NULL
            ) ENGINE=InnoDB
        `);
    }

    async init() {
        await this.ensureTable();
    }

    async StartServer() {
        await this.init();
        http.createServer((req, res) => this.RequestHandler(req, res)).listen(this.port, () => {
            console.log(STR.LOG_LISTENING(this.port));
        });
    }

    // En-tetes CORS (le client est servi depuis une AUTRE origine : server1).
    setCors(res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    sendJson(res, status, payload) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(payload));
    }

    RequestHandler(req, res) {
        this.setCors(res);

        if (req.method === "OPTIONS") {
            res.writeHead(204);
            return res.end();
        }

        const url = new URL(req.url, `http://${req.headers.host}`);

        if (!url.pathname.startsWith(BASE_PATH)) {
            return this.sendJson(res, 404, { error: STR.ERR_NOT_FOUND });
        }

        if (req.method === "GET") {
            return this.handleGet(url, res);
        } else if (req.method === "POST") {
            return this.handlePost(req, res);
        }

        this.sendJson(res, 405, { error: STR.ERR_METHOD_NOT_ALLOWED });
    }

    // GET : la requete SQL arrive dans l'URL. Executee par le user LECTURE SEULE.
    // Si quelqu'un soumet DROP/DELETE/UPDATE/CREATE, MySQL le refuse car
    // lab5_reader n'a que le privilege SELECT (protection au niveau DB).
    async handleGet(url, res) {
        const query = decodeURIComponent(url.pathname.substring(BASE_PATH.length)).trim();

        if (!query) {
            return this.sendJson(res, 400, { error: STR.ERR_EMPTY_QUERY });
        }

        try {
            const [rows] = await this.readPool.query(query);
            this.sendJson(res, 200, rows);
        } catch (err) {
            // Inclut les refus de privilege MySQL (ex: "command denied") -> renvoyes au client.
            this.sendJson(res, 403, { error: err.message });
        }
    }

    // POST : INSERT, la requete SQL arrive dans le body. Executee par le user ECRITURE.
    handlePost(req, res) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            let query = body;
            // Supporte un body JSON { query } ou du SQL brut.
            try {
                const parsed = JSON.parse(body);
                if (parsed && parsed.query) query = parsed.query;
            } catch (_) {
                // body SQL brut : garde tel quel
            }

            if (!/^insert\b/i.test(query.trim())) {
                return this.sendJson(res, 400, { error: STR.ERR_POST_INSERT_ONLY });
            }

            try {
                // Note du lab : a chaque insertion, on verifie que la table existe,
                // sinon on la (re)cree avant de faire l'INSERT.
                await this.ensureTable();
                const [result] = await this.writePool.query(query);
                this.sendJson(res, 200, {
                    affectedRows: result.affectedRows,
                    insertId: result.insertId,
                });
            } catch (err) {
                this.sendJson(res, 500, { error: err.message });
            }
        });
    }
}

const PORT = process.env.PORT || 3000;
const server = new Server(PORT);
server.StartServer().catch((err) => {
    console.error(STR.LOG_START_FAIL, err.message);
    process.exit(1);
});
