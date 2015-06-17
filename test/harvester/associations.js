var inflect = require('i')();
var should = require('should');
var _ = require('lodash');
var RSVP = require('rsvp');
var request = require('supertest');
var Promise = RSVP.Promise;
var uuid = require('node-uuid');

var config = require('../config.js');


describe('associations', function () {

  var ids;
  before(function () {
    this.timeout(50000);
    return require('./fixtures.js')().seed().then(function (result) {
      ids = result;
    });
  });

  describe('many to one association', function () {
    it('should be able to associate', function (done) {
      new Promise(function (resolve) {
        var payload = {};

        payload.people = [
          {
            links: {
              pets: [ids.pets[0]]
            }
          }
        ];

        request(config.baseUrl).put('/people/' + ids.people[0]).send(payload).expect('Content-Type', /json/).expect(200).end(function (error, response) {
          should.not.exist(error);
          var body = JSON.parse(response.text);
          (body.people[0].links.pets).should.containEql(ids.pets[0]);
          resolve();
        });
      }).then(function () {
            request(config.baseUrl).get('/pets/' + ids.pets[0]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              (body.pets[0].links.owner).should.equal(ids.people[0]);
              done();
            });
          });
    });
    it('should be able to dissociate', function (done) {
      new Promise(function (resolve) {
        request(config.baseUrl).patch('/people/' + ids.people[0]).send([
              {path: '/people/0/links/pets', op: 'replace', value: []}
            ]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.people[0].links);
              resolve();
            });
      }).then(function () {
            request(config.baseUrl).get('/pets/' + ids.pets[0]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.pets[0].links);
              done();
            });
          });
    });
  });

  describe('one to many association', function () {
    it('should be able to associate', function (done) {
      new Promise(function (resolve) {
        var payload = {};

        payload.pets = [
          {
            links: {
              owner: ids.people[0]
            }
          }
        ];

        request(config.baseUrl).put('/pets/' + ids.pets[0]).send(payload).expect('Content-Type', /json/).expect(200).end(function (error, response) {
          should.not.exist(error);
          var body = JSON.parse(response.text);
          should.equal(body.pets[0].links.owner, ids.people[0]);
          resolve();
        });
      }).then(function () {
            request(config.baseUrl).get('/people/' + ids.people[0]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              (body.people[0].links.pets).should.containEql(ids.pets[0]);
              done();
            });
          });
    });
    it('should be able to dissociate', function (done) {
      new Promise(function (resolve) {
        request(config.baseUrl).patch('/pets/' + ids.pets[0]).send([
              {path: '/pets/0/links/owner', op: 'replace', value: null}
            ]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.pets[0].links);
              resolve();
            });
      }).then(function () {
            request(config.baseUrl).get('/people/' + ids.people[1]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.people[0].links);
              done();
            });
          });
    });
  });

  describe('one to one association', function () {
    it('should be able to associate', function (done) {
      new Promise(function (resolve) {
        var payload = {};

        payload.people = [
          {
            links: {
              soulmate: ids.people[1]
            }
          }
        ];

        request(config.baseUrl).put('/people/' + ids.people[0]).send(payload).expect('Content-Type', /json/).expect(200).end(function (error, response) {
          should.not.exist(error);
          var body = JSON.parse(response.text);
          should.equal(body.people[0].links.soulmate, ids.people[1]);
          resolve();
        });
      }).then(function () {
            request(config.baseUrl).get('/people/' + ids.people[1]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              (body.people[0].links.soulmate).should.equal(ids.people[0]);
              done();
            });
          });
    });
    it('should be able to dissociate', function (done) {
      new Promise(function (resolve) {
        request(config.baseUrl).patch('/people/' + ids.people[0]).send([
              {path: '/people/0/links/soulmate', op: 'replace', value: null}
            ]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.people[0].links);
              resolve();
            });
      }).then(function () {
            request(config.baseUrl).get('/people/' + ids.people[1]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.people[0].links);
              done();
            });
          });
    });
  });

  describe('many to many association', function () {
    it('should be able to associate', function (done) {
      new Promise(function (resolve) {
        var payload = {};

        payload.people = [
          {
            links: {
              lovers: [ids.people[1]]
            }
          }
        ];

        request(config.baseUrl).put('/people/' + ids.people[0]).send(payload).expect('Content-Type', /json/).expect(200).end(function (error, response) {
          should.not.exist(error);
          var body = JSON.parse(response.text);
          (body.people[0].links.lovers).should.containEql(ids.people[1]);
          resolve();
        });
      }).then(function () {
            request(config.baseUrl).get('/people/' + ids.people[1]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              (body.people[0].links.lovers).should.containEql(ids.people[0]);
              done();
            });
          });
    });
    it('should be able to dissociate', function (done) {
      new Promise(function (resolve) {
        request(config.baseUrl).patch('/people/' + ids.people[0]).send([
              {path: '/people/0/links/lovers', op: 'replace', value: []}
            ]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.people[0].links);
              resolve();
            });
      }).then(function () {
            request(config.baseUrl).get('/people/' + ids.people[1]).expect('Content-Type', /json/).expect(200).end(function (error, response) {
              should.not.exist(error);
              var body = JSON.parse(response.text);
              should.not.exist(body.people[0].links);
              done();
            });
          });
    });
  });

  describe('UUID association', function () {
    it('shouldn\'t associate if the property value is a UUID', function (done) {
      var payload = {};

      payload.vehicles = [
        {
          id: uuid.v4(),
          name: uuid.v4(),
          links: {
            owners: uuid.v4()
          }
        }
      ];

      request(config.baseUrl).post('/vehicles').send(payload).expect('Content-Type', /json/).expect(201).end(function (error, response) {
        should.not.exist(error);
        var body = JSON.parse(response.text);
        should.not.exist(body.vehicles[0].links.name);
        done();
      });
    });

    it('shouldn\'t associate if the property value is a an array of UUID', function (done) {
      var payload = {};

      payload.vehicles = [
        {
          id: uuid.v4(),
          name: [uuid.v4(), uuid.v4()],
          links: {
            owners: uuid.v4()
          }
        }
      ];

      request(config.baseUrl).post('/vehicles').send(payload).expect('Content-Type', /json/).expect(201).end(function (error, response) {
        should.not.exist(error);
        var body = JSON.parse(response.text);
        should.not.exist(body.vehicles[0].links.name);
        done();
      });
    });
  });
});
