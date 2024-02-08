"use strict";

let prefixStorage;

module.exports.init = async function() {
    prefixStorage = await global.storage.getDatabase(`prefix`);

    await global.allClientEvents.addListener(3, checkForPrefix);

    await global.commands.registerCommand(`setprefix`, {
        run: setPrefix,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`STRING`],
        helpCategory: `admin`,
        briefHelp: ` [prefix] - Changes the server's bot prefix.`,
        longHelp: ` [prefix] - 
Changes the server prefix to the input specified. The bot's normal prefix won't work after this is set. The prefix cannot contain spaces and must be shorter than 5 characters.`
    });

    await global.commands.registerCommand(`resetprefix`, {
        run: resetPrefix,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        helpCategory: `admin`,
        briefHelp: ` - Resets the server's bot prefix. This command will work with the default prefix of ;;.`,
        longHelp: ` - 
Resets the server's bot prefix back to ;;. This command will work with the default prefix of ;;, so you can run ;;resetprefix and that will reset the server's prefix regardless of what the server's prefix was previously.
This command can only be run by bot admins and server admins.`
    });

    await global.commands.registerCommand(`setuserprefix`, {
        run: setUserPrefix,
        helpCategory: `general`,
        briefHelp: ` [prefix] - Sets the user's bot prefix.`,
        longHelp: ` [prefix] - 
Sets the user's bot prefix. This prefix can only be used by the user setting it. The user will still be able to use the prefix set by the server they are in currently.`
    });
};

async function setUserPrefix(message, newPrefix) {
    if (~newPrefix.indexOf(` `)) { // Check for space
        await global.message.send(`INVALIDPREFIX`, message.channel);
        return;
    }

    if (newPrefix.length > 5) {
        await global.message.send(`PREFIXTOOLONG`, message.channel);
        return;
    }

    await prefixStorage.set(message.author.id, newPrefix);

    await global.message.send(`SETUSERPREFIX`, message.channel, newPrefix);
}

async function resetPrefix(message, ) {
    await prefixStorage.set(message.guild.id, undefined);

    await global.message.send(`RESETPREFIX`, message.channel);
}

async function setPrefix(message, newPrefix) {
    if (~newPrefix.indexOf(` `)) { // Check for space
        await global.message.send(`INVALIDPREFIX`, message.channel);
        return;
    }

    if (newPrefix.length > 5) {
        await global.message.send(`PREFIXTOOLONG`, message.channel);
        return;
    }

    await prefixStorage.set(message.guild.id, newPrefix);

    await global.message.send(`SETPREFIX`, message.channel, newPrefix);
}

async function checkForPrefix(event) {
    if (event[0] === `message`) {
        const message = event[1];

        const userPrefix = await prefixStorage.get(message.author.id);
        if (userPrefix && message.content.startsWith(userPrefix)) {
            message.content = `;;${message.content.substr(userPrefix.length)}`;
            return event;
        }

        if (message.guild) {
            const guildPrefix = await prefixStorage.get(message.guild.id);
            if (guildPrefix) {
                if (message.content.startsWith(guildPrefix)) {
                    message.content = `;;${message.content.substr(guildPrefix.length)}`;
                    return event;
                } else if (message.content.startsWith(`;;`)) {
                    return null;
                }
            }
        }
    }

    return event;
}
