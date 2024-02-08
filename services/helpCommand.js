"use strict";

/** Help info:
 * commandObj.briefHelp - Help that shows up with no extra info specified
 * commandObj.longHelp - Help that shows up with extra info specified
 * commandObj.helpCategory - Category it appears under
 */

const discordUtil = require(`../util/discordUtil.js`);
const stringUtil = require(`../util/stringUtil.js`);

let prefixStorage;

module.exports.init = async function() {
    prefixStorage = await global.storage.getDatabase(`prefix`); /// doin this

    await global.commands.registerCommand(`help`, {
        run: help,
        helpCategory: `general`,
        briefHelp: ` - Lists some helpful information about Ajax.`,
        longHelp: ` - 
Lists some helpful information about Ajax.`});

    await global.commands.registerCommand(`link`, {
        run: link,
        helpCategory: `general`,
        briefHelp: ` - Gives you a link so you can add Ajax to your server.`,
        longHelp: ` - 
Gives you a link so you can add Ajax to your server.`});

    await global.commands.registerCommand(`commands`, {
        run: commandsCommand,
        helpCategory: `general`,
        briefHelp: ` {command} - Lists commands and provides information for a command`,
        longHelp: ` {command} - 
Lists all commands and a brief piece of information about them, it can also provide more in-depth information on a command that is specified.`});
};

async function link(message) {
    await global.message.send(`LINK`, message.channel);
}

async function help(message) {
    const guildPrefix = await prefixStorage.get(message.guild.id);
    await global.message.send(`HELPMESSAGE`, message.channel, guildPrefix || `;;`);
}

async function commandsCommand(message, detailCommand) {
    let helpMessage = `Run ;;help for general info, ;;commands for a list of commands, and ;;commands {command name} for specific info on a command
   
Note: The ;;loud command has been changed a bit. You have to run ;;play -loud in order to loud songs now. For a full list of options, run ;;commands play.\n    `;

    if (!detailCommand) { // Command wasn't specified, give list of every command
        helpMessage += `Commands: \n`;

        const commands = await global.commands.getCommands();
        const categorizedCommands = {};

        for (var commandName in commands) {
            const commandObj = commands[commandName];

            if (commandObj.helpCategory) {

                categorizedCommands[commandObj.helpCategory] = categorizedCommands[commandObj.helpCategory] || {};
                categorizedCommands[commandObj.helpCategory][commandName] = commandObj;
            }
        }

        for (var category in categorizedCommands) {
            helpMessage += `\n${await stringUtil.capitalizeFirstLetter(category)}:`;

            const categoryObj = categorizedCommands[category];
            for (var command in categoryObj) {
                const commandObj = categoryObj[command];

                if (commandObj.briefHelp) { // Adds command only if it has the help
                    helpMessage += `\n\t${command}`;
                    helpMessage += commandObj.briefHelp;
                }
            }
        }
    } else {
        const commandObj = await global.commands.getCommand(detailCommand);
        if (!commandObj) {
            global.message.send(`COMMANDNOTFOUND`, message.channel, detailCommand);
            return;
        }

        if (!commandObj.helpCategory) { // They shouldn't know about this command
            global.message.send(`COMMANDNOTFOUND`, message.channel, detailCommand);
            return;
        }

        helpMessage += `${detailCommand.toLowerCase() + commandObj.longHelp || commandObj.briefHelp}`;
    }

    helpMessage = `\`\`\`${helpMessage}\`\`\``;

    const err = await discordUtil.sendDM(message.author, helpMessage, {"split" : {"prepend" : `\`\`\``, "append" : `\`\`\``}});
    if (typeof err === `object`) {
        global.message.send(`DMERR`, message.channel);
    } else {
        if (message.channel.guild) {
            global.message.send(`CHECKDM`, message.channel);
        }
    }
}
