"use strict";

const stringUtil = require(`../util/stringUtil.js`);

const driftList = require(`../config/drift.js`);
const woahList = require(`../config/woah.js`);

const Discord = require(`discord.js`);

module.exports.init = async function() {
    // ratelimitHandler.js
    await global.message.registerMessage(`RATELIMIT`, ratelimit => `You are sending this command too fast. Please wait \`${Math.ceil(ratelimit / 1000)}\` second(s).`);

    // parameterHandler.js
    await global.message.registerMessage(`MISSPARAMS`, `Missing parameters.`);
    await global.message.registerMessage(`INVALIDPARAMS`, params => `Invalid parameters, need: \`${params.join(`, `)}\``);
    await global.message.registerMessage(`JOINVC`, `Please join a voice channel`);
    await global.message.registerMessage(`INVALIDFLAGS`, (flag, keys) => `Invalid option for flag ${flag}, need: \`${keys.join(`, `)}\``);

    // permissionHandler.js
    await global.message.registerMessage(`ADDADMIN`, admin => `Added ${admin} as bot admin`);
    await global.message.registerMessage(`REMOVEADMIN`, admin => `Removed bot admin from guild with id ${admin}`);
    await global.message.registerMessage(`NOMEMBER`, `Member not found`); // Also used by avatarCommand.js
    await global.message.registerMessage(`ADMINNOTFOUND`, `No admin found`);
    await global.message.registerMessage(`NODM`, `This command cannot be used in DM channels`);
    await global.message.registerMessage(`MULTIPERMS`, permission => `You need one of these permisions: \`${permission.join(`, `)}\` to run this command`);
    await global.message.registerMessage(`PERM`, permission => `You need the \`${permission}\` permission to run this command`);

    // botbanHandler.js
    await global.message.registerMessage(`SERVERBAN`, serverid => `Server \`${serverid}\` has been botbanned`);
    await global.message.registerMessage(`SERVERNOTFOUND`, `Server not botbanned`);
    await global.message.registerMessage(`SERVERUNBAN`, serverid => `Server \`${serverid}\` has been unbotbanned`);
    await global.message.registerMessage(`USERBAN`, id => `User \`${id}\` has been userbanned`);
    await global.message.registerMessage(`USERNOTFOUND`, `User not found`);
    await global.message.registerMessage(`USERUNBAN`, id => `User \`${id}\` has been unuserbanned`);

    // helpCommand.js
    await global.message.registerMessage(`COMMANDNOTFOUND`, command => `Cannot find command \`${command}\``);
    await global.message.registerMessage(`DMERR`, `Please allow me to send DMs to you`);
    await global.message.registerMessage(`CHECKDM`, (Math.random() < 0.99) ? `Check your DMs` : `Check your DMs \`;]\``);
    await global.message.registerMessage(`HELPMESSAGE`, prefix => `For a list of commands run \`${prefix}commands\`
If you want to donate be sure to visit my patreon at http://patreon.com/ajaxbot or if you need help with Ajax or just want to chat and talk about nerd stuff join my server at https://discord.gg/yGVGasg
You can also vote for Ajax here every 24 hours to have your user ratelimits cut in half: https://discordbots.org/bot/318558676241874945/vote`);
    await global.message.registerMessage(`link`, `Here's a link to add Ajax to your server!
https://discordapp.com/oauth2/authorize?client_id=318558676241874945&scope=bot&permissions=3533888`);

    // musicCommand.js
    await global.message.registerMessage(`INVLDMDNESS`, `Invalid madness time specified, please input a number`);
    await global.message.registerMessage(`ERRJOINVC`, `Cannot join your voicechannel, check the permissions`); // voiceRecognitionCommands.js
    await global.message.registerMessage(`INVLDSEARCH`, `Invalid search query`);
    await global.message.registerMessage(`ADDSONG`, info => `\`${stringUtil.removeMentions(info.title)}${info.duration ? ` (${stringUtil.formatMillisecondsHHMMSS(info.duration)})` : ``}\` was added to the queue.`);
    await global.message.registerMessage(`NOMUSIC`, `I am not playing a song`);
    await global.message.registerMessage(`SKIP`, amount => amount === 1 ? `Song successfully skipped` : `${amount} songs successfully skipped.`);
    await global.message.registerMessage(`NOSKIP`, `You don't have permission to skip this song`);
    await global.message.registerMessage(`NOQUEUE`, `The queue is empty`);
    await global.message.registerMessage(`NOLEAVE`, `You don't have permission to disconnect the bot`);
    await global.message.registerMessage(`LEAVE`, `Voicechannel successfully left`);
    await global.message.registerMessage(`TOGGLE`, status => `Music ${status ? `paused` : `resumed`}`);
    await global.message.registerMessage(`TOGGLELOOP`, status => `Loop ${status ? `on` : `off`}`);
    await global.message.registerMessage(`DRIFT`, driftList.driftgif[Math.floor(Math.random() * driftList.driftgif.length)]);
    await global.message.registerMessage(`WOAH`, woahList.WOAHgif[Math.floor(Math.random() * woahList.WOAHgif.length)]);
    await global.message.registerMessage(`YTINFO`, (info) => {
        const youtubeUrl = `https://www.youtube.com/watch?v=${info.id}`;

        const embed = {
            "title": info.title,
            "description": stringUtil.truncateWithEllipsis(info.description, 3),
            "url": youtubeUrl,
            "color": 850964,
            "footer": {
                "icon_url": info.avatar,
                "text": `Queued by ${info.user}`
            },
            "thumbnail": {
                "url": info.thumbnail
            },
            "author": {
                "name": `Now Playing`,
                "url": youtubeUrl,
                "icon_url": `https://cdn.discordapp.com/avatars/318558676241874945/d7931fb13cd1300bbea7c181d18facc6.webp`
            },
            "fields": [
                {
                    "name": `${stringUtil.formatMillisecondsHHMMSS(info.timePlaying)} / ${stringUtil.formatMillisecondsHHMMSS(info.duration)}`,
                    "value": `${stringUtil.ballProgressBar(info.timePlaying / info.duration, 17)}
                Video by ${info.channel}`
                }
            ]
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`SCINFO`, (info) => {
        const embed = {
            "title": `${info.title}${info.genre ? `` : ` [${info.genre}]`}`,
            "description": stringUtil.truncateWithEllipsis(info.description, 3),
            "url": info.url,
            "color": 850964,
            "footer": {
                "icon_url": info.avatar,
                "text": `Queued by ${info.user}`
            },
            "thumbnail": {
                "url": info.artwork
            },
            "author": {
                "name": `Now Playing`,
                "url": info.url,
                "icon_url": `https://cdn.discordapp.com/avatars/318558676241874945/d7931fb13cd1300bbea7c181d18facc6.webp`
            },
            "fields": [
                {
                    "name": `${stringUtil.formatMillisecondsHHMMSS(info.timePlaying)} / ${stringUtil.formatMillisecondsHHMMSS(info.duration)}`,
                    "value": `${stringUtil.ballProgressBar(info.timePlaying / info.duration, 17)}
                Track by ${info.creator}`
                }
            ]
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`ERRINFO`, `Error getting info`);

    // redditCommands.js
    await global.message.registerMessage(`REDDITPOST`, post => `\`${post.data.title}\`\n${post.data.url}`);
    await global.message.registerMessage(`NOSFW`, subreddit => `I could not find the SFW subreddit ${subreddit}`);
    await global.message.registerMessage(`NONSFW`, subreddit => `I could not find the subreddit ${subreddit}`);

    // prefixCommands.js
    await global.message.registerMessage(`INVALIDPREFIX`, `The prefix cannot contain spaces`);
    await global.message.registerMessage(`SETUSERPREFIX`, newPrefix => `Your prefix is now \`${newPrefix}\``);
    await global.message.registerMessage(`SETPREFIX`, newPrefix => `The server prefix is now \`${newPrefix}\``);
    await global.message.registerMessage(`RESETPREFIX`, `The prefix is now \`;;\``);
    await global.message.registerMessage(`PREFIXTOOLONG`, `The new prefix must not be longer than 5 characters`);

    // avatarCommands.js
    await global.message.registerMessage(`AVATAR`, (avatar, name) => `Here's ${name} avatar:
${avatar}`);
    await global.message.registerMessage(`IMAGE`, (buffer, filename) => new Discord.MessageAttachment(buffer, filename));
    await global.message.registerMessage(`IMAGEERR`, `There was an error downloading the image.`);
    await global.message.registerMessage(`PRIDERIGHTS`, (buffer, name, pride) => [`${(Math.random() >= 0.97) ? `Donkey Kong` : name} says ${pride} rights!`, new Discord.MessageAttachment(buffer, `pride.png`)]);
    await global.message.registerMessage(`PRIDELIST`, (list) => `Here's the current list of of pride flags: \`${list.join(`, `)}\``);
    await global.message.registerMessage(`INVLDFLAG`, `Sorry, I don't have a flag for that, DM TeeJ on the Ajax Public Server if you want a new pride flag added.`);

    // nitwTextCommand.js
    await global.message.registerMessage(`TOOLONG`, `Your message must be shorter than 500 characters`);
    await global.message.registerMessage(`NOEMOJI`, `Emoji not supported`);
    await global.message.registerMessage(`MAXLINES`, `Your message cannot exceed 8 lines`);
    await global.message.registerMessage(`INVLDCHR`, `Invalid character`);

    // welcomeMessageCommands.js
    await global.message.registerMessage(`WELCOMEMESSAGE`, (welcomeMessage, member) => welcomeMessage.replace(`{{name}}`, member));
    await global.message.registerMessage(`NEWWELCOMEMESSAGE`, (welcomeMessage) => `The welcome message is now: "${welcomeMessage}"`);
    await global.message.registerMessage(`REMOVEWELCOMEMESSAGE`, `The welcome message has been removed`);

    // oldMiscCommands.js
    await global.message.registerMessage(`OLDMAN`, whatever => `Get off my lawn! And take your ${whatever} with you!`);
    await global.message.registerMessage(`OWO`, text => text);
    await global.message.registerMessage(`ISLANDGENERATING`, `One island coming up!`);
    await global.message.registerMessage(`GENERROR`, `Error generating island.`);
    await global.message.registerMessage(`OWO`, text => text);
    await global.message.registerMessage(`ISLAND`, {files: [`map.jpg`]});
    await global.message.registerMessage(`OLDSOURCE`, `Here's the old source code for Ajax: https://github.com/cat/NiceTMDiscordBot`);

    // philosophyCommand.js
    await global.message.registerMessage(`PHILOSOPHY`, (pages, result) => {
        let messageToSend = `\`\`\``;
        for (var i in pages) {
            messageToSend += `\n${parseInt(i) + 1}. ${pages[i]}`;
        }

        switch (result) {
            case `LOOP`:
                messageToSend += `\nLoop detected. Ending iteration after ${pages.length} step(s). Philosophy not reached :(`;
                break;
            case `NONEWLINKS`:
                messageToSend += `\nNo new links found. Ending iteration after ${pages.length} step(s). Philosophy not reached :(`;
                break;
            case `PHILOSOPHY`:
                messageToSend += `\nWe reached philosophy in ${pages.length} step(s)!`;
                break;
            case `TOOBIG`:
                messageToSend += `\nStopping iteration after 100 steps because that's too big.`;
                break;
        }

        messageToSend += `\`\`\``;
        return [messageToSend, {"split" : {"prepend" : `\`\`\``, "append" : `\`\`\``}}];
    }); // {"split" : {"prepend" : `\`\`\``, "append" : `\`\`\``}
    await global.message.registerMessage(`STARTPHILOSOPHY`, startPage => `\`\`\`Starting at Wikipedia Page: ${startPage}\`\`\``);
    await global.message.registerMessage(`STARTPHILOSOPHY`, startPage => `\`\`\`Starting at Wikipedia Page: ${startPage}\`\`\``);
    await global.message.registerMessage(`ERRNORESULTS`, page => `\`\`\`No results found on Wikipedia for ${page}\`\`\``);
    await global.message.registerMessage(`INCEPTION`, `<:thinktrix:419537903782330368>`);
    await global.message.registerMessage(`ERRGETTINGPAGE`, `Error getting wikipedia page.`);

    // moderationCommands.js
    await global.message.registerMessage(`MEMBEREXISTS`, member => `That user is already a member of the server as ${member.user.tag}. Please ban them normally`);
    await global.message.registerMessage(`HACKBAN`, id => `Successfully banned user with id ${id}`);
    await global.message.registerMessage(`NOHACKBAN`, id => `Couldn't ban user with id ${id}. Please make sure the id is correct and that Ajax has the correct permissions`);
    await global.message.registerMessage(`ARCHIVE`, (messageAmount, filename) => {
        return {
            files: [filename],
            content: `Successfully archived ${messageAmount} messages.`
        };
    });
    await global.message.registerMessage(`ARCHIVESTART`, `Now archiving, Please wait, as this may take a while...`);
    await global.message.registerMessage(`INVLDARCHIVELIMIT`, `The limit must be greater than zero and less than 5 million.`);
    await global.message.registerMessage(`INVLDPURGEAMOUNT`, `Amount must be between 0 and 100`);  // musicCommands.js

    // shortcutCommands.js
    await global.message.registerMessage(`ALREADYSHORTCUT`, shortcut => `Shortcut ${shortcut} already exists. You'll need to remove it first with \`removeshortcut\``);
    await global.message.registerMessage(`ADDSHORTCUT`, shortcut => `Shortcut ${shortcut} successfully added`);
    await global.message.registerMessage(`NOSHORTCUT`, shortcut => `Shortcut ${shortcut} doesn't exist`);
    await global.message.registerMessage(`REMOVESHORTCUT`, shortcut => `Shortcut ${shortcut} successfully removed`);
    await global.message.registerMessage(`TOOMANYSHORTCUT`, `You can't have more than 5 shortcuts, please remove one first`);
    await global.message.registerMessage(`LISTSHORTCUTS`, shortcuts => {
        if (Object.keys(shortcuts).length === 0) {
            return `There are no shortcuts`;
        }

        let messageToSend = `\`\`\`Current shortcuts: `;
        let count = 0;
        for (var i in shortcuts) {
            messageToSend += `\n${count++}. ${i} - ${shortcuts[i].join(` `)}`;
        }

        messageToSend += `\`\`\``;
        return [messageToSend, {"split" : {"prepend" : `\`\`\``, "append" : `\`\`\``}}];
    });
    await global.message.registerMessage(`ALREADYCOMMAND`, `The name of the shortcut cannot be an already registered command.`);

    // toggleCommand.js
    await global.message.registerMessage(`DISABLEDALL`, `That command has been disabled on this server`);
    await global.message.registerMessage(`DISABLED`, `That command has been disabled in this channel`);
    await global.message.registerMessage(`NOTCOMMAND`, command => `Command \`${command}\` is not a valid command`);
    await global.message.registerMessage(`DISABLEDCOMMAND`, command => `Command \`${command}\` has been successfully disabled on all channels`);
    await global.message.registerMessage(`ENABLEDCOMMAND`, command => `Command \`${command}\` has been successfully enabled on all channels`);
    await global.message.registerMessage(`DISABLEDCOMMANDCHANNEL`, (command, channel) => `Command \`${command}\` has been successfully disabled in ${channel}`);
    await global.message.registerMessage(`ENABLEDCOMMANDCHANNEL`, (command, channel) => `Command \`${command}\` has been successfully enabled in ${channel}`);

    // repeatCommand.js
    await global.message.registerMessage(`INVALIDAMOUNT`, `The amount cannot be greater than 10`);
    await global.message.registerMessage(`NO`, `No.`);

    // autoresponseCommand.js
    await global.message.registerMessage(`INVALIDCHANCE`, `The chance must be between 0 and 100`);
    await global.message.registerMessage(`INVALIDREGEX`, `Trigger must be a valid regex`);
    await global.message.registerMessage(`ADDRESPONSE`, `Autoresponse added`);
    await global.message.registerMessage(`REMOVERESPONSE`, `Autoresponse removed`);
    await global.message.registerMessage(`RESPONSENOTFOUND`, `Autoresponse not found`);
    await global.message.registerMessage(`LISTRESPONSES`, responses => {
        if (responses.length === 0) {
            return `There are no autoresponses`;
        }

        let messageToSend = `\`\`\`Current autoresponses: `;
        for (var i in responses) {
            messageToSend += `\n${parseInt(i) + 1}. '${responses[i].trigger}' triggers '${responses[i].response}'`;
        }

        messageToSend += `\`\`\``;
        return [messageToSend, {"split" : {"prepend" : `\`\`\``, "append" : `\`\`\``}}];
    });
    await global.message.registerMessage(`AUTORESPONSE`, r => r);

    //loggingCommand.js
    await global.message.registerMessage(`GUILDMEMBERADDLOG`, (member) => {
        const embed = {
            "title": `Member ${member.user.tag} joined`,
            "color": 1295429, // Green
            "timestamp": (new Date()).getTime()
        };



        return [{embed: embed}];
    });
    await global.message.registerMessage(`GUILDMEMBERREMOVELOG`, (member) => {
        const embed = {
            "title": `Member ${member.user.tag} left or was kicked`,
            "color": 16734003, // Red
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`GUILDBANADDLOG`, (guild, user) => {
        const embed = {
            "title": `Member ${user.tag} was banned`,
            "color": 16734003,
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`GUILDBANREMOVELOG`, (guild, user) => {
        const embed = {
            "title": `Member ${user.tag} was unbanned`,
            "color": 1295429,
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`NICKNAMEUPDATELOG`, (memberOld, memberNew) => {
        const embed = {
            "title": `Member ${memberNew.user.tag} changed nickname`,
            "fields": [
                {
                    "name": `Old Nickname`,
                    "value": memberOld.nickname || memberOld.user.username
                },
                {
                    "name": `New Nickname`,
                    "value": memberNew.nickname || memberNew.user.username
                }
            ],
            "color": 3447003, // Blue
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`MESSAGEEDITLOG`, (messageOld, messageNew) => {
        const embed = {
            "title": `Message by ${messageNew.author.tag} edited in channel #${messageOld.channel.name}`,
            "fields": [
                {
                    "name": `Old Message`,
                    "value": messageOld.content
                },
                {
                    "name": `New message`,
                    "value": messageNew.content
                }
            ],
            "color": 3447003, // Blue
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`MESSAGEDELETELOG`, message => {
        const embed = {
            "title": `Message by ${message.author.tag} deleted in channel #${message.channel.name}`,
            "fields": [
                {
                    "name": `Message Content`,
                    "value": message.content
                }
            ],
            "color": 16734003,
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`CHANNELNAMELOG`, (channelOld, channelNew) => {
        const embed = {
            "title": `Channel Renamed`,
            "fields": [
                {
                    "name": `Old Name`,
                    "value": channelOld.name
                },
                {
                    "name": `New Name`,
                    "value": channelNew.name
                }
            ],
            "color": 3447003,
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`CHANNELTOPICLOG`, (channelOld, channelNew) => {
        const embed = {
            "title": `Channel #${channelNew.name} Topic Changed`,
            "fields": [
                {
                    "name": `Old Topic`,
                    "value": channelOld.topic || `Empty`
                },
                {
                    "name": `New Topic`,
                    "value": channelNew.topic || `Empty`
                }
            ],
            "color": 3447003,
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`GUILDNAMELOG`, (guildOld, guildNew) => {
        const embed = {
            "title": `Guild Name Changed`,
            "fields": [
                {
                    "name": `Old Name`,
                    "value": guildOld.name
                },
                {
                    "name": `New Name`,
                    "value": guildNew.name
                }
            ],
            "color": 3447003,
            "timestamp": (new Date()).getTime()
        };

        return [{embed: embed}];
    });

    await global.message.registerMessage(`NOLOGGING`, `Logging is not enabled on this server`);
    await global.message.registerMessage(`DISABLELOG`, `Disabled logging`);
    await global.message.registerMessage(`ENABLELOG`, channel => `Enabled logging in ${channel}`);

    // spamlimitCommand.js
    await global.message.registerMessage(`INVLDAMOUNTLIMIT`, `Amount and limit must be greater than zero`);
    await global.message.registerMessage(`SPAMLIMITSET`, channel => `Spamlimit set for channel ${channel}`);
    await global.message.registerMessage(`SPAMLIMITRESET`, channel => `Spamlimit removed for channel ${channel}`);

    // weebCommands.js and imageCommand.js
    await global.message.registerMessage(`WEEB`, (url) => {
        const embed = {
            "color": 3447003, // Blue
            "image": {
                "url": url
            }
        };

        return [{embed: embed}];
    });
    await global.message.registerMessage(`WEEBERR`, `There was an error getting the image`);

    // ownerCommands.js
    await global.message.registerMessage(`SNOCHANNEL`, `Channel not found.`);

    // autoReactions.js
    await global.message.registerMessage(`AUTOREACTIONON`, `Autoreactions:tm: have been turned on`);
    await global.message.registerMessage(`AUTOREACTIONOFF`, `Autoreactions:tm: have been turned off`);

    // voiceRecognitionCommands.js
    await global.message.registerMessage(`ERRCURRLISTEN`, `Already listening for you in this channel`);
    await global.message.registerMessage(`LISTEN`, `Started listening`);
    await global.message.registerMessage(`NOLISTEN`, `Not currently listening`);
    await global.message.registerMessage(`STOPLISTEN`, `Stopped listening`);

    // minesweeperCommand.js
    await global.message.registerMessage(`MINEFIELD`, field => field);
    await global.message.registerMessage(`INVALIDMINE`, `Mine count cannot exceed 30% of the total tiles`);
    await global.message.registerMessage(`INVALIDFIELDDIM`, `Mine dimensions cannot exceed 30`);
    await global.message.registerMessage(`EXCEEDEDMAXFIELDSIZE`, `Due to the 2k character limit on discord messages, the minefield size cannot exceed 200`);
};