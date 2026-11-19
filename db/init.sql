-- Crée la table utilisée par l'appli TaskBoard
CREATE TABLE IF NOT EXISTS taches (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    terminee BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ajoute trois tâxhes d'exemple au premier démarrage de la bdd
INSERT INTO taches (titre)
VALUES  
    ('Installer les outils du projet'),
    ('Conteneuriser l''app'),
    ('Déployer TaskBoard sur Kubernetes');