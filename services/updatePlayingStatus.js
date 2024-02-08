'use strict';

const discordUtil = require(`../util/discordUtil.js`);

let pingStorage;

module.exports.init = async function() {
    pingStorage = await global.storage.getDatabase(`ping`);

    loopPlaying();
};

async function loopPlaying() {
    await waitSetTime();

    while (true) {
        await setPlayingStatus(`;;help - ${await discordUtil.getGuildCountSharding()} servers`);
        await waitSetTime();

        await setPlayingStatus(`;;help - ${await discordUtil.getUserCountSharding()} users`);
        await waitSetTime();

        const pingCount = await pingStorage.get(0) || 0;
        await setPlayingStatus(`;;help - ${pingCount} pings`);
        await waitSetTime();
    }
}

async function setPlayingStatus(status) {
    await global.client.user.setPresence({ activity: { name: status} });
}

async function waitSetTime() {
    await new Promise((resolve, reject) => {
        setTimeout(resolve, 60000); // One minute
    });
}