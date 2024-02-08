"use strict";

const youtubeUtil = require(`../util/youtubeUtil.js`);
const discordUtil = require(`../util/discordUtil.js`);
const vcUtil = require(`../util/voiceConnectionUtil.js`);
const soundcloudUtil = require(`../util/soundcloudUtil.js`);
const stringUtil = require(`../util/stringUtil.js`);

const driftList = require(`../config/drift.js`);
const woahList = require(`../config/woah.js`);

let queueStorage;

module.exports.init = async function() {
    queueStorage = new global.storage.Database(); // Reset queues when bot restarts

    await global.allClientEvents.addListener(2, checkIfVCEmpty);

    await global.commands.registerCommand(`play`, { // TODO: add support for queueing albums, playlists, and etc, add it to soundcloudUtil.js
        run: play,
        permissionlevel: `NODM`,
        reqParameters: [`STRING`],
        reqStatus: `INVC`,
        potentialFlags: [`-list`, `-loud`, [`-madness`, `NUMBER`], `-nightcore`, `-hospital`, `-sc`, `-next`],
        helpCategory: `music`,
        briefHelp: ` [yt link/search query] - Queues and plays a song.`,
        longHelp: ` [yt link/search query] - 
Queues a song and joins voice and starts playing if not already playing. Will attempt to resolve youtube link, if can't it will search for the video on Youtube.
Additional Flags:
-list            - Queues a whole Youtube playlist (Note: This can take some time)
-loud         - Plays song(s) at 5,000% volume
-nightcore       - Plays song(s) at 2x pitch and 1.4x speed
-hospital        - Combines both the loud and nightcore functions into one
-madness {time}  - Increases the volume by 5,000% after time seconds
-sc              - Queues a song from soundcloud
-next            - Places the song at the front of the queue`
    });

    await global.commands.registerCommand(`p`, {
        run: play,
        permissionlevel: `NODM`,
        reqParameters: [`STRING`],
        reqStatus: `INVC`,
        potentialFlags: [`-list`, `-loud`, [`-madness`, `NUMBER`], `-nightcore`, `-hospital`, `-sc`, `-next`],
        helpCategory: `music`,
        briefHelp: ` Shortcut for the play command.`,
        longHelp: ` [yt link/search query] - 
Queues a song and joins voice and starts playing if not already playing. Will attempt to resolve youtube link, if can't it will search for the video on Youtube.
Additional Flags:
-list            - Queues a whole Youtube playlist (Note: This can take some time)
-loud         - Plays song(s) at 5,000% volume
-nightcore       - Plays song(s) at 2x pitch and 1.4x speed
-hospital        - Combines both the loud and nightcore functions into one
-madness {time}  - Increases the volume by 5,000% after time seconds
-sc              - Queues a song from soundcloud
-next            - Places the song at the front of the queue`
    });

    await global.commands.registerCommand(`skip`, {
        run: skip,
        permissionlevel: `NODM`,
        reqStatus: `INVC`,
        helpCategory: `music`,
        briefHelp: ` {amount} - Skips the currently playing song.`,
        longHelp: ` {amount} - 
Skips the currently playing song. If amount is specified it will try to skip as many songs as the user has permission to.`
    });

    await global.commands.registerCommand(`s`, {
        run: skip,
        permissionlevel: `NODM`,
        reqStatus: `INVC`,
        helpCategory: `music`,
        briefHelp: ` - Shortcut for the skip command.`,
        longHelp: ` {amount} - 
Skips the currently playing song. If amount is specified it will try to skip as many songs as the user has permission to.`
    });

    await global.commands.registerCommand(`queue`, {
        run: queue,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        briefHelp: ` - Lists all the songs in the queue.`,
        longHelp: ` - 
DMs the caller a list of all songs in the queue, who queued them, their length, and the total length of the queue`
    });

    await global.commands.registerCommand(`q`, {
        run: queue,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        briefHelp: ` - Shortcut for the queue command.`,
        longHelp: ` - 
DMs the caller a list of all songs in the queue, who queued them, their length, and the total length of the queue`
    });

    await global.commands.registerCommand(`leave`, {
        run: leave,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        briefHelp: ` - Leaves the voice channel.`,
        longHelp: ` - 
Clears the current queue and leaves the voice channel.`
    });

    await global.commands.registerCommand(`toggle`, {
        run: toggle,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        reqStatus: `INVC`,
        briefHelp: ` - Pauses/resumes the currently playing song.`,
        longHelp: ` - 
Pauses/resumes the currently playing song.`
    });

    await global.commands.registerCommand(`loop`, {
        run: loop,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        reqStatus: `INVC`,
        briefHelp: ` - Toggles the queue loop.`,
        longHelp: ` - 
When the queue is looping no songs will be removed from the queue once they are finished, instead the queue will loop.`
    });

    await global.commands.registerCommand(`shuffle`, {
        run: shuffle,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        reqStatus: `INVC`,
        briefHelp: ` - Shuffles all the songs in the queue.`,
        longHelp: ` - 
Shuffles all the songs in the queue. Doesn't affect currently playing song.`
    });

    await global.commands.registerCommand(`drift`, {
        run: drift,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        reqStatus: `INVC`,
        briefHelp: ` - Deja vu!`,
        longHelp: ` - 
Deja vu
I've just been in this place before
Higher on the street
And I know it's my time to go
Calling you, and the search is a mystery
Standing on my feet
It's so hard when I try to be me, woah
Deja vu
I've just been in this time before
Higher on the beat
And I know it's a place to go
Calling you and the search is a mystery
Standing on my feet
It's so hard when I try to be me, yeah`
    });

    await global.commands.registerCommand(`woah`, {
        run: woah,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        reqStatus: `INVC`,
        briefHelp: ` - WOAH!`,
        longHelp: ` - 
WOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOA
WOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOA
WOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOA
WOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAWOAH`
    });

    await global.commands.registerCommand(`np`, {
        run: np,
        permissionlevel: `NODM`,
        helpCategory: `music`,
        channelRatelimit : [2, 5000],
        briefHelp: ` - Posts information on the currently playing song.`,
        longHelp: ` - 
Gets detailed information on the song that is currently playing and posts it to the channel in an embed`
    });
};

