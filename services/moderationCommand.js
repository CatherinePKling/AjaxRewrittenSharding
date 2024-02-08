'use strict';

const fs = require(`fs`);

module.exports.init = async function () {
    await global.commands.registerCommand(`hackban`, {
        run: hackban,
        permissionlevel: `BAN`,
        reqParameters: [`SNOWFLAKEID`],
        briefHelp: ` [userid] - Bans a user given their id. If the user is not on this server it will prevent them from joining the server.`,
        helpCategory: `admin`,
        longHelp: ` [userid] -
Bans a user given their id. If the user is not on this server it will prevent them from joining the server. Hackbans are revoked in the same way that regular bans are.`
    });

    await global.commands.registerCommand(`archive`, {
        run: archive,
        permissionlevel: `SERVEROWNER`,
        potentialFlags: [[`-limit`, `NUMBER`]],
        helpCategory: `admin`,
        briefHelp: ` - Archives all the messages sent in this channel (up to 5 million) into a text file. (NOTE: This takes a VERY long time depending on how many messages were sent in the channel)`,
        longHelp: ` -
Archives all the messages sent in this channel (up to 5 million) into a text file. (NOTE: This takes a VERY long time depending on how many messages were sent in the channel)
Possible flags:
-limit [amount] - If this flag is set then the command will stop once it has reached amount messages`
    });

    await global.commands.registerCommand(`purge`, {
        run: purge,
        permissionlevel: `SERVERMOD`,
        reqParameters: [`NUMBER`],
        helpCategory: `admin`,
        briefHelp: ` [amount] - Deletes most recent messages sent in this channel up to a certain amount.`,
        longHelp: ` [amount] -
Deletes most recent messages sent in this channel up to a certain amount. (Note: This command has no output and deletes the message that called it)`
    });
};

async function purge(message, amount) {
    if (amount < 1 || amount > 100) {
        await global.message.send(`INVLDPURGEAMOUNT`, message.channel);
        return;
    }
    await message.channel.bulkDelete(amount);
}

async function hackban(message, id) {
    const member = message.guild.members.resolve(id);
    if (member) {
        global.message.send(`MEMBEREXISTS`, message.channel, member);
        return;
    }

    try {
        await message.guild.members.ban(id);
        global.message.send(`HACKBAN`, message.channel, id);
    } catch (e) {
        global.message.send(`NOHACKBAN`, message.channel, id);
    }
}

async function archive(message) {
    if (message.flags.limit !== undefined && (message.flags.limit < 1 || message.flags.limit > 5000000)) {
        await global.message.send(`INVLDARCHIVELIMIT`, message.channel);
    }

    await global.message.send(`ARCHIVESTART`, message.channel);

    const filename = `${message.id}.txt`;
    const inputFileStream = fs.createWriteStream(filename);

    const totalMessages = await writeMessages(inputFileStream, message.id, message.channel, message.flags.limit);

    await new Promise((resolve, reject) => { // Wait one second to make sure the file gets saved
        setTimeout(resolve, 1000);
    });

    await global.message.send(`ARCHIVE`, message.channel, totalMessages, filename);

    await new Promise((resolve, reject) => { // Wait one second to make sure the file gets uploaded
        setTimeout(resolve, 1000);
    });

    fs.unlinkSync(filename);
}

async function writeMessages(inputStream, before, channel, amount = 5000000, totalMessages = 0) {
    let messages = await channel.messages.fetch({"before" : before, "limit" : amount > 100 ? 100 : amount});
    amount -= 100;
    messages = Array.from(messages);
    for (var message of messages) {
        inputStream.write(`${new Date(message[1].createdTimestamp).toString()} <${message[1].author.username}> ${message[1].content}\r\n`);
    }
    if (messages.length < 100 || amount < 1) { // Finished getting all messages
        return totalMessages + messages.length;
    } else {
        totalMessages += 100;
        return await writeMessages(inputStream, messages[messages.length - 1][1].id, channel, amount, totalMessages);
    }
}
