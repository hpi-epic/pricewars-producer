process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

const storage = require('node-persist');

chai.should();
let testStorage;

chai.use(chaiHttp);

describe('API Tests', function () {
    before(function () {
        testStorage = storage.create({dir: 'test/storage'});
        testStorage.initSync();
        testStorage.clearSync();
    });

    after(function () {
        testStorage.clearSync();
    });

    describe('Producer API', function () {
        it('should get denied if ordering without providing a merchant_id', (done) => {
            chai.request(server)
                .post('/orders')
                .end(function (err, res) {
                    res.should.have.status(400);
                    done();
                });
        });

        it('should give me a key to decrypt the product hash', (done) => {
            chai.request(server)
                .get('/decryption_key')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('decryption_key');
                    res.body.decryption_key.should.be.a('string');
                    done();
                });
        });


        it('should give me a random product', (done) => {
            chai.request(server)
                .post('/orders')
                .set('Authorization', 'Token merchant_token')
                .send({'amount': '10'})
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    const order = res.body;

                    order.should.have.property('product_id');
                    order.product_id.should.be.a('number');

                    order.should.have.property('product_name');
                    order.product_name.should.be.a('string');

                    order.should.have.property('billing_amount');
                    order.billing_amount.should.be.a('number');

                    order.should.have.property('fixed_cost');
                    order.fixed_cost.should.be.a('number');

                    order.should.have.property('unit_price');
                    order.unit_price.should.be.a('number');

                    order.should.have.property('stock');
                    order.stock.should.be.a('number');

                    order.should.have.property('products');
                    order.products.should.be.instanceof(Array);

                    done();
                });
        });

    });
});
