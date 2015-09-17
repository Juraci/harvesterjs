var mongojs = require('mongojs');
var inflect = require('i')();
var _ = require('lodash');
var Promise = require('bluebird');
var SSE = function () {
};

SSE.prototype.init = function (router, adapter, options) {
    this.router = router;
    this.adapter = adapter;
    this.options = options;
    this.db = mongojs(options.oplogConnectionString);
}

var sse = require('tiny-sse');


SSE.prototype.initRoute = function (routeName) {
    this.router.get(routeName + '/changes/stream', sse.head(), sse.ticker({seconds: 3}), this.handler.bind(this));
};

SSE.prototype.handler = function (req, res, next) {
    var me = this;
    var routeName = /\/(.+)\/changes\/stream/.exec(req.route.path)[1];
    var filters = _.chain(req.query)
    .map(function(item, key) {
        if (!_.contains(['limit', 'sort', 'offset'], key)) {
            var filter = {};
            filter[key] = item;
            return filter;
        }
    })
    .filter(function(item) {
        return !!item;
    })
    //converts {'foo.bar' : 'foobar'} to {foo : { bar : 'foobar' }}
    .map(function(item) {
        var keys = _.keys(item)[0].split('.');
        return _.reduce(keys, function(obj, key, index) {

            var value = (index === keys.length - 1 || keys.length === 1) ? _.values(item)[0] : {};

            if (index === 0) {
                obj[key] = (keys.length > 1) ? {} : value;
            } else {
                obj[keys[index - 1]][key] = value;
            }
            return obj;
        }, {});
    })
    .value();

    var coll = this.db.collection('oplog.rs');
    var options = {
        tailable: true,
        awaitData: true
    };

    var regex = new RegExp('.*\\.' + routeName, 'i');

    this.getQuery(req, regex)
    .then(function(query) {
        var stream = coll.find(query, options);

        stream.on('data', function (chunk) {
            if (regex.test(chunk.ns)) {
                var singularKey = me.options.inflect ? inflect.singularize(routeName) : routeName;
                var model = me.adapter.model(singularKey);
                var data = me.adapter._deserialize(model, chunk.o);
                var id = chunk.ts.getHighBits() + '_' + chunk.ts.getLowBits();


                var passedFilter = _.reduce(filters, function(obj, filter) {
                    return _.filter([data], _.matches(filter));
                }, true);

                //if we have filters, make sure they are passed
                if (passedFilter.length > 0 || filters.length === 0) {
                    sse.send({id: id, event: routeName + '_' + chunk.op, data: data})(req, res);
                }
            }
        });
        stream.on('end', function () {
            res.end();
        });
        stream.on('err', function () {
            res.end();
        });
        res.on('close', function () {
            stream.destroy();
        });
    })
    .catch(function(err) {
        console.log(err.stack)
        res.end();
    });
};

SSE.prototype.getQuery = function(req, ns) {
    var lastEventId = req.headers['last-event-id'];
    var coll = this.db.collection('oplog.rs');
    var query = {
        ns : ns
    };
    return new Promise(function(resolve, reject) {
        if (req.headers['last-event-id']) {
            var tsSplit = _.map(lastEventId.split('_'), function (item) {
                return parseInt(item, 10);
            });

            query.ts = {
                $gt: new mongojs.Timestamp(tsSplit[1], tsSplit[0])
            };

            return resolve(query);
        }


        coll.find(query).sort({$natural : -1}).limit(1, function(err, items) {
            if (err) return reject(err);

            if(items.length === 0) {
                return coll.find().sort({$natural : -1}).limit(1, function(err, items) {
                    if (err) return reject(err);

                    query.ts = {
                        $gt: items[0].ts
                    };

                    return resolve(query);
                });
            }

            query.ts = {
                $gt: items[0].ts
            };

            return resolve(query);
        });
    });
};


module.exports = new SSE;
