var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    public_key = crypto.randomBytes(32).toString('hex');

var Products = {

    products :
        [
            {
                uid: 11,
                product_id: 1,
                name: "CD_1",
                quality: 1,
                price: 15
            },
            {
                uid: 12,
                product_id: 1,
                name: "CD_1",
                quality: 2,
                price: 12
            },
            {
                uid: 13,
                product_id: 1,
                name: "CD_1",
                quality: 3,
                price: 9
            },
            {
                uid: 14,
                product_id: 1,
                name: "CD_1",
                quality: 4,
                price: 6
            },
            {
                uid: 21,
                product_id: 2,
                name: "CD_2",
                quality: 1,
                price: 15
            },
            {
                uid: 22,
                product_id: 2,
                name: "CD_2",
                quality: 2,
                price: 12
            },
            {
                uid: 23,
                product_id: 2,
                name: "CD_2",
                quality: 3,
                price: 9
            },
            {
                uid: 24,
                product_id: 2,
                name: "CD_2",
                quality: 4,
                price: 6
            },
            {
                uid: 31,
                product_id: 3,
                name: "CD_3",
                quality: 1,
                price: 15
            },
            {
                uid: 32,
                product_id: 3,
                name: "CD_3",
                quality: 2,
                price: 12
            },
            {
                uid: 33,
                product_id: 3,
                name: "CD_3",
                quality: 3,
                price: 9
            },
            {
                uid: 34,
                product_id: 3,
                name: "CD_3",
                quality: 4,
                price: 6
            },
            {
                uid: 41,
                product_id: 4,
                name: "CD_4",
                quality: 1,
                price: 15
            },
            {
                uid: 42,
                product_id: 4,
                name: "CD_4",
                quality: 2,
                price: 12
            },
            {
                uid: 43,
                product_id: 4,
                name: "CD_4",
                quality: 3,
                price: 9
            },
            {
                uid: 44,
                product_id: 4,
                name: "CD_4",
                quality: 4,
                price: 6
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

    GetRandomProduct : function(amount) {
        if (amount == undefined) amount = 1;
        var randomProduct = this.products[getRandomInt(0, this.products.length - 1)];
        randomProduct["amount"] = amount;
        return randomProduct;
    },

    // encrypts a given product by adding an encrypted hash to the product-object that only the marketplace can read
    AddEncryption : function(product, timeOfBuy) {
        var hash = generateProductSignature(product, timeOfBuy);
        product["signature"] = encrypt(hash);
        return product;
    },

    GetPublicKey : function() {
        return public_key;
    },

    SetProducts : function(new_products) {
        this.products = new_products;
    },

    SetProduct : function(uid, newProduct) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].uid == uid) {
                newProduct["uid"] = "" + newProduct["product_id"] + newProduct["quality"];

                // make sure this uid does not exist yet
                var existingProduct = this.GetProductByUID(newProduct["uid"]);
                if (existingProduct) {
                    return false;
                }

                this.products[i] = newProduct;
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
        newProduct["uid"] = "" + newProduct["product_id"] + newProduct["quality"];

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

// returns a random int (range including min and max)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function encrypt(text){
    var cipher = crypto.createCipher(algorithm, public_key);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
}

function generateProductSignature(product, timeOfBuy) {
    var amount =product.amount == undefined ? 1 : product.amount;
    return product.uid + ' ' + amount  + ' ' + timeOfBuy;
}

module.exports = Products;