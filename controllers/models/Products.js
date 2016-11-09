var Products = [
    {
        product_id: 1,
        name: "CD_Rock",
        genre: "Rock",
        price: 15
    },
    {
        product_id: 2,
        name: "CD_Classic",
        genre: "Classic",
        price: 15
    },
    {
        product_id: 3,
        name: "CD_Pop",
        genre: "Pop",
        price: 15
    },
    {
        product_id: 4,
        name: "CD_Jazz",
        genre: "JazZ",
        price: 15
    },
    {
        product_id: 5,
        name: "CD_Children",
        genre: "Children",
        price: 15
    },
    {
        product_id: 6,
        name: "CD_Electro",
        genre: "Electro",
        price: 15
    },
    {
        product_id: 7,
        name: "CD_Dance",
        genre: "Dance",
        price: 15
    },
    {
        product_id: 8,
        name: "CD_Country",
        genre: "Country",
        price: 15
    },
    {
        product_id: 9,
        name: "CD_HipHop",
        genre: "Hip Hop",
        price: 15
    },
    {
        product_id: 10,
        name: "CD_Christmas",
        genre: "Christmas",
        price: 15
    }
];

Products.GetStartProductIDs = function (numberOfRandomProducts, numberOfSharedProducts) {
    var randomProductIDs = [];

    // if merchants share products, just add the first x available products to the selection
    if (numberOfSharedProducts === undefined) numberOfSharedProducts = 0;
    for (var i = 0; i < numberOfSharedProducts; i++) {
        randomProductIDs.push(Products[i].product_id);
    }

    // then fill up with random products
    while (randomProductIDs.length < (numberOfRandomProducts + numberOfSharedProducts)) {
        var randomProductIndex = getRandomInt(numberOfSharedProducts, Products.length - 1);
        var randomProduct = Products[randomProductIndex];

        // check whether product has been chosen already
        if (randomProductIDs.indexOf(randomProduct.product_id) > -1) continue;

        randomProductIDs.push(randomProduct.product_id);
    }

    return randomProductIDs;
};

Products.GetProductByID = function (product_id) {
    for (var i = 0; i < Products.length; i++) {
        if (Products[i].product_id === product_id) {
            return Products[i];
        }
    }
    return undefined;
};

// returns a random int (range including min and max)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = Products;