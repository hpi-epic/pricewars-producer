const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const routes = require("./controllers/routes/routes.js");
app.use('/', routes);

const server = app.listen(3050, function () {
    console.log("Listening on port %s...", server.address().port);
});

module.exports = server;
