"use strict";

let botbanStorage;

module.exports.init = async function() {
    botbanStorage = await global.storage.getDatabase(`botbans`);
    await botbanStorage.setDefault(`userbans`, []);
    await botbanStorage.setDefault(`serverbans`, []);

    await global.commands.registerCommand(`banserver`, {run: addServerBan, permissionlevel: `OWNER`, reqParameters:[`SNOWFLAKEID`]});
    await global.commands.registerCommand(`unbanserver`, {run: removeServerBan, permissionlevel: `OWNER`, reqParameters:[`SNOWFLAKEID`]});

    await global.commands.registerCommand(`banuser`, {run: addUserBan, permissionlevel: `ADMIN`, reqParameters:[[`USER`, `SNOWFLAKEID`]]});
    await global.commands.registerCommand(`unbanuser`, {run: removeUserBan, permissionlevel: `ADMIN`, reqParameters:[[`USER`, `SNOWFLAKEID`]]});

    await global.allClientEvents.addListener(3, checkForBan);
};

async function checkForBan(event) {
    const userbans = await botbanStorage.get(`userbans`);
    const serverbans = await botbanStorage.get(`serverbans`);

    if (event[0] == `message`) { // NOTE: Handle more events as they are added
        const message = event[1];

        if (~userbans.indexOf(message.author.id)) {
            return null;
        }

        if (message.guild && (~serverbans.indexOf(message.guild.id) || ~userbans.indexOf(message.guild.ownerID))) {
            await message.guild.leave();
            return null;
        }
    }

    return event;
}

async function addServerBan(message, serverid) {
    await botbanStorage.update(`serverbans`, async function() {
        this.push(serverid);
    });

    global.message.send(`SERVERBAN`, message.channel, serverid);
}

async function addUserBan(message, userResolvable) {
    const id = userResolvable.id || userResolvable;

    if (id == 150699865997836288) // My id
        return;

    const name = userResolvable.username || userResolvable;
    await botbanStorage.update(`userbans`, async function() {
        this.push(id);
    });

    global.message.send(`USERBAN`, message.channel, name);
}

async function removeServerBan(message, serverid) {
    const serverbans = await botbanStorage.get(`serverbans`);
    const index = serverbans.indexOf(serverid);
    if (index == -1) {
        global.message.send(`SERVERNOTFOUND`, message.channel);
        return;
    }

    await botbanStorage.update(`serverbans`, async function() {
        this.splice(index, 1);
    });

    global.message.send(`SERVERUNBAN`, message.channel, serverid);
}

async function removeUserBan(message, userid) {
    const userbans = await botbanStorage.get(`userbans`);
    const index = userbans.indexOf(userid);
    if (index == -1) {
        global.message.send(`USERNOTFOUND`, message.channel);
        return;
    }

    await botbanStorage.update(`userbans`, async function() {
        this.splice(index, 1);
    });

    global.message.send(`USERUNBAN`, message.channel, userid);
}