var kafka_connection = process.env.KAFKA_URL || "vm-mpws2016hp1-05.eaalab.hpi.uni-potsdam.de:9092";

var Kafka = require('no-kafka');
var producer = new Kafka.Producer({
    connectionString: kafka_connection
});
producer.init();

var sha256 = require('js-sha256');

var kafkaLogger = {

    LogBuy: function(order, merchantId, timeOfBuy) {
        const orderInfo = Object.assign({}, order.product);
        orderInfo.fixed_order_cost = order.fixed_cost;
        orderInfo.stock = order.stock;
        orderInfo.price = order.unit_price;
        orderInfo.merchant_id = merchantId;
        orderInfo.timestamp = timeOfBuy;
        orderInfo.billing_amount = order.billing_amount;

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