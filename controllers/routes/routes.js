var appRouter = function(app) {

    var Products = require("../models/Products.js");
    var KafkaLogger = require("../logging/KafkaLogger.js");

    app
        .get("/products", function(req, res) {
            // console.log("GET Products called");
            return res.status(200).send(Products.GetProducts());
        })
        .put("/products", function(req, res) {
            if (Object.prototype.toString.call( req.body ) === '[object Array]' ) {
                Products.SetProducts(req.body);
                return res.status(200).send();
            } else {
                return res.status(406).send({
                    "code": 406,
                    "message": "products have to be in the form of an array"
                });
            }
        })
        .post("/products", function(req, res) {
            if (Object.prototype.toString.call( req.body ) === '[object Array]' ) {
                for (var i = 0; i < req.body.length; i++) {
                    if (!Products.AddProduct(req.body[i])) {
                        return res.status(406).send({
                            "code": 406,
                            "message": "the product with this product_id and quality already exists"
                        });
                    }
                }
                return res.status(200).send();
            } else {
                if (Products.AddProduct(req.body)) {
                    return res.status(200).send();
                } else {
                    return res.status(406).send({
                        "code": 406,
                        "message": "the product with this product_id and quality already exists"
                    });
                }
            }
        })
        .get("/products/:uid", function(req, res) {
            // get specific product information
            // console.log("GET Products called for " + req.params.uid);
            var product = Products.GetProductByUID(parseInt(req.params.uid));
            if (product !== undefined) {
                return res.status(200).send([product]);
            } else {
                return res.status(404).send({
                    "code": 404,
                    "message": "this product does not exist for this producer",
                    "fields": "uid"
                });
            }
        })
        .put("/products/:uid", function(req, res) {
            if (Products.GetProductByUID(parseInt(req.params.uid)) == null) {
                return res.status(404).send({
                    "code": 404,
                    "message": "a product with this uid does not exist"
                });
            }
            if (Object.prototype.toString.call( req.body ) === '[object Array]' ) {
                if (Products.SetProduct(parseInt(req.params.uid), req.body[0])) {
                    return res.status(200).send();
                } else {
                    return res.status(404).send({
                        "code": 404,
                        "message": "other products than the one with the specified UID would be overwritten",
                    });
                }
            } else {
                return res.status(406).send({
                    "code": 406,
                    "message": "product has to be in the form of an array"
                });
            }
        })
        .delete("/products/:uid", function(req, res) {
            if (Products.DeleteProduct(parseInt(req.params.uid))) {
                return res.status(200).send();
            } else {
                return res.status(404).send({
                    "code": 404,
                    "message": "this product does not exist for this producer",
                });
            }
        })
        .get("/buy", function(req, res) {
            // buy random product
            if(!req.query.merchant_token) {
                // console.log("GET Buy random Product called without merchant_id");
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_token",
                    "field" : "merchant_token"
                });
            } else {
                var merchant_hash =  KafkaLogger.hashToken(req.query.merchant_token);
                // console.log("GET Buy random Product called with merchant_ id " + merchant_hash);

                var randomProduct = Products.GetRandomProduct(merchant_hash, 1);

                if (randomProduct == undefined) {
                    return res.status(410).send({
                        "code": 410,
                        "message": "no items left in stock"
                    });
                } else {
                    var timeOfBuy = (new Date()).toISOString();
                    Products.AddEncryption(merchant_hash, randomProduct, timeOfBuy);

                    // log to console and to kafka
                    // console.log("Sold " + JSON.stringify(randomProduct) + " to " + merchant_hash);
                    KafkaLogger.LogBuy(randomProduct, merchant_hash, timeOfBuy);

                    return res.status(200).send(randomProduct);
                }
            }
        })
        .get("/decryption_key", function(req, res) {
            // todo for later: add check for permission
            return res.status(200).send({"decryption_key" : Products.GetPublicKey()});
        });
};

module.exports = appRouter;
