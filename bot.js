"use strict";

const Discord = require(`discord.js`);
const client = global.client = new Discord.Client();
const fs = require(`fs`);
const path = require(`path`);
const PrioritizedEventHandler = require(`./util/prioritizedEventHandler.js`);

const token = require(`./config/token.js`);

const DBL = require(`dblapi.js`);

const logger = require(`./systems/logger.js`);
const commandProcessor = global.commands = require(`./systems/commandProcessor.js`);
const messageProcessor = global.message = require(`./systems/messageProcessor.js`);
const storage = global.storage = require(`./systems/storage.js`);

const isWin = process.platform === "win32";

const clientEventList = [`message`, `guildMemberAdd`, `guildMemberRemove`, `guildBanAdd`, `guildMemberUpdate`, `messageUpdate`, `messageDelete`, `channelUpdate`, `guildUpdate`, `guildBanRemove`, `guildCreate`, `voiceStateUpdate`];

/** Available APIs:
 *
 * Logging:
 * console.log(message)
 * console.warn(message, err)
 * console.severe(message, err)
 * console.debug(object)
 *
 * Client:
 * global.client - Discord client
 * global.allClientEvents - All client events (clientEventList are the events that get processed)
 * async function eventListener(["eventname", eventObject])
 *
 * Command:
 * global.commands - Command Processor
 * global.commands.registerCommand(name, async function command(message, ...parameters)) - Registers command
 * global.commands.unregistercommand(name)
 * global.commands.getCommands() - Returns an array of all commands
 * global.commands.getDictionaryInput() - Gets prioritizedEventHandler that goes from the interpreter to the dictionary
 * async function eventListener(["command", [message content split up into array], message object])
 * global.commands.getExecutorInput() - Gets prioritizedEventHandler that goes from dictionary to executor
 * async function eventListener(["command", {command object}, [message content split up into array], message object])
 *
 * Message:
 * global.message - Message processor
 * global.message.send(key, channel, args) - Sends message with key given the args
 * global.message.registerMessage(key, message) - Registers message with message, key can be function or string
 * global.message.unregisterMessage(key)
 * global.message.getDictionaryInput() - Gets prioritizedEventHandler that goes from the API to the dictionary
 * async function eventListener(["message", ["KEY", channel object, parameters]])
 *
 * Storage:
 * global.storage - Stores data that can be saved on bot restart
 * global.storage.getDatabase(database) - Gets database with key
 * global.storage.save() - Saves databases to MongoDB
 * global.storage.load() - Loads databases from MongoDB
 * Database.get(key) - Gets data
 * Database.set(key, data) - Sets data
 * Database.setDefault(key, data) - Sets data but wont override
 * Database.reset() - Clears all data
 *
 * prioritizedEventHandler.addListener(priority, async function listener(eventdata))
     * priority - Priority that decides when this listener recieves the event (Higher priorities get executed first)
     * listener - Function that processes event
     * returns null - Deletes event
     * returns false - Deletes event and listener
     * returns anything else - Passed on as new event data
 */

/** Parameter requirements .reqParameters
 * STRING - Anything
 * ID - Correctly formatted snowflake id
 * MEMBER - Member of guild
 * USER - User
 * NUMBER - Parseable number
 * EMOJI - Valid custom emoji, returns emoji id
 */

/** User status requirements .reqStatus
  * INVC - User is in a voice channel
  */

/** Permission levels .permissionlevel:
  * SERVEROWNER - Only owner of server can run
    SERVERADMIN - Server Admins
    SERVERMANAGER - Manage channels permission
    SERVERMOD - Manage messages permission
    KICK - Kick members permission
    BAN - Ban members permission
    BOTADMIN - Server admin or has "ajax admin" role
    BOTMOD - Server mod or server admin or has "ajax mod" role
    OWNER - Bot owner
    ADMIN - Admins registered by owner
  */

/** Ratelimit Types (all in milliseconds):
  * .channelRatelimit - Checks channel id
  * .userRatelimit - Checks user id
  */

/** Flags handler .potentialFlags
 * Put an array of flags to be detected - Ex: ["-help", "-loud"]
 * Detected flags are put in message.flags - Ex: message.flags = {help: true, loud: true}
 * Put an array of flags to be detected with resolvables - Ex: ["-help", ["-loud", `NUMBER`]] // TODO actually make this work
 * Detected flags are put in message.flags - Ex: message.flags = {help: true, loud: 45}
 */

/** global.discordBotsClient
 * Contains discord bot list object
 */

(async function () {
    // Initialize global systems here
    await logger.init();
    console.log(`Logger initialized`);
    await commandProcessor.init();
    console.log(`Command processor initialized`);
    await messageProcessor.init();
    console.log(`Message processor initialized`);
    await storage.init();
    console.log(`Storage initialized`);

    const masterEventHandler = global.allClientEvents = new PrioritizedEventHandler(commandProcessor); // Hooks up the client to the event listener

    await new Promise(async (resolve, reject) => {
        client.on(`ready`, async function() {
            console.log(`Logged into Discord as ${client.user.username}`);

            resolve();
        });

        client.login(token.discordToken);
    });


    masterEventHandler.addListener(0, async (event) => { // Ignore all messages made by the bot itself
        if (event[0] === `message` && event[1].author.id === client.user.id) {
            return null;
        }

        return event;
    });

    const dbl = global.discordBotsClient = new DBL(token.discordBots2Token, global.client);

    const servicesPath = path.join(__dirname, `services`);

    const services = fs.readdirSync(servicesPath);
    for (var i in services) {
        const file = services[i];
        if (isWin && file.includes(`WE`)) // Don't load files with "WE" in the name if on Windows
            continue;

        try {
            await require(`./services/${file}`).init();
            console.log(`Loaded ./services/${file}`);
        } catch (err) {
            console.warn(`Error loading ./services/${file}`, err);
        }
    }

    await masterEventHandler.addEventEmitter(client, clientEventList);
    console.log(`Eventhandler initialized.`);

    if (client.shard.count == client.shard.ids + 1) {
        console.log(`Last shard loaded.`);
    }
})();
