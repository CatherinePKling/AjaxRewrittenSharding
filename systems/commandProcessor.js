"use strict";

const PrioritizedEventHandler = require(`../util/prioritizedEventHandler.js`);

let commandList, dictionaryInput, executorInput;

module.exports = async function(event) {
    if (event[0] === `message`) {
        const message = event[1];

        if (message.author.id == global.client.user.id) // Ignore messages from the bot itself
            return;

        if (message.content.startsWith(`;;`)) {
            message.content = message.content.slice(2); // Remove first 2 characters of string

            const commandRegex = /"([^"]+)"|'([^']+)'|(\S+)/g;
            let result;
            const rawCommand = [];

            do {
                result = commandRegex.exec(message.content);
                if (result) {
                    rawCommand.push(result[1] || result[2] || result[3]);
                }
            } while (result);


            await dictionaryInput.emit(`command`, rawCommand, message);
        }
    }
};

/** commandList Object
 * {"help": {run: function, metadata: {data here}}}
 */

module.exports.registerCommand = async function (name, command) {
    command.commandName = name;
    commandList[name.toLowerCase()] = command;
};

module.exports.unregistercommand = async function (name) {
    commandList[name.toLowerCase()] = undefined;
};

module.exports.getCommand = async function(name) { // NOTE: This passes a reference to the command object, this could cause weird behavior in the future

    return commandList[name.toLowerCase()];
};

module.exports.getCommands = async function () {
    return commandList;
};

module.exports.getDictionaryInput = async function() {
    return dictionaryInput;
};

module.exports.getExecutorInput = async function() {
    return executorInput;
};

module.exports.init = async function() {
    commandList = {};

    dictionaryInput = new PrioritizedEventHandler(processDictionaryInput);
    executorInput = new PrioritizedEventHandler(processExecutorInput);
};

async function processDictionaryInput(event) {

    if (event[0] === `command`) {
        const command = await module.exports.getCommand(event[1][0]); // Gets command object

        if (command) {
            await executorInput.emit(`command`, command, event[1], event[2]);
        }
    }
}

async function processExecutorInput(event) { // Commands are run with run(message, [...parameters])

    if (event[0] === `command`) {
        if (typeof event[1].run == `function` && typeof event[2] == `object`) { // Valid command
            event[2].splice(0, 1); // Remove command name from parameter array

            try {
                console.log(`User ${event[3].author.id} running command ${event[1].commandName} ${event[2].join(` `)}`);

                await event[1].run(event[3], ...event[2]);
            } catch (err) {
                console.warn(`Error running command`, err);
            }
        }
    }
}
