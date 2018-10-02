var kafka_connection = process.env.KAFKA_URL || "vm-mpws2016hp1-05.eaalab.hpi.uni-potsdam.de:9092";

var Kafka = require('no-kafka');
var producer = new Kafka.Producer({
    connectionString: kafka_connection
});
producer.init();

var sha256 = require('js-sha256');

var kafkaLogger = {

    LogBuy: function (order, merchantId, timeOfBuy) {
        const orderInfo = {
            billing_amount: order.billing_amount,
            product_id: order.product_id,
            name: order.product_name,
            unit_price: order.unit_price,
            quantity: order.products.reduce((sum, product) => sum + product.quantity, 0),
            merchant_id: merchantId,
            fixed_order_cost: order.fixed_cost,
            stock: order.stock,
            timestamp: timeOfBuy,
        };

        producer.send({
            topic: 'producer',
            partition: 0,
            message: {
                value: JSON.stringify(orderInfo)
            }
        });
    },

    merchantId: function(token) {
        return new Buffer(sha256(token), 'hex').toString('base64');
    }

};

module.exports = kafkaLogger;