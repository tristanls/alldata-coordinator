/*

dropPeer.js - allDataCoordinator.dropPeer(peer, options) test

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

var AllDataCoordinator = require('../index.js');

var test = module.exports = {};

test['dropPeer() drops peer by id from local peers if no options specified'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'});
    test.deepEqual(allDataCoordinator.local.foo, {id: 'foo'});
    allDataCoordinator.dropPeer({id: 'foo'});
    test.strictEqual(allDataCoordinator.local.foo, undefined);
    test.done(); 
};

test['dropPeer() drops local peer and drecrements noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() dropping same local peer does not drecrement noOfPeers'] = function (test) {
    test.expect(3);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    allDataCoordinator.dropPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() drops peer by id from specified peer zone in options'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.deepEqual(allDataCoordinator.zoneMap['bar'].foo, {id: 'foo'});
    allDataCoordinator.dropPeer({id: 'foo'}, {zone: 'bar'});
    test.strictEqual(allDataCoordinator.zoneMap['bar'], undefined);
    test.done(); 
};

test['dropPeer() dropping zone peer drecrements noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() dropping same zone peer does not drecrement noOfPeers'] = function (test) {
    test.expect(3);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    allDataCoordinator.dropPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() dropping another peer from different zone drecrements noOfPeers'] = function (test) {
    test.expect(3);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    allDataCoordinator.addPeer({id: 'baz'}, {zone: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    allDataCoordinator.dropPeer({id: 'baz'}, {zone: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() drops peer by id from specified peer region in options'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.deepEqual(allDataCoordinator.regionMap['bar'].foo, {id: 'foo'});
    allDataCoordinator.dropPeer({id: 'foo'}, {region: 'bar'});
    test.strictEqual(allDataCoordinator.regionMap['bar'], undefined);
    test.done(); 
};

test['dropPeer() dropping region peer increments noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() dropping same region peer does not drecrement noOfPeers'] = function (test) {
    test.expect(3);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    allDataCoordinator.dropPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() dropping another peer from different region drecrements noOfPeers'] = function (test) {
    test.expect(4);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'baz'}, {region: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    allDataCoordinator.dropPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'baz'}, {region: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 0);
    test.done(); 
};

test['dropPeer() dropping peers from local, zone, and region drecrements noOfPeers'] = function (test) {
    test.expect(6);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'baz'}, {region: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    allDataCoordinator.addPeer({id: 'buz'});
    test.equal(allDataCoordinator.noOfPeers, 3);
    allDataCoordinator.dropPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    allDataCoordinator.dropPeer({id: 'baz'}, {region: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.dropPeer({id: 'buz'});
    test.equal(allDataCoordinator.noOfPeers, 0);    
    test.done(); 
};