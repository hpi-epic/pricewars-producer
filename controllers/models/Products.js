var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    public_key = crypto.randomBytes(32).toString('hex');

var Products = {

    products :
        [
            {
                uid: 1,
                product_id: 1,
                name: "CD_1",
                quality: 1,
                price: 15
            },
            {
                uid: 2,
                product_id: 1,
                name: "CD_1",
                quality: 2,
                price: 12
            },
            {
                uid: 3,
                product_id: 1,
                name: "CD_1",
                quality: 3,
                price: 9
            },
            {
                uid: 4,
                product_id: 1,
                name: "CD_1",
                quality: 4,
                price: 6
            },
            {
                uid: 5,
                product_id: 2,
                name: "CD_2",
                quality: 1,
                price: 15
            },
            {
                uid: 6,
                product_id: 2,
                name: "CD_2",
                quality: 2,
                price: 12
            },
            {
                uid: 7,
                product_id: 2,
                name: "CD_2",
                quality: 3,
                price: 9
            },
            {
                uid: 8,
                product_id: 2,
                name: "CD_2",
                quality: 4,
                price: 6
            },
            {
                uid: 9,
                product_id: 3,
                name: "CD_3",
                quality: 1,
                price: 15
            },
            {
                uid: 10,
                product_id: 3,
                name: "CD_3",
                quality: 2,
                price: 12
            },
            {
                uid: 11,
                product_id: 3,
                name: "CD_3",
                quality: 3,
                price: 9
            },
            {
                uid: 12,
                product_id: 3,
                name: "CD_3",
                quality: 4,
                price: 6
            },
            {
                uid: 13,
                product_id: 4,
                name: "CD_4",

                quality: 1,
                price: 15
            },
            {
                uid: 14,
                product_id: 4,
                name: "CD_4",
                quality: 2,
                price: 12
            },
            {
                uid: 15,
                product_id: 4,
                name: "CD_4",
                quality: 3,
                price: 9
            },
            {
                uid: 16,
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
            if (this.products[i].uid === uid) {
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
            if (this.products[i].uid === uid) {
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

    AddProduct : function(newproduct) {
       this.products.push(newproduct);
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