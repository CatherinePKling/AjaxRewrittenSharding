'use strict';

let toggleStorage;

module.exports.init = async function() {
    toggleStorage = await global.storage.getDatabase(`toggle`);

    (await global.commands.getExecutorInput()).addListener(3, checkIfDisabled);


    await global.commands.registerCommand(`disablecommand`, {
        run: disablecommand,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`WORD`],
        helpCategory: `admin`,
        briefHelp: ` [command] - Disables a command on this server.`,
        longHelp: ` [command] - 
Disables a command on this server in all channels.`
    });

    await global.commands.registerCommand(`enablecommand`, {
        run: enablecommand,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`WORD`],
        helpCategory: `admin`,
        briefHelp: ` [command] - Enables a command on this server.`,
        longHelp: ` [command] - 
Enables a command on this server in all channels.`
    });

    await global.commands.registerCommand(`disablecommandchannel`, {
        run: disablecommandchannel,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`WORD`, `GUILDCHANNEL`],
        helpCategory: `admin`,
        briefHelp: ` [command] [channel] - Disables a command on this server in a specific channel.`,
        longHelp: ` [command] [channel] - 
Disables a command on this server in a specific channel.`
    });

    await global.commands.registerCommand(`enablecommandchannel`, {
        run: enablecommandchannel,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`WORD`, `GUILDCHANNEL`],
        helpCategory: `admin`,
        briefHelp: ` [command] [channel] - Enables a command on this server in a specific channel.`,
        longHelp: ` [command] [channel] - 
Enables a command on this server in a specific channel.`
    });
};

async function disablecommand(message, command) {
    command = command.toLowerCase();
    if (!(await global.commands.getCommand(command))) {
        await global.message.send(`NOCOMMAND`, message.channel, command);
        return;
    }

    await disableAll(message.guild.id, command);
    await global.message.send(`DISABLEDCOMMAND`, message.channel, command);
}

async function enablecommand(message, command) {
    command = command.toLowerCase();
    if (!(await global.commands.getCommand(command))) {
        await global.message.send(`NOCOMMAND`, message.channel, command);
        return;
    }

    await enableAll(message.guild.id, command);
    await global.message.send(`ENABLEDCOMMAND`, message.channel, command);
}

async function disablecommandchannel(message, command, channel) {

    command = command.toLowerCase();

    if (!(await global.commands.getCommand(command))) {

        await global.message.send(`NOCOMMAND`, message.channel, command);
        return;
    }

    await disableCommandChannel(message.guild.id, command, channel.id);
    await global.message.send(`DISABLEDCOMMANDCHANNEL`, message.channel, command, channel);

}

async function enablecommandchannel(message, command, channel) {

    command = command.toLowerCase();

    if (!(await global.commands.getCommand(command))) {
        await global.message.send(`NOCOMMAND`, message.channel, command);
        return;
    }

    await enableCommandChannel(message.guild.id, command, channel.id);
    await global.message.send(`ENABLEDCOMMANDCHANNEL`, message.channel, command, channel);

}

//["command", {command object}, [message content split up into array], message object]
async function checkIfDisabled(event) {

    if (event[0] === `command`) {
        const commandName = event[1].commandName;
        const message = event[3];

        if (message.guild) {
            if (commandName.toLowerCase() === `enablecommand`) {
                return event;
            }

            const disabled = await getDisabledCommand(message.guild.id, commandName);

            if (disabled.all) { // If the first item is all then the rest are channels the command is allowed in

                if (disabled[message.channel.id]) {

                    return event;
                } else {

                    await global.message.send(`DISABLEDALL`, message.channel);
                    return null;
                }
            } else if (disabled[message.channel.id]) {

                await global.message.send(`DISABLED`, message.channel);
                return null;
            }
        }
    }

    return event;
}

async function getDisabled(id) {
    await toggleStorage.setDefault(id, {});
    return await toggleStorage.get(id);
}

async function getDisabledCommand(id, command) {
    return (await getDisabled(id))[command] || {};
}

async function disableAll(id, command) {
    await toggleStorage.setDefault(id, {});
    await toggleStorage.update(id, async function (disabled) {
        disabled[command] = {all: true};
    });
}

async function enableAll(id, command) {
    await toggleStorage.setDefault(id, {});
    await toggleStorage.update(id, async function (disabled) {
        disabled[command] = {};
    });
}

async function disableCommandChannel(id, command, channelid) {
    await toggleStorage.setDefault(id, {});
    await toggleStorage.update(id, async function (disabled) {
        disabled[command] = disabled[command] || {};

        if (disabled[command].all) {
            delete disabled[command][channelid];
        } else {
            disabled[command][channelid] = true;
        }
    });
}

async function enableCommandChannel(id, command, channelid) {
    await toggleStorage.setDefault(id, {});
    await toggleStorage.update(id, async function (disabled) {
        disabled[command] = disabled[command] || {};

        if (disabled[command].all) {
            disabled[command][channelid] = true;
        } else {
            delete disabled[command][channelid];
        }
    });
}