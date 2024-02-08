'use strict';

let loggingStorage;

module.exports.init = async function() {
    loggingStorage = await global.storage.getDatabase(`logging`);

    await global.allClientEvents.addListener(3, onEvent);

    await global.commands.registerCommand(`enablelogging`, {
        run: enablelogging,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`GUILDCHANNEL`],
        helpCategory: `admin`,
        briefHelp: ` [channel] - Enables logging for moderation.`,
        longHelp: ` [channel] -
Enables logging for moderation. Detects when members join, when members leave, when members are banned, when members are unbanned, when members change their nicknames, when messages are edited, when messages are deleted, when channels are renamed, when channel topics are changed, and when the guild name is changed.`
    });

    await global.commands.registerCommand(`disablelogging`, {
        run: disablelogging,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        helpCategory: `admin`,
        briefHelp: ` - Disables logging for moderation.`,
        longHelp: ` -
Disables logging for moderation.`
    });
};

async function enablelogging(message, channel) {
    await setLogChannel(message.guild.id, channel.id);
    await global.message.send(`ENABLELOG`, channel, channel);
}

async function disablelogging(message) {
    if (!await getLogChannel(message.guild.id)) {
        await global.message.send(`NOLOGGING`, message.channel);
        return;
    }

    await setLogChannel(message.guild.id, undefined);
    await global.message.send(`DISABLELOG`, message.channel);
}

async function onEvent(event) {
    switch(event[0]) {
        case `guildMemberAdd`: {
            const member = event[1];
            const loggingChannel = member.guild.channels.resolve(await getLogChannel(member.guild.id));
            if (loggingChannel) {
                global.message.send(`GUILDMEMBERADDLOG`, loggingChannel, member);
            }
        }
            break;
        case `guildMemberRemove`: {
            const member = event[1];
            const loggingChannel = member.guild.channels.resolve(await getLogChannel(member.guild.id));
            if (loggingChannel) {
                global.message.send(`GUILDMEMBERREMOVELOG`, loggingChannel, member);
            }
        }
            break;
        case `guildBanAdd`: {
            const guild = event[1];
            const user = event[2];
            const loggingChannel = guild.channels.resolve(await getLogChannel(guild.id));
            if (loggingChannel) {
                global.message.send(`GUILDBANADDLOG`, loggingChannel, guild, user);
            }
        }
            break;
        case `guildBanRemove`: {
            const guild = event[1];
            const user = event[2];
            const loggingChannel = guild.channels.resolve(await getLogChannel(guild.id));
            if (loggingChannel) {
                global.message.send(`GUILDBANREMOVELOG`, loggingChannel, guild, user);
            }
        }
            break;
        case `guildMemberUpdate`: {
            const memberOld = event[1];
            const memberNew = event[2];
            const loggingChannel = memberNew.guild.channels.resolve(await getLogChannel(memberNew.guild.id));
            if (loggingChannel) {
                if (memberOld.nickname !== memberNew.nickname) {
                    global.message.send(`NICKNAMEUPDATELOG`, loggingChannel, memberOld, memberNew);
                }
            }
        }
            break;
        case `messageUpdate`: {
            const messageOld = event[1];
            const messageNew = event[2];
            const loggingChannel = messageNew.guild.channels.resolve(await getLogChannel(messageNew.guild.id));
            if (loggingChannel) {
                if (messageNew.content !== messageOld.content) {
                    global.message.send(`MESSAGEEDITLOG`, loggingChannel, messageOld, messageNew);
                }
            }
        }
            break;
        case `messageDelete`: {
            const message = event[1];
            if (!message.content) {
                break;
            }

            const loggingChannel = message.guild.channels.resolve(await getLogChannel(message.guild.id));
            if (loggingChannel) {
                global.message.send(`MESSAGEDELETELOG`, loggingChannel, message);
            }
        }
            break;
        case `channelUpdate`: {
            const channelOld = event[1];
            const channelNew = event[2];
            const loggingChannel = channelNew.guild.channels.resolve(await getLogChannel(channelNew.guild.id));
            if (loggingChannel) {
                if (channelNew.name !== channelOld.name) {
                    global.message.send(`CHANNELNAMELOG`, loggingChannel, channelOld, channelNew);
                } else if (channelNew.topic !== channelOld.topic) {
                    global.message.send(`CHANNELTOPICLOG`, loggingChannel, channelOld, channelNew);
                }
            }
        }
            break;
        case `guildUpdate`: {
            const guildOld = event[1];
            const guildNew = event[2];
            const loggingChannel = guildNew.channels.resolve(await getLogChannel(guildNew.id));
            if (loggingChannel) {
                if (guildNew.name !== guildOld.name) {
                    global.message.send(`GUILDNAMELOG`, loggingChannel, guildOld, guildNew);
                }
            }
        }
            break;
    }

    return event;
}

async function getLogChannel(id) {
    return await loggingStorage.get(id);
}

async function setLogChannel(id, value) {
    return await loggingStorage.set(id, value);
}