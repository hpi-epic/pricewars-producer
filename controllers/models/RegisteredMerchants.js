var RegisteredMerchants = [];

RegisteredMerchants.RegisterMerchant = function (merchant_id, products) {
    RegisteredMerchants.push({
        merchant_id : merchant_id,
        products : products
    });
};

RegisteredMerchants.GetRegisteredMerchants = function() {
  return RegisteredMerchants;
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
}

module.exports = RegisteredMerchants;