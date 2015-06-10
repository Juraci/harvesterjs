var should = require('should');
var _ = require('lodash');
var RSVP = require('rsvp');
var Joi = require('joi');

module.exports = function(baseUrl,keys,ids) {

    describe('chaining', function () {

        describe('resource returns chainable functions', function () {
            it('should return httpMethods on last resource', function (done) {
                var plant = this.app.resource('plant', {
                    name: Joi.string().required().description('name'),
                    appearances: Joi.string().required().description('appearances'),
                    links : {
                        pets: ['pet'],
                        soulmate: {ref: 'person', inverse: 'soulmate'},
                        lovers: [
                            {ref: 'person', inverse: 'lovers'}
                        ]
                    }
                });

                ['get', 'post', 'put', 'delete', 'patch', 'getById', 'putById', 'deleteById', 'patchById', 'getChangeEventsStreaming'].forEach(function(httpMethod) {
                    should.exist(plant[httpMethod]().before);
                    should.exist(plant[httpMethod]().after);
                    should.exist(plant[httpMethod]().authorize);
                    should.exist(plant[httpMethod]().validate);
                });

                done();
            });

        });

    })
};
