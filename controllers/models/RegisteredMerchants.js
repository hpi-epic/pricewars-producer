var RegisteredMerchants = [];

var Products = require("../models/Products.js");
var storage = require('node-persist');
storage.init();

//storage.getItem("registered")

RegisteredMerchants.RegisterMerchant = function (merchant_id) {
    var merchant = new RegisteredMerchant(merchant_id, Products.GetRandomProductIDs(5));
    RegisteredMerchants.push(merchant);
    return merchant;
};

var RegisteredMerchant = function(merchant_id, productIDs) {
    this.merchant_id = merchant_id;
    this.products = productIDs;
}

RegisteredMerchant.prototype.GetRandomProduct = function(amount) {
    var randomProductID = this.products[getRandomInt(0, this.products.length - 1)];
    var randomProduct = Products.GetProductByID(randomProductID);
    randomProduct["amount"] = amount;
    return randomProduct;
};

RegisteredMerchant.prototype.GetSpecificProduct = function(product_id, amount) {
    for (var j = 0; j < this.products.length; j++) {
        if (this.products[j] === product_id) {
            var requestedProduct = Products.GetProductByID(this.products[j]);
            requestedProduct["amount"] = amount;
            return requestedProduct;
        }
    }
    return undefined;
};

// 'static' function to get an already registered merchant by ID
RegisteredMerchants.GetRegisteredMerchant = function(merchant_id) {
    for (var i = 0; i < RegisteredMerchants.length; i++) {
        if (RegisteredMerchants[i].merchant_id === merchant_id) return RegisteredMerchants[i];
    }
    return undefined;
};

// 'static' function to delete an already registered merchant.
// Returns true if the merchant was found and deleted, false otherwise.
RegisteredMerchants.DeleteMerchant = function(merchant_id) {
    for (var i = 0; i < RegisteredMerchants.length; i++) {
        if (RegisteredMerchants[i].merchant_id === merchant_id) {
            RegisteredMerchants.splice(i, 1);
            return true;
        }
    }
    return false;
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = RegisteredMerchants;