var crypto = require('crypto'),
    key = crypto.randomBytes(16);

var aesjs = require("aes-js");
var public_key = aesjs.util.convertStringToBytes(key);
var aesEcb = new aesjs.ModeOfOperation.ecb(key);

var Merchants = require("../models/RegisteredMerchants.js");

var Products = {

    products :
        [
            {
                uid: 11,
                product_id: 1,
                name: "CD_1",
                quality: 1,
                price: 15,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 12,
                product_id: 1,
                name: "CD_1",
                quality: 2,
                price: 12,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 13,
                product_id: 1,
                name: "CD_1",
                quality: 3,
                price: 9,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 14,
                product_id: 1,
                name: "CD_1",
                quality: 4,
                price: 6,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 21,
                product_id: 2,
                name: "CD_2",
                quality: 1,
                price: 15,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 22,
                product_id: 2,
                name: "CD_2",
                quality: 2,
                price: 12,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 23,
                product_id: 2,
                name: "CD_2",
                quality: 3,
                price: 9,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 24,
                product_id: 2,
                name: "CD_2",
                quality: 4,
                price: 6,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 31,
                product_id: 3,
                name: "CD_3",
                quality: 1,
                price: 15,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 32,
                product_id: 3,
                name: "CD_3",
                quality: 2,
                price: 12,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 33,
                product_id: 3,
                name: "CD_3",
                quality: 3,
                price: 9,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 34,
                product_id: 3,
                name: "CD_3",
                quality: 4,
                price: 6,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 41,
                product_id: 4,
                name: "CD_4",
                quality: 1,
                price: 15,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 42,
                product_id: 4,
                name: "CD_4",
                quality: 2,
                price: 12,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 43,
                product_id: 4,
                name: "CD_4",
                quality: 3,
                price: 9,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            },
            {
                uid: 44,
                product_id: 4,
                name: "CD_4",
                quality: 4,
                price: 6,
                stock: -1,
                time_to_life: -1,
                start_of_lifetime: -1
            }
        ],

    GetStartProductUIDs : function (numberOfRandomProducts, numberOfSharedProducts) {
        var randomProductUIDs = [];

        // if merchants share products, just add the first x available this.products to the selection
        if (numberOfSharedProducts === undefined) numberOfSharedProducts = 0;
        for (var i = 0; i < numberOfSharedProducts; i++) {
            randomProductUIDs.push(this.products[i].uid);
        }

        // then fill up with random products
        while (randomProductUIDs.length < (numberOfRandomProducts + numberOfSharedProducts)) {
            var randomProductIndex = getRandomInt(numberOfSharedProducts, this.products.length - 1);
            var randomProduct = this.products[randomProductIndex];

            // check whether product has been chosen already
            if (randomProductUIDs.indexOf(randomProduct.uid) > -1) continue;

            randomProductUIDs.push(randomProduct.uid);
        }

        return randomProductUIDs;
    },

    // returns a product by uid, so a unique product with a specific quality
    GetProductByUID : function (uid) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].uid == uid) {
                return this.products[i];
            }
        }
        return undefined;
    },

    // returns a product by product_id, ie without quality (and thus uid) information
    GetProductByID : function (product_id) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].product_id === product_id) {
                var productWithoutQuality = this.products[i];
                delete productWithoutQuality.quality;
                delete productWithoutQuality.uid;
                return this.products[i];
            }
        }
        return undefined;
    },

    GetRandomProduct : function(merchant_id, amount) {
        var merchant = Merchants.GetRegisteredMerchant(merchant_id);
        if (!merchant) merchant = Merchants.RegisterMerchant(merchant_id, this.products);

        var randomProduct = merchant.GetRandomProductFromOwnStock(amount);
        return randomProduct;
    },

    // encrypts a given product by adding an encrypted hash to the product-object that only the marketplace can read
    AddEncryption : function(merchant_hash, product, timeOfBuy) {
        var hash = generateProductSignature(merchant_hash, product, timeOfBuy);
        product["signature"] = encrypt(hash);
        return product;
    },

    GetPublicKey : function() {
        return  public_key.toString('base64');
    },

    SetProducts : function(new_products) {
        var products = [];
        new_products.forEach(function(np) {
            var new_product = createValidProduct(np);
            products.push(new_product);
        });
        this.products = products;
    },

    SetProduct : function(uid, newProduct) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].uid == uid) {
                var product = createValidProduct(newProduct);

                // make sure the new product wont be a duplicate of another existing product (because they happen to have the same UID)
                var existingProduct = this.GetProductByUID(product["uid"]);
                if (existingProduct && existingProduct.uid != this.products[i].uid) {
                    return false;
                }
                this.products[i] = product;
                return true;
            }
        }
        return false;
    },

    DeleteProduct : function(uid) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].uid === uid) {
                this.products.splice(i, 1);
                return true;
            }
        }
        return false;
    },

    AddProduct : function(newProduct) {
        newProduct = createValidProduct(newProduct);

        // make sure this uid does not exist yet
        var existingProduct = this.GetProductByUID(newProduct["uid"]);
        if (!existingProduct) {
            this.products.push(newProduct);
            return true;
        } else {
            return false;
        }
    },

    GetProducts : function() {
        return this.products;
    }
};

function createValidProduct(np) {
    var product = {
        "product_id": np.product_id ? np.product_id : "100",
        "name": np.name ? np.name : "Unnamed product",
        "quality": np.quality ? np.quality : 4,
        "price": np.price ? np.price : 15,
        "stock": np.stock ? np.stock : -1,
        "time_to_life": np.time_to_life ? np.time_to_life : -1,
        "start_of_lifetime": np.start_of_lifetime ? np.start_of_lifetime : -1
    };
    product.uid = parseInt("" + product.product_id + product.quality);
    return product;
}

// returns a random int (range including min and max)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function encrypt(text){
    text = aesjs.util.convertStringToBytes(addWhitespacePadding(text));
    var cipher = aesEcb.encrypt(text);
    return cipher.toString('base64');
}

function generateProductSignature(merchant_hash, product, timeOfBuy) {
    var amount = product.amount == undefined ? 1 : product.amount;
    return product.uid + ' ' + amount  + ' ' + merchant_hash + ' ' + timeOfBuy;
}

function addWhitespacePadding(text) {
    while (text.length % 16 != 0 || !powerOf2(text.length / 16)) text += " ";
    return text;
}

function powerOf2 (input) {
    while (input > 1 && input/2 !== 0 && input%2 === 0) {
        input /= 2;
    }
    return input === 1;
}

module.exports = Products;