'use strict';

module.exports.init = async function() {
    await global.commands.registerCommand(`speak`, {
        run: s,
        permissionlevel: `OWNER`,
        reqParameters:[`SNOWFLAKEID`]
    });
};

async function s(message, snowflake, text) {
    const channel = await message.client.channels.fetch(snowflake);
    if (channel) {
        channel.send(text); // Ignore all post message processing
    } else {
        global.message.send(`SNOCHANNEL`, message.channel);
    }
}