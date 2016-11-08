var Products = require("../models/Products.js");
var RegisteredMerchants = require("../models/RegisteredMerchants.js");

var appRouter = function(app) {

    app
        .get("/buyers", function(req, res) {
            console.log("GET Buyers called");
            return res.status(200).send(RegisteredMerchants.GetRegisteredMerchants());
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
                RegisteredMerchants.RegisterMerchant(req.body.merchant_id, Products.GetRandomProducts(5));

                res.status(200).send({
                    "code": 200,
                    "message": "successfully registered"
                });
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
                    "code": 409,
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

                var randomProduct = registeredMerchant.products[getRandomInt(0, registeredMerchant.products.length - 1)];
                res.send(randomProduct);
            }
        });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = appRouter;