'use strict';

const discordUtil = require(`../util/discordUtil.js`);

module.exports.init = async function() {
    await global.allClientEvents.addListener(3, onGuildAdd);
};

const guildAddMessage = `Hiya! Thanks for adding Ajax to your server!
For a list of commands run \`;;commands\` and for a some general information run ;;help

But if you want to get started right away here are some commands you could try out:
\`;;play -loud [song_name]\` - This will play a youtube video at 5,000% volume.
\`;;play -madness 55 smash mouth all star\` - Madness increases the volume by 5,000% after an elapsed time.
\`;;m [subreddit]\` - Get a post from a specified subreddit.
\`;;genisland\` - Generates an island

There's a lot more commands to try out, so be sure to read what's in \`;;commands\`
If you want to donate, visit my patreon (http://patreon.com/ajaxbot) or if you want help with Ajax or just want to hang out join Ajax's server (https://discord.gg/yGVGasg)`;

async function onGuildAdd(event) {
    if (event[0] === `guildCreate`) {
        const guild = event[1];
        const defaultChannel = await discordUtil.getDefaultChannel(guild);
        if (defaultChannel) {
            defaultChannel.send(guildAddMessage);
        } else {
            discordUtil.sendDM(guild.owner, guildAddMessage);
        }
    }

    return event;
}