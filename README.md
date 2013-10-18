# alldata-coordinator

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/alldata-coordinator.png)](http://npmjs.org/package/alldata-coordinator)

Request coordinator module for [AllData](https://github.com/tristanls/alldata), a distributed master-less append-only immutable event store database implementing "All Data" part of [Lambda Architecture](http://www.slideshare.net/nathanmarz/runaway-complexity-in-big-data-and-a-plan-to-stop-it).

## Usage

```javascript
var AllDataCoordinator = require('alldata-coordinator');
var AllDataKeygen = require('alldata-keygen');
var AllDataPeerClient = require('alldata-peer-client-http');
var AllDataPeerServer = require('alldata-peer-server-http');
var AllDataServer = require('alldata-server-http');
var AllDataStorage = require('alldata-storage-leveldb');

var allDataStorage = new AllDataStorage('/data');
var allDataCoordinator = new AllDataCoordinator(allDataStorage);
var allDataServer = new AllDataServer({
    hostname: 'localhost',
    port: 80
});
var allDataPeerServer = new AllDataPeerServer({
    port: 8080
});
var allDataPeerClient = new AllDataPeerClient({
    method: "POST",    
    port: 8080 
});

allDataServer.on('put', function (event, callback) {
    // request from a client external to the cluster
    allDataCoordinator.put(AllDataKeygen.generateKey(), event, callback);
});

allDataPeerServer.on('_put', function (key, event, callback) {
    // request from a peer within the cluster
    // notice that coordinator is not used here as _put is being coordinated
    // by some other node
    allDataStorage.put(key, event, callback);
});

allDataCoordinator.on('_put', function (peer, key, event, callback) {
    // coordinator determined that a _put should happen to given peer
    // but because peer clients can have multiple implementations an event
    // is emitted that should be listened to and handed to a peer client
    // implementation; peer is opaque to the coordinator but has structure
    // known to the peer client, hence the peer client knows to use
    // peer.hostname for the _put request
    allDataPeerClient._put({hostname: peer.hostname}, key, event, callback);
});

// start external server and peer server
allDataServer.listen(function () {
    console.log('HTTP Server listening...');
});
allDataPeerServer.listen(function () {
    console.log('HTTP Peer Server listening...');
});
```

## Test

    npm test

## Overview

AllDataCoordinator coordinates replication between peer nodes as specified by the replication and zone and region placement policies.

It is worth noting that due to the nature of the kind of data stored in AllData, there is no requirement for consistent hashing. Instead, replicas are selected randomly according with placement policies. This is in contrast to data storage systems with more restrictive placement requirements. This has the advantage that if parts of the cluster are down and some zones or regions are unavailable, it still may be possible to succeed in replication by falling back onto writing replicas located in a different region, different zone, or other nodes in the local zone.

## Documentation

### AllDataCoordinator

**Public API**

  * [new AllDataCoordinator(localStorage, options)](#new-alldatacoordinatorlocalstorage-options)
  * [allDataCoordinator.addPeer(peer, \[options\])](#alldatacoordinatoraddpeerpeer-options)
  * [allDataCoordinator.dropPeer(peer, \[options\])](#alldatacoordinatordroppeerpeer-options)
  * [allDataCoordinator.put(key, event, \[commitLevel\], callback)](#alldatacoordinatorputkey-event-commitlevel-callback)
  * [Event '_put'](#event-_put)

### new AllDataCoordinator(localStorage, options)

  * `localStorage`: _Object_ Instance of AllData storage module local to the AllDataCoordinator.
  * `options`: _Object_ _(Default: undefined)_
    * `commitLevel`: _String_ _(Default: "QUORUM")_ One of: `ONE`, `QUORUM`, `ALL`. `ONE` means that once local storage stored the event, the request will be acknowledged. `QUORUM` means that once majority of replicas stored the event, the request will be acknowledged (notice that `QUORUM` for `replicationFactor` of 1 is 1). `ALL` means that once all replicas stored the event, the request will be acknowledged.
    * `replicationFactor`: _Integer_ _(Default: 1)_ Number of replicas (including local one) to create for any `put` event.
    * `replicationStrategy`: _Object_
      * `otherZoneReplicas`: _Integer_ _(Default: 0)_ Number of replicas to place explicitly in other zones within the local region.    
      * `otherRegionReplicas`: _Integer_ _(Default: 0)_ Number of replicas to place explicitly in other regions.

Creates a new instance of AllDataCoordinator.

Note that the following must hold:

    replicationFactor <= 
        1 + replicationStrategy.otherRegionReplicas 
        + replicationStrategy.otherZoneReplicas;

If `replicationFactor` is less than the total above, coordinator will create replicas in the following order:

  1. local storage
  2. other zones
  3. other regions
  4. same zone

It is worth highlighting that AllDataCoordinator will attempt to fulfill the `replicationFactor` over the chosen `replicationStrategy`. This means that if other zone or other region replicas should be created, but no peers in other zones or regions are known, then peers from the same zone may be selected. If there are not enough peers to satisfy `replicationFactor` and `commitLevel` criteria, the put will fail.

For example, given:

    replicationFactor = 3;
    replicationStrategy.otherZoneReplicas = 2;
    replicationStrategy.otherRegionReplicas = 1;

the following number of replicas would be created:

  1. local storage - 1 replica
  2. other zones - 2 replicas
  3. other regions - 0 replicas
  4. same zone - 0 replicas

Here is an example of placing replicas in other zones and other regions. Given:

    replicationFactor = 3;
    replicationStrategy.otherZoneReplicas = 1;
    replicationStrategy.otherRegionReplicas = 1;

the following number of replicas would be created:

  1. local storage - 1 replica
  2. other zones - 1 replica
  3. other regions - 1 replica
  4. same zone - 0 replicas

Here is an example of placing replicas in same zone only. Given:

    replicationFactor = 3;
    replicationStrategy.otherZoneReplicas = 0;
    replicationStrategy.otherRegionReplicas = 0;

the following number of replicas would be created:

  1. local storage - 1 replica
  2. other zones - 0 replica
  3. other regions - 0 replicas
  4. same zone - 2 replicas

If any of the replicas fails to succeed in put operation, the AllDataCoordinator will go into "get it done" mode and attempt to spread out the failed replica to any available peer that hasn't been selected already, so that the `replicationFactor` is honored.

### allDataCoordinator.addPeer(peer, options)

  * `peer`: _Object_ Peer to add to coordinator's awareness.
    * `id`: _String_ Unique `peer` identifier.
  * `options`: _Object_ _(Default: {})_
    * `zone`: _String _(Default: undefined)_ If provided, an identifier in the local region for the `zone` the `peer` belongs to. If `zone` is specified `options.region` will be ignored.
    * `region`: _String_ _(Default: undefined)_ If provided, an identifier for a remote region the `peer` belongs to. This parameter is ignored if `options.zone` is specified.

Adds the `peer` to AllDataCoordinator's awareness for selection when replicas need to be created.

### allDataCoordinator.dropPeer(peer, options)

  * `peer`: _Object_ Peer to drop from coordinator's awareness.
    * `id`: _String_ Unique `peer` identifier.
  * `options`: _Object_ _(Default: {})_
    * `zone`: _String _(Default: undefined)_ If provided, an identifier in the local region for the `zone` the `peer` belongs to. If `zone` is specified `options.region` will be ignored.
    * `region`: _String_ _(Default: undefined)_ If provided, an identifier for a remote region the `peer` belongs to. This parameter is ignored if `options.zone` is specified.

Drops the `peer` from AllDataCoordinator's awareness so that it is no longer considered for replica placement.

### allDataCoordinator.put(key, event, [commitLevel], callback)

  * `key`: _String_ AllData key generated for the `event`.
  * `event`: _Object_ JavaScript object representation of the event to `put`.
  * `commitLevel`: _String_ _(Default: AllDataCoordinator default)_ Commit level for this `put` if different from `commitLevel` set for AllDataCoordinator.
  * `callback`: _Function_ `function (error) {}` Callback to call on success or failure.

Coordinates the replication of the `event` according to specified `commitLevel`, `replicationFactor` and `replicationStrategy`.

### Event `_put`

  * `function (peer, key, event callback) {}`
    * `peer`: _Object_ Peer to `_put` the `event` on.
    * `key`: _String_ AllData generated event key.
    * `event`: _Object_ Event to `_put`.
    * `callback`: _Function_ `function (error) {}`

Emitted when AllDataCoordinator determines that a remote `_put` should happen for given `peer`. Because `peer` clients can have multiple implementations, this event is emitted instead of directly calling a specific client implementation. The `peer` is mostly opaque to the AllDataCoordinator but has structure known to the client. See [Usage](#usage) for an example.