var harvester = require('../../lib/harvester');
var JSONAPI_Error = harvester.JSONAPI_Error;
var RSVP = require('rsvp');
var Joi = require('joi');

function createApp(options) {

    var harvesterApp = harvester(options)

        .resource('person', {
            name: Joi.string().required().description('name'),
            appearances: Joi.string().required().description('appearances'),
            pets: ['pet'],
            soulmate: {ref: 'person', inverse: 'soulmate'},
            lovers: [
                {ref: 'person', inverse: 'lovers'}
            ]
        })

        .resource('pet', {
            name: Joi.string().required().description('name'),
            appearances: Joi.string().required().description('appearances'),
            owner: 'person'
        })

        .resource('cat', {
            name: Joi.string().required().description('name')
        }, {namespace: 'animals'})

        .resource('foobar', {
            foo: Joi.string().required().description('name')
        })

        .before(
        function (req, res) {
            var foobar = this;

            if (foobar.foo && foobar.foo === 'bar') {
                // promise
                return new RSVP.Promise(function (resolve, reject) {
                    reject(new JSONAPI_Error({
                        status: 400,
                        detail: 'Foo was bar'
                    }));
                });
            } else if (foobar.foo && foobar.foo === 'baz') {
                // non-promise
                throw new JSONAPI_Error({
                    status: 400,
                    detail: 'Foo was baz'
                });
            }
            else {
                return foobar;
            }
        }
    );


    harvesterApp.router.get('/random-error', function (req, res, next) {
        next(new Error('this is an error'));
    });

    harvesterApp.router.get('/json-errors-error', function (req, res, next) {
        next(new JSONAPI_Error({status: 400, detail: 'Bar was not foo'}));
    });


    return harvesterApp;
}

module.exports = createApp;
