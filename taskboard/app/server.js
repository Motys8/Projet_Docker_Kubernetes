const express = require('express');
const app = express();
const port = process.env.APP_PORT || 3000; 

app.get('/', (req, res) => 
{
    res.send("Hello world temporaire !");
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});