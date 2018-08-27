const express = require('express');
const Products = require("../models/Products.js");
const KafkaLogger = require("../logging/KafkaLogger.js");

const router = express.Router();

router.route('/products')
    .get(function(req, res) {
        return res.status(200).send(Products.getAllProductsInfo());
    })
    .put(function(req, res) {
        if (Object.prototype.toString.call( req.body ) === '[object Array]' ) {
            Products.setProducts(req.body);
            return res.status(200).send();
        } else {
            return res.status(406).send({
                "code": 406,
                "message": "products have to be in the form of an array"
            });
        }
    })
    .post(function(req, res) {
        if (Object.prototype.toString.call( req.body ) === '[object Array]' ) {
            for (let i = 0; i < req.body.length; i++) {
                if (!Products.addProduct(req.body[i])) {
                    return res.status(406).send({
                        "code": 406,
                        "message": "the product with this product_id and quality already exists"
                    });
                }
            }
            return res.status(200).send();
        } else {
            if (Products.addProduct(req.body)) {
                return res.status(200).send();
            } else {
                return res.status(406).send({
                    "code": 406,
                    "message": "the product with this product_id and quality already exists"
                });
            }
        }
    });

router.route('/products/:id')
    .get(function(req, res) {
        const productInfo = Products.getProductInfo(parseInt(req.params.id));
        if (productInfo !== undefined) {
            return res.status(200).send(productInfo);
        } else {
            return res.status(404).send({
                "code": 404,
                "message": "A product with this id does not exist",
                "fields": "id"
            });
        }
    })
    .put(function(req, res) {
        if (Products.updateProductInfo(parseInt(req.params.uid), req.body)) {
            return res.status(200).send();
        } else {
            return res.status(404).send({
                "code": 404,
                "message": "A product with this id does not exist"
            });
        }
    })
    .delete(function(req, res) {
        if (Products.deleteProductQuality(parseInt(req.params.uid))) {
            return res.status(200).send();
        } else {
            return res.status(404).send({
                "code": 404,
                "message": "this product does not exist for this producer",
            });
        }
    });

router.post('/orders', function(req, res) {
    if (!req.header("authorization")) {
        return res.status(400).send({
            "code": 400,
            "message": "missing the merchant_token",
            "fields" : "merchant_token"
        });
    }

    const merchant_token = req.header("authorization").split(" ");
    if (merchant_token.length !== 2 || merchant_token[0] !== "Token") {
        return res.status(400).send({
            "code": 400,
            "message": "missing or unacceptable merchant_token",
            "fields" : "authorization header"
        });
    }

    const amount = parseInt(req.body.amount);

    if (isNaN(amount)) {
        return res.status(400).send({
            "code": 400,
            "message": "missing or unacceptable amount",
            "fields" : "amount"
        });
    }

    const merchantId = KafkaLogger.merchantId(merchant_token[1]);
    const timeOfBuy = (new Date()).toISOString();
    const order = Products.orderRandomProduct(merchantId, amount, timeOfBuy);

    if (order === undefined) {
        return res.status(410).send({
            "code": 410,
            "message": "no items left in stock"
        });
    }

    KafkaLogger.LogBuy(order, merchantId, timeOfBuy);
    return res.status(200).send(order);
});

router.get('/decryption_key', function(req, res) {
    // todo for later: add check for permission
    return res.status(200).send({"decryption_key" : Products.getSecretKey()});
});

module.exports = router;
