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



const express = require('express');

const { Pool } = require('pg');



const app = express();

app.use(express.json());

// Pour servir une future page HTML statique (étape suivante)

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));



// Connexion à la base via les variables d'environnement (Contrat d'interface)

const pool = new Pool({

&#x20; host: process.env.DB\_HOST || 'localhost',

&#x20; port: process.env.DB\_PORT || 5432,

&#x20; database: process.env.DB\_NAME || 'taskboard',

&#x20; user: process.env.DB\_USER || 'taskboard',

&#x20; password: process.env.DB\_PASSWORD || 'secret',

});



const PORT = process.env.APP\_PORT || 3000;



// APP-4 : Route healthz (sans interroger la base)

app.get('/healthz', (req, res) => {

&#x20; res.status(200).send('OK');

});



// APP-5 : Route readyz (teste la connexion à la base)\[cite: 2]

app.get('/readyz', async (req, res) => {

&#x20; try {

&#x20;   await pool.query('SELECT 1');

&#x20;   res.status(200).send('Ready');

&#x20; } catch (err) {

&#x20;   res.status(503).send('Database not ready');

&#x20; }

});



// APP-1, APP-2 : Lister les tâches\[cite: 2]

app.get('/api/tasks', async (req, res) => {

&#x20; try {

&#x20;   const result = await pool.query('SELECT \* FROM taches ORDER BY id DESC');

&#x20;   res.json(result.rows);

&#x20; } catch (err) {

&#x20;   res.status(500).json({ error: err.message });

&#x20; }

});



// APP-1, APP-2 : Créer une tâche\[cite: 2]

app.post('/api/tasks', async (req, res) => {

&#x20; const { titre } = req.body;

&#x20; try {

&#x20;   const result = await pool.query(

&#x20;     'INSERT INTO taches (titre, terminee, date\_creation) VALUES ($1, false, NOW()) RETURNING \*',

&#x20;     \[titre]

&#x20;   );

&#x20;   res.status(201).json(result.rows\[0]);

&#x20; } catch (err) {

&#x20;   res.status(500).json({ error: err.message });

&#x20; }

});



// APP-2 : Supprimer une tâche\[cite: 2]

app.delete('/api/tasks/:id', async (req, res) => {

&#x20; const { id } = req.params;

&#x20; try {

&#x20;   await pool.query('DELETE FROM taches WHERE id = $1', \[id]);

&#x20;   res.status(204).send();

&#x20; } catch (err) {

&#x20;   res.status(500).json({ error: err.message });

&#x20; }

});



app.listen(PORT, () => {

&#x20; console.log(`Server running on port ${PORT}`);

});









**Étape 4** : 

Créer la page HTML de test (app/public/index.html)Pour pouvoir tester ton application visuellement (et préparer la Semaine 2), crée un dossier public dans ton dossier app, puis un fichier index.html dedans :   Bashmkdir app/public

touch app/public/index.html



<!DOCTYPE html>

<html lang="fr">

<head>

&#x20;   <meta charset="UTF-8">

&#x20;   <title>TaskBoard</title>

&#x20;   <style>

&#x20;       body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }

&#x20;       .pod-info { background: #f4f4f4; padding: 10px; margin-bottom: 20px; border-radius: 4px; font-size: 0.9em; color: #555; }

&#x20;       ul { list-style: none; padding: 0; }

&#x20;       li { background: #fff; border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }

&#x20;       button { background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }

&#x20;   </style>

</head>

<body>

&#x20;   <h1>TaskBoard</h1>

&#x20;   <div class="pod-info">Servi par le Pod : <span id="hostname">Chargement...</span></div>



&#x20;   <form id="task-form">

&#x20;       <input type="text" id="task-title" placeholder="Nouvelle tâche..." required>

&#x20;       <button type="submit" style="background: #2ecc71;">Ajouter</button>

&#x20;   </form>



