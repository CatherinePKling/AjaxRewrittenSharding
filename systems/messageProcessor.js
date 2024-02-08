"use strict";

const PrioritizedEventHandler = require(`../util/prioritizedEventHandler.js`);

let dictionary, dictionaryInput;

module.exports.send = async function() { // sendMessage(key, channel, args)
    dictionaryInput.emit(`message`, Array.from(arguments));
};

module.exports.init = async function() {
    dictionary = {};

    dictionaryInput = new PrioritizedEventHandler(messageMapper);
};

module.exports.registerMessage = async function(key, message) {
    dictionary[key.toLowerCase()] = message;
};

module.exports.unregisterMessage = async function(key) {
    dictionary[key.toLowerCase()] = undefined;
};

module.exports.reset = async function() {
    dictionary = {};
};

module.exports.getDictionaryInput = async function() {
    return dictionaryInput;
};

async function messageMapper(event) {
    if (event[0] === `message`) {
        const args = event[1];
        const message = dictionary[args[0].toLowerCase()];
        if (message) {
            const channel = args[1];
            args.splice(0, 2);

            let messageString;
            if (typeof message === `function`) {
                messageString = message(...args);
            } else {
                messageString = message;
            }

            if (Array.isArray(messageString)) {
                channel.send(...messageString);
            } else {
                channel.send(messageString);
            }
        }
    }
}