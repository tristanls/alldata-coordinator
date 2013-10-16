/*

index.js - "alldata-coordinator": AllData request coordinator module

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

var events = require('events'),
    util = require('util');

/*
  * `localStorage`: _Object_ Instance of AllData storage module local to the 
        AllDataCoordinator.
  * `options`: _Object_ _(Default: undefined)_
    * `commitLevel`: _String_ _(Default: "QUORUM")_ One of: `ONE`, `QUORUM`, `ALL`. 
            `ONE` means that once local storage stored the event, the
            request will be acknowledged. `QUORUM` means that once majority of
            replicas stored the event, the request will be acknowledged (notice
            that `QUORUM` for `replicationFactor` of 1 is 1). `ALL` means that 
            once all replicas stored the event, the request will be acknowledged.
    * `replicationFactor`: _Integer_ _(Default: 1)_ Number of replicas
            (including local one) to create for any `put` event.
    * `replicationStrategy`: _Object_
      * `otherZoneReplicas`: _Integer_ _(Default: 0)_ Number of replicas to
              place explicitly in other zones within the local region.    
      * `otherRegionReplicas`: _Integer_ _(Default: 0)_ Number of replicas to
              place explicitly in other regions.
*/
var AllDataCoordinator = module.exports = function AllDataCoordinator (localStorage, options) {
    var self = this;
    events.EventEmitter.call(self);

    self.localStorage = localStorage;

    options = options || {};

    self.commitLevel = options.commitLevel || AllDataCoordinator.QUORUM;
    self.replicationFactor = options.replicationFactor || 1;
    self.replicationStrategy = options.replicationStrategy || {};
    self.replicationStrategy.otherRegionReplicas = 
        self.replicationStrategy.otherRegionReplicas || 0;
    self.replicationStrategy.otherZoneReplicas =
        self.replicationStrategy.otherZoneReplicas || 0;

    self.noOfPeers = 0;
    self.local = {}; // map of peers by id (local zone)
    self.zoneMap = {}; // map from zone identifier to map of peers by id
    self.zones = []; // list of zone identifiers for random zone selection
    self.regionMap = {}; // map from region identifier to map of peers by id
    self.regions = []; // list of region identifiers for random region selection
};

util.inherits(AllDataCoordinator, events.EventEmitter);

AllDataCoordinator.ONE = "ONE";
AllDataCoordinator.QUORUM = "QUORUM";
AllDataCoordinator.ALL = "ALL";

/*
  * `peer`: _Object_ Peer to add to coordinator's awareness.
    * `id`: _String_ Unique `peer` identifier.
  * `options`: _Object_ _(Default: {})_
    * `zone`: _String _(Default: undefined)_ If provided, an identifier in the
            local region for the `zone` the `peer` belongs to. If `zone` is
            specified `options.region` will be ignored.
    * `region`: _String_ _(Default: undefined)_ If provided, an identifier for
            a remote region the `peer` belongs to. This parameter is ignored if
            `options.zone` is specified.
*/
AllDataCoordinator.prototype.addPeer = function addPeer (peer, options) {
    var self = this;

    options = options || {};

    if (options.zone) {
        // add zone to coordinator awareness if unknown
        if (self.zones.indexOf(options.zone) == -1) {
            self.zones.push(options.zone);
        }

        // add peer to the zone map if unknown (initialize if necessary)
        self.zoneMap[options.zone] = self.zoneMap[options.zone] || [];
        if (!self.zoneMap[options.zone][peer.id]) {
            self.zoneMap[options.zone][peer.id] = peer;
            self.noOfPeers++;
        }
        return; // ignore options.region parameter if zone was specified
    }

    if (options.region) {
        // add region to coordinator awareness if unknown
        if (self.regions.indexOf(options.region) == -1) {
            self.regions.push(options.region);
        }

        // add peer to the region map if unknown (initialize if necessary)
        self.regionMap[options.region] = self.regionMap[options.region] || [];
        if (!self.regionMap[options.region][peer.id]) {
            self.regionMap[options.region][peer.id] = peer;
            self.noOfPeers++;
        }
        return; // added the peer, all done
    }

    // no zone or region specified, this means a local peer
    // add peer to local if unknown
    if (!self.local[peer.id]) {
        self.local[peer.id] = peer;
        self.noOfPeers++;
    }
};