async function checkIfVCEmpty(event) {
    if (event[0] === `voiceStateUpdate`) {

        const oldState = event[1], newState = event[2];
        const guild = oldState.guild;

        // if (oldState.id === global.client.user.id) { // Ignore events from Ajax
        //     return event;
        // }

        if (oldState.channel && !newState.channel) { // Member left voice channel
            if (!guild.voice) { // If Ajax isn't in vc, ignore event
                return event;
            }

            if (oldState.id === global.client.user.id) { // Ajax left voice channel
                const currentQueue = await getQueue(oldState.guild.id);

                currentQueue.loop = false; // To prevent bugs next time a song is played

                currentQueue.splice(0, currentQueue.length); // Don't reassign queue to [] because that overwrites the loop property
            }

            const voiceConnection = guild.voice.connection;

            const voiceChannel = voiceConnection.channel;

            if (voiceChannel.members.size > 1) { // If Ajax isn't the only one in vc, ignore
                return event;
            }

            const currentQueue = await getQueue(guild.id);

            currentQueue.loop = false;

            currentQueue.splice(0, currentQueue.length); // Don't reassign queue to [] because that overwrites the loop property

            const dispatcher = voiceConnection.player.dispatcher;
            if (dispatcher)  {
                if (dispatcher.paused)
                    dispatcher.resume();
                dispatcher.end();
            }

            voiceConnection.disconnect();
        }
    }

    return event;
}

async function shuffle(message) {
    let currentQueue = await getQueue(message.guild.id);
    if (currentQueue.length < 3) {
        global.message.send(`SMALLQUEUE`, message.channel);
        return;
    }

    const currentSong = currentQueue.shift();

    currentQueue = shuffleArray(currentQueue);

    currentQueue.unshift(currentSong);

    global.message.send(`SHUFFLED`, message.channel);
}

