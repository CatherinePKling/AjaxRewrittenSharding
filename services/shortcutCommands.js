"use strict";

let shortcutStorage;
let dictionaryInput;

const MAX_SHORTCUTS = 5;

module.exports.init = async function() {
    shortcutStorage = await global.storage.getDatabase(`shortcut`);

    dictionaryInput = await global.commands.getDictionaryInput();
    await dictionaryInput.addListener(3, checkForShortcut);

    await global.commands.registerCommand(`addshortcut`, {
        run: addshortcut,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`WORD`, `WORD`],
        helpCategory: `admin`,
        briefHelp: ` [shortcut] [command] {params...} - Adds a command shortcut to the server.`,
        longHelp: ` [shortcut] [command] {params...} -
Adds a command shortcut to the server. If you want to add a parameter with spaces surround it with quotes. Command shortcuts allow you to type a shortcut to run a command with preset parameters.`
    });

    await global.commands.registerCommand(`removeshortcut`, {
        run: removeshortcut,
        permissionlevel: [`BOTADMIN`, `SERVERADMIN`],
        reqParameters: [`WORD`],
        helpCategory: `admin`,
        briefHelp: ` [shortcut] - Removes a command shortcut from the server.`,
        longHelp: ` [shortcut] - 
Removes a command shortcut from the server. `
    });

    await global.commands.registerCommand(`listshortcuts`, {
        run: listshortcuts,
        helpCategory: `general`,
        permissionlevel: [`NODM`],
        briefHelp: ` - Lists the command shortcuts on the server.`,
        longHelp: ` - 
Lists the command shortcuts on the server.`
    });

    await global.commands.registerCommand(`addusershortcut`, {
        run: addusershortcut,
        reqParameters: [`WORD`, `WORD`],
        helpCategory: `general`,
        briefHelp: ` [shortcut] [command] {params...} - Adds a command shortcut to your shortcuts.`,
        longHelp: ` [shortcut] [command] {params...} -
Adds a command shortcut to the user's shortcuts. If you want to add a parameter with spaces surround it with quotes. Command shortcuts allow you to type a shortcut to run a command with preset parameters.`
    });

    await global.commands.registerCommand(`removeusershortcut`, {
        run: removeusershortcut,
        reqParameters: [`WORD`],
        helpCategory: `general`,
        briefHelp: ` [shortcut] - Removes a command shortcut from your shortcuts.`,
        longHelp: ` [shortcut] - 
Removes a command shortcut from your shortcuts.`
    });

    await global.commands.registerCommand(`listusershortcuts`, {
        run: listusershortcuts,
        helpCategory: `general`,
        permissionlevel: [`NODM`],
        briefHelp: ` - Lists your command shortcuts.`,
        longHelp: ` - 
Lists your command shortcuts.`
    });
};

async function addusershortcut(message, shortcut) {
    const shortcutCount = await getShortcutsLength(message.author.id);
    if (shortcutCount >= MAX_SHORTCUTS) {
        await global.message.send(`TOOMANYSHORTCUT`, message.channel);
        return;
    }

    shortcut = shortcut.toLowerCase();

    if (await global.commands.getCommand(shortcut)) {
        await global.message.send(`ALREADYCOMMAND`, message.channel);
        return;
    }

    const currentShortcut = await getShortcut(message.author.id, shortcut);
    if (currentShortcut) {
        await global.message.send(`ALREADYSHORTCUT`, message.channel, shortcut);
        return;
    }

    const commandData = [].slice.call(arguments).splice(2); // Get the data to run the command

    await addShortcut(message.author.id, shortcut, commandData);

    await global.message.send(`ADDSHORTCUT`, message.channel, shortcut);
}

async function removeusershortcut(message, shortcut) {
    shortcut = shortcut.toLowerCase();

    const currentShortcut = await getShortcut(message.author.id, shortcut);
    if (!currentShortcut) {
        await global.message.send(`NOSHORTCUT`, message.channel, shortcut);
        return;
    }

    await removeShortcut(message.author.id, shortcut);

    await global.message.send(`REMOVESHORTCUT`, message.channel, shortcut);
}

async function listusershortcuts(message) {
    const shortcuts = await getShortcuts(message.author.id);

    await global.message.send(`LISTSHORTCUTS`, message.channel, shortcuts);
}

async function addshortcut(message, shortcut) {
    const shortcutCount = await getShortcutsLength(message.guild.id);
    if (shortcutCount >= MAX_SHORTCUTS) {
        await global.message.send(`TOOMANYSHORTCUT`, message.channel);
        return;
    }

    shortcut = shortcut.toLowerCase();

    if (await global.commands.getCommand(shortcut)) {
        await global.message.send(`ALREADYCOMMAND`, message.channel);
        return;
    }

    const currentShortcut = await getShortcut(message.guild.id, shortcut);
    if (currentShortcut) {
        await global.message.send(`ALREADYSHORTCUT`, message.channel, shortcut);
        return;
    }

    const commandData = [].slice.call(arguments).splice(2); // Get the data to run the command

    await addShortcut(message.guild.id, shortcut, commandData);

    await global.message.send(`ADDSHORTCUT`, message.channel, shortcut);
}

async function removeshortcut(message, shortcut) {
    shortcut = shortcut.toLowerCase();

    const currentShortcut = await getShortcut(message.guild.id, shortcut);
    if (!currentShortcut) {
        await global.message.send(`NOSHORTCUT`, message.channel, shortcut);
        return;
    }

    await removeShortcut(message.guild.id, shortcut);

    await global.message.send(`REMOVESHORTCUT`, message.channel, shortcut);
}

async function listshortcuts(message) {
    const shortcuts = await getShortcuts(message.guild.id);

    await global.message.send(`LISTSHORTCUTS`, message.channel, shortcuts);
}

async function checkForShortcut(event) {
    if (event[0] === `command`) {

        const contentsArray = event[1];
        const message = event[2];

        const userShortcuts = await getShortcuts(message.author.id);
        let shortCommand = userShortcuts[contentsArray[0]];
        if (shortCommand) {

            contentsArray.shift(); // Remove command from argument list
            shortCommand.push.apply(shortCommand, ...contentsArray);
            event[1] = [].slice.call(shortCommand); // Overwrite event and send modified event

            return event;
        }

        if (message.guild) {

            const guildShortcuts = await getShortcuts(message.guild.id);
            shortCommand = guildShortcuts[contentsArray[0]];
            if (shortCommand) {

                contentsArray.shift(); // Remove command from argument list
                shortCommand.push.apply(shortCommand, ...contentsArray);
                event[1] = [].slice.call(shortCommand); // Overwrite event and send modified event

                return event;
            }
        }
    }

    return event;
}

async function getShortcuts(id) {
    await shortcutStorage.setDefault(id, {});
    return await shortcutStorage.get(id);
}

async function getShortcutsLength(id) {
    await shortcutStorage.setDefault(id, {});
    return Object.keys((await shortcutStorage.get(id))).length;
}

async function addShortcut(id, shortcut, commandData) {
    await shortcutStorage.setDefault(id, {});
    await shortcutStorage.update(id, async shortcuts => {
        shortcuts[shortcut] = commandData;
    });
}

async function removeShortcut(id, shortcut) {
    await shortcutStorage.setDefault(id, {});
    await shortcutStorage.update(id, async shortcuts => {
        delete shortcuts[shortcut];
    });
}

async function getShortcut(id, shortcut) {
    await shortcutStorage.setDefault(id, {});
    return (await shortcutStorage.get(id))[shortcut];
}