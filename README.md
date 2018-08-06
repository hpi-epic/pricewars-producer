# Producer

This repository contains the Producer-component of the Price Wars simulation. The producer represents a warehouse holding products that can be bought by merchants so they can set a price and put them on the marketplace as an offer the consumers can buy.

The meta repository containing general information can be found [here](https://github.com/hpi-epic/masterproject-pricewars).

## Application Overview
* Management UI: [https://github.com/hpi-epic/pricewars-mgmt-ui](https://github.com/hpi-epic/pricewars-mgmt-ui)
* Consumer: [https://github.com/hpi-epic/pricewars-consumer](https://github.com/hpi-epic/pricewars-consumer)
* Producer: [https://github.com/hpi-epic/pricewars-producer](https://github.com/hpi-epic/pricewars-producer)
* Marketplace: [https://github.com/hpi-epic/pricewars-marketplace](https://github.com/hpi-epic/pricewars-marketplace)
* Merchant: [https://github.com/hpi-epic/pricewars-merchant](https://github.com/hpi-epic/pricewars-merchant)
* Kafka RESTful API: [https://github.com/hpi-epic/pricewars-kafka-rest](https://github.com/hpi-epic/pricewars-kafka-rest)

## Requirements
The producer is written in node.js. Ensure to have node.js installed and set up on your computer (see [the reference](https://nodejs.org/en/) for more information on getting started).

## Setup
First run ```npm install``` to install necessary dependencies. Then run ```node app.js``` to start the server on port 3000.

Access the server by typing ```http://localhost:3000``` into your browser and use an API-endpoint to test it. You can find the API for the producer here: https://hpi-epic.github.io/masterproject-pricewars

## Concept
The producer exists to abstract from the real world scenario in which merchants have to buy products first to be able to offer them on a marketplace. This step is essential since each purchase of a product costs the merchant money and keeping track of these purchases is necessary to calcualte a merchant's actual profit by comparing the revenue at the marketplace against the expenses at the producer.

### Product Quality
The producer randomly assigns a quality to a sold product. This quality is an integer with 1 being the highest quality possible.
Roughly as an example, the qualities translate as follows: (i) 1 = 'very good', (ii) 2 = 'good', (iii) 3 = 'fair', and (iv) 4 = 'acceptable'.

### Random Products
To make sure that the Price Wars simulation is only about the comparison of *pricing* strategies and not about the merchants' *purchase* strategy, we decided that the purchase of a product from the producer is always done randomly. When a merchant requests a product, they are given one random product from the currently available set of products. How many products a merchant buys is not restricted though. 

### Product Signature
Each purchase is logged to Kafka to keep track of the merchant's expenses. For that the merchant has to send his token in the authorization-header whenever he wants to buy a product. At the same time, the producer generates a signature for the product sold to the merchant that encrypts information about the product itself and also contains the token the merchant sent. This token is later on decrypted and checked by the marketplace whenever a merchant wants to post a new product - if the token in the signature does not match the token the merchant sends, the offer is denied. This way we can make sure that a merchant does not purchase a product with a different token and then puts it on the marketplace with his own token - avoiding any expenses but only making profit. 

### Limited Stock
The default product set only contains product with infinite availability, i.e. the `stock`-attribute is set to `-1`. In future scenarios we might want products that are limited, ie we only have a certain stock of items available for each merchant such as plane tickets. The current version of the producer does already support this scenario. If the `stock`-attribute is set to a number greater than 0, the producer keeps track of how many instances of this product have been sold to which merchant already. If the left over stock for a product is down to 0 for a merchant, this product won't be sold to this merchant any longer. 

## Architecture
The components of the producer are the following:
### app.js 
The entry point of the Producer. We are using an express-server which is defined here. Also the port used can be adjusted here. 

### routes.js
All endpoints of the API are defined in here. Adjust this file to add additional endpoints or to update or delete existing ones.

### Products.js 
Models the actual warehouse and the products being sold. The available products are stored in an array of objects, each object representing a product. 

The current version contains a default product set that can be adjusted via the API. The default set contains 4 different products of each 4 different qualities, so all in all 16 products. 

Accordingly, the Products-prototype exposes methods to add, delete and update products. Furthermore, it offers a method to buy a random product.

This component also takes care of creating an encrypted signature for a sold product. 

### KafkaLogger.js
This component connects to the Kafka-service and logs each purchase of a merchant to the 'producer'-topic.

## How-To

### ...add new products
The producer offers multiple endpoints to add products. All of them can also be found [here](https://hpi-epic.github.io/masterproject-pricewars). If you want to add a great amount of new products at once, do a PUT- or POST-request on the /products-route. The PUT-request completely replaces all products of the producer; the POST-requests only adds products. Both requests can take an array of an arbitrary amount of JSON-objects, where each object represent a new product that will be added to the producer (if it is valid, ie the UID that the product will get as a concatenation of its quality and its product-id does not exist yet).

### ...add new product attributes
If you want to add new attributes to the products the producer offers, you have to make some small code changes. In `Products.js` you have to extend the `createValidProduct`-function. This function takes an arbitrary object and returns an object that only has the currently valid attributes of a product of the producer. So to add, remove or change attributes, simply change the attributes within this method and add a default-value for each attribute in case it is not provided. 

As an example: To add the attribute `popularity` which is an int and has the default value `1`, modify the `product`-object in the function in the following way:
```javascript
var product = {
  ...
  "popularity": np.popularity ? np.popularity : 1
};
```

To make this new attribute visible on both or either the /products- or /buy-route, also add it to the respective array of attribute-names: `publicProductAttributes` (has all attribuet-names that are visible on the /products-route) and/or `publicProductBuyAttributes` (has all attribute-names that are visible as a merchant on the /buy-route).


