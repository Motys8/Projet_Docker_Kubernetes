**Projet Kubernetes info Timothee**



**Étape 1:**



*Se mettre d'accord sur le "Contrat d'interface"Avant de coder, toute l'équipe doit respecter des noms communs pour que vos briques s'emboîtent parfaitement (notamment avec la base de données de Dorian et le déploiement d'Hugo). Pour ton application, retiens ces valeurs clés :*  



Port de l'appli : 3000 (variable APP\_PORT)   Variables d'environnement requises : DB\_HOST (qui vaudra db), DB\_PORT (5432), DB\_NAME (taskboard), DB\_USER (taskboard), DB\_PASSWORD.   Routes API attendues :GET /api/tasks et POST /api/tasks (CRUD de base)   /healthz : doit renvoyer 200 OK si le processus tourne (sans interroger la base).   /readyz : doit tester la connexion à PostgreSQL et renvoyer 200 OK si la base répond, ou 503 Service Unavailable sinon.





**Etape 2:**

Initialisation du projet



mkdir app

cd app

npm init -y

npm install express pg





**Etape 3:** 

**Créer le serveur de base (app/server.js)**

Ton application doit utiliser les variables d'environnement pour se connecter à PostgreSQL. 



JavaScript

const express = require('express');

const { Pool } = require('pg');



const app = express();

app.use(express.json());



// Connexion à la base via les variables d'environnement (Contrat d'interface)

const pool = new Pool({

&#x20; host: process.env.DB\_HOST || 'localhost',

&#x20; port: process.env.DB\_PORT || 5432,

&#x20; database: process.env.DB\_NAME || 'taskboard',

&#x20; user: process.env.DB\_USER || 'taskboard',

&#x20; password: process.env.DB\_PASSWORD || 'secret',

});



const PORT = process.env.APP\_PORT || 3000;



// Route healthz (APP-4) : vérifie juste que le serveur tourne

app.get('/healthz', (req, res) => {

&#x20; res.status(200.send('OK');

});



// Route readyz (APP-5) : teste la connexion à la base de données

app.get('/readyz', async (req, res) => {

&#x20; try {

&#x20;   await pool.query('SELECT 1');

&#x20;   res.status(200).send('Ready');

&#x20; } catch (err) {

&#x20;   res.status(503).send('Database not ready');

&#x20; }

});



// Exemple de route API pour lister les tâches (APP-1, APP-2)

app.get('/api/tasks', async (req, res) => {

&#x20; try {

&#x20;   const result = await pool.query('SELECT \* FROM taches');

&#x20;   res.json(result.rows);

&#x20; } catch (err) {

&#x20;   res.status(500).json({ error: err.message });

&#x20; }

});



app.listen(PORT, () => {

&#x20; console.log(`Server running on port ${PORT}`);

});

