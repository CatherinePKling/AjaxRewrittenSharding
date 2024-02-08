'use strict';

let dictionaryInput;

module.exports.init = async function() {
    dictionaryInput = await global.commands.getDictionaryInput();

    await global.commands.registerCommand(`repeat`, {
        run: repeat,
        reqParameters: [`NUMBER`, `WORD`],
        helpCategory: `general`,
        potentialFlags: [`-nowait`],
        briefHelp: ` [amount] [command] - Repeats a command up to 10 times, accounting for command ratelimits.`,
        longHelp: ` [amount] [command] - 
Repeats a command up to 10 times, accounting for ratelimits.
Potential flags:
-nowait - This will ignore command ratelimits and attempt to run them all instantly. (This is a bad idea to run on commands with ratelimits)`
    });
};

async function repeat(message, amount, command) {
    command = command.toLowerCase();
    if (command === `repeat`) {
        await global.message.send(`NO`, message.channel);
        return;
    }

    if (amount <= 1 || amount >= 11) {
        await global.message.send(`INVALIDAMOUNT`, message.channel);
        return;
    }

    const commandObj = await global.commands.getCommand(command);
    if (!commandObj) {

        await global.message.send(`NOCOMMAND`, message.channel, command);
        return;
    }

    const rawCommand = [].slice.call(arguments).splice(2);

    if (!message.flags.nowait) { // [amount, milliseconds] // TODO check for more ratelimits as you add more
        let waitTime = Math.max(commandObj.channelRatelimit ? commandObj.channelRatelimit[1] / commandObj.channelRatelimit[0] : 0, commandObj.userRatelimit ? commandObj.userRatelimit[1] / commandObj.userRatelimit[0] : 0);
        waitTime += 100; // To make sure it doesn't ratelimit
        var i = 0;

        const repeater = setInterval(() => {

            dictionaryInput.emit.call(dictionaryInput, `command`, Array.from(rawCommand), message);

            if ((++i) >= amount)  {
                clearInterval(repeater);
            }
        }, waitTime);
    } else {
        for (i = 0; i < amount; i++) {
            dictionaryInput.emit.call(dictionaryInput, `command`, rawCommand, message);
        }
    }
}