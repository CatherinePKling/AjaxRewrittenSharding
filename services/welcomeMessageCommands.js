'use strict';

const discordUtil = require(`../util/discordUtil.js`);

let joinWelcomeStorage; // Entries are in format {channelId: channelId, welcomeMessage: welcomeMessage}

module.exports.init = async function() {
    joinWelcomeStorage = await global.storage.getDatabase(`welcomeMessage`);

    await global.allClientEvents.addListener(0, onMemberJoin);

    await global.commands.registerCommand(`setwelcomemessage`, {
        run: setWelcomeMessage,
        permissionlevel: [`SERVERADMIN`],
        reqParameters: [`GUILDCHANNEL`, `STRING`],
        helpCategory: `admin`, briefHelp: ` [channel] [message] - Sets the welcome message. Add "{{name}}" whereever you want the new user to be pinged.`, longHelp: ` [channel] [message] - 
Sets the welcome message. Add "{{name}}" whereever you want the new user to be pinged.`});

    await global.commands.registerCommand(`removewelcomemessage`, {
        run: removeWelcomeMessage,
        permissionlevel: [`SERVERADMIN`],
        helpCategory: `admin`, briefHelp: ` - Removes the current welcome message.`, longHelp: ` - 
Removes the current welcome message.`});
};

async function setWelcomeMessage(message, channel, newJoinMessage) {
    await joinWelcomeStorage.set(message.guild.id, {channelId: channel.id, welcomeMessage: newJoinMessage});

    global.message.send(`NEWWELCOMEMESSAGE`, channel, newJoinMessage);
}

async function removeWelcomeMessage(message) {
    await joinWelcomeStorage.set(message.guild.id, undefined);

    global.message.send(`REMOVEWELCOMEMESSAGE`, message.channel);
}

async function onMemberJoin(event) {
    if (event[0] === `guildMemberAdd`) {
        const member = event[1];

        const welcomeMessageData = await joinWelcomeStorage.get(member.guild.id);
        if (!welcomeMessageData) {
            return event;
        }

        const channel = member.guild.channels.resolve(welcomeMessageData.channelId) || await discordUtil.getDefaultChannel(member.guild);
        if (!channel) {
            return event;
        }

        global.message.send(`WELCOMEMESSAGE`, channel, welcomeMessageData.welcomeMessage, member);
    }

    return event;
}