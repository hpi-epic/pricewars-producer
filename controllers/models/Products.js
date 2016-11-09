var Products = [
    {
        product_id: "1",
        name: "CD_Rock",
        genre: 1,
        price: 15
    },
    {
        product_id: "2",
        name: "CD_Classic",
        genre: 2,
        price: 15
    },
    {
        product_id: "3",
        name: "CD_Pop",
        genre: 3,
        price: 15
    },
    {
        product_id: "4",
        name: "CD_Jazz",
        genre: 4,
        price: 15
    },
    {
        product_id: "5",
        name: "CD_Children",
        genre: 5,
        price: 15
    },
    {
        product_id: "6",
        name: "CD_Electro",
        genre: 6,
        price: 15
    },
    {
        product_id: "7",
        name: "CD_Dance",
        genre: 7,
        price: 15
    },
    {
        product_id: "8",
        name: "CD_Country",
        genre: 8,
        price: 15
    },
    {
        product_id: "9",
        name: "CD_Folk",
        genre: 9,
        price: 15
    },
    {
        product_id: "10",
        name: "CD_Christmas",
        genre: 10,
        price: 15
    }
];

Products.GetRandomProductIDs = function (numberOfDifferentProducts) {
    var randomProductIDs = [];

    while (randomProductIDs.length < numberOfDifferentProducts) {
        var randomProductIndex = getRandomInt(0, Products.length - 1);
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