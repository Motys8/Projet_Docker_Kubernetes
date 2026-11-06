const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Connexion à la base via les variables d'environnement (Contrat d'interface)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskboard',
  user: process.env.DB_USER || 'taskboard',
  password: process.env.DB_PASSWORD || 'secret',
});

const PORT = process.env.APP_PORT || 3000;

// Route healthz (APP-4) : vérifie juste que le serveur tourne
app.get('/healthz', (req, res) => {
  res.status(200.send('OK');
});

// Route readyz (APP-5) : teste la connexion à la base de données
app.get('/readyz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).send('Ready');
  } catch (err) {
    res.status(503).send('Database not ready');
  }
});

// Exemple de route API pour lister les tâches (APP-1, APP-2)
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM taches');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});