"use strict";

/** Permission levels:
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

const moment = require(`moment`);

// module.exports.init = async function() {
//     const pingStorage = await global.storage.getDatabase(`ping`);
//     await global.commands.registerCommand(`ping`, {run: async function(message, randstring, member) {
//         let pingCount = await pingStorage.get(message.guild.id) || 0;
//         await global.message.send(`PING`, message.channel, pingCount);
//         pingCount++;

//         console.log(`Ping Fire: ` + message.flags.fire);

//         console.log(randstring);
//         await pingStorage.set(message.guild.id, pingCount);
//     }, permissionlevel: [`ADMIN`], reqParameters: undefined, channelRatelimit: [2, 5000], potentialFlags: [[`-fire`, `MEMBER`]],
//     helpCategory: `general`, briefHelp: ` {command} - Lists commands and provides information for a command`, longHelp: ` {command} -
//     Lists all commands and a brief piece of information about them, it can also provide more in-depth information on a command that is specified.`});


//     await global.message.registerMessage(`PING`,  count => `Ping! Count: ${count}`);
// };

let pingStorage;

module.exports.init = async function() {
    pingStorage = await global.storage.getDatabase(`ping`);
    await global.commands.registerCommand(`ping`, {
        run: ping,
        helpCategory: `general`,
        briefHelp: ` - Check to see if Ajax is online.`,
        longHelp: ` - 
Check to see if Ajax is online.`});
};

async function ping(message) {
    let pingCount = await pingStorage.get(0) || 0;
    pingCount++;
    await pingStorage.set(0, pingCount);

    const currentTime = parseInt(moment().format(`x`));
    const pingMessage = await message.channel.send(`Pong!`);
    const timeElapsed = parseInt(moment().format(`x`)) - currentTime;
    await pingMessage.edit(`Pong! \`${timeElapsed} ms\``);
}