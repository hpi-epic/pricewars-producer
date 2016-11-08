var Product = require("../models/Product.js");

var appRouter = function(app) {

    var merchantProdcuts = [];

    app
        .get("/buyers", function(req, res) {
            console.log("GET Buyers called");
            return res.status(200).send(merchantProdcuts);
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
                existingMerchants = merchantProdcuts.filter(function(merchant){
                    if (merchant.merchantID === req.body.merchantID)
                        return merchant
                });
                if (existingMerchants.length != 0)
                    return res.status(409).send({
                        "code": 409,
                        "message": "this merchantID is already registered with the producer",
                        "fields" : "merchantID-body-data"
                    });

                // add this merchant and his product selection to the storage
                merchantProdcuts.push({
                    merchantID: req.body.merchantID,
                    products: Product.GetRandomProducts(5)
                });

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
                // check if merchant exists
                for (var i = 0; i < merchantProdcuts.length; i++) {
                    if (merchantProdcuts[i].merchantID === req.body.merchantID) {
                        merchantProdcuts.splice(i, 1);
                        return res.status(200).send({
                            "status": 200,
                            "message": "merchant was successfully deleted"
                        });
                    }
                }
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
                merchant = merchantProdcuts.filter(function(merchant){
                    if (merchant.merchantID === req.query.merchantID)
                        return merchant
                });
                if (merchant.length == 1) {
                    merchant = merchant[0];
                    res.send(merchant.products[ getRandomInt(0, merchant.products.length - 1) ]);
                } else {
                    res.status(401).send({
                        "code": 401,
                        "message": "merchant is not known to the producer, please register first",
                        "field" : "please provide a registered merchantID as 'merchantID'-form-parameter"
                    });
                }
            }
        });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = appRouter;