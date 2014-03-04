# abac-mongodb

An [ABAC](https://github.com/vovantics/abac/) back-end datastore for authorizing requests against policies stored in a MongoDB collection.

---

Be mindful of the additional overhead of making a network call to MongoDB per request-response cycle.

## Install

    $ npm install abac-mongodb

## Usage

### Configure BackEnd and define policies

The MongoDB BackEnd requires a MongoDB connection.
The action is used to find the policy document in the policies collection.
A policy's rules can be defined as a boolean or a function.

```javascript
var abac = require('abac'),
    mongoose = require('mongoose'),
    MongoDBBackEnd = require('abac-mongodb').BackEnd;

abac.use(new MongoDBBackEnd(mongoose.connection));
abac.set_policy('mongodb', 'use secret feature', true);
```

### Authorize requests

Use `abac.can(backend, action, options)`, specifying `'mongodb'` as the `backend`. Ensure that the `action` belongs to a policy defined to be stored in the MongoDB BackEnd.

#### Routes

```javascript
var express = require('express'),
    abac = require('abac');

app.post('/users/invite/', abac.can('mongodb', 'invite a friend'), function(req, res, next){
    res.json({msg: 'You sent an invite b/c you could!'});
});
```

#### Control flow

```javascript
var express = require('express'),
    abac = require('abac');

app.get('/', function(req, res, next){
    abac.can('mongodb', 'use secret feature', {
        yes: function() {
            // Do something.
        }.bind(this),
        no: function(err, info) {
            // Do something else.
        }.bind(this)
    })(req, res);
});
```

## Tests

    $ npm install
    $ npm test

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Stevo <[http://github.com/vovantics/](http://github.com/vovantics/)>
