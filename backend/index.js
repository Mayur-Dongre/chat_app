const express = require('express');

const app = express();
const port = 8080;

// Define a route
app.get('/', (req, res) => {
    res.send('Congratulations Mad World Folks!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});

