const crypto = require('crypto');
const secretKey = crypto.randomBytes(16);

const aesjs = require("aes-js");
const aesEcb = new aesjs.ModeOfOperation.ecb(secretKey);

const allQualities = Object.freeze({veryGood: 1, good: 2, fair: 3, acceptable: 4});

const Products = {

    // This is a mapping from product id to product info
    productsInfo: {
        1: {
            name: 'Product #1',
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
        if (this.productsInfo[productId] === undefined) return undefined;
        const productInfo = Object.assign({}, this.productsInfo[productId]);
        // Change the set of qualities to an array because we cannot send sets via JSON
        productInfo.qualities = Array.from(productInfo.qualities);
        productInfo.product_id = productId;
        return productInfo;
    },

    getAllProductsInfo() {
        return Object.keys(this.productsInfo).map(productId => this.getProductInfo(productId));
    },

    // returns ids of all products with enough stock for a given merchant and order quantity
    getAvailableProductIds(merchantId, quantity) {
        return Object.keys(this.productsInfo)
            .map(id => parseInt(id))
            .filter(productId => this.hasEnoughStock(productId, merchantId, quantity));
    },

    hasEnoughStock(productId, merchantId, quantity) {
        const productInfo = this.productsInfo[productId];
        // Stock is unlimited
        if (productInfo.stock === -1) return true;

        if (!this.remaining_stock.hasOwnProperty(productId)) {
            this.remaining_stock[productId] = {};
        }

        // product is limited, check if it's still available
        if (this.remaining_stock[productId].hasOwnProperty(merchantId)
            && this.remaining_stock[productId][merchantId] >= quantity) {
            return true;
        }
        // If merchant hasn't bought this product before, his personal available stock equals productInfo.stock
        return !this.remaining_stock[productId].hasOwnProperty(merchantId) && productInfo.stock >= quantity;
    },

    // If enough items in stock, it reduces the stock and returns the number of items left in stock.
    // Otherwise, it returns undefined.
    reduceStock(productId, merchantId, quantity) {
        const productInfo = this.productsInfo[productId];
        // stock is unlimited
        if (productInfo.stock === -1) return productInfo.stock;

        if (!this.remaining_stock.hasOwnProperty(productId)) {
            this.remaining_stock[productId] = {};
        }

        // The merchant has never bought this product if he does not appear in remaining_stock
        if (!this.remaining_stock[productId].hasOwnProperty(merchantId)) {
            this.remaining_stock[productId][merchantId] = productInfo.stock;
        }

        if (this.remaining_stock[productId][merchantId] >= quantity) {
            this.remaining_stock[productId][merchantId] -= quantity;
            return productInfo.stock;
        }
        return undefined;
    },

    // generates an encrypted signature for a given product that only the marketplace and producer can read
    createSignature(merchantId, uid, quantity, timeOfBuy) {
        const text = uid + ' ' + quantity  + ' ' + merchantId + ' ' + timeOfBuy;
        const padded_text = aesjs.util.convertStringToBytes(addWhitespacePadding(text));
        return aesEcb.encrypt(padded_text).toString('base64');
    },

    getSecretKey() {
        return secretKey.toString('base64');
    },

    updateProductInfo(id, newProduct) {
        if (id !== parseInt(newProduct.product_id)) return false;
        if (this.productsInfo[id] === undefined) return false;
        this.productsInfo[id] = newProduct;
        return true;
    },

    deleteProductInfo(id) {
        if (this.productsInfo[id] === undefined) return false;
        delete this.productsInfo[id];
        return true;
    },

    // Adds a new product info but does not replace existing ones
    addProductInfo(newProduct) {
        if (this.productsInfo[newProduct.product_id] !== undefined) return false;
        this.productsInfo[newProduct.product_id] = newProduct;
        return true;
    },

    orderRandomProduct(merchantId, quantity, timeOfBuy) {
        const availableProductIds = this.getAvailableProductIds(merchantId, quantity);
        const randomProductId = randomChoice(availableProductIds);
        return this.orderProduct(merchantId, quantity, timeOfBuy, randomProductId);
    },

    orderProduct(merchantId, totalQuantity, timeOfBuy, productId) {
        const productInfo = this.productsInfo[productId];
        if (productInfo === undefined) return undefined;
        const leftInStock = this.reduceStock(productId, merchantId, totalQuantity);
        if (leftInStock === undefined) return undefined;

        // Draw random qualities from available qualities
        const qualityQuantities = countOccurrences(randomChoices(Array.from(productInfo.qualities), totalQuantity));

        const order = {
            product_id: productId,
            product_name: productInfo.name,
            billing_amount: productInfo.unit_price * totalQuantity + productInfo.fixed_order_cost,
            fixed_cost: productInfo.fixed_order_cost,
            unit_price: productInfo.unit_price,
            stock: productInfo.stock,
            left_in_stock: leftInStock,
            products: []
        };

        for (const [key, quantity] of Object.entries(qualityQuantities)) {
            const quality = parseInt(key);
            const uid = parseInt("" + productId + quality);
            order.products.push({
                uid: uid,
                product_id: productId,
                name: productInfo.name,
                quality: quality,
                quantity: quantity,
                time_to_live: productInfo.time_to_live,
                start_of_lifetime: productInfo.start_of_lifetime,
                signature: this.createSignature(merchantId, uid, quantity, timeOfBuy)
            });
        }

        return order;
    }
};

// Picks a random element from an array. Returns undefined for empty lists
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
