'use strict';

let autoReactionStorage;

module.exports.init = async function() {
    autoReactionStorage = await global.storage.getDatabase(`autoreaction`);

    await global.commands.registerCommand(`toggleautoreactions`, {
        run: toggleautoreactions,
        permissionlevel: [`BOTMOD`, `SERVERMANAGER`],
        helpCategory: `admin`,
        briefHelp: ` - Toggles autoreactions such as automatically responding to nice with ™.`,
        longHelp: ` - 
Toggles autoreactions such as automatically responding to nice with ™.`
    });

    await global.allClientEvents.addListener(2, react);
};

const isNice = /[n]n*[i]i*[c]c*[e]e*/;

async function toggleautoreactions(message) {

    await autoReactionStorage.setDefault(message.guild.id, true);

    let result = await autoReactionStorage.get(message.guild.id);

    result = !result;

    await autoReactionStorage.set(message.guild.id, result);

    if (result) {

        await global.message.send(`AUTOREACTIONON`, message.channel);
    } else {

        await global.message.send(`AUTOREACTIONOFF`, message.channel);
    }
}

async function react(event) {
    if (event[0] === `message`) {
        const message = event[1];


        if (message.guild) {

            await autoReactionStorage.setDefault(message.guild.id, true);

            const on = await autoReactionStorage.get(message.guild.id);

            if (!on) {
                return event;
            }
        }

        const content = message.content.toLowerCase();
        if (content.indexOf(`™`) > -1) {
            message.react(`🇳`).then(async () => {
                await message.react(`🇮`);
                await message.react(`🇨`);
                await message.react(`🇪`);
            });
        } else if (content === `deja vu?`) {
            message.react(`🇩`).then(async () => {
                await message.react(`🇷`);
                await message.react(`🇮`);
                await message.react(`🇫`);
                await message.react(`🇹`);
            });
        } else if (isNice.test(content) && content.indexOf(` `) === -1) {
            message.react(`™`);
        } else if (content === `🤙`) {
            message.react(`🤙`);
        }
    }

    return event;
}