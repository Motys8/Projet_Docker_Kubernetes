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


**Etape 9**

Ajout du mdp et du patch ds server.js

const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connexion à la base via les variables d'environnement (Contrat d'interface)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskboard',
  user: process.env.DB_USER || 'taskboard',
  password: process.env.DB_PASSWORD,
});

const PORT = process.env.APP_PORT || 3000;

// APP-4 : Route healthz (sans interroger la base)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// APP-5 : Route readyz (teste la connexion à la base)
app.get('/readyz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).send('Ready');
  } catch (err) {
    res.status(503).send('Database not ready');
  }
});

// APP-1, APP-2 : Lister les tâches
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM taches ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APP-1, APP-2 : Créer une tâche
app.post('/api/tasks', async (req, res) => {
  const { titre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO taches (titre, terminee, date_creation) VALUES ($1, false, NOW()) RETURNING *',
      [titre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APP-2 : Marquer une tâche comme terminée / non terminée
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE taches SET terminee = NOT terminee WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tâche introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// APP-2 : Supprimer une tâche
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM taches WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BONUS APP-6 : Route pour récupérer le nom du Pod
app.get('/api/hostname', (req, res) => {
  res.json({ hostname: process.env.HOSTNAME || 'localhost-dev' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



**Etape 9**

creer branche  : git checkout -b app/v1.1.0

et dans package.json on passe a cett version "version": "1.1.0",

Test avec une mini modif sur le site 

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskBoard v1.1.0 - DevOps Project</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 40px auto; 
            padding: 0 20px; 
            background-color: #ecfdf5;
            color: #1f2937;
        }
        h1 { 
            color: #065f46; 
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .version-badge {
            background: #10b981;
            color: white;
            font-size: 0.45em;
            padding: 4px 10px;
            border-radius: 999px;
            vertical-align: middle;
        }
        .pod-info { 
            background: #d1fae5; 
            border-left: 4px solid #10b981; 
            padding: 10px 15px; 
            margin-bottom: 20px; 
            border-radius: 4px; 
            font-size: 0.95em; 
            color: #065f46; 
        }
        form { 
            display: flex; 
            gap: 10px; 
            margin-bottom: 20px; 
        }
        input[type="text"] { 
            flex: 1; 
            padding: 10px; 
            border: 1px solid #a7f3d0; 
            border-radius: 4px; 
            font-size: 1em; 
        }
        button { 
            padding: 10px 15px; 
            border: none; 
            cursor: pointer; 
            border-radius: 4px; 
            font-weight: bold; 
        }
        .btn-add { background: #059669; color: white; }
        .btn-add:hover { background: #047857; }
        .btn-delete { background: #e74c3c; color: white; padding: 5px 10px; font-size: 0.85em; }
        .btn-delete:hover { background: #c0392b; }
        ul { list-style: none; padding: 0; }
        li { 
            background: #fff; 
            border: 1px solid #d1fae5; 
            padding: 12px 15px; 
            margin-bottom: 8px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .task-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .task-done {
            text-decoration: line-through;
            color: #9ca3af;
        }
    </style>
</head>
<body>

    <h1>TaskBoard <span class="version-badge">v1.1.0</span></h1>
    
    <!-- Bonus APP-6 : Affichage du nom du Pod / Hostname -->
    <div class="pod-info">
        🖥️ Servi par le Pod : <strong id="hostname">Chargement...</strong>
    </div>

    <!-- Formulaire d'ajout de tâche -->
    <form id="task-form">
        <input type="text" id="task-title" placeholder="Nouvelle tâche à accomplir..." required>
        <button type="submit" class="btn-add">Ajouter</button>
    </form>

    <!-- Liste des tâches -->
    <ul id="task-list">
        <!-- Chargé dynamiquement via JavaScript -->
    </ul>

    <script>
        // Récupérer et afficher le nom du Pod (Bonus APP-6)
        async function loadHostname() {
            try {
                const res = await fetch('/api/hostname');
                const data = await res.json();
                document.getElementById('hostname').innerText = data.hostname;
            } catch (err) {
                document.getElementById('hostname').innerText = window.location.hostname;
            }
        }

        // Charger la liste des tâches depuis l'API
        async function loadTasks() {
            try {
                const res = await fetch('/api/tasks');
                const tasks = await res.json();
                const list = document.getElementById('task-list');
                list.innerHTML = '';
                
                if (tasks.length === 0) {
                    list.innerHTML = '<li style="justify-content: center; color: #7f8c8d;">Aucune tâche pour le moment.</li>';
                    return;
                }

                tasks.forEach(t => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="task-left">
                            <input type="checkbox" ${t.terminee ? 'checked' : ''} onchange="toggleTask(${t.id})">
                            <span class="${t.terminee ? 'task-done' : ''}">${t.titre}</span>
                        </div>
                        <button class="btn-delete" onclick="deleteTask(${t.id})">Supprimer</button>
                    `;
                    list.appendChild(li);
                });
            } catch (err) {
                console.error("Erreur lors du chargement des tâches :", err);
            }
        }

        // Ajouter une tâche
        document.getElementById('task-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('task-title');
            
            try {
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ titre: titleInput.value })
                });
                titleInput.value = '';
                loadTasks();
            } catch (err) {
                console.error("Erreur lors de l'ajout :", err);
            }
        });

        // Cocher / décocher une tâche (PATCH)
        async function toggleTask(id) {
            try {
                await fetch(`/api/tasks/${id}`, { method: 'PATCH' });
                loadTasks();
            } catch (err) {
                console.error("Erreur lors de la mise à jour :", err);
            }
        }

        // Supprimer une tâche
        async function deleteTask(id) {
            try {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
                loadTasks();
            } catch (err) {
                console.error("Erreur lors de la suppression :", err);
            }
        }

        // Initialisation au chargement de la page
        loadHostname();
        loadTasks();
    </script>
</body>
</html>


