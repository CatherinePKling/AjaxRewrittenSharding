'use strict';

const discordUtil = require(`../util/discordUtil.js`);
const imageUtil = require(`../util/imageUtil.js`);

const sharp = require(`sharp`);

const fs = require(`fs`);
const path = require(`path`);

let doittoemBase, patBase, smolPatBase, largePatBase, prideFlags, prideFlagsSquare, thinkHand;

module.exports.init = async function() {
    await global.commands.registerCommand(`avatar`, {
        run: getAvatar,
        helpCategory: `utility`,
        reqParameters: [
            `MEMBERDEFAULT`
        ],
        briefHelp: ` {member} - Posts a link the specified user's avatar`,
        longHelp: ` {member} - 
Posts a link the specified user's avatar or if no avatar is specified, it will post the avatar of the person running the command`
    });

    await global.commands.registerCommand(`doittoem`, {
        run: doittoem,
        helpCategory: `misc`,
        reqParameters: [
            `MEMBERDEFAULT`
        ],
        briefHelp: ` {member} - Had to do it to 'em`,
        longHelp: ` {member} - 
Had to do it to 'em`
    });

    await global.commands.registerCommand(`pat`, {
        run: pat,
        helpCategory: `misc`,
        reqParameters: [
            [`MEMBERDEFAULT`, `EMOJI`]
        ],
        potentialFlags: [
            `-large`,
            `-smol`
        ],
        briefHelp: ` {member/emote} - Get pat kiddo`,
        longHelp: ` {member/emote} - 
Get pat kiddo
Potential flags:
-large - Makes hand l a r g e
-smol - Makes hand smol`
    });

    await global.commands.registerCommand(`hmm`, {
        run: hmm,
        helpCategory: `misc`,
        reqParameters: [
            [`MEMBERDEFAULT`, `EMOJI`]
        ],
        briefHelp: ` {member/emote} - hmm`,
        longHelp: ` {member/emote} - 
hmm`
    });

    await global.commands.registerCommand(`humanrights`, {
        run: humanrights,
        helpCategory: `misc`,
        reqParameters: [
            [`MEMBERDEFAULT`]
        ],
        potentialFlags: [
            [`-pride`, `STRING`],
            `-list`,
            `-avatar`
        ],
        briefHelp: ` {member} - Donkey kong says trans rights`,
        longHelp: ` {member} - 
Donkey kong says trans rights
Potential flags:
-pride {type} - Gives you a pride flag of a specified gender/sexual minority ex: ;;humanrights -pride gay
-list - Sends a list of all available pride flags ex: ;;humanrights -list
-avatar - Overlays the avatar of the user on top of the pride flag ex: ;;humanrights -avatar`
    });

    doittoemBase = sharp(`5994dada1c216.png`);
    patBase = sharp(`pat.png`);
    largePatBase = sharp(`largepat.png`);
    smolPatBase = sharp(`smolpat.png`);
    thinkHand = sharp(`thinking.png`);

    prideFlags = [];
    prideFlagsSquare = [];

    const pridePath = path.join(__dirname, `../images/pride`);
    const flagFiles = fs.readdirSync(pridePath);
    for (var i in flagFiles) {
        const file = flagFiles[i];
        
        if (!file.endsWith(`.png`)) continue;

        const type = file.substring(0, file.length - 9);
        prideFlags[type] = sharp(`images/pride/${file}`);
        prideFlagsSquare[type] = `images/pride/square/${file}`;
    }
};

async function getAvatar(message, member) {
    await global.message.send(`AVATAR`, message.channel, member.user.displayAvatarURL({format: `png`}), member ? `${discordUtil.getName(member)}'s` : `your`);
}

