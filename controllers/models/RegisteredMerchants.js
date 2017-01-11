var RegisteredMerchants = [];

var storage = require('node-persist');
var usedStorage;

RegisteredMerchants.LoadRegisteredMerchants = function() {

    if (process.env.NODE_ENV == 'test') {
        usedStorage = storage.create({dir: 'test/storage'});
        // no need to call init, has been done in tests
    } else {
        usedStorage = storage.create({dir: 'storage'});
        usedStorage.initSync();
    }

    usedStorage.getItem('registered_merchants').then(function(value) {
        if (value === null || value === undefined) {
            usedStorage.setItem('registered_merchants', RegisteredMerchants);
        } else {
            var tempMerchants = value;
            tempMerchants.forEach(function(tempMerchant) {
                var merchant = new RegisteredMerchant(tempMerchant.merchant_id, tempMerchant.products);
                RegisteredMerchants.push(merchant);
            });
        }
    });
}();

RegisteredMerchants.GetRegisteredMerchants = function() {
    return RegisteredMerchants;
};

RegisteredMerchants.RegisterMerchant = function (merchant_id, product_choice) {
    var merchant = new RegisteredMerchant(merchant_id, product_choice);
    RegisteredMerchants.push(merchant);
    usedStorage.setItem('registered_merchants', RegisteredMerchants);

    return merchant;
};

var RegisteredMerchant = function(merchant_id, product_choice) {
    this.merchant_id = merchant_id;
    this.products = product_choice;
};

RegisteredMerchant.prototype.GetRandomProductFromOwnStock = function(amount) {
    if (this.products.length == 0) return undefined;

    if (amount == undefined || amount < 1) amount = 1;
    var randomProductPos = getRandomInt(0, this.products.length - 1);

    // get a random product
    var randomProduct = this.products[randomProductPos];
    while (randomProduct.stock != -1 && randomProduct.stock < amount) {
            randomProductPos = getRandomInt(0, this.products.length - 1);
            randomProduct = this.products[randomProductPos];
    }
    randomProduct["amount"] = amount;

    // decrease that product's amount and if it's out of stock, delete it
    if (this.products[randomProductPos].stock != -1) {
        this.products[randomProductPos].stock -= amount;
        if (this.products[randomProductPos].stock == 0) {
            this.products.splice(randomProductPos, 1);
        }
    }

    // save the changes
    usedStorage.setItem('registered_merchants', RegisteredMerchants);

    return randomProduct;
};

RegisteredMerchant.prototype.GetSpecificProduct = function(uid, amount) {
    for (var j = 0; j < this.products.length; j++) {
        if (this.products[j] == uid) {
            var requestedProduct = Products.GetProductByUID(this.products[j]);
            requestedProduct["amount"] = amount;
            return requestedProduct;
        }
    }
    return undefined;
};

// 'static' function to get an already registered merchant by ID
RegisteredMerchants.GetRegisteredMerchant = function(merchant_id) {
    for (var i = 0; i < RegisteredMerchants.length; i++) {
        if (RegisteredMerchants[i].merchant_id == merchant_id) return RegisteredMerchants[i];
    }
    return undefined;
};

// 'static' function to delete an already registered merchant.
// Returns true if the merchant was found and deleted, false otherwise.
RegisteredMerchants.DeleteMerchant = function(merchant_id) {
    for (var i = 0; i < RegisteredMerchants.length; i++) {
        if (RegisteredMerchants[i].merchant_id === merchant_id) {
            RegisteredMerchants.splice(i, 1);
            usedStorage.setItem('registered_merchants', RegisteredMerchants);
            return true;
        }
    }
    return false;
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = RegisteredMerchants;