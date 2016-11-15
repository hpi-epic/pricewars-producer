var appRouter = function(app) {

    var RegisteredMerchants = require("../models/RegisteredMerchants.js");
    var Products = require("../models/Products.js");

    app
        .get("/buyers", function(req, res) {
            console.log("GET Buyers called");
            if (req.query.merchant_id) {
                var merchant = RegisteredMerchants.GetRegisteredMerchant(req.query.merchant_id);
                if (merchant !== undefined) {
                    return res.status(200).send([merchant]);
                } else {
                    return res.status(404).send({
                       "code": 404,
                        "message": "this merchant is not registered with the producer",
                        "fields" : "merchant_id"
                    });
                }
            }
            return res.status(200).send(RegisteredMerchants.GetRegisteredMerchants());
        })
        .get("/products", function(req, res) {
            console.log("GET Products called")
            if (req.query.product_id) {
                var product = Products.GetProductByID(req.query.product_id);
                if (product !== undefined) {
                    return res.status(200).send([product]);
                } else {
                    return res.status(404).send({
                        "code": 404,
                        "message": "this product does not exist for this producer",
                        "fields" : "product_id"
                    });
                }
            }
            return res.status(200).send(Products);
        })
        .post("/buyers/register", function(req, res) {
            if(!req.body.merchant_id) {
                console.log("POST Buyers called without merchant_id");

                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id parameter",
                    "fields" : "merchant_id"
                });
            } else {
                console.log("POST Buyers called with merchant " + req.body.merchant_id);

                // check if merchant already exists
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.body.merchant_id);
                if (registeredMerchant != undefined) {
                    return res.status(409).send({
                        "code": 409,
                        "message": "this merchant_id is already registered with the producer",
                        "fields" : "merchant_id"
                    });
                }

                // add this merchant and his product selection to the storage
                var newMerchant = RegisteredMerchants.RegisterMerchant(req.body.merchant_id);

                // answer with an initial array containing the products this merchant can start selling with
                var initialProducts = [];
                for (var i = 0; i < newMerchant.products.length; i++) {
                    initialProducts.push(newMerchant.GetSpecificProduct(newMerchant.products[i], 10));
                }

                return res.status(200).send(initialProducts);
            }
        })
        .delete("/buyers", function(req, res) {
            console.log("DELETE Buyers called");
            if(!req.body.merchant_id) {
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id parameter",
                    "field" : "merchant_id"
                });
            } else {
                // try and delete the merchant
                var deleted = RegisteredMerchants.DeleteMerchant(req.body.merchant_id);
                if (deleted) {
                    return res.status(200).send({
                        "status": 200,
                        "message": "merchant was successfully deleted"
                    });
                }

                // merchant didnt exist, couldnt delete
                return res.status(409).send({
                    "code": 409,
                    "message": "this merchant_id is not registered with the producer",
                    "field" : "merchant_id"
                });
            }
        })
        .get("/products/:product_id/buy", function(req, res) {
            if(!req.query.merchant_id) {
                console.log("GET Buy Product called without merchant_id");
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id form-parameter",
                    "field" : "merchant_id"
                });
            } else {
                console.log("GET Buy Product called with merchant_id " + req.query.merchant_id + " and product_id " + req.params.product_id);
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.query.merchant_id);

                if (registeredMerchant === undefined) {
                    return res.status(401).send({
                        "code": 401,
                        "message": "merchant is not known to the producer, please register first",
                        "field" : "merchant_id"
                    });
                }

                if (req.params.product_id) {
                    // merchant wants to buy specific product
                    var product = registeredMerchant.GetSpecificProduct(req.params.product_id, 1);
                    if (product === undefined) {
                        return res.status(403).send({
                            "code": 403,
                            "message": "this merchant cannot buy the product with this product_id",
                            "field" : "product_id"
                        });
                    }
                    if (req.query.amount) {
                        if (isNumber((req.query.amount))) {
                            product["amount"] = parseInt(req.query.amount);
                        } else {
                            return res.status(406).send({
                                "code": 406,
                                "message": "the amount-parameter has to be a number",
                                "field" : "amount"
                            });
                        }
                    }
                    return res.status(200).send(product);
                } else {
                    // merchant buys random product
                    return res.status(200).send(registeredMerchant.GetRandomProduct(1));
                }
            }
        })
        .get("/products/buy", function(req, res) {
            if(!req.query.merchant_id) {
                console.log("GET Buy Product called without merchant_id");
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id form-parameter",
                    "field" : "merchant_id"
                });
            } else {
                console.log("GET Random Buy Product called with merchant_id " + req.query.merchant_id);
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.query.merchant_id);

                if (registeredMerchant === undefined) {
                    return res.status(401).send({
                        "code": 401,
                        "message": "merchant is not known to the producer, please register first",
                        "field" : "merchant_id"
                    });
                }

                // merchant buys random product
                return res.status(200).send(registeredMerchant.GetRandomProduct(1));
            }
        });
}

function isNumber(obj) { return !isNaN(parseInt(obj)) }

module.exports = appRouter;