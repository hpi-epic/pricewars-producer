# Producer

This repository contains the Producer-component of the Price Wars simulation. The producer represents a warehouse holding products that can be bought by merchants so they can set a price and put them on the marketplace as an offer the consumers can buy.

The meta repository containing general information can be found [here](https://github.com/hpi-epic/masterproject-pricewars).

## Application Overview

| Repo | Branch 	| Deployment to  	| Status | Description |
|--- |---	|---	|---  |---   |
| [UI](https://github.com/hpi-epic/pricewars-mgmt-ui) | master  	|  [vm-mpws2016hp1-02.eaalab.hpi.uni-potsdam.de](http://vm-mpws2016hp1-02.eaalab.hpi.uni-potsdam.de) 	| [ ![Codeship Status for hpi-epic/pricewars-mgmt-ui](https://app.codeship.com/projects/d91a8460-88c2-0134-a385-7213830b2f8c/status?branch=master)](https://app.codeship.com/projects/184009) | Stable |
| [Consumer](https://github.com/hpi-epic/pricewars-consumer) | master  	|  [vm-mpws2016hp1-01.eaalab.hpi.uni-potsdam.de](http://vm-mpws2016hp1-01.eaalab.hpi.uni-potsdam.de) | [ ![Codeship Status for hpi-epic/pricewars-consumer](https://app.codeship.com/projects/96f32950-7824-0134-c83e-5251019101b9/status?branch=master)](https://app.codeship.com/projects/180119) | Stable |
| [Producer](https://github.com/hpi-epic/pricewars-producer) | master  	|  [vm-mpws2016hp1-03.eaalab.hpi.uni-potsdam.de](http://vm-mpws2016hp1-03.eaalab.hpi.uni-potsdam.de) | [ ![Codeship Status for hpi-epic/pricewars-producer](https://app.codeship.com/projects/0328e450-88c6-0134-e3d6-7213830b2f8c/status?branch=master)](https://app.codeship.com/projects/184016) | Stable |
| [Marketplace](https://github.com/hpi-epic/pricewars-marketplace) | master  	|  [vm-mpws2016hp1-04.eaalab.hpi.uni-potsdam.de/marketplace](http://vm-mpws2016hp1-04.eaalab.hpi.uni-potsdam.de/marketplace/offers) 	| [ ![Codeship Status for hpi-epic/pricewars-marketplace](https://app.codeship.com/projects/e9d9b3e0-88c5-0134-6167-4a60797e4d29/status?branch=master)](https://app.codeship.com/projects/184015) | Stable |
| [Merchant](https://github.com/hpi-epic/pricewars-merchant) | master  	|  [vm-mpws2016hp1-06.eaalab.hpi.uni-potsdam.de/](http://vm-mpws2016hp1-06.eaalab.hpi.uni-potsdam.de/) 	| [ ![Codeship Status for hpi-epic/pricewars-merchant](https://app.codeship.com/projects/a7d3be30-88c5-0134-ea9c-5ad89f4798f3/status?branch=master)](https://app.codeship.com/projects/184013) | Stable |

## Requirements
The producer is written in node.js. Ensure to have node.js installed and set up on your computer (see [the reference](https://nodejs.org/en/) for more information on getting started).

## Setup
First run ```npm install``` to install necessary dependencies. Then run ```node app.js``` to start the server on port 3000.

Access the server by typing ```http://localhost:3000``` into your browser and use an API-endpoint to test it. You can find the API for the producer here: https://hpi-epic.github.io/masterproject-pricewars

## Concept
The producer exists to abstract from the real world scenario in which merchants have to buy products first to be able to offer them on a marketplace. This step is essential since each purchase of a product costs the merchant money and keeping track of these purchases is necessary to calcualte a merchant's actual profit by comparing the revenue at the marketplace against the expenses at the producer.

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

### RegisteredMerchants.js
*This component is currently not in use*

This component models a store of all merchants that are registered at the producer, ie that have already bought a product. With a merchant, the products available to a merchant are stored. It also persistently stores registered merchants on the hard drive through a simple .txt-file.

In the current version, we do not need this component since the information which products are available to which merchant are directly saved with the products themselves. This decision was made to simplify adding, updating and deleting products - if we used this component, each merchant's store would have to be updated with each product-update. 

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


