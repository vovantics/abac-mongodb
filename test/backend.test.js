/*global describe: false, it: false, before: false, after: false */
/*jshint expr: true */

var mongodb = require('mongodb'),
    MongoDBBackEnd = require('../lib/backend'),
    _ = require('underscore'),
    chai = require('chai'),
    expect = chai.expect;

describe('BackEnd', function() {

    var backend;

    before(function(done) {
        mongodb.connect('mongodb://localhost:27017/acltest',function(err, db) {
            db.dropDatabase(function () {
                backend = new MongoDBBackEnd(db);
                done();
            });
        });
    });

    it('should be named mongodb', function() {
        expect(backend.name).to.equal('mongodb');
    });

    describe('#can', function() {

        describe('calls yes when a defined action can be performed', function() {
            var request, pass = false;

            before(function(done) {
                // Define policy and abac yes & no callbacks.
                backend.set_policy('do an action', true);
                backend.yes = function() {
                    pass = true;
                    done();
                };
                backend.no = function(err, info) {
                    throw new Error('BackEnd#no should not be called.');
                };

                backend.can(request, 'do an action', {});
            });

            after(function(done) {
                backend.unset_policy('do an action');
                done();
            });

            it('should pass', function() {
                expect(pass).to.be.true;
            });
        });

        describe('calls no when a defined action can be performed', function() {
            var request, pass = false;

            before(function(done) {
                // Define policy and abac yes & no callbacks.
                backend.set_policy('do an action', false);
                backend.yes = function() {
                    throw new Error('BackEnd#yes should not be called.');
                };
                backend.no = function(err, info) {
                    pass = true;
                    done();
                };

                backend.can(request, 'do an action', {});
            });

            after(function(done) {
                backend.unset_policy('do an action');
                done();
            });

            it('should pass', function() {
                expect(pass).to.be.true;
            });
        });

        describe('calls no when an undefined action cannot be performed', function() {
            var request, pass = false;

            before(function(done) {
                // Define abac yes & no callbacks.
                backend.yes = function() {
                    throw new Error('BackEnd#yes should not be called.');
                };
                backend.no = function(err, info) {
                    pass = true;
                    done();
                };

                backend.can(request, 'do an action', {});
            });

            after(function(done) {
                done();
            });

            it('should pass', function() {
                expect(pass).to.be.true;
            });
        });

    });

    describe('#serialize', function() {

        describe('serializes policies to permissions', function() {
            var request, pass = false;
            var permissions;

            before(function(done) {
                // Define policies.
                backend.set_policy('do an action 1', true);
                backend.set_policy('do an action 2', false);

                backend.serialize(request, function(err, perm) {
                    pass = true;
                    permissions = perm;
                    done();
                });
            });

            after(function(done) {
                backend.unset_policy('do an action');
                done();
            });

            it('should pass', function() {
                expect(pass).to.be.true;
                var is_equal = _.isEqual(
                    permissions,
                    {
                        'do an action 1': true,
                        'do an action 2': false
                    }
                );
                expect(is_equal).to.be.true;
            });
        });

    });

});