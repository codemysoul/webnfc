const express = require('express');
const app = express();
const path = require('path');
app.use(express.static(__dirname + '/public'));
app.get('*', function (request, response) {
    response.sendFile(path.resolve(__dirname, 'index.html'));
});
app.listen(8080);
console.log('Running on port 8080');