/*
  * `peer`: _Object_ Peer to add to coordinator's awareness.
    * `id`: _String_ Unique `peer` identifier.
  * `options`: _Object_ _(Default: {})_
    * `zone`: _String _(Default: undefined)_ If provided, an identifier in the
            local region for the `zone` the `peer` belongs to. If `zone` is
            specified `options.region` will be ignored.
    * `region`: _String_ _(Default: undefined)_ If provided, an identifier for
            a remote region the `peer` belongs to. This parameter is ignored if
            `options.zone` is specified.
*/
AllDataCoordinator.prototype.dropPeer = function dropPeer (peer, options) {
    var self = this;
    var index;

    options = options || {};

    if (options.zone) {
        // remove peer from zoneMap
        self.zoneMap[options.zone] = self.zoneMap[options.zone] || {};
        if (self.zoneMap[options.zone][peer.id]) {
            delete self.zoneMap[options.zone][peer.id];
            self.noOfPeers--;
        }

        // check if any peers left in zone
        if (Object.keys(self.zoneMap[options.zone]).length == 0) {
            delete self.zoneMap[options.zone];
            index = self.zones.indexOf(options.zone);
            self.zones.splice(index, 1);
        }
        return; // ignore options.region parameter if zone was specified
    }

    if (options.region) {
        // remove peer from regionMap
        self.regionMap[options.region] = self.regionMap[options.region] || {};
        if (self.regionMap[options.region][peer.id]) {
            delete self.regionMap[options.region][peer.id];
            self.noOfPeers--;
        }

        // check if any peers left in region
        if (Object.keys(self.regionMap[options.region]).length == 0) {
            delete self.regionMap[options.region];
            index = self.regions.indexOf(options.region);
            self.regions.splice(index, 1);
        }
        return; // removed the peer, all done
    }

    // no zone or region specified, this means a local peer
    // remove peer from local
    if (self.local[peer.id]) {
        delete self.local[peer.id];
        self.noOfPeers--;
    }
};

