var crypto = require('crypto'),
    key = crypto.randomBytes(16);

var aesjs = require("aes-js");
var public_key = aesjs.util.convertStringToBytes(key);
var aesEcb = new aesjs.ModeOfOperation.ecb(key);

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
                time_to_live: -1,
                start_of_lifetime: -1
            },
            {
                uid: 12,
                product_id: 1,
                name: "CD_1",
                quality: 2,
                price: 12,
                stock: -1,
                time_to_live: -1,
                start_of_lifetime: -1
            },
            {
                uid: 13,
                product_id: 1,
                name: "CD_1",
                quality: 3,
                price: 9,
                stock: -1,
                time_to_live: -1,
                start_of_lifetime: -1
            },
            {
                uid: 14,
                product_id: 1,
                name: "CD_1",
                quality: 4,
                price: 6,
                stock: -1,
                time_to_live: -1,
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
        if (amount == undefined) amount = 1;
        let availableProducts = this.GetAvailableProducts(merchant_id, amount);
        if (availableProducts.length == 0) return undefined;

        let randomProduct = availableProducts[getRandomInt(0, availableProducts.length - 1)];

        return this.prepareProductForBuy(randomProduct, merchant_id);
    },

    // returns all products that are still available for sell for the given merchant
    GetAvailableProducts: function(merchant_id, amount) {
        let result = [];
        for (let i = 0; i < this.products.length; i++) {
            let product = this.products[i];
            product.amount = amount;

            if (product.hasOwnProperty('deleted') && product.deleted == true) {
                continue;
            }

            if (product.stock == -1) {
                result.push(product);
                continue;
            }

            // product is limited, check if it's still available
            if (product.stock > 0 && product.amount <= product.stock) {
                if (!product.hasOwnProperty("merchant_stock")) product.merchant_stock = {};

                // this merchant has never bought this product before aka he can buy it
                if (!product.merchant_stock.hasOwnProperty(merchant_id)) {
                    product.merchant_stock[merchant_id] = product.stock;
                    result.push(product);
                    continue;
                } else if (product.merchant_stock[merchant_id] - product.amount >= 0) {
                    // the merchant still has enough of this product left in stock
                    result.push(product);
                    continue;
                }
            }
        }
        return result;
    },

    // prepares a product for buy, ie decreases the amount left in stock for that merchant
    // and creates a copy of the product that contains only the keys listed as public below (see publicProductBuyAttributes)
    prepareProductForBuy: function(product, merchant_id) {
        let cleanProduct = {};
        for (let key in product) {
            if (publicProductBuyAttributes.indexOf(key) > -1) {
                cleanProduct[key] = product[key];
            }
        }
        if (product.stock > 0) {
            product.merchant_stock[merchant_id] -= product.amount;
            cleanProduct.left_in_stock = product.merchant_stock[merchant_id];
        }
        return cleanProduct;
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
                //this.products.splice(i, 1);
                this.products[i].deleted = true;
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
        } else if (existingProduct.hasOwnProperty('deleted') && existingProduct.deleted == true) {
            // product existed once: replace it with new information and remove deleted-flag
            for (var key in existingProduct) {
                if (newProduct.hasOwnProperty(key)) {
                    existingProduct[key] = newProduct[key];
                } else {
                    delete existingProduct[key]; // will also remove the deleted-flag
                }
            }
            return true;
        } else {
            return false;
        }
    },

    // returns all available products
    GetExistingProducts : function() {
        return cleanUpProducts(filterForExistingProducts(this.products));
    },

    // returns all products, also the once that have been deleted and are no longer sold
    GetAllProducts : function() {
        return cleanUpProducts(this.products);
    }
};

// list all attributes that should be visible via the GET /products-route
var publicProductAttributes = ["uid", "product_id", "name", "quality", "price", "stock", "time_to_live", "start_of_lifetime", "deleted"];

// list all attributes that should be returned on the GET /buy-route
var publicProductBuyAttributes = ["uid", "product_id", "name", "quality", "price", "stock", "amount", "time_to_live", "start_of_lifetime"];

// creates a copy of the products-list that contains only the keys listed as public above
function cleanUpProducts(products) {
    let result = [];
    for (let i = 0; i < products.length; i++) {
        let cleanProduct = {};
        for (let key in products[i]) {
            if (publicProductAttributes.indexOf(key) > -1) {
                cleanProduct[key] = products[i][key];
            }
        }
        result.push(cleanProduct);
    }
    return result;
}

function filterForExistingProducts(products) {
    let result = [];
    for (let i = 0; i < products.length; i++) {
        if (!products[i].hasOwnProperty('deleted') || products[i].deleted == false) {
            result.push(products[i]);
        }
    }
    return result;
}

function createValidProduct(np) {
    var product = {
        "product_id": np.product_id ? np.product_id : "100",
        "name": np.name ? np.name : "Unnamed product",
        "quality": np.quality ? np.quality : 4,
        "price": np.price ? np.price : 15,
        "stock": np.stock ? np.stock : -1,
        "time_to_live": np.time_to_live ? np.time_to_live : -1,
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