async function np(message) {
    const currentQueue = await getQueue(message.guild.id);
    if (currentQueue.length === 0) {
        global.message.send(`NOQUEUE`, message.channel);
        return;
    }

    const currentSong = currentQueue[0];
    const member = message.guild.members.resolve(currentSong.user);

    let extraInfo;
    if (currentSong.flags.sc) {
        extraInfo = await soundcloudUtil.getDetailedTrackInfoFromId(currentSong.id);
    } else {
        extraInfo = await youtubeUtil.getDetailedVideoInfoFromId(currentSong.id);
    }

    if (!(member && extraInfo)) {
        global.message.send(`ERRINFO`, message.channel);
        return;
    }

    extraInfo.timePlaying = message.guild.voice.connection.dispatcher.totalStreamTime;
    extraInfo.user = discordUtil.getName(member);
    extraInfo.avatar = member.user.avatarURL();

    if (currentSong.flags.sc) {
        global.message.send(`SCINFO`, message.channel, extraInfo);
    } else {
        global.message.send(`YTINFO`, message.channel, extraInfo);
    }
}

async function woah(message) {
    const currentQueue = await getQueue(message.guild.id);
    const empty = currentQueue.length === 0; // Check to see if queue is empty before filling it up

    const newsong = woahList.WOAH[Math.floor(Math.random() * woahList.WOAH.length)];
    newsong.user = message.member.id;
    newsong.flags = message.flags;
    currentQueue.push(newsong);

    global.message.send(`WOAH`, message.channel);

    if (empty) { // Queue was empty
        executeQueue(currentQueue, message); // await isn't used for a reason
    }
}

async function drift(message) {
    const currentQueue = await getQueue(message.guild.id);
    const empty = currentQueue.length === 0; // Check to see if queue is empty before filling it up

    const newsong = driftList.driftmusic[Math.floor(Math.random() * driftList.driftmusic.length)];
    newsong.user = message.member.id;
    newsong.flags = message.flags;
    currentQueue.push(newsong);

    global.message.send(`DRIFT`, message.channel);

    if (empty) { // Queue was empty
        executeQueue(currentQueue, message); // await isn't used for a reason
    }
}

async function loop(message) {
    if (!message.guild.voice) {
        global.message.send(`NOMUSIC`, message.channel);
        return;
    }
    const voiceConnection = message.guild.voice.connection;

    const currentQueue = await getQueue(message.guild.id);
    currentQueue.loop = !currentQueue.loop;

    global.message.send(`TOGGLELOOP`, message.channel, currentQueue.loop);
}

async function toggle(message) {
    if (!message.guild.voice) {
        global.message.send(`NOMUSIC`, message.channel);
        return;
    }
    const voiceConnection = message.guild.voice.connection;

    const dispatcher = voiceConnection.player.dispatcher;
    if (!dispatcher)
        return;

    if (dispatcher.paused) dispatcher.resume();
    else dispatcher.pause();

    global.message.send(`TOGGLE`, message.channel, dispatcher.paused);
}

async function leave(message) {
    const currentQueue = await getQueue(message.guild.id);
    // if (currentQueue.length === 0) {
    //     global.message.send(`NOQUEUE`, message.channel);
    //     return;
    // }

    
    const member = message.member;
    if (member.hasPermission(`MANAGE_MESSAGES`) ||
    member.roles.find(role => role.name.toLowerCase() === `dj`) ||
    member.id === 150699865997836288) {
        
        currentQueue.loop = false; // To prevent bugs next time a song is played
        
        if (!message.guild.voice) {
            global.message.send(`NOMUSIC`, message.channel);
            return;
        }
        const voiceConnection = message.guild.voice.connection;

        currentQueue.splice(0, currentQueue.length); // Don't reassign queue to [] because that overwrites the loop property

        const dispatcher = voiceConnection.player.dispatcher;
        if (dispatcher) {
            if (dispatcher.paused)
                dispatcher.resume();
            dispatcher.end();
        }

        voiceConnection.disconnect();

        global.message.send(`LEAVE`, message.channel);
    } else {
        global.message.send(`NOLEAVE`, message.channel);
    }
}

