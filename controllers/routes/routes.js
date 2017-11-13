var appRouter = function(app) {

    var Products = require("../models/Products.js");
    var KafkaLogger = require("../logging/KafkaLogger.js");

    app
        .get("/products", function(req, res) {
            // console.log("GET Products called");
            if (req.query.showDeleted == 'true') {
                return res.status(200).send(Products.GetAllProducts());
            } else {
                return res.status(200).send(Products.GetExistingProducts());
            }
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
        .post("/order", function(req, res) {
            if (!req.header("authorization")) {
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_token",
                    "fields" : "merchant_token"
                });
            }

            var merchant_token = req.header("authorization").split(" ");
            if (merchant_token.length != 2 || merchant_token[0] != "Token") {
                return res.status(400).send({
                    "code": 400,
                    "message": "missing or unacceptable merchant_token",
                    "fields" : "authorization header"
                });
            }

            var merchant_hash = KafkaLogger.hashToken(merchant_token[1]);
            var amount = parseInt(req.body.amount);
            var product = Products.GetRandomProduct(merchant_hash, amount);
            if (product == undefined) {
                return res.status(410).send({
                    "code": 410,
                    "message": "no items left in stock"
                });
            }
            
            var timeOfBuy = (new Date()).toISOString();
            Products.AddEncryption(merchant_hash, product, timeOfBuy);
            KafkaLogger.LogBuy(product, merchant_hash, timeOfBuy);
            product.ordering_cost = 20
            
            var order = {
                "price": product.price * product.amount,
                "stock": product.stock,
                "left_in_stock": product.left_in_stock,
                "product": {
                    "uid": product.uid,
                    "product_id": product.product_id,
                    "name": product.name,
                    "quality": product.quality,
                    "amount": product.amount,
                    "signature": product.signature,
                    "time_to_live": product.time_to_live,
                    "start_of_lifetime": product.start_of_lifetime
                }
            }
            return res.status(200).send(order);
        })
        .get("/decryption_key", function(req, res) {
            // todo for later: add check for permission
            return res.status(200).send({"decryption_key" : Products.GetPublicKey()});
        });
};

module.exports = appRouter;
