"use strict";

const token = require(`./config/token.js`);

const { ShardingManager } = require(`discord.js`);

let manager;
if (process.argv[2] === `inspect`) {
    console.log(`Debug mode on`);
    manager = new ShardingManager(`./bot.js`, { token: token.discordToken, execArgv: [`--inspect`]});
} else {
    manager = new ShardingManager(`./bot.js`, { token: token.discordToken, timeout: 9999999 });
}

manager.spawn();
manager.on(`launch`, shard => console.log(`Launched shard ${shard.ids}`));
