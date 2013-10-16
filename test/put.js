/*

put.js - allDataCoordinator.put(key, event, commitLevel, callback) test

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

"use strict";

var AllDataCoordinator = require('../index.js'),
    assert = require('assert');

var test = module.exports = {};

test['put() returns immediate failure if noOfPeers + 1 is less than replicationFactor'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator({}, {replicationFactor: 3});
    allDataCoordinator.put('key1', {foo: 'bar'}, function (error) {
        test.ok(error);
        test.done();
    });
};

test['put() creates a local replica'] = function (test) {
    test.expect(2);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            test.done();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage);
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates only a local replica if replicationFactor == 1'] = function (test) {
    test.expect(0);
    var storage = {
        put: function () {}
    };
    var allDataCoordinator = new AllDataCoordinator(storage);
    allDataCoordinator.on('_put', function () {
        assert.fail("`_put` event emitted");
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
    test.done();
};

test['put() creates local and one other zone replica if otherZoneReplicas == 1'] = function (test) {
    test.expect(5);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 2,
        replicationStrategy: {
            otherZoneReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        test.equal(peer.id, 'peer1');
        test.equal(key, 'key1');
        test.deepEqual(event, {foo: 'bar'});
        test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in two other zones if '
    + 'otherZoneReplicas == 2 and have peers in two other zones'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {zone: 'zone2'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in one other zone if '
    + 'otherZoneReplicas == 2 and have peers in only one other zone'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {zone: 'zone1'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in other regions if '
    + 'otherZoneReplicas == 2 and have no peers in other zone'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {region: 'region1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region2'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in local zone if '
    + 'otherZoneReplicas == 2 and have no peers in other zone or other region'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'});
    allDataCoordinator.addPeer({id: 'peer2'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local and one other region replica if otherRegionReplicas == 1'] = function (test) {
    test.expect(5);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 2,
        replicationStrategy: {
            otherRegionReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        test.equal(peer.id, 'peer1');
        test.equal(key, 'key1');
        test.deepEqual(event, {foo: 'bar'});
        test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in two other regions if '
    + 'otherRegionReplicas == 2 and have peers in two other regions'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherRegionReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {region: 'region1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region2'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in one other region if '
    + 'otherRegionReplicas == 2 and have peers in only one other region'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherRegionReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {region: 'region1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in other zones if '
    + 'otherRegionReplicas == 2 and have no peers in other region'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherRegionReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {zone: 'zone2'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replicas in local zone if '
    + 'otherRegionReplicas == 2 and have no peers in other zone or other region'] = function (test) {
    test.expect(8);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'});
    allDataCoordinator.addPeer({id: 'peer2'});
    var putPeer1 = false;
    var putPeer2 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        }
        if (putPeer1 && putPeer2) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});
};

test['put() creates local replica and replica in other zone, other region, and'
    + ' local zone if otherZoneReplicas == 1, otherRegionReplicas == 1, and'
    + ' replicationFactor == 4'] = function (test) {
    test.expect(11);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 4,
        replicationStrategy: {
            otherZoneReplicas: 1,
            otherRegionReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    allDataCoordinator.addPeer({id: 'peer3'});
    var putPeer1 = false;
    var putPeer2 = false;
    var putPeer3 = false;
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            putPeer1 = true;
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else if (peer.id == 'peer2') {
            putPeer2 = true;
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});            
        } else {
            putPeer3 = true;
            test.equal(peer.id, 'peer3');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});  
        }
        if (putPeer1 && putPeer2 && putPeer3) 
            test.done();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function () {});    
};

test['put() responds with an error if not enough replicas after error in local storage'] = function (test) {
    test.expect(3);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback(true);
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 1
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function (error) {
        test.ok(error);
        test.done();
    });
};

test['put() responds with an error if not enough replicas after error in zone peer'] = function (test) {
    test.expect(6);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 2,
        replicationStrategy: {
            otherZoneReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        test.equal(peer.id, 'peer1');
        test.equal(key, 'key1');
        test.deepEqual(event, {foo: 'bar'});
        callback(true);
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function (error) {
        test.ok(error);
        test.done();
    });
};

test['put() responds with an error if not enough replicas after error in region peer'] = function (test) {
    test.expect(6);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 2,
        replicationStrategy: {
            otherRegionReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        test.equal(peer.id, 'peer1');
        test.equal(key, 'key1');
        test.deepEqual(event, {foo: 'bar'});
        callback(true);
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function (error) {
        test.ok(error);
        test.done();
    });
};

test['put() responds with an error if not enough replicas after error in zone peer'
    + ' and error in extra peer'] = function (test) {
    test.expect(9);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 2,
        replicationStrategy: {
            otherZoneReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        }
        callback(true);
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function (error) {
        test.ok(error);
        test.done();
    });
};

test['put() responds with an error if not enough replicas after error in region peer'
    + ' and error in extra peer'] = function (test) {
    test.expect(9);
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 2,
        replicationStrategy: {
            otherRegionReplicas: 1
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        } else {
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
        }
        callback(true);
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, function (error) {
        test.ok(error);
        test.done();
    });
};

test['put() responds with success after majority replicas written with QUORUM '
    + 'commitLevel'] = function (test) {
    test.expect(7);
    var successes = 0;
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
        } else {
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
        }
        callback();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, AllDataCoordinator.QUORUM, function (error) {
        test.ok(!error);
        test.equal(successes, 2); // only 2 of 3 for QUORUM required
        test.done();
    });
};

test['put() responds with success after all replicas written with ALL commitLevel'] = function (test) {
    test.expect(10);
    var successes = 0;
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
        } else {
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
        }
        callback();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, AllDataCoordinator.ALL, function (error) {
        test.ok(!error);
        test.equal(successes, 3); // 3 of 3 for ALL required
        test.done();
    });
};

test['put() responds with success after one replica written with ONE commitLevel'] = function (test) {
    test.expect(4);
    var successes = 0;
    var storage = {
        put: function (key, event, callback) {
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
            callback();
        }
    };
    var allDataCoordinator = new AllDataCoordinator(storage, {
        replicationFactor: 3,
        replicationStrategy: {
            otherZoneReplicas: 2
        }
    });
    allDataCoordinator.addPeer({id: 'peer1'}, {zone: 'zone1'});
    allDataCoordinator.addPeer({id: 'peer2'}, {region: 'region1'});
    allDataCoordinator.on('_put', function (peer, key, event, callback) {
        if (peer.id == 'peer1') {
            test.equal(peer.id, 'peer1');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
        } else {
            test.equal(peer.id, 'peer2');
            test.equal(key, 'key1');
            test.deepEqual(event, {foo: 'bar'});
            successes++;
        }
        callback();
    });
    allDataCoordinator.put('key1', {foo: 'bar'}, AllDataCoordinator.ONE, function (error) {
        test.ok(!error);
        test.equal(successes, 1); // 1 of 3 for ONE required
        test.done();
    });
};