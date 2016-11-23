var kafka_connection = "vm-mpws2016hp1-05.eaalab.hpi.uni-potsdam.de:9092";

var Kafka = require('no-kafka');
var producer = new Kafka.Producer({
    connectionString: kafka_connection
});

producer.init();

var kafkaLogger = {

    LogBuy: function(product, merchant_id, timeOfBuy) {
        var saleInfo = JSON.parse(JSON.stringify(product));
        saleInfo["merchant_id"] = parseInt(merchant_id);
        saleInfo["timestamp"] = timeOfBuy;
        producer.send({
            topic: 'producer',
            partition: 0,
            message: {
                value: JSON.stringify(saleInfo)
            }
        });
    }

};

module.exports = kafkaLogger;