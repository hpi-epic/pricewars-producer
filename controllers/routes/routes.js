var Products = require("../models/Products.js");
var RegisteredMerchants = require("../models/RegisteredMerchants.js");

var appRouter = function(app) {

    app
        .get("/buyers", function(req, res) {
            console.log("GET Buyers called");
            return res.status(200).send(RegisteredMerchants.GetRegisteredMerchants());
        })
        .post("/buyers", function(req, res) {
            if(!req.body.merchantID) {
                console.log("POST Buyers called without merchantID");

                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchantID parameter",
                    "fields" : "constraints violated for field 'merchantID'"
                });
            } else {
                console.log("POST Buyers called with merchant " + req.body.merchantID);

                // check if merchant already exists
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.body.merchantID);
                if (registeredMerchant != undefined) {
                    return res.status(409).send({
                        "code": 409,
                        "message": "this merchantID is already registered with the producer",
                        "fields" : "merchantID-body-data"
                    });
                }

                // add this merchant and his product selection to the storage
                RegisteredMerchants.RegisterMerchant(req.body.merchantID, Products.GetRandomProducts(5));

                res.status(200).send({
                    "code": 200,
                    "message": "successfully registered"
                });
            }
        })
        .delete("/buyers", function(req, res) {
            console.log("DELETE Buyers called");
            if(!req.body.merchantID) {
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchantID parameter",
                    "field" : "constraints violated for field 'merchantID'"
                });
            } else {
                // try and delete the merchant
                var deleted = RegisteredMerchants.DeleteMerchant(req.body.merchantID);
                if (deleted) {
                    return res.status(200).send({
                        "status": 200,
                        "message": "merchant was successfully deleted"
                    });
                }

                // merchant didnt exist, couldnt delete
                return res.status(409).send({
                    "code": 409,
                    "message": "this merchantID is not registered with the producer",
                    "field" : "merchantID-body-data"
                });
            }
        })
        .get("/products/buy", function(req, res) {
            if(!req.query.merchantID) {
                console.log("GET Buy Product called without merchantID");
                return res.status(400).send({
                    "code": 400,
                    "message": "missing the merchantID form-parameter",
                    "field" : "constraints violated for field 'merchantID'"
                });
            } else {
                console.log("GET Buy Product called with merchantID " + req.query.merchantID);
                var registeredMerchant = RegisteredMerchants.GetRegisteredMerchant(req.query.merchantID);

                if (registeredMerchant === undefined) {
                    return res.status(401).send({
                        "code": 401,
                        "message": "merchant is not known to the producer, please register first",
                        "field" : "please provide a registered merchantID as 'merchantID'-form-parameter"
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