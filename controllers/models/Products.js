const crypto = require('crypto');
const secret_key = crypto.randomBytes(16);

const aesjs = require("aes-js");
const aesEcb = new aesjs.ModeOfOperation.ecb(secret_key);

const allQualities = Object.freeze({veryGood: 1, good: 2, fair: 3, acceptable: 4});

const Products = {

    // This is a mapping from product id to product info
    productsInfo: {
        1: {
            //TODO: can I remove redundant product id?
            product_id: 1,
            name: 'CD_1',
            price: 15,
            fixed_order_cost: 0,
            stock: -1,
            time_to_live: -1,
            start_of_lifetime: -1,
            merchant_stock: {},
            qualities: new Set([
                allQualities.veryGood,
                allQualities.good,
                allQualities.fair,
                allQualities.acceptable
            ])
        }
    },

    // returns a product by uid, so a unique product with a specific quality
    getProductInfo(product_id) {
        //TODO: this used to be UID -> specific product
        return this.productsInfo[product_id]
    },

    // returns all products that are still available for sell for the given merchant
    getAvailableProducts(merchantId, amount) {
        return Object.values(this.productsInfo).filter(productInfo => this.hasEnoughStock(productInfo, merchantId, amount));
    },

    hasEnoughStock(productInfo, merchantId, amount) {
        // Stock is unlimited
        if (productInfo.stock === -1) return true;

        // product is limited, check if it's still available
        if (productInfo.merchant_stock.hasOwnProperty(merchantId) && productInfo.merchant_stock[merchantId] >= amount) {
            return true;
        }
        // If merchant hasn't bought this product before, his personal available stock equals productInfo.stock
        return !productInfo.merchant_stock.hasOwnProperty(merchantId) && productInfo.stock >= amount;
    },

    // If enough items in stock, it reduces the stock and returns the number of items left in stock.
    // Otherwise, it returns undefined.
    reduceStock(productInfo, merchantId, amount) {
        // stock is unlimited
        if (productInfo.stock === -1) return productInfo.stock;

        // The merchant has never bought this product if he does not appear in merchant_stock
        if (!productInfo.merchant_stock.hasOwnProperty(merchantId)) {
            productInfo.merchant_stock[merchantId] = productInfo.stock;
        }

        if (productInfo.merchant_stock[merchantId] >= amount) {
            productInfo.merchant_stock[merchantId] -= amount;
            return productInfo.stock;
        }
        return undefined;
    },

    // generates an encrypted signature for a given product that only the marketplace and producer can read
    createSignature(merchantId, uid, amount, timeOfBuy) {
        const text = uid + ' ' + amount  + ' ' + merchantId + ' ' + timeOfBuy;
        console.log('signature ' + text);
        const padded_text = aesjs.util.convertStringToBytes(addWhitespacePadding(text));
        return aesEcb.encrypt(padded_text).toString('base64');
    },

    getSecretKey() {
        return secret_key.toString('base64');
    },

    setProducts(newProductsInfo) {
        //TODO: marketplace sends proper format
        //TODO: validate input
        this.productsInfo = newProductsInfo;
    },

    updateProductInfo(uid, newProduct) {
        //TODO: marketplace sends proper format
        //TODO: validate input
        if (this.productsInfo[newProduct.product_id] === undefined) return false;
        this.productsInfo[newProduct.product_id] = newProduct;
        return true;
    },

    deleteProductQuality(uid) {
        const [productId, quality] = splitToIdAndQuality(uid);
        const productInfo = this.productsInfo[productId];
        if (productInfo === undefined) return false;
        const containedQuality = productInfo.qualities.delete(quality);
        if (!containedQuality) return false;
        if (productInfo.qualities.size === 0) {
            delete this.productsInfo[productId];
        }
        return true;
    },

    // Adds a new product info but does not replace existing ones
    addProduct(newProduct) {
        //TODO: marketplace sends proper format
        //TODO: validate input
        if (this.productsInfo[newProduct.product_id] !== undefined) return false;
        this.productsInfo[newProduct.product_id] = newProduct;
        return true;
    },

    getAllProducts() {
        return this.productsInfo;
    },

    orderRandomProduct(merchantId, amount, timeOfBuy) {
        const availableProducts = this.getAvailableProducts(merchantId, amount);
        const randomProductId = randomChoice(availableProducts).product_id;
        return this.orderProduct(merchantId, amount, timeOfBuy, randomProductId);
    },

    orderProduct(merchantId, amount, timeOfBuy, productId) {
        const productInfo = this.productsInfo[productId];
        if (productInfo === undefined) return undefined;
        //TODO: for now single quality, get multiple qualities
        const quality = randomChoice(Array.from(productInfo.qualities));
        const uid = parseInt("" + productInfo.product_id + quality);
        const leftInStock = this.reduceStock(productInfo, merchantId, amount);
        if (leftInStock === undefined) return undefined;

        return {
            billing_amount: productInfo.price * amount + productInfo.fixed_order_cost,
            fixed_cost: productInfo.fixed_order_cost,
            unit_price: productInfo.price,
            stock: productInfo.stock,
            left_in_stock: leftInStock,
            product: {
                uid: uid,
                product_id: productInfo.product_id,
                name: productInfo.name,
                quality: quality,
                amount: amount,
                time_to_live: productInfo.time_to_live,
                start_of_lifetime: productInfo.start_of_lifetime,
                signature: this.createSignature(merchantId, uid, amount, timeOfBuy)
            }
        };
    }
};

// Picks a random element from an array
function randomChoice(values) {
    return values[Math.floor(Math.random() * values.length)];
}

// Adds whitespaces to the string until its length is a multiple of 16
function addWhitespacePadding(text) {
    return text + ' '.repeat((16 - (text.length % 16)) % 16);
}

function splitToIdAndQuality(uid) {
    const product_id = uid.toString().slice(0, -1);
    const quality = uid.toString().slice(-1);
    return [product_id, quality];
}

module.exports = Products;
