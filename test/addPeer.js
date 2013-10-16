/*

addPeer.js - allDataCoordinator.addPeer(peer, options) test

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

test['addPeer() adds peer by id to local peers if no options specified'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'});
    test.deepEqual(allDataCoordinator.local.foo, {id: 'foo'});
    test.done(); 
};

test['addPeer() adding local peer increments noOfPeers'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    test.done(); 
};

test['addPeer() adding same local peer does not increment noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'foo'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    test.done(); 
};

test['addPeer() adds peer by id to specified peer zone in options'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.deepEqual(allDataCoordinator.zoneMap['bar'].foo, {id: 'foo'});
    test.done(); 
};

test['addPeer() adding zone peer increments noOfPeers'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    test.done(); 
};

test['addPeer() adding same zone peer does not increment noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    test.done(); 
};

test['addPeer() adding another peer to different zone increments noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'baz'}, {zone: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    test.done(); 
};

test['addPeer() adds peer by id to specified peer region in options'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.deepEqual(allDataCoordinator.regionMap['bar'].foo, {id: 'foo'});
    test.done(); 
};

test['addPeer() adding region peer increments noOfPeers'] = function (test) {
    test.expect(1);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    test.done(); 
};

test['addPeer() adding same region peer does not increment noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    test.done(); 
};

test['addPeer() adding another peer to different region increments noOfPeers'] = function (test) {
    test.expect(2);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {region: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'baz'}, {region: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    test.done(); 
};

test['addPeer() adding peers to local, zone, and region increments noOfPeers'] = function (test) {
    test.expect(3);
    var allDataCoordinator = new AllDataCoordinator();
    allDataCoordinator.addPeer({id: 'foo'}, {zone: 'bar'});
    test.equal(allDataCoordinator.noOfPeers, 1);
    allDataCoordinator.addPeer({id: 'baz'}, {region: 'far'});
    test.equal(allDataCoordinator.noOfPeers, 2);
    allDataCoordinator.addPeer({id: 'buz'});
    test.equal(allDataCoordinator.noOfPeers, 3);
    test.done(); 
};