/*
  * `key`: _String_ AllData key generated for the `event`.
  * `event`: _Object_ JavaScript object representation of the event to `put`.
  * `commitLevel`: _String_ _(Default: AllDataCoordinator default)_ Commit level
          for this `put` if different from `commitLevel` set for AllDataCoordinator.
  * `callback`: _Function_ `function (error) {}` Callback to call on success or
          failure.
*/
AllDataCoordinator.prototype.put = function put (key, event, commitLevel, callback) {
    var self = this;
    var i;
    var index;

    // commitLevel is optional
    if (typeof commitLevel === "function") {
        callback = commitLevel;
        commitLevel = null;
    }

    // check that we have enough machines to satisfy replication factor
    if ((self.noOfPeers + 1) < self.replicationFactor)
        return callback(new Error("not enough peers for replicationFactor " + self.replicationFactor));

    var noOfReplicasToCommit = self.replicationFactor;
    var noOfReplicasToStart = self.replicationFactor;
    var replicaPeerIds = [];
    var acknowledgmentSent = false;
    var getItDoneMode = false;
    var getItDoneModePeers = [];

    var putContinuation = function putContinuation (error, keepStartingReplicasFlag) {
        if (error) {
            if (!getItDoneMode) {
                // go into "get it done" mode and start writing to available peers
                // to satisfy `replicationFactor`
                getItDoneMode = true;

                // get a list of all untried peers everywhere (getItDoneModePeers)
                self.zones.forEach(function (zone) {
                    Object.keys(self.zoneMap[zone]).forEach(function (k) {
                        var p = self.zoneMap[zone][k];
                        if (replicaPeerIds.indexOf(p.id) == -1)
                            getItDoneModePeers.push(p);
                    });
                });
                self.regions.forEach(function (region) {
                    Object.keys(self.regionMap[region]).forEach(function (k) {
                        var p = self.regionMap[region][k];
                        if (replicaPeerIds.indexOf(p.id) == -1)
                            getItDoneModePeers.push(p);
                    });
                });
                Object.keys(self.local).forEach(function (k) {
                    var p = self.local[k];
                    if (replicaPeerIds.indexOf(p.id) == -1)
                        getItDoneModePeers.push(p);
                });
            }

            // get next available peer
            var peer = getItDoneModePeers.shift();
            if (!peer) {
                // we ran out of peers and replicationFactor has not been achieved
                if (!acknowledgmentSent) {
                    acknowledgmentSent = true;
                    callback(new Error("" + noOfReplicasToStart + 
                        " replicas have NOT been created."));
                }
                return; // done
            }

            self.emit('_put', peer, key, event, function (error) {
                putContinuation(error);
            });

            if (keepStartingReplicasFlag) {
                // we got here because not enough replicas were started so far
                // we just stared one in self.emit('_put', ...) above
                --noOfReplicasToStart;

                // keep starting as needed
                while (noOfReplicasToStart > 0 && getItDoneModePeers.length > 0) {
                    peer = getItDoneModePeers.shift();
                    self.emit('_put', peer, key, event, function (error) {
                        putContinuation(error);
                    });
                    --noOfReplicasToStart;
                }

                if (noOfReplicasToStart > 0) {
                    // we ran out of peers and replicationFactor has not been achieved
                    if (!acknowledgmentSent) {
                        acknowledgmentSent = true;
                        callback(new Error("" + noOfReplicasToStart + 
                            " replicas have NOT been created."));
                    }

                    return; // done
                }
            }

            return; // handled error
        }

        // put succeeded, check if we should acknowledge according to commitLevel
        --noOfReplicasToCommit;
        if (!acknowledgmentSent) {
            switch (self.commitLevel) {
                case AllDataCoordinator.ONE:
                    acknowledgmentSent = true;
                    return callback();
                case AllDataCoordinator.ALL:
                    if (noOfReplicasToCommit <= 0) {
                        acknowledgmentSent = true;
                        return callback();
                    }
                    
                    return;
                case AllDataCoordinator.QUORUM:
                    var majority = Math.ceil(self.replicationFactor / 2);
                    if (self.replicationFactor % 2 == 0) {
                        majority++; // handle even numbers
                    }
                    if (noOfReplicasToCommit <= (self.replicationFactor - majority)) {
                        acknowledgmentSent = true;
                        return callback();
                    }
                    
                    return;
            }
        }
    };

    // we initialize all put operations and let putContinuation() deal with
    // making sure that the desired outcome is achieved

    // always write a local replica
    self.localStorage.put(key, event, function (error) {
        putContinuation(error);
    });
    
    if (--noOfReplicasToStart <= 0) 
        return; // done starting replicas

    // place replicas in other zones in same region
    if (self.replicationStrategy.otherZoneReplicas > 0) {
        var noOfZoneReplicas = self.replicationStrategy.otherZoneReplicas;
        // first, attempt to spread across all zones
        if (noOfZoneReplicas == self.zones.length) {
            for (i = 0; i < self.zones.length; i++) {
                var zone = self.zones[i];
                // select random peer
                var zonePeerIds = Object.keys(self.zoneMap[zone]);
                index = Math.floor(Math.random() * zonePeerIds.length);
                var id = zonePeerIds[index];
                var peer = self.zoneMap[zone][id];

                replicaPeerIds.push(peer.id);

                self.emit('_put', peer, key, event, function (error) {
                    putContinuation(error);
                });

                if (--noOfReplicasToStart <= 0)
                    return; // done starting replicas
            }
        } else if (noOfZoneReplicas < self.zones.length) {
            var zones = self.zones.slice(); // copy
            while (noOfZoneReplicas > 0) {
                // select random zone
                index = Math.floor(Math.random() * zones.length);
                var zone = zones.splice(index, 1); // reduce choice for next one
                // select random peer
                var zonePeerIds = Object.keys(self.zoneMap[zone]);
                index = Math.floor(Math.random() * zonePeerIds.length);
                var id = zonePeerIds[index];
                var peer = self.zoneMap[zone][id];

                replicaPeerIds.push(peer.id);

                self.emit('_put', peer, key, event, function (error) {
                    putContinuation(error);
                });

                --noOfZoneReplicas;
                if (--noOfReplicasToStart <= 0)
                    return; // done starting replicas
            }
        } else {
            var peers = [];
            self.zones.forEach(function (zone) {
                Object.keys(self.zoneMap[zone]).forEach(function (k) {
                    var p = self.zoneMap[zone][k];
                    peers.push(p);
                });
            });
            if (noOfZoneReplicas >= peers.length) {
                for (i = 0; i < peers.length; i++) {
                    var peer = peers[i];
                    replicaPeerIds.push(peer.id);

                    self.emit('_put', peer, key, event, function (error) {
                        putContinuation(error);
                    });

                    if (--noOfReplicasToStart <= 0)
                        return; // done starting replicas

                    // if noOfZoneReplicas was greater than peers.length
                    // then the execution will fall through to peers in zone
                    // to keep attempting to spread replicas
                }
            } else {
                while (noOfZoneReplicas > 0) {
                    // select random peer
                    index = Math.floor(Math.random() * peers.length);
                    var peer = peers.splice(index, 1);
                    replicaPeerIds.push(peer.id);

                    self.emit('_put', peer, key, event, function (error) {
                        putContinuation(error);
                    });

                    --noOfZoneReplicas;
                    if (--noOfReplicasToStart <= 0)
                        return; // done starting replicas
                }
            }
        }
    }

    // place replicas in other regions
    if (self.replicationStrategy.otherRegionReplicas > 0) {
        var noOfRegionReplicas = self.replicationStrategy.otherRegionReplicas;
        // first, attempt to spread across all regions
        if (noOfRegionReplicas == self.regions.length) {
            for (i = 0; i < self.regions.length; i++) {
                var region = self.regions[i];
                // select random peer
                var regionPeerIds = Object.keys(self.regionMap[region]);
                index = Math.floor(Math.random() * regionPeerIds.length);
                var id = regionPeerIds[index];
                var peer = self.regionMap[region][id];

                replicaPeerIds.push(peer.id);

                self.emit('_put', peer, key, event, function (error) {
                    putContinuation(error);
                });

                if (--noOfReplicasToStart <= 0)
                    return; // done starting replicas
            }
        } else if (noOfRegionReplicas < self.regions.length) {
            var regions = self.regions.slice(); // copy
            while (noOfRegionReplicas > 0) {
                // select random region
                index = Math.floor(Math.random() * regions.length);
                var region = region.splice(index, 1); // reduce choice for next one
                // select random peer
                var regionPeerIds = Object.keys(self.regionMap[region]);
                index = Math.floor(Math.random() * regionPeerIds.length);
                var id = regionPeerIds[index];
                var peer = self.regionMap[region][id];

                replicaPeerIds.push(peer.id);

                self.emit('_put', peer, key, event, function (error) {
                    putContinuation(error);
                });

                --noOfRegionReplicas;
                if (--noOfReplicasToStart <= 0)
                    return; // done starting replicas
            }
        } else {
            var peers = [];
            self.regions.forEach(function (region) {
                Object.keys(self.regionMap[region]).forEach(function (k) {
                    var p = self.regionMap[region][k];
                    peers.push(p);
                });
            });
            if (noOfRegionReplicas >= peers.length) {
                for (i = 0; i < peers.length; i++) {
                    var peer = peers[i];
                    replicaPeerIds.push(peer.id);

                    self.emit('_put', peer, key, event, function (error) {
                        putContinuation(error);
                    });

                    if (--noOfReplicasToStart <= 0)
                        return; // done starting replicas

                    // if noOfRegionReplicas was greater than peers.length
                    // then the execution will fall through to peers in zone
                    // to keep attempting to spread replicas
                }
            } else {
                while (noOfRegionReplicas > 0) {
                    // select random peer
                    index = Math.floor(Math.random() * peers.length);
                    var peer = peers.splice(index, 1);
                    replicaPeerIds.push(peer.id);

                    self.emit('_put', peer, key, event, function (error) {
                        putContinuation(error);
                    });

                    --noOfRegionReplicas;
                    if (--noOfReplicasToStart <= 0)
                        return; // done starting replicas
                }
            }
        }
    }

    // place replicas in local zone
    var peerIds = Object.keys(self.local); // copy
    for (i = 0; i < peerIds.length; i++) {
        // select random peer
        index = Math.floor(Math.random() * peerIds.length);
        var peerId = peerIds.splice(index, 1);
        var peer = self.local[peerId];
        replicaPeerIds.push(peer.id);

        self.emit('_put', peer, key, event, function (error) {
            putContinuation(error);
        });

        if (--noOfReplicasToStart <= 0)
            return; // done starting replicas
    }

    // we tried to put replicas according to policy but still have replicas
    // to start since noOfReplicasToStart > 0
    // go into "get it done" mode and try to spread replicas wherever possible
    putContinuation(true, true /* keep starting replicas flag */);
};