&#x20;   <ul id="task-list"></ul>



&#x20;   <script>

&#x20;       // Afficher le nom d'hôte (Hostname / ID du Pod)

&#x20;       document.getElementById('hostname').innerText = window.location.hostname;



&#x20;       async function loadTasks() {

&#x20;           const res = await fetch('/api/tasks');

&#x20;           const tasks = await res.json();

&#x20;           const list = document.getElementById('task-list');

&#x20;           list.innerHTML = '';

&#x20;           tasks.forEach(t => {

&#x20;               const li = document.createElement('li');

&#x20;               li.innerHTML = `${t.titre} <button onclick="deleteTask(${t.id})">Supprimer</button>`;

&#x20;               list.appendChild(li);

&#x20;           });

&#x20;       }



&#x20;       document.getElementById('task-form').addEventListener('submit', async (e) => {

&#x20;           e.preventDefault();

&#x20;           const titleInput = document.getElementById('task-title');

&#x20;           await fetch('/api/tasks', {

&#x20;               method: 'POST',

&#x20;               headers: { 'Content-Type': 'application/json' },

&#x20;               body: JSON.stringify({ titre: titleInput.value })

&#x20;           });

&#x20;           titleInput.value = '';

&#x20;           loadTasks();

&#x20;       });



&#x20;       async function deleteTask(id) {

&#x20;           await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

&#x20;           loadTasks();

&#x20;       }



&#x20;       loadTasks();

&#x20;   </script>

</body>

</html>









**Étape 5 :** 

Créer le dossier k8s/ et la ConfigMap (k8s/10-configmap.yaml)À la racine de ton projet Projet\_Docker\_Kubernetes, crée un dossier k8s s'il n'existe pas encore, puis crée le fichier 10-configmap.yaml.   Tu peux le faire directement dans ton terminal PowerShell :PowerShellNew-Item -ItemType Directory k8s -Force

New-Item -ItemType File k8s/10-configmap.yaml



YAMLapiVersion: v1

kind: ConfigMap

metadata:

&#x20; name: web-config

&#x20; namespace: taskboard

data:

&#x20; DB\_HOST: "db"

&#x20; DB\_PORT: "5432"

&#x20; DB\_NAME: "taskboard"

&#x20; DB\_USER: "taskboard"

&#x20; APP\_PORT: "3000"







**Etape 6:**

Ajout du gitignore a la racine



\# Dépendances Node.js

node\_modules/



\# Fichiers d'environnement locaux (secrets, etc.)

.env



\# Logs et fichiers temporaires OS

npm-debug.log\*

yarn-debug.log\*

yarn-error.log\*

.DS\_Store

Thumbs.db



\# IDE

.vscode/

.idea/







**Etape 7:**

**Le Bonus APP-6 :**

Afficher le nom du Pod (Hostname)Dans le cahier des charges, l'exigence APP-6 (qui rapporte 0,5 point bonus) demande à ce que la page d'accueil affiche le nom du Pod qui a servi la requête (via la variable HOSTNAME), ce qui permet de visualiser la répartition de charge entre les différents réplicas de ton application.   

app/server.js pour renvoyer le hostnameAjoute cette route dans ton serveur Express pour que le front-end puisse récupérer l'identifiant du conteneur/Pod qui répond :

// Route pour récupérer le nom du Pod (Bonus APP-6)
app.get('/api/hostname', (req, res) => {
  res.json({ hostname: process.env.HOSTNAME || 'localhost-dev' });
});


app/public/index.html pour l'afficher dynamiquementModifie la partie JavaScript de ta page HTML pour qu'elle interroge cette route et l'affiche bien sur le tableau de bord :

