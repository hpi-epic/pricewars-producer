const crypto = require('crypto');
const secret_key = crypto.randomBytes(16);

const aesjs = require("aes-js");
const aesEcb = new aesjs.ModeOfOperation.ecb(secret_key);

const allQualities = Object.freeze({veryGood: 1, good: 2, fair: 3, acceptable: 4});

const Products = {

    // This is a mapping from product id to product info
    productsInfo: {
        1: {
            product_id: 1,
            name: 'CD_1',
            unit_price: 15,
            fixed_order_cost: 0,
            stock: -1,
            time_to_live: -1,
            start_of_lifetime: -1,
            qualities: new Set([
                allQualities.veryGood,
                allQualities.good,
                allQualities.fair,
                allQualities.acceptable
            ])
        }
    },

    // Each merchant has a certain stock of each product. If remaining_stock does not contain an entry for a specific
    // product and merchant, that merchant has a stock as indicated in the corresponding product info.
    // A stock of -1 means unlimited stock.
    remaining_stock: {},

    getProductInfo(productId) {
        const productInfo = Object.assign({}, this.productsInfo[productId]);
        // Change the set of qualities to an array because we cannot send sets via JSON
        productInfo.qualities = Array.from(productInfo.qualities);
        return productInfo;
    },

    getAllProductsInfo() {
        return Object.keys(this.productsInfo).map(productId => this.getProductInfo(productId));
    },

    // returns all products that are still available for sell for the given merchant
    getAvailableProducts(merchantId, amount) {
        return Object.values(this.productsInfo).filter(productInfo => this.hasEnoughStock(productInfo, merchantId, amount));
    },

    hasEnoughStock(productInfo, merchantId, amount) {
        // Stock is unlimited
        if (productInfo.stock === -1) return true;

        if (!this.remaining_stock.hasOwnProperty(productInfo.product_id)) {
            this.remaining_stock[productInfo.product_id] = {};
        }

        // product is limited, check if it's still available
        if (this.remaining_stock[productInfo.product_id].hasOwnProperty(merchantId)
            && this.remaining_stock[productInfo.product_id][merchantId] >= amount) {
            return true;
        }
        // If merchant hasn't bought this product before, his personal available stock equals productInfo.stock
        return !this.remaining_stock[productInfo.product_id].hasOwnProperty(merchantId) && productInfo.stock >= amount;
    },

    // If enough items in stock, it reduces the stock and returns the number of items left in stock.
    // Otherwise, it returns undefined.
    reduceStock(productInfo, merchantId, amount) {
        // stock is unlimited
        if (productInfo.stock === -1) return productInfo.stock;

        if (!this.remaining_stock.hasOwnProperty(productInfo.product_id)) {
            this.remaining_stock[productInfo.product_id] = {};
        }

        // The merchant has never bought this product if he does not appear in remaining_stock
        if (!this.remaining_stock[productInfo.product_id].hasOwnProperty(merchantId)) {
            this.remaining_stock[productInfo.product_id][merchantId] = productInfo.stock;
        }

        if (this.remaining_stock[productInfo.product_id][merchantId] >= amount) {
            this.remaining_stock[productInfo.product_id][merchantId] -= amount;
            return productInfo.stock;
        }
        return undefined;
    },

    // generates an encrypted signature for a given product that only the marketplace and producer can read
    createSignature(merchantId, uid, amount, timeOfBuy) {
        const text = uid + ' ' + amount  + ' ' + merchantId + ' ' + timeOfBuy;
        const padded_text = aesjs.util.convertStringToBytes(addWhitespacePadding(text));
        return aesEcb.encrypt(padded_text).toString('base64');
    },

    getSecretKey() {
        return secret_key.toString('base64');
    },

    updateProductInfo(id, newProduct) {
        if (id !== newProduct.product_id) return false;
        if (this.productsInfo[id] === undefined) return false;
        this.productsInfo[id] = newProduct;
        return true;
    },

    deleteProductInfo(id) {
        delete this.productsInfo[id];
        return true;
    },

    // Adds a new product info but does not replace existing ones
    addProductInfo(newProduct) {
        console.log(newProduct);
        if (this.productsInfo[newProduct.product_id] !== undefined) return false;
        this.productsInfo[newProduct.product_id] = newProduct;
        return true;
    },

    orderRandomProduct(merchantId, amount, timeOfBuy) {
        const availableProducts = this.getAvailableProducts(merchantId, amount);
        if (availableProducts.length === 0) return undefined;
        const randomProductId = randomChoice(availableProducts).product_id;
        return this.orderProduct(merchantId, amount, timeOfBuy, randomProductId);
    },

    orderProduct(merchantId, totalAmount, timeOfBuy, productId) {
        const productInfo = this.productsInfo[productId];
        if (productInfo === undefined) return undefined;
        const leftInStock = this.reduceStock(productInfo, merchantId, totalAmount);
        if (leftInStock === undefined) return undefined;

        // Draw random qualities from available qualities
        const qualityAmounts = countOccurrences(randomChoices(Array.from(productInfo.qualities), totalAmount));

        const order = {
            product_id: productId,
            product_name: productInfo.name,
            billing_amount: productInfo.unit_price * totalAmount + productInfo.fixed_order_cost,
            fixed_cost: productInfo.fixed_order_cost,
            unit_price: productInfo.unit_price,
            stock: productInfo.stock,
            left_in_stock: leftInStock,
            products: []
        };

        for (const [key, amount] of Object.entries(qualityAmounts)) {
            const quality = parseInt(key);
            const uid = parseInt("" + productInfo.product_id + quality);
            order.products.push({
                uid: uid,
                product_id: productInfo.product_id,
                name: productInfo.name,
                quality: quality,
                amount: amount,
                time_to_live: productInfo.time_to_live,
                start_of_lifetime: productInfo.start_of_lifetime,
                signature: this.createSignature(merchantId, uid, amount, timeOfBuy)
            });
        }

        return order;
    }
};

// Picks a random element from an array
function randomChoice(values) {
    return values[Math.floor(Math.random() * values.length)];
}

// Picks multiple random elements from an array. Elements can be picked multiple times.
function randomChoices(values, number_choices) {
    const choices = [];
    for (let i = 0; i < number_choices; i++) {
        choices.push(randomChoice(values));
    }
    return choices;
}

// Counts occurrences of each value
function countOccurrences(values) {
    const occurrences = {};
    for (let i = 0; i < values.length; ++i) {
        if (occurrences.hasOwnProperty(values[i])) {
            occurrences[values[i]] += 1;
        } else {
            occurrences[values[i]] = 1;
        }
    }
    return occurrences;
}

// Adds whitespaces to the string until its length is a multiple of 16
function addWhitespacePadding(text) {
    return text + ' '.repeat((16 - (text.length % 16)) % 16);
}

module.exports = Products;
