const crypto = require('crypto');
const secret_key = crypto.randomBytes(16);

const aesjs = require("aes-js");
const aesEcb = new aesjs.ModeOfOperation.ecb(secret_key);

const Products = {

    products :
        [
            {
                uid: 11,
                product_id: 1,
                name: "CD_1",
                quality: 1,
                price: 15,
                fixed_order_cost: 0,
                stock: -1,
                time_to_live: -1,
                start_of_lifetime: -1,
                deleted: false
            },
            {
                uid: 12,
                product_id: 1,
                name: "CD_1",
                quality: 2,
                price: 12,
                fixed_order_cost: 0,
                stock: -1,
                time_to_live: -1,
                start_of_lifetime: -1,
                deleted: false
            },
            {
                uid: 13,
                product_id: 1,
                name: "CD_1",
                quality: 3,
                price: 9,
                fixed_order_cost: 0,
                stock: -1,
                time_to_live: -1,
                start_of_lifetime: -1,
                deleted: false
            },
            {
                uid: 14,
                product_id: 1,
                name: "CD_1",
                quality: 4,
                price: 6,
                fixed_order_cost: 0,
                stock: -1,
                time_to_live: -1,
                start_of_lifetime: -1,
                deleted: false
            }
        ],

    // returns a product by uid, so a unique product with a specific quality
    GetProductByUID : function (uid) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].uid == uid) {
                return this.products[i];
            }
        }
        return undefined;
    },

    getRandomProduct : function(merchant_id, amount) {
        let availableProducts = this.GetAvailableProducts(merchant_id, amount);
        if (availableProducts.length === 0) return undefined;

        let randomProduct = availableProducts[getRandomInt(0, availableProducts.length - 1)];

        return this.createProduct(randomProduct, merchant_id, amount);
    },

    // returns all products that are still available for sell for the given merchant
    GetAvailableProducts: function(merchant_id, amount) {
        let result = [];
        for (let i = 0; i < this.products.length; i++) {
            const product = this.products[i];

            if (product.deleted === true) {
                continue;
            }

            if (product.stock == -1) {
                result.push(product);
                continue;
            }

            // product is limited, check if it's still available
            if (product.stock > 0 && amount <= product.stock) {
                if (!product.hasOwnProperty("merchant_stock")) product.merchant_stock = {};

                // this merchant has never bought this product before aka he can buy it
                if (!product.merchant_stock.hasOwnProperty(merchant_id)) {
                    product.merchant_stock[merchant_id] = product.stock;
                }

                if (product.merchant_stock[merchant_id] - amount >= 0) {
                    // the merchant still has enough of this product left in stock
                    result.push(product);
                }
            }
        }
        return result;
    },

    // prepares a product for buy, ie decreases the amount left in stock for that merchant
    createProduct: function(product_info, merchant_id, amount) {
        const product = {
            'uid': product_info.uid,
            'product_id': product_info.product_id,
            'name': product_info.name,
            'quality': product_info.quality,
            'price': product_info.price,
            'stock': product_info.stock,
            'amount': amount,
            'time_to_live': product_info.time_to_live,
            'start_of_lifetime': product_info.start_of_lifetime,
            'fixed_order_cost': product_info.fixed_order_cost
        };

        if (product_info.stock > 0) {
            product_info.merchant_stock[merchant_id] -= product_info.amount;
            product.left_in_stock = product_info.merchant_stock[merchant_id];
        }

        return product;
    },

    // generates a encrypted signature for a given product that only the marketplace and producer can read
    createSignature : function(merchant_hash, product, timeOfBuy) {
        const text = product.uid + ' ' + product.amount  + ' ' + merchant_hash + ' ' + timeOfBuy;
        const padded_text = aesjs.util.convertStringToBytes(addWhitespacePadding(text));
        return aesEcb.encrypt(padded_text).toString('base64');
    },

    GetPublicKey : function() {
        return secret_key.toString('base64');
    },

    SetProducts : function(new_products) {
        var products = [];
        new_products.forEach(function(np) {
            var new_product = createValidProduct(np);
            products.push(new_product);
        });
        this.products = products;
    },

    setProduct(uid, newProduct) {
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
        } else if (existingProduct.deleted === true) {
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

    getExistingProducts : function() {
        return this.products.filter(product => product.deleted === false);
    },

    // returns all products, also the once that have been deleted and are no longer sold
    getAllProducts : function() {
        return this.products;
    }
};

function createValidProduct(np) {
    let product = {
        "product_id": np.product_id ? np.product_id : "100",
        "name": np.name ? np.name : "Unnamed product",
        "quality": np.quality ? np.quality : 4,
        "price": np.price ? np.price : 15,
        "stock": np.stock ? np.stock : -1,
        "time_to_live": np.time_to_live ? np.time_to_live : -1,
        "start_of_lifetime": np.start_of_lifetime ? np.start_of_lifetime : -1,
        "fixed_order_cost": np.fixed_order_cost ? np.fixed_order_cost : 0,
    };
    product.uid = parseInt("" + product.product_id + product.quality);
    return product;
}

// returns a random int (range including min and max)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Adds whitespaces to the string until its length is a multiple of 16
function addWhitespacePadding(text) {
    return text + ' '.repeat((16 - (text.length % 16)) % 16);
}

module.exports = Products;
