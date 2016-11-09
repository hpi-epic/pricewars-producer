process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var should = chai.should();

var storage = require('node-persist');
var testStorage;
var tempStorage;

chai.use(chaiHttp);

describe('API Tests', function() {
    before(function () {
        testStorage = storage.create({dir: 'test/storage'});
        testStorage.initSync();
        testStorage.clearSync();
    });

    after(function() {
        testStorage.clearSync();
    });

    describe('Producer API', function() {
        it('should GET all the registered merchants',(done) =>
        {
            chai.request(server)
                .get('/buyers')
                .end(function(err, res){
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(0);
                    done();
                });
        });
    });
});