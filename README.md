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
* Node.js 8
* npm

## Setup
Install dependencies with:

```npm install```
 
Start the producer:
 
```node app.js```

The producer runs on port `3050`. The API documentation is available here: https://hpi-epic.github.io/pricewars

Run tests:

```npm test```

## Concept
The producer exists to abstract from the real world scenario in which merchants have to buy products first to be able to offer them on a marketplace. This step is essential since each purchase of a product costs the merchant money and keeping track of these purchases is necessary to calculate a merchant's actual profit by comparing the revenue at the marketplace against the expenses at the producer.

### Product Quality
If the merchant orders products, he receives them in varying quality.
The quality is an integer with 1 being the highest quality possible.
Roughly as an example, the qualities translate as follows: (i) 1 = 'very good', (ii) 2 = 'good', (iii) 3 = 'fair', and (iv) 4 = 'acceptable'.

### Random Products
To make sure that the Price Wars simulation is only about the comparison of *pricing* strategies and not about the merchants' *purchase* strategy, we decided that the purchase of a product from the producer is always done randomly. When a merchant requests a product, they are given one random product from the currently available set of products. How many products a merchant buys is not restricted though. 

### Product Signature
Each purchase is logged to Kafka to keep track of the merchant's expenses. For that the merchant has to send his token in the authorization-header whenever he wants to buy a product. At the same time, the producer generates a signature for the product sold to the merchant that encrypts information about the product itself and also contains the token the merchant sent. This token is later on decrypted and checked by the marketplace whenever a merchant wants to post a new product - if the token in the signature does not match the token the merchant sends, the offer is denied. This way we can make sure that a merchant does not purchase a product with a different token and then puts it on the marketplace with his own token - avoiding any expenses but only making profit. 

### Limited Stock
The product information contains the attribute `stock`.
This attributes controls how many units can be ordered from that product type.
The stock is not shared between merchants.
If there are less units in stock than ordered, the order will fail.
A stock of `-1` means that the stock is unlimited.

## Architecture
The components of the producer are the following:
### app.js 
The entry point of the Producer. We are using an express-server which is defined here. Also the port used can be adjusted here. 

### routes.js
All endpoints of the API are defined in here. Adjust this file to add additional endpoints or to update or delete existing ones.

### Products.js 
Models the actual warehouse and the products being sold. The available products are stored in an array of objects, each object representing a product. 

Available products can be configured in the management UI.
By default, one product type with four different qualities is available. 

This component exposes methods to add, delete and update products. Furthermore, it offers a method to order products.
It also takes care of creating an encrypted signature for a sold product. 

### KafkaLogger.js
This component connects to the Kafka service and logs each purchase of a merchant to the 'producer'-topic.

## How-To

### ...add new products
The easiest way to add new products and configure existing products is by using the management UI under the `Config > Producer` tab.
The API endpoint to add products can be found [here](https://hpi-epic.github.io/pricewars).

### ...add new product attributes
If you want to add new attributes to the products the producer offers, you have to make some code changes.
In `Products.js` you have to change the `orderProduct`-function.
In there, the order and products are created that the merchant will receive.
You can add new attributes here.
It might be necessary to update the marketplace to recognize new attributes.