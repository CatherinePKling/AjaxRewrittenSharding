'use strict';

const moment = require(`moment`);
const fs = require(`fs`);

const discordBotsUtil = require(`../util/discordBotsUtil.js`);
const discordUtil = require(`../util/discordUtil.js`);

module.exports.init = async function() {
    setInterval(appendCurrentServers, 3600000);

    setInterval(async () => {
        try {
            await discordBotsUtil.postGuildCount(await discordUtil.getGuildCountSharding());
        } catch(error) {
            console.warn(error);
        }
    }, 3600000 / 2);

    setTimeout(appendCurrentServers, 15000);
};

async function appendCurrentServers() {
    if (!global.client.guilds || await discordUtil.getGuildCountSharding() === 0) {
        return;
    }

    const daysSincePublic = moment().diff(moment(`20170730`, `YYYYMMDD`), `days`);

    fs.appendFile(`serversOverTime.txt`, `${daysSincePublic}\t${await discordUtil.getGuildCountSharding()}\r\n`, function (err) {
        if (err) throw err;
    });
}