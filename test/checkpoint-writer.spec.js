var expect = require('chai').expect;
var Joi = require('joi');
var sinon = require('sinon');
var checkpointWriter = require('../lib/checkpoint-writer');
var Promise = require('bluebird');

describe.only('checkpoint writer', function () {

  describe('timeout', function () {
    const harvestApp = {
      adapter: {
        update: () => {}
      }
    };
    const fakeDoc = {ts: 1};
    const checkpointEvent = checkpointWriter.checkpointEvent;

    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      sinon.stub(harvestApp.adapter, 'update');
      harvestApp.adapter.update.returns(new Promise.resolve());
      checkpointWriter.startWriterLoop(harvestApp, true);
      checkpointEvent.emit('newCheckpoint', 1, fakeDoc);
    });

    afterEach(() => {
      harvestApp.adapter.update.restore();
      clock.restore();
    });

    it('should clean last doc and checkpoint after handled', done => {
      clock.tick(100);
      expect(harvestApp.adapter.update.callCount).to.be.eql(1);
      clock.tick(100);
      expect(checkpointWriter.getLastDoc()).to.be.null;
      expect(checkpointWriter.getLastCheckpointId()).to.be.null;
      expect(harvestApp.adapter.update.calledOnce).to.be.true;

      done();
    });

    it('should write a checkpoint in a given interval', done => {
      clock.tick(100);
      expect(harvestApp.adapter.update.callCount).to.be.eql(1);

      checkpointEvent.emit('newCheckpoint', 1, fakeDoc);
      clock.tick(100);
      expect(harvestApp.adapter.update.callCount).to.be.eql(2);

      done();
    });

  });

});
