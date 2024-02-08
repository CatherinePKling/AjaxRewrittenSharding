'use strict';

let spamlimitStorage; // [amount, milliseconds, lastamount, lastmilliseconds]

const moment = require(`moment`);

module.exports.init = async function() {
    spamlimitStorage = await global.storage.getDatabase(`spamlimit`);

    const messageDictInput = await global.message.getDictionaryInput();
    await messageDictInput.addListener(2, checkSpamlimit);

    await global.commands.registerCommand(`addspamlimit`, {
        run: addspamlimit,
        reqParameters: [`GUILDCHANNEL`, `NUMBER`, `NUMBER`],
        helpCategory: `admin`,
        briefHelp: ` [channel] [amount] [time in milliseconds] - Makes it so Ajax can only send a certain amount of messages in a given time in a given channel.`,
        longHelp: ` [channel] [amount] [time in milliseconds] -
Makes it so Ajax can only send a certain amount of messages in a given time in a given channel. For example if the spamlimit was 2 messages every 3000 milliseconds and Ajax tried to send 3 messages in less than 3000 milliseconds, the last message wouldn't send.`
    });

    await global.commands.registerCommand(`removespamlimit`, {
        run: removespamlimit,
        reqParameters: [`GUILDCHANNEL`],
        helpCategory: `admin`,
        briefHelp: ` [channel] - Removes a spamlimit from a channel.`,
        longHelp: ` [channel] -
Removes a spamlimit from a channel.`
    });
};

async function addspamlimit(message, channel, amount, limit) {
    if (amount < 1 || limit < 1) {
        await global.message.send(`INVLDAMOUNTLIMIT`, message.channel);
        return;
    }

    await spamlimitStorage.set(channel.id, [amount, limit]);
    await global.message.send(`SPAMLIMITSET`, message.channel, channel);
}

async function removespamlimit(message, channel) {
    await spamlimitStorage.set(channel.id, undefined);
    await global.message.send(`SPAMLIMITRESET`, message.channel, channel);
}

async function checkSpamlimit(event) {
    if (event[0] === `message`) {
        const channel = event[1][1];
        if (!await checkRatelimit(channel.id)) {
            return null;
        }
    }

    return event;
}

async function checkRatelimit(channelid) { // Returns time left until you can run this command again

    const currentTime = parseInt(moment().format(`x`)); // Gets unix timestamp in milliseconds
    const spamlimitData = await spamlimitStorage.get(channelid);

    if (!spamlimitData) { // No spamlimit set for this channel
        return true;
    }


    if (!spamlimitData[2]) {
        await spamlimitStorage.set(channelid, [spamlimitData[0], spamlimitData[1], 1, currentTime]); // Store initial values
        return true;
    }


    let [amount, ratelimit, lastCount, lastTime] = spamlimitData;
    lastCount++; // Increment count for this command

    if (lastTime + ratelimit < currentTime) { // Spamlimit expired

        await spamlimitStorage.set(channelid, [amount, ratelimit, 1, currentTime]); // Reset count
        return true;
    }

    if (lastCount > amount) { // Spamlimit exceeded
        await spamlimitStorage.set(channelid, [amount, ratelimit, lastCount, lastTime]); // Store new values
        return false;
    }


    // Just store the increased count
    await spamlimitStorage.set(channelid, [amount, ratelimit, lastCount, lastTime]);
    return true;
}