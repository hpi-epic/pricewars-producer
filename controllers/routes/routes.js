var RegisteredMerchants = require("../models/RegisteredMerchants.js");
var Products = require("../models/Products.js");

var appRouter = function(app) {

    app
        .get("/buyers", function(req, res) {
            console.log("GET Buyers called");
            if (req.query.merchant_id) {
                var merchant = RegisteredMerchants.GetRegisteredMerchant(req.query.merchant_id);
                if (merchant !== undefined) {
                    return res.status(200).send(merchant);
                } else {
                    return res.status(404).send({
                       "code": 404,
                        "message": "this merchant is not registered with the producer",
                        "fields" : "unknown 'merchant_id'"
                    });
                }
            }
            return res.status(200).send(RegisteredMerchants);
        })
        .get("/products", function(req, res) {
            console.log("GET Products called")
            if (req.query.product_id) {
                var product = Products.GetProductByID(req.query.product_id);
                if (product !== undefined) {
                    return res.status(200).send(product);
                } else {
                    return res.status(404).send({
                        "code": 404,
                        "message": "this product does not exist for this producer",
                        "fields" : "unknown 'product_id'"
                    });
                }
            }
            return res.status(200).send(Products);
        })
        .post("/buyers", function(req, res) {
            if(!req.body.merchant_id) {
                console.log("POST Buyers called without merchant_id");

                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id parameter",
                    "fields" : "constraints violated for field 'merchant_id'"
                });
            } else {
                console.log("POST Buyers called with merchant " + req.body.merchant_id);

                // check if merchant already exists
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.body.merchant_id);
                if (registeredMerchant != undefined) {
                    return res.status(409).send({
                        "code": 409,
                        "message": "this merchant_id is already registered with the producer",
                        "fields" : "merchant_id-body-data"
                    });
                }

                // add this merchant and his product selection to the storage
                var newMerchant = RegisteredMerchants.RegisterMerchant(req.body.merchant_id);

                // answer with an initial array containing the products this merchant can start selling with
                var initialProducts = [];
                for (var i = 0; i < newMerchant.products.length; i++) {
                    initialProducts.push(newMerchant.GetSpecificProduct(newMerchant.products[i], 10));
                }

                res.status(200).send(initialProducts);
            }
        })
        .delete("/buyers", function(req, res) {
            console.log("DELETE Buyers called");
            if(!req.body.merchant_id) {
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id parameter",
                    "field" : "constraints violated for field 'merchant_id'"
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
                    "code": 404,
                    "message": "this merchant_id is not registered with the producer",
                    "field" : "merchant_id-body-data"
                });
            }
        })
        .get("/products/buy", function(req, res) {
            if(!req.query.merchant_id) {
                console.log("GET Buy Product called without merchant_id");
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchant_id form-parameter",
                    "field" : "constraints violated for field 'merchant_id'"
                });
            } else {
                console.log("GET Buy Product called with merchant_id " + req.query.merchant_id);
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.query.merchant_id);

                if (registeredMerchant === undefined) {
                    return res.status(401).send({
                        "code": 401,
                        "message": "merchant is not known to the producer, please register first",
                        "field" : "please provide a registered merchant_id as 'merchant_id'-form-parameter"
                    });
                }

                res.status(200).send(registeredMerchant.GetRandomProduct(1));
            }
        });
}

module.exports = appRouter;