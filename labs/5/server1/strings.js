// server1/strings.js
// Toutes les chaines affichees a l'utilisateur sont centralisees ici
// (exigence du lab : les user strings doivent etre stockees separement).

const STRINGS = {
    // === Endpoint de l'API (server2, AUTRE origine). A adapter au deploiement. ===
    // Exemple local : http://localhost:3000/COMP4537/labs/5/api/v1/sql/
    // Exemple distant : https://your-api.onrender.com/COMP4537/labs/5/api/v1/sql/
    API_BASE: "https://comp4537-n4v9.onrender.com/COMP4537/labs/5/api/v1/sql/",

    TITLE: "Lab 5 — Patient database",
    ENDPOINT_LABEL: "API endpoint (server2)",

    // Section INSERT (POST)
    INSERT_HEADING: "1) Insert patients (POST)",
    INSERT_INTRO:
        "The Insert button sends one POST request that inserts the 4 rows below. " +
        "Press it again and the rows are inserted again (the table grows).",
    INSERT_BTN: "Insert",

    // Section QUERY (GET)
    QUERY_HEADING: "2) Run a read query (GET)",
    QUERY_INTRO:
        "Type a SQL SELECT statement to read from the patient table, then Submit. " +
        "Harmful statements (DROP, DELETE, UPDATE, CREATE) are rejected by the " +
        "read-only database user.",
    QUERY_PLACEHOLDER: "SELECT * FROM patient",
    SUBMIT_BTN: "Submit",

    RESPONSE_HEADING: "Server response",
    RESPONSE_EMPTY: "(no request sent yet)",
    SENDING_POST: "Sending POST request...",
    SENDING_GET: "Sending GET request...",
    REQUEST_FAILED: "Request failed: ",

    // Les 4 lignes a inserer a chaque clic (devoir du lab 5).
    ROWS: [
        ["Sara Brown", "1901-01-01"],
        ["John Smith", "1941-01-01"],
        ["Jack Ma", "1961-01-30"],
        ["Elon Musk", "1999-01-01"],
    ],
};
