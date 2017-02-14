var kafka_connection = process.env.KAFKA_URL || "vm-mpws2016hp1-05.eaalab.hpi.uni-potsdam.de:9092";

var Kafka = require('no-kafka');
var producer = new Kafka.Producer({
    connectionString: kafka_connection
});
producer.init();

var sha256 = require('js-sha256');

var kafkaLogger = {

    LogBuy: function(product, merchant_hash, timeOfBuy) {
        var saleInfo = JSON.parse(JSON.stringify(product));
        saleInfo["merchant_id"] = merchant_hash;
        saleInfo["timestamp"] = timeOfBuy;

        producer.send({
            topic: 'producer',
            partition: 0,
            message: {
                value: JSON.stringify(saleInfo)
            }
        });
    },

    hashToken: function(token) {
        return new Buffer(sha256(token), 'hex').toString('base64');
    }

};

module.exports = kafkaLogger;