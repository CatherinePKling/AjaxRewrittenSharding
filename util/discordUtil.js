// Various functions that act as extensions to regular discord.js objects

"use strict";

const NodeCache = require( `node-cache` );
const shardCache = new NodeCache({ stdTTL: 100, checkperiod: 0 });

const emojiRegex = /<a?:\S{1,}:(\d{17,20})>/;
const memberRegex = /<@!?(\d{17,20})>/;
const channelRegex = /<#(\d{17,20})>/;

module.exports.getUserCountSharding = async function () {
    let userCount = shardCache.get(`userCount`);
    if (userCount) {
        return userCount;
    } else {
        userCount = (await global.client.shard.broadcastEval(function() {
            let userCount = 0;

            const guilds = Array.from(global.client.guilds.values());
            for (const k in guilds) {
                if (guilds[k] && guilds[k].members) {
                    userCount += guilds[k].members.cache.size;
                }
            }

            return userCount;
        })).reduce((a, b) => a + b);
        shardCache.set(`userCount`, userCount);
    }

    return userCount;
};

module.exports.getGuildCountSharding = async function () {
    let guildCount = shardCache.get(`guildCount`);
    if (guildCount) {
        return guildCount;
    } else {
        guildCount = (await global.client.shard.fetchClientValues(`guilds.cache.size`)).reduce((a, b) => a + b);
        shardCache.set(`guildCount`, guildCount);
    }

    return guildCount;
};

module.exports.getDefaultChannel = async function (guild) {
    const messageableChannels = [];

    for (const [snowflake, channel] of guild.channels) {
        if (channel.permissionsFor(guild.me).has(`SEND_MESSAGES`)) {
            messageableChannels.push(channel);
        }
    }

    if (messageableChannels && messageableChannels.length > 0) {
        return messageableChannels[0];
    }
};

module.exports.resolveEmojiId = async function (resolvable) { // Change this and the one in parameterhandler to resolve just the emoji id and return it
    const result = emojiRegex.exec(resolvable);

    if (!result) {
        return;
    }

    return result[1];
};

module.exports.resolveEmojis = async function (resolvable) { // Resolve emojis in a string and output array with string seperated and resolved emojis inbetween
    const result = resolvable.replace(/></g, `> <`).split(emojiRegex); // The emojis have to be spread out with a space or else not all of them will be captured
    return result;
};

module.exports.getEmojiUrl = id => `https://cdn.discordapp.com/emojis/${id}.png`;

module.exports.getName = function(member) {
    return member.nickname || member.user.username;
};

module.exports.resolveChannel = async function(channelResolvable, guild) {
    if (!(guild && channelResolvable))
        return null;

    const result = channelRegex.exec(channelResolvable);
    if (result && result[1]) {
        return guild.channels.resolve(result[1]);
    }

    let channel = guild.channels.resolve(channelResolvable);
    if (channel) {
        return channel;
    }
    channelResolvable = channelResolvable.toLowerCase();
    channel = guild.channels.find(channel => channel.name.toLowerCase() === channelResolvable);
    if (channel) {
        return channel;
    } else {
        return null;
    }
};

module.exports.resolveMember = async function(memberResolvable, guild) {
    if (!(guild && memberResolvable))
        return null;

    const result = memberRegex.exec(memberResolvable);
    if (result && result[1]) {
        return guild.members.resolve(result[1]);
    }

    let member = guild.members.resolve(memberResolvable);
    if (member) {
        return member;
    }
    memberResolvable = memberResolvable.toLowerCase();
    member = guild.members.cache.find(member =>
        (member.user.username.toLowerCase() === memberResolvable) ||
        (member.nickname && member.nickname.toLowerCase() === memberResolvable)
    );

    if (member) {
        return member;
    } else {
        member = guild.members.cache.find(member =>
            (member.user.username.toLowerCase().includes(memberResolvable)) ||
            (member.nickname && (member.nickname.toLowerCase().includes(memberResolvable)))
        );
        if (member) {
            return member;
        } else {

            return null;
        }
    }
};

const snowflakeIdRegex = /\d{17,20}/g;

module.exports.isSnowflakeId = async function(userID) {
    return Boolean(userID.match(snowflakeIdRegex));
};

module.exports.sendDM = async function (user, message, options) {
    const dm = user.dmChannel || await user.createDM();
    try {
        await dm.send(message, options);
    } catch (err) {
        return err;
    }

    return true;
};

module.exports.getVoiceConnection = async function getVoiceConnection(message) {

    const voiceConnection = global.client.voice.connections.find(connection => connection.channel.guild.id == message.guild.id);

    if (voiceConnection) {
        return voiceConnection;
    }

    const voiceChannel = message.member.voice.channel;

    if (voiceChannel) {

        try {

            return await voiceChannel.join();
        } catch (err) {

            console.warn(`Couldn't join voice channel.`, err);
            return;
        }
    }

    return;
};

// function levenshteinDistance(s, t, len_s = s.length, len_t = t.length) {
//     let cost;

//     /* base case: empty strings */
//     if (len_s === 0) return len_t;
//     if (len_t === 0) return len_s;

//     /* test if last characters of the strings match */
//     if (s[len_s - 1] === t[len_t - 1])
//         cost = 0;
//     else
//         cost = 1;

//     /* return minimum of delete char from s, delete char from t, and delete char from both */
//     return Math.min(levenshteinDistance(s, t, len_s - 1, len_t    ) + 1,
//         levenshteinDistance(s, t, len_s    , len_t - 1) + 1,
//         levenshteinDistance(s, t, len_s - 1, len_t - 1) + cost);
// }