async function queue(message) {
    const currentQueue = await getQueue(message.guild.id);
    if (currentQueue.length === 0) {
        global.message.send(`NOQUEUE`, message.channel);
        return;
    }

    if (!message.guild.voice) {
        global.message.send(`NOMUSIC`, message.channel);
        return;
    }
    const voiceConnection = message.guild.voice.connection;

    const totalTime = currentQueue.length === 1 ? currentQueue[0].duration : currentQueue.reduce((a, b) => a + b.duration, 0); // If the queue only has one item in it reduce returns 0
    let queueMessage = `Current Queue: ${currentQueue.length} songs (${stringUtil.formatMillisecondsHHMMSS(totalTime)})${voiceConnection.dispatcher && voiceConnection.dispatcher.paused ? ` Paused` : ``}${currentQueue.loop ? ` Looping` : ``}`;

    for (var i in currentQueue) {
        const name = discordUtil.getName(message.guild.members.resolve(currentQueue[i].user));
        const title = currentQueue[i].title;
        const duration = currentQueue[i].duration;

        if (i == 0) {
            queueMessage += `\n► ${parseInt(i) + 1}. ${title} (${stringUtil.formatMillisecondsHHMMSS(duration)}) queued by ${name || `someone`} ◄`;
        } else {
            queueMessage += `\n${parseInt(i) + 1}. ${title} (${stringUtil.formatMillisecondsHHMMSS(duration)}) queued by ${name || `someone`}`;
        }
    }

    const err = await discordUtil.sendDM(message.author, `\`\`\`${queueMessage}\`\`\``, {"split" : {"prepend" : `\`\`\``, "append" : `\`\`\``}});
    if (typeof err === `object`) {
        global.message.send(`DMERR`, message.channel);
    } else {
        global.message.send(`CHECKDM`, message.channel);
    }
}

async function skip(message, amount) {
    if (amount) {
        if (isNaN(amount) || amount < 0 || amount > 100) {
            await global.message.send(`INVLDPURGEAMOUNT`, message.channel);
            return;
        }

        amount = Math.floor(amount - 1);
    }

    const currentQueue = await getQueue(message.guild.id);
    if (currentQueue.length === 0) {
        global.message.send(`NOQUEUE`, message.channel);
        return;
    }

    const member = message.member;
    const guild = message.guild;
    const hasOverride = message.member.hasPermission(`MANAGE_MESSAGES`) ||
    member.roles.find(role => role.name.toLowerCase() === `dj`) ||
    member.id === `150699865997836288`;

    if (hasOverride ||
        member.id === currentQueue[0].user ||
        !guild.voice.connection.channel.members.cache.has(currentQueue[0].user)) {

        if (!message.guild.voice) {
            global.message.send(`NOMUSIC`, message.channel);
            return;
        }
        const voiceConnection = message.guild.voice.connection;

        let totalSkipped = 1;
        if (!hasOverride) {
            if (amount) {
                let index = 1;
                while (amount > 0 && index < 100 && index < currentQueue.length) {
                    if (currentQueue[index].user === member.id || !guild.voice.connection.channel.members.cache.has(currentQueue[index].user)) {
                        totalSkipped++;
                        amount--;
                        index--; // When an item is removed the index stays the same but it's at the next item so this causes the index to stay the same

                        currentQueue.splice(index, 1);
                    }

                    index++;
                }
            }
        } else {
            currentQueue.splice(0, amount - 1); // Use this to skip more than one song ignoring permissions
        }


        const dispatcher = voiceConnection.player.dispatcher;
        if (dispatcher) {
            if (dispatcher.paused)
                dispatcher.resume();
            dispatcher.end();
        }

        if (queue.length === 0) {
            voiceConnection.disconnect();
            return;
        }

        global.message.send(`SKIP`, message.channel, totalSkipped);
    } else {
        global.message.send(`NOSKIP`, message.channel);
    }
}

