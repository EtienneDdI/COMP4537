-- =====================================================================
-- Lab 5 - Configuration des utilisateurs DB (Principe du moindre privilege)
-- =====================================================================
-- A executer UNE SEULE FOIS sur la base Aiven en tant qu'admin (avnadmin),
-- par ex. via la console web MySQL d'Aiven ou le client mysql.
--
-- Combien d'utilisateurs DB pour ce lab ? -> DEUX :
--   1) lab5_writer : SELECT, INSERT, CREATE   -> utilise par le POST (bouton Insert)
--   2) lab5_reader : SELECT uniquement         -> utilise par le GET (textarea SQL)
--
-- Ainsi, si un visiteur soumet DROP / DELETE / UPDATE / CREATE via le textarea
-- (chemin GET), l'utilisateur lab5_reader n'a tout simplement PAS le privilege
-- de le faire : MySQL rejette la commande. C'est la seule protection fiable.
-- =====================================================================

-- --- 1) Utilisateur en ECRITURE (POST / insert) ----------------------
CREATE USER IF NOT EXISTS 'lab5_writer'@'%' IDENTIFIED BY 'CHANGE_ME_WRITER';
-- Volontairement : PAS de DROP, DELETE, UPDATE, ALTER.
GRANT SELECT, INSERT, CREATE ON defaultdb.* TO 'lab5_writer'@'%';

-- --- 2) Utilisateur en LECTURE SEULE (GET / textarea) ----------------
CREATE USER IF NOT EXISTS 'lab5_reader'@'%' IDENTIFIED BY 'CHANGE_ME_READER';
-- Lecture seule : aucune modification possible, quelle que soit la requete soumise.
GRANT SELECT ON defaultdb.* TO 'lab5_reader'@'%';

FLUSH PRIVILEGES;

-- Verification (optionnel) :
--   SHOW GRANTS FOR 'lab5_writer'@'%';
--   SHOW GRANTS FOR 'lab5_reader'@'%';
