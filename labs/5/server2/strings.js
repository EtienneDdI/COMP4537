// server2/strings.js
// Toutes les chaines destinees a l'utilisateur / aux reponses sont centralisees ici
// (exigence du lab : les user strings doivent etre stockees separement).

module.exports = {
    BASE_PATH: "/COMP4537/labs/5/api/v1/sql/",

    LOG_LISTENING: (port) => `Server2 (API) en ecoute sur le port ${port}`,
    LOG_START_FAIL: "Echec du demarrage du serveur :",

    ERR_NO_DB_CONFIG: "Configuration DB manquante dans .env",
    ERR_NOT_FOUND: "404 : route introuvable",
    ERR_METHOD_NOT_ALLOWED: "405 : methode non autorisee",
    ERR_GET_SELECT_ONLY: "Seules les requetes SELECT sont autorisees via GET",
    ERR_POST_INSERT_ONLY: "Seules les requetes INSERT sont autorisees via POST",
    ERR_EMPTY_QUERY: "Aucune requete SQL fournie",
};
