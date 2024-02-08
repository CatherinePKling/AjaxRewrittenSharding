'use strict';

let responseStorage;

module.exports.init = async function() {
    responseStorage = await global.storage.getDatabase(`responses`);

    await global.allClientEvents.addListener(1, checkForAutoresponse);

    await global.commands.registerCommand(`addautoresponse`, {
        run: addautoresponse,
        permissionlevel: [`BOTMOD`, `SERVERMANAGER`],
        reqParameters: [`STRING`, `STRING`],
        potentialFlags: [[`-chance`, `NUMBER`], `-s`, `-e`, `-r`, `-c`],
        helpCategory: `admin`,
        briefHelp: ` [trigger] [response] - Adds an autoresponse to the server.`,
        longHelp: ` [trigger] [response] - 
Adds an autoresponse to the server. 
Potential flags:
-s - Will see if the message starts with the trigger
-e - Will see if the message ends with the trigger
-r - Interprets the message as a regex and tests the contents of the message for it
-c - Will see if the message contains the trigger
-chance - Chance of this autoresponse being sent if triggered. Put a number between 0 and 100`
    });

    await global.commands.registerCommand(`removeautoresponse`, {
        run: removeautoresponse,
        permissionlevel: [`BOTMOD`, `SERVERMANAGER`],
        reqParameters: [`NUMBER`],
        helpCategory: `admin`,
        briefHelp: ` [response id] - Removes an autoresponse from the server. Get the autoresponse ids from running the \`removeautoresponse\` command.`,
        longHelp: ` [response id] - 
Removes an autoresponse from the server. Get the autoresponse ids from running the \`removeautoresponse\` command.`
    });

    await global.commands.registerCommand(`listautoresponses`, {
        run: listautoresponses,
        permissionlevel: [`BOTMOD`, `SERVERMANAGER`],
        helpCategory: `admin`,
        briefHelp: ` - Lists the autoresponses on the server.`,
        longHelp: ` [response id] - 
Lists the autoresponses on the server with their ids.`
    });
};

async function addautoresponse(message, trigger, response) {

    const chance = message.flags.chance;

    if (chance && (chance < 0 || chance > 99)) {
        await global.message.send(`INVALIDCHANCE`, message.channel);
        return;
    }

    if (message.flags.r) {
        try {
            new RegExp(trigger);
        } catch (e) {
            await global.message.send(`INVALIDREGEX`, message.channel);
            return;
        }
    }

    await addResponse(message.guild.id, {flags: message.flags, chance: chance, trigger: trigger, response: response});

    await global.message.send(`ADDRESPONSE`, message.channel);

}

async function removeautoresponse(message, id) {
    const guildResponseList = await getResponses(message.guild.id);
    if (id > guildResponseList.length) {
        await global.message.send(`RESPONSENOTFOUND`, message.channel);
        return;
    }

    await removeResponse(message.guild.id, id);
    await global.message.send(`REMOVERESPONSE`, message.channel);
}

async function listautoresponses(message) {
    const guildResponseList = await getResponses(message.guild.id);

    await global.message.send(`LISTRESPONSES`, message.channel, guildResponseList);
}

async function checkForAutoresponse(event) {
    if (event[0] === `message`) {

        const message = event[1];
        if (!message.guild) {
            return event;
        }

        const guildResponseList = await getResponses(message.guild.id);

        for (var i in guildResponseList) {
            const data = guildResponseList[i];

            let sendResponse = false;
            if (data.flags.s) {

                if (message.content.startsWith(data.trigger)) {

                    sendResponse = true;
                }
            } else if (data.flags.e) {

                if (message.content.endsWith(data.trigger)) {

                    sendResponse = true;
                }
            } else if (data.flags.c) {

                if (message.content.includes(data.trigger)) {

                    sendResponse = true;
                }
            } else if (data.flags.r) {

                const regex = new RegExp(data.trigger);
                if (regex.test(message.content)) {

                    sendResponse = true;
                }
            } else {

                if (message.content === data.trigger) {

                    sendResponse = true;
                }
            }

            if (sendResponse) {

                if (!data.chance || data.chance > 1 + Math.floor(Math.random() * 99)) {

                    global.message.send(`AUTORESPONSE`, message.channel, data.response);
                }
            }
        }
    }

    return event;
}

async function getResponses(id) {
    await responseStorage.setDefault(id, []);
    return responseStorage.get(id);
}

async function addResponse(id, data) {
    await responseStorage.setDefault(id, []);
    responseStorage.update(id, async (datas) => {
        datas.unshift(data);
    });
}

async function removeResponse(id, responseid) {
    await responseStorage.setDefault(id, []);
    responseStorage.update(id, async (datas) => {
        let count = 0;
        return datas.filter(() => ++count != responseid);
    });
}