var appRouter = function(app) {

    var Products = require("../models/Products.js");
    var KafkaLogger = require("../logging/KafkaLogger.js")

    app
        .get("/products", function(req, res) {
            console.log("GET Products called");
            return res.status(200).send(Products);
        })
        .get("/products/:product_id", function(req, res) {
            // get specific product information
            console.log("GET Products called for " + req.params.product_id);
            var product = Products.GetProductByUID(parseInt(req.params.product_id));
            if (product !== undefined) {
                return res.status(200).send([product]);
            } else {
                return res.status(404).send({
                    "code": 404,
                    "message": "this product does not exist for this producer",
                    "fields": "product_id"
                });
            }
        })
        .get("/buy", function(req, res) {
            // buy random product
            if(!req.query.merchant_id) {
                console.log("GET Buy random Product called without merchant_id");
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id form-parameter",
                    "field" : "merchant_id"
                });
            } else {
                console.log("GET Buy random Product called with merchant_id " + req.query.merchant_id);

                var randomProduct = Products.GetRandomProduct(1);
                var timeOfBuy = (new Date()).getTime();

                // log to console and to kafka
                console.log("Sold " + JSON.stringify(randomProduct) + " to " + req.query.merchant_id);
                KafkaLogger.LogBuy(randomProduct, req.query.merchant_id, timeOfBuy);

                return res.status(200).send(Products.AddEncryption(randomProduct, timeOfBuy));
            }
        })
        .get("/decryption_key", function(req, res) {
            // todo for later: add check for permission
            return res.status(200).send({"decryption_key" : Products.GetPublicKey()});
        });
};

module.exports = appRouter;