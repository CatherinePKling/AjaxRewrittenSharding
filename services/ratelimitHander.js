"use strict";

/** Ratelimit Types (all in format [amount, milliseconds]):
  * .channelRatelimit - Checks channel id
  * .userRatelimit - Checks user id
  */

const moment = require(`moment`);

let ratelimitStorage, publicServer;

const PUBLIC_SERVER_ID = `442416549513396224`,
    DONOR_ROLE_ID = `442418360161140756`,
    BUG_FINDER_ROLE_ID = `442424691886653459`;

module.exports.init = async function() {
    ratelimitStorage = await global.storage.getDatabase(`ratelimit`);
    publicServer = global.client.guilds.resolve(PUBLIC_SERVER_ID);
    global.client.publicServer = publicServer;

    const executorInput = await global.commands.getExecutorInput();
    await executorInput.addListener(2, processRatelimits);
};

async function processRatelimits(event) {
    if (event[0] === `command` && (event[1].channelRatelimit || event[1].userRatelimit)) {
        const message = event[3];
        const commandName = event[2][0].toLowerCase();

        const donor = await isDonor(message.author);

        if (event[1].channelRatelimit) {
            let timeLeft;
            if (donor) {
                timeLeft = await checkRatelimit(message.channel.id + commandName, event[1].channelRatelimit[0] * 2, event[1].channelRatelimit[1]);
            } else {
                timeLeft = await checkRatelimit(message.channel.id + commandName, ...event[1].channelRatelimit);
            }

            if (timeLeft != 0) {
                global.message.send(`RATELIMIT`, message.channel, timeLeft);
                return null;
            }
        }

        if (!donor && event[1].userRatelimit) {
            let timeLeft;
            if (await isBugFinder(message.author)) {
                timeLeft = await checkRatelimit(message.channel.id + commandName, event[1].userRatelimit[0] * 4, event[1].userRatelimit[1]);
            } else if (await isVoter(message.author)) {
                timeLeft = await checkRatelimit(message.author.id + commandName, event[1].userRatelimit[0] * 2, event[1].userRatelimit[1]);
            } else {
                timeLeft = await checkRatelimit(message.author.id + commandName, ...event[1].userRatelimit);
            }

            if (timeLeft != 0) {
                global.message.send(`RATELIMIT`, message.channel, timeLeft);
                return null;
            }
        }
    }

    return event;
}

async function checkRatelimit(id, amount, ratelimit) { // Returns time left until you can run this command again
    const currentTime = parseInt(moment().format(`x`)); // Gets unix timestamp in milliseconds
    const ratelimitData = await ratelimitStorage.get(id);
    if (!ratelimitData) { // First time command being run
        await ratelimitStorage.set(id, [1, currentTime]); // Store initial values
        return 0;
    }

    let [lastCount, lastTime] = ratelimitData;
    lastCount++; // Increment count for this command

    if (+lastTime + +ratelimit < currentTime) { // Ratelimit expired
        await ratelimitStorage.set(id, [1, currentTime]); // Reset count
        return 0;
    }

    if (lastCount > amount) { // Ratelimit exceeded
        const timeLeft = lastTime - currentTime + ratelimit;

        if (timeLeft > ratelimit || timeLeft < 0) { // The time left is probably some obscene number

            await ratelimitStorage.set(id, [1, currentTime]); // Reset it
            return 0;
        } else {

            await ratelimitStorage.set(id, [lastCount, lastTime]); // Store new values
            return timeLeft;
        }

    }


    // Just store the increased count
    await ratelimitStorage.set(id, [lastCount, lastTime]);
    return 0;
}

async function isDonor(user) {
    const results = await global.client.shard.broadcastEval(await publicServerRoleCheckerFactory(DONOR_ROLE_ID, user.id));
    return results.reduce((a, b) => a || b);
}

async function publicServerRoleCheckerFactory(roleId, userId) {
    return `
        this.publicServer && this.publicServer.members.resolve('${userId}') && this.publicServer.members.resolve('${userId}').roles.cache.has('${roleId}');
    `;
}

async function isBugFinder(user) {
    const results = await global.client.shard.broadcastEval(await publicServerRoleCheckerFactory(BUG_FINDER_ROLE_ID, user.id));
    return results.reduce((a, b) => a || b);
}

async function isVoter(user) {
    const voter = await global.discordBotsClient.hasVoted(user.id);
    return voter;
}