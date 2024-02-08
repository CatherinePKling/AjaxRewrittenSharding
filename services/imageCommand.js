'use strict';

const images = require(`../config/images.js`);

// type desc name
const imageCommands = [
    images.mao, `mao`, `mao`
];

module.exports.init = async function() {
    for (let i = 0; i < imageCommands.length; i += 3) {
        await addImageCommand(imageCommands[i], imageCommands[i + 1], imageCommands[i + 2]);
    }
};

async function addImageCommand(array, desc, name) {
    await global.commands.registerCommand(name, await imageCommandObjectFactory(array, desc));
}

async function imageCommandObjectFactory(array, desc) {
    return {
        run: await imageCommandFactory(array),
        permissionlevel: `NODM`,
        helpCategory: `images`,
        channelRatelimit: [3, 15000],
        briefHelp: ` - ${desc}`,
        longHelp: ` - 
${desc}`
    };
}

async function imageCommandFactory(imageArray) {
    return async function(message) {
        await global.message.send(`WEEB`, message.channel, getRandom(imageArray));
    };
}

function getRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}