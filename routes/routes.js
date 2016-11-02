var appRouter = function(app) {

    var availableProducts = [
        {
            product_id: 1,
            name: "CD_Rock",
            genre: 1,
            price: 15
        },
        {
            product_id: 2,
            name: "CD_Classic",
            genre: 2,
            price: 15
        },
        {
            product_id: 3,
            name: "CD_Pop",
            genre: 3,
            price: 15
        },
        {
            product_id: 4,
            name: "CD_Jazz",
            genre: 4,
            price: 15
        },
        {
            product_id: 5,
            name: "CD_Children",
            genre: 5,
            price: 15
        },
        {
            product_id: 6,
            name: "CD_Electro",
            genre: 6,
            price: 15
        },
        {
            product_id: 7,
            name: "CD_Dance",
            genre: 7,
            price: 15
        },
        {
            product_id: 8,
            name: "CD_Country",
            genre: 8,
            price: 15
        },
        {
            product_id: 9,
            name: "CD_Folk",
            genre: 9,
            price: 15
        },
        {
            product_id: 10,
            name: "CD_Christmas",
            genre: 10,
            price: 15
        }
    ];

    var merchantProdcuts = [];

    app
        .get("/buyers", function(req, res) {
            return res.send(merchantProdcuts);
        })
        .post("/buyers", function(req, res) {
            if(!req.body.merchantID) {
                return res.send({"status": "error", "message": "missing the merchantID query-parameter"});
            } else {
                // TODO check if merchant already exists
                // randomly pick 5 availableProducts for this new merchant
                products = [];
                while (products.length < 5) {
                    random = getRandomInt(0, availableProducts.length - 1);
                    if (products.indexOf(random) > -1) continue;
                    products.push(random);
                }
                console.log(products);
                // add this merchant and his product selection to the storage
                merchantProdcuts.push({
                    merchantID: req.body.merchantID,
                    products
                });
                return res.send({"status": "200", "message": "successfully registered"});
            }
        })
        .get("/products/buy", function(req, res) {
            if(!req.query.merchantID) {
                return res.send({"status": "error", "message": "missing the merchantID query-parameter"});
            } else {
                 merchant = merchantProdcuts.filter(function(merchant){
                    if (merchant.merchantID === req.query.merchantID)
                    return merchant
                });
                if (merchant.length == 1) {
                    merchant = merchant[0];
                    // take a random product index from the product-indices the merchant receives
                    indexOfProduct = merchant.products[ getRandomInt(0, merchant.products.length - 1) ];
                    res.send(availableProducts[indexOfProduct]);
                } else {
                    res.send({"status": "error", "message": "merchant not known to the producer, please register first"});
                }
            }
        });
}

// returns a random in (range including min and max)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = appRouter;