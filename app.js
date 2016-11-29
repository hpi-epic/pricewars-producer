var express = require('express')
  , cors = require('cors')
  , bodyParser = require("body-parser")
  , app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var routes = require("./controllers/routes/routes.js")(app);

var server = app.listen(3050, function () {
    console.log("Listening on port %s...", server.address().port);
});

module.exports = server;
