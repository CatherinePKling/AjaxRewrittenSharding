'use strict';

var mongoose = require('mongoose');
var nodecache = require('node-cache');

var serverSchema = mongoose.Schema({
    _id: String, // If its a number everything breaks :/
    prefix: String,
    newMemberMessage: String,
    newMemberMessageChannel: String,
    shortcuts: [{shortcut: String, command: String}]
});

serverSchema.statics.updateWithIdFromNodeCache = function(id, cache) {
    this.findByIdAndUpdate(id, {
        prefix: cache.get('prefix'), 
        newMemberMessage: cache.get('newMemberMessage'),
        newMemberMessageChannel: cache.get('newMemberMessageChannel'),
        shortcuts: cache.get("shortcuts"),
        _id: id
    }, {
        upsert: true // Makes it so it will created a new document if this one doesn't exist
    }, (err, server) => {
        if (err) {
            console.log(err);
        }
    });
};

serverSchema.methods.getFilledNodeCache = function() {
    var newCache = new nodecache();
    newCache.set("prefix", this.prefix);
    newCache.set("newMemberMessage", this.newMemberMessage);
    newCache.set("newMemberMessageChannel", this.newMemberMessageChannel);
    newCache.set("shortcuts", this.shortcuts);
    return newCache;
}

module.exports = mongoose.model("DiscordServer", serverSchema);