async function doittoem(message, member) {
    const avatarUrl = member.user.displayAvatarURL({format: `png`, size: 128});
    const imageBuffer = await imageUtil.requestImage(avatarUrl);

    if (!imageBuffer) {
        global.message.send(`IMAGEERR`, message.channel);
        return;
    }

    const maskedAvatar = sharp(imageBuffer)
        .resize(74, 74)
        .joinChannel(`74x74mask.png`);

    doittoemBase.composite([{input: await maskedAvatar.toBuffer(), top: 1, left: 35}]);

    global.message.send(`IMAGE`, message.channel, await doittoemBase.toBuffer(), `hadtodoittoem.png`);
}

async function pat(message, resolvable) {
    let avatarUrl = ``;

    switch (message.parsedParameters[0]) {
        case `EMOJI`:
            avatarUrl = discordUtil.getEmojiUrl(resolvable);
            break;
        case `MEMBERDEFAULT`:
            avatarUrl = resolvable.user.displayAvatarURL({format: `png`, size: 128});
            break;
    }

    const imageBuffer = await imageUtil.requestImage(avatarUrl);

    if (!imageBuffer) {
        global.message.send(`IMAGEERR`, message.channel);
        return;
    }

    const maskedAvatar = sharp(imageBuffer)
        .resize(128, 128);
    
    if (message.flags.large) {
        maskedAvatar.composite([{input: await largePatBase.toBuffer(), top: 0, left: 0}]);
    } else if (message.flags.smol) {
        maskedAvatar.composite([{input: await smolPatBase.toBuffer(), top: 0, left: 0}]);
    } else {
        maskedAvatar.composite([{input: await patBase.toBuffer(), top: 0, left: 0}]);
    }

    global.message.send(`IMAGE`, message.channel, await maskedAvatar.toBuffer(), `pat.png`);
}

async function humanrights(message, member) {
    if (message.flags.list) {
        global.message.send(`PRIDELIST`, message.channel, Object.keys(prideFlags));
        return;
    }

    const avatarUrl = member.user.displayAvatarURL({format: `png`, size: 128});
    const imageBuffer = await imageUtil.requestImage(avatarUrl);

    if (!imageBuffer) {
        global.message.send(`IMAGEERR`, message.channel);
        return;
    }

    let pride;
    if (message.flags.pride) {
        message.flags.pride = message.flags.pride.toLowerCase();

        if (Object.keys(prideFlags).includes(message.flags.pride)) {
            pride = message.flags.pride;
        } else {
            global.message.send(`INVLDFLAG`, message.channel);
            return;
        }
    } else {
        pride = Object.keys(prideFlags)[Math.floor(Math.random() * Object.keys(prideFlags).length)];
    }

    let finalImage;
    if (message.flags.avatar) {
        let prideFlagSquare = prideFlagsSquare[pride];
        prideFlagSquare = sharp(prideFlagSquare);

        prideFlagSquare.composite([{input: imageBuffer}]);

        finalImage = prideFlagSquare;
    } else {
        const prideFlag = prideFlags[pride];
    
        const maskedAvatar = sharp(imageBuffer)
        .resize(108, 108);

        prideFlag.composite([{input: await maskedAvatar.toBuffer(), top: 10, left: 53}]);
        finalImage = prideFlag;
    }

    global.message.send(`PRIDERIGHTS`, message.channel, await finalImage.toBuffer(), discordUtil.getName(member), pride);
}

async function hmm(message, resolvable) {
    let avatarUrl = ``;

    switch (message.parsedParameters[0]) {
        case `EMOJI`:
            avatarUrl = discordUtil.getEmojiUrl(resolvable);
            break;
        case `MEMBERDEFAULT`:
            avatarUrl = resolvable.user.displayAvatarURL({format: `png`, size: 128});
            break;
    }

    const imageBuffer = await imageUtil.requestImage(avatarUrl);

    if (!imageBuffer) {
        global.message.send(`IMAGEERR`, message.channel);
        return;
    }

    const maskedAvatar = sharp(imageBuffer)
        .resize(128, 128);
    
    maskedAvatar.composite([{input: await thinkHand.toBuffer(), top: 0, left: 0}]);

    global.message.send(`IMAGE`, message.channel, await maskedAvatar.toBuffer(), `hmm.png`);
}