/*global emit: false */

/**
 * Module dependencies.
 */

var abac = require('abac'),
    _ = require('underscore'),
    util = require('util');

 /**
  * `BackEnd` constructor.
  *
  * The MongoDB BackEnd stores policies in a MongoDB collection.
  *
  * Examples:
  *
  *     abac.use(new MongoDBBackEnd(mongoose.connection));
  *
  * Options:
  *
  *    - `collection` Name of the collection. defaults to 'policies'
  *
  * @param {Object} db
  * @param {Object} options
  * @api public
  */

function BackEnd(db, options) {
    options = options || {};
    if (!db) { throw new Error('MongoDB back-end requires a db instance.'); }
    this.db_collection_name = options.collection || 'policies';

    abac.BackEnd.call(this);
    this.name = 'mongodb';
    this.db = db;
}

/**
 * Inherit from `abac.BackEnd`.
 */

util.inherits(abac, abac.BackEnd);

/**
 * Insert/update policy into policies collection.
 *
 * @param {String} action
 * @param {Object} req
 * @api protected
 */

BackEnd.prototype.set_policy = function(action, rule) {
    this.db.collection(this.db_collection_name)
    .update(
        {action: action},
        {action: action, rule: rule},
        {upsert: true, w: 1},
        function(err, result){
            if (err) { throw err; }
        }
    );
};

BackEnd.prototype.unset_policy = function(action) {
    this.db.collection(this.db_collection_name)
    .remove({action: action}, function(err, number_removed){
        if (err) { throw err; }
    });
};

/**
 * Authorize request to perform an action.
 *
 * @param {Object} req
 * @param {String} action
 * @return {Function}
 * @api protected
 */

BackEnd.prototype.can = function(req, action) {
    this.db.collection(this.db_collection_name)
    .findOne({'action': action},function(err, item){
        if (err) {
            return this.no(err , new Error('"' + action + '" cannot be performed because an error has occurred.'));
        }
        if(!item) {
            return this.no(null, '"' + action + '" cannot be performed because it is not defined.');
        }

        if (typeof item.rule === 'function') {
            if (item.rule(req)) {
                return this.yes();
            }
            else {
                return this.no(null, '"' + action + '" cannot be performed.');
            }
        }
        else if (typeof item.rule === 'boolean') {
            if (item.rule) {
                return this.yes();
            }
            else {
                return this.no(null, '"' + action + '" cannot be performed.');
            }
        }
        else {
            return this.no(null, '"' + action + '" cannot be performed because the rules are not in the correct format.');
        }
    }.bind(this));
};

/**
 * Serialize policies stored in this BackEnd into a permissions JavaScript
 * object.
 *
 * @param {Object} req
 * @param {Function} done
 * @return {Object}
 * @api protected
 */

BackEnd.prototype.serialize = function(req, done) {
    // Map function
    var map = function() { emit(this.action, this.rule); };
    // Reduce function
    var reduce = function(key, values) {
        var permissions = {};
        values.forEach(function(value) {
            if (typeof value === 'function') {
                //permissions[key] = value(req.sessionID, req.user);
                permissions.key = value(req);
            }
            else {
                permissions.key = value;
            }
        });

        return permissions;
    };

    this.db.collection(this.db_collection_name)
    .mapReduce(map, reduce, { out: { inline: 1 } }, function(err, results) {
        if (err) { throw err; }

        // Transform [ { _id: 'first mongodb policy action', value: true } ]
        // into { 'first mongodb policy action': true }
        var permissions = _.object(_.map(results, function(item) {
            return [item._id, item.value];
        }));

        done(null, permissions);
    });
};

/**
 * Expose `BackEnd`.
 */

module.exports = BackEnd;
