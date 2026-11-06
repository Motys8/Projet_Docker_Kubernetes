const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
// Pour servir une future page HTML statique (étape suivante)
app.use(express.static('public'));

// Connexion à la base via les variables d'environnement (Contrat d'interface)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskboard',
  user: process.env.DB_USER || 'taskboard',
  password: process.env.DB_PASSWORD || 'secret',
});

const PORT = process.env.APP_PORT || 3000;

// APP-4 : Route healthz (sans interroger la base)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// APP-5 : Route readyz (teste la connexion à la base)[cite: 2]
app.get('/readyz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).send('Ready');
  } catch (err) {
    res.status(503).send('Database not ready');
  }
});

// APP-1, APP-2 : Lister les tâches[cite: 2]
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM taches ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APP-1, APP-2 : Créer une tâche[cite: 2]
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

// APP-2 : Supprimer une tâche[cite: 2]
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM taches WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});