<div class="pod-info">Servi par le Pod : <span id="hostname">Chargement...</span></div>
<script>
    // Récupérer le nom du Pod depuis l'API (Bonus APP-6)
    async function loadHostname() {
        try {
            const res = await fetch('/api/hostname');
            const data = await res.json();
            document.getElementById('hostname').innerText = data.hostname;
        } catch (err) {
            document.getElementById('hostname').innerText = window.location.hostname;
        }
    }
    loadHostname();
    // ... reste de du code pour les tâches ...
</script>


**Etape 8:**

Test Vérifier le rendu de la page HTML

Lance application Node.js en local (node app/server.js).

Ouvre navigateur à l'adresse : http://localhost:3000



Semaine 1 (9 – 15 nov.) — ✅ Terminée à 100 %✅ Serveur Node.js / Express + PostgreSQL (app/server.js, app/package.json), sans mot de passe en dur.✅ API CRUD /api/tasks complète (GET, POST, PATCH, DELETE) alignée sur la table taches.✅ Sondes de santé /healthz (200 OK) et /readyz (SELECT 1, 200 ou 503) testées et validées.Semaine 2 (16 – 22 nov.) — ✅ Ta partie est bouclée (en attente d'équipe)✅ Interface HTML (app/public/index.html) + bonus APP-6 (affichage du nom du Pod via /api/hostname).✅ ConfigMap k8s/10-configmap.yaml (web-config, namespace taskboard, 5 variables sans mot de passe).✅ PR #1 nettoyée : node_modules/ retiré de Git (passée de 730 à 7 fichiers modifiés), description complète et liée au projet GitHub.   ✅ Test Docker Compose validé : build de taskboard-web:1.0.0, initialisation PostgreSQL (db/init.sql), affichage des 3 tâches et du hostname du conteneur.   ⬜ Reste côté équipe pour clôturer S2 :Faire valider et merger ta PR #1 par Justin (vérifie qu'il est bien mis en Reviewer sur GitHub).   Relire la PR docker de Justin (indentation de compose.yaml + suppression de app/node_modules/).Une fois les PR de tout le monde mergées dans main, refaire le docker compose up --build depuis main.Semaine 3 (23 – 29 nov.) — 🚀 Déjà bien avancée✅ Version v1.1.0 prête : package.json passé en 1.1.0, nouveau thème vert + badge v1.1.0 + case à cocher (PATCH) dans index.html, poussée sur la branche app/v1.1.0 et taguée v1.1.0. (À ne pas merger dans main tant que la 1.0.0 n'est pas mergée et buildée.)⬜ Intégration Minikube : corriger d'éventuels bugs quand Hugo et Justin déploieront sur le cluster.Semaine 4 (30 nov. – 6 déc.) — ⬜ À venir⬜ Valider les tests T3 (persistance des tâches) et T6 (base à 0 réplica → Pods web en 0/1 sans redémarrer) sur Minikube, ajouter les commandes au README.md et faire les captures (docs/captures/).⬜ Rédiger tes parties du rapport (docs/rapport) : « Application et sondes de santé », tableau « Répartition du travail », difficultés et solutions.Semaine de marge (7 – 14 déc.) — ⬜ À venir⬜ Relecture du README.md, test « cluster vierge » et 2 répétitions chronométrées avant le rendu (15 déc.) et la soutenance (16 déc.).



- **Déploiement Minikube (S3) :** déploiement de `taskboard-web:1.0.0` avec la ConfigMap (`web-config`), le Secret (`db-credentials`), les sondes `/healthz` et `/readyz` et une base PostgreSQL de test.
- **Résilience et test T6 :** ajout de `pool.on('error', ...)` dans `app/server.js` pour éviter le crash Node.js lors d'une coupure DB, validant le passage des Pods web de `1/1` à `0/1` puis `1/1 Running` avec **0 redémarrage**.
- **Rolling Update (test T9) :** mise à jour sans coupure de `taskboard-web:1.0.0` vers `taskboard-web:1.1.0` (thème vert, badge version et cases à cocher) validée via `kubectl set image` et `kubectl rollout status`.