async function play(message, videoResolvable) {
    const currentQueue = await getQueue(message.guild.id);
    const empty = currentQueue.length === 0 || currentQueue.length === undefined; // Check to see if queue is empty before filling it up
    console.debug(currentQueue);
    console.log(queue.length);
    console.log("1");
    let info;
    if (message.flags.list) {
        info = await youtubeUtil.getPlaylistInfo(videoResolvable);
        if (!info) {
            global.message.send(`INVLDSEARCH`, message.channel);
            return;
        }

        info.videos.forEach((data) => {
            data.flags = message.flags;
            data.user = message.author.id;
        });
        
        //currentQueue.push.apply(currentQueue, info.videos);
        //currentQueue[queueAddFunction](...info.videos);

        if (message.flags.next) {
            currentQueue.splice(1, 0, ...info.videos);
        } else {
            currentQueue.push(...info.videos);
        }  

        info = info.info; // For display
    } else if (message.flags.sc) {
        info = await soundcloudUtil.getTrackInfo(videoResolvable);
        if (!info) {
            global.message.send(`INVLDSEARCH`, message.channel);
            return;
        }

        info.flags = message.flags;
        info.user = message.author.id;

        if (message.flags.next) {
            currentQueue.splice(1, 0, info);
        } else {
            currentQueue.push(info);
        }  
    } else {
        console.log("2");
        info = await youtubeUtil.getVideoInfo(videoResolvable);
        if (!info) {
            global.message.send(`INVLDSEARCH`, message.channel);
            return;
        }
        console.log("3");
        info.flags = message.flags;
        info.user = message.author.id;

        if (message.flags.next) { 
            console.log("4");
            currentQueue.splice(1, 0, info);
        } else {
            console.log("5");
            currentQueue.push(info);
        }  
    }
    console.debug(currentQueue);
    console.log(queue.length);
    console.log("6");
    global.message.send(`ADDSONG`, message.channel, info);
    //console.log(`Song info:`);
    
    //console.debug(info);
    //console.debug(empty);
    if (empty || !message.guild.voice) { // Queue was empty or there is no active voice connection
        currentQueue.loop = false; // Don't start with it looped or it wont work
        console.debug(currentQueue);
        console.log(queue.length);
        console.log("7");
        executeQueue(currentQueue, message); // await isn't used here for a reason
    }
}

async function getQueue(id) {
    const newQueue = [];
    Object.defineProperty(newQueue, `loop`, {
        value: false,
        enumerable: false, // So this doesn't show up in for ... in ...
        writable: true
    });

    await queueStorage.setDefault(id, newQueue);
    return await queueStorage.get(id);
}

async function executeQueue(queue, message) {
    console.log("8");
    console.debug(queue);
    console.log(queue.length);
    const voiceConnection = await discordUtil.getVoiceConnection(message); // Joins voice channel
    
    if (!voiceConnection) {
        console.log("10");
        global.message.send(`ERRJOINVC`, message.channel);
        queue.splice(0, queue.length); // Clear Queue
        return;
    }
    console.log("9");
    console.debug(queue);
    console.log(queue.length);
    console.log(queue.length === 0);
    if (queue.length === 0) {
        //console.log("11");
        voiceConnection.disconnect();
        return;
    }

    let dispatcher;
    const currentSong = queue[0];
    const options = {};

    if (currentSong.flags.loud) {
        options.audioFilters = [`volume=50`];                                                                 // Play the video better
    } else if (currentSong.flags.nightcore) {
        options.audioFilters = [`atempo=0.7`, `asetrate=r=88200`];                                            // Play the video even better
    } else if (currentSong.flags.hospital) {
        options.audioFilters = [`volume=50`, `atempo=0.7`, `asetrate=r=88200`];                               // Play the video both better and even better
    } else if (currentSong.flags.madness) {
        options.complexFilters = [`volume=enable='between(t,${Math.floor(currentSong.flags.madness)},t)':volume=50`]; // *evil laughter*
    }

    if (currentSong.flags.sc) {
        dispatcher = await vcUtil.playSoundcloudTrack(voiceConnection, currentSong.url, options);
    } else {
        console.log("11");
        dispatcher = await vcUtil.playYoutubeVideo(voiceConnection, currentSong.id, options);
    }

    dispatcher.on(`error`, (err) => {
        console.log("12");
        console.warn(`Error in dispatcher`, err);
    });

    voiceConnection.on(`error`, (err) => {
        console.log("13");
        console.warn(`Error in connection`, err);
    });

    dispatcher.on(`end`, () => {
        console.log("14");
        setTimeout(() => {
            if (queue.loop) queue.push(queue.shift()); // Move item at back of queue to front
            else queue.shift();
            if (queue.length === 0) {
                voiceConnection.disconnect();
                return;1
            }
            executeQueue(queue, message);
        }, 1000);
    });
}

function shuffleArray(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
