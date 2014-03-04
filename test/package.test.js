/*global describe: false, it: false */

var backend = require('..'),
    chai = require('chai'),
    expect = chai.expect;

describe('abac-mongodb', function() {

    it('should export BackEnd constructor directly from package', function() {
        expect(backend).to.be.a('function');
        expect(backend).to.equal(backend.BackEnd);
    });

    it('should export BackEnd constructor', function() {
        expect(backend.BackEnd).to.be.a('function');
    });

});