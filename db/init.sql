CREATE TABLE IF NOT EXISTS taches (
    id SERIAL PRIMARY KEY, 
    titre VARCHAR(55) NOT NULL, 
    terminee BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO taches (titre) VALUES ('Installer minikube'), ('Ecrire le Dockerfile');
