'use strict';

const sharp = require(`sharp`);
const imageUtil = require(`../util/imageUtil.js`);
const discordUtil = require(`../util/discordUtil.js`);

const runes = require(`runes`);
const twemoji = require(`twemoji`);
const fs = require(`fs`);
const GIFEncoder = require(`gifencoder`);

const distortedChord = sharp(`distortedchord.svg`), //sharp(`distortedchord.svg`),
    tangentChord = sharp(`tangentchord.svg`), // sharp(`tangentchord.svg`),
    triangle = sharp(`triangle.svg`);

module.exports.init = async function () {
    await global.commands.registerCommand(`say`, {
        run: say,
        permissionlevel: `NODM`,
        reqParameters: [
            [`EMOJI`, `STRING`], `STRING`
        ],
        userRatelimit: [2, 5000],
        potentialFlags: [`-w`, `-r`, [`-c`, `RGBCODE`], `-g`, `-n`],
        helpCategory: `nitw`,
        briefHelp: ` [emoji/user/character] [message] - Generates an image of the emoji/user/character saying the phrase with text bubbles from Night in the Woods.`,
        longHelp: ` [emoji/user/character] [message] - 
        Generates an image of the emoji/user/character saying the phrase with text bubbles from Night in the Woods.
        Flags:
        -w - Stretches the character's head horizontally by 200% for comedic effect
        -r - Gives all letters random colors
        -c [RGBCODE] - Gives all letters the specified html code
        -g - Gives letters rainbow effect
        -n - In the process of developing this command I accidently put a bug in that cuts off most of the characters nose. People thought it was funny so now it's a part of the command.`
    });

    await global.commands.registerCommand(`asay`, {
        run: asay,
        permissionlevel: `NODM`,
        reqParameters: [
            [`EMOJI`, `STRING`], `STRING`
        ],
        userRatelimit: [2, 10000],
        potentialFlags: [`-w`, `-r`, [`-c`, `RGBCODE`], `-g`, `-n`],
        helpCategory: `nitw`,
        briefHelp: ` [emoji/user/character] [message] - Generates an animated gif of the emoji/user/character saying the phrase with text bubbles from Night in the Woods.`,
        longHelp: ` [emoji/user/character] [message] - 
        Generates an animated gif of the emoji/user/character saying the phrase with text bubbles from Night in the Woods.
        Flags:
        -w - Stretches the character's head horizontally by 200% for comedic effect
        -r - Gives all letters random colors
        -c [RGBCODE] - Gives all letters the specified html code
        -g - Gives letters rainbow effect
        -n - In the process of developing this command I accidently put a bug in that cuts of most of the characters nose. People thought it was funny so now it's a part of the command.`
    });
};

const rainbowColors = [
    [255, 0,   0],
    [255, 127, 0],
    [255, 255, 0],
    [0,   255, 0],
    [0,   51,  255],
    [74,  16,  129],
    [148, 0,   211]
];

const charMap = {
    'A': `A`,
    '\'': `APOSTROPHE`,
    '*': `ASTERISK`,
    'B': `B`,
    'C': `C`,
    ':': `COLON`,
    ',': `COMMA`,
    'D': `D`,
    '-': `DASH`,
    '$': `DOLLAR`,
    'E': `E`,
    '8': `EIGHT`,
    '!': `EXCLAMATION`,
    'F': `F`,
    '5': `FIVE`,
    '4': `FOUR`,
    'G': `G`,
    'H': `H`,
    'I': `I`,
    'J': `J`,
    'K': `K`,
    'L': `L`,
    'M': `M`,
    'N': `N`,
    '9': `NINE`,
    'O': `O`,
    '1': `ONE`,
    'P': `P`,
    '%': `PERCENT`,
    '.': `PERIOD`,
    'Q': `Q`,
    '?': `QUESTION`,
    '"': `QUOTE`,
    'R': `R`,
    'S': `S`,
    ';': `SEMICOLON`,
    '7': `SEVEN`,
    '6': `SIX`,
    'T': `T`,
    '3': `THREE`,
    '2': `TWO`,
    'U': `U`,
    'V': `V`,
    'W': `W`,
    'X': `X`,
    'Y': `Y`,
    'Z': `Z`,
    '0': `ZERO`,
    ' ': `SPACE`
};

const characterTextMap = {
    'gregg': [255, 194, 36],
    'bea': [80, 224, 224],
    'lori': [2, 255, 225],
    'coffinwolf': [57, 125, 156],
    'germ': [117, 235, 151],
    'angus': [235, 89, 43],
    'ajax': [117, 235, 151]
};

const mouthHeightDict = global.nitwMouthHeightDict = {
    'jackie': 32,
    'angus': 35,
    'mae': 30,
    'bea': 60,
    'lori': 55,
    'coffinwolf': 50,
    'germ': 45,
    'pumpkinhead': 40,
    'adina': 40,
    'selmers': 25,
    'garbo': 60,
    'molly': 40,
    'malloy': 60,
    'dad': 40,
    'mom': 40,
    'cole': 40,
    'deer': 42,
    'sharkle': 60,
    'gregg': 45,
    'ajax': 60
};

const newLineChars = [` `, `!`, `?`, `,`];

const DEFAULT_MOUTH_HEIGHT = 50;
const DEFAULT_TEXT_COLOR = [255, 255, 255, 0];

const SOFT_MAX_WIDTH = 850; // If line with exceeds this make new line at next opportunity
const HARD_MAX_WIDTH = 1200; // If line with exceeds this force new line

const LINE_HEIGHT = 64; // Height of line
const CHAR_SPACING = 5; // Pixels inbetween chars

const MAX_LINES = 8; // Maximum lines allowed (Note: If you change this change the message in messages.js too)
const MAX_CHARACTERS = 500; // Maximum characters allowed in message (Note: If you change this change the message in messages.js too)

const EDGES_PADDING = 10; // Padding added to sides of completed text
const TOP_PADDING = 4; // Padding added to top and bottom of completed text

const HORIZONTAL_CHORD_HEIGHT = 10; // Height of chords on the sides
const VERTICAL_CHORD_HEIGHT = 5; // Height of chords on the top and bottom
const TRIANGLE_WIDTH = 40; // Width of the triangle on the left
const HEAD_HEIGHT = 70; // Height to resize the head to and the minimum height of the final image

const GIF_DELAY = 166; // Delay in milliseconds between frames in the gifs

async function getCharacterHead(message, character) {
    let headBuffer, mouthHeight = DEFAULT_MOUTH_HEIGHT,
        textColor = DEFAULT_TEXT_COLOR;

    switch (message.parsedParameters[0]) {
        case `EMOJI`:
            headBuffer = await imageUtil.requestImage(discordUtil.getEmojiUrl(character));
            break;
        case `STRING`: {
            if (character.includes(`gregg`)) {
                if (character.includes(`cup`) || character.includes(`cups`)) {
                    headBuffer = fs.readFileSync(`assets/heads/gregg_cups.png`);
                    character = `gregg`;
                } else if (character.includes(`happy`) || character.includes(`joy`)) {

                    headBuffer = fs.readFileSync(`assets/heads/gregg_happy.png`);
                    character = `gregg`;
                    mouthHeight = 40;

                } else if (character.includes(`bike`)) {
                    headBuffer = fs.readFileSync(`assets/heads/gregg_bike.png`);
                    character = `gregg`;
                }
            } else if (character.includes(`bea`)) {
                if (character.includes(`real`)) {
                    headBuffer = fs.readFileSync(`assets/heads/bea_real.png`);
                    character = `bea`;
                }
            } else if (character.includes(`mae`)) {
                if (character.includes(`bike`)) {
                    headBuffer = fs.readFileSync(`assets/heads/mae_bike.png`);
                    character = `mae`;
                }
            }

            if (character in mouthHeightDict) { // Is a valid character

                if (mouthHeight == DEFAULT_MOUTH_HEIGHT) mouthHeight = mouthHeightDict[character] || mouthHeight;
                if (textColor == DEFAULT_TEXT_COLOR) textColor = characterTextMap[character] || textColor;

                headBuffer = headBuffer || fs.readFileSync(`assets/heads/${character}.png`);
            } else if (character.codePointAt(0) > 255 && !runes(character)[1]) { // Is one character and isnt an ascii character
                const path = `assets/72x72/${twemoji.convert.toCodePoint(character)}.png`;
                if (fs.existsSync(path)) {
                    headBuffer = fs.readFileSync(path);
                } else {
                    global.message.send(`NOEMOJI`, message.channel);
                    return;
                }
            } else {
                const characterMember = await discordUtil.resolveMember(character, message.guild); // Check to see if there's a  member with this name
                if (characterMember) {
                    const headUrl = characterMember.user.displayAvatarURL({
                        format: `png`,
                        size: 128
                    });

                    const unmaskedHeadBuffer = await imageUtil.requestImage(headUrl);

                    headBuffer = await sharp(unmaskedHeadBuffer)
                        .resize(129, 129)
                        .joinChannel(`129x129mask.png`)
                        .toBuffer();

                    headBuffer = await sharp(headBuffer)
                        .resize(128, 128)
                        .toBuffer();

                    // fs.writeFile(`test.png`, headBuffer);
                } else {
                    global.message.send(`INVLDCHR`, message.channel);
                    return;
                }
            }

            break;
        }
    }

    return [headBuffer, mouthHeight, textColor];
}

async function resolveText(text) {
    const emojiResolvedText = await discordUtil.resolveEmojis(text);

    const imagePromises = [],
        imagePromiseKeys = [],
        seperatedText = []; // ImagePromises and ImagePromiseKeys are seperate and not in a dictionary yet because you can't put a dictionary into Promise.all
    for (var i = 0; i < emojiResolvedText.length; i++) {

        let plaintext = emojiResolvedText[i].normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``); // Removes accents
        plaintext = runes(plaintext);

        for (var j in plaintext) {

            const char = plaintext[j].toUpperCase();
            seperatedText.push(char);

            if (imagePromiseKeys.includes(char)) { // Don't need to load again
                continue;
            }

            if (char in charMap) {
                imagePromiseKeys.push(char);
                imagePromises.push(new Promise((resolve, reject) => { // This gets all 3 parts of the animation and returns them in an array
                    const images = [];

                    for (let i = 1; i < 4; i++) {

                        images.push(new Promise((resolve, reject) => {
                            resolve(fs.readFileSync(`assets/standard_dialogue/Dialogue_standard_1_${charMap[char]}${i}.png`));
                        }));
                    }

                    resolve(Promise.all(images));
                }));
            } else {

                const path = `assets/72x72/${twemoji.convert.toCodePoint(char)}.png`;

                if (fs.existsSync(path)) { // Gets emojis
                    imagePromiseKeys.push(char);
                    imagePromises.push(new Promise((resolve, reject) => {
                        resolve(fs.readFileSync(path));
                    }));
                } else {
                    imagePromiseKeys.push(char);
                    imagePromises.push(null); // Loading char failed, push this so it won't try to load again

                    seperatedText.pop(); // Remove the character from the list of characters to be rendered
                }
            }
        }

        i++; // Increment to process custom emojis now
        const customEmoji = emojiResolvedText[i];

        if (!customEmoji) // If nothing left return
            continue;

        seperatedText.push(customEmoji);

        if (customEmoji in imagePromises) { // Don't need to load again
            continue;
        }

        imagePromiseKeys.push(customEmoji);
        imagePromises.push(imageUtil.requestImage(discordUtil.getEmojiUrl(customEmoji)));
    }

    return [imagePromises, imagePromiseKeys, seperatedText];
}

async function colorText(message, imageArray, textColor) {
    let colorBuffer;

    if (textColor && textColor != DEFAULT_TEXT_COLOR && !message.flags.g && !message.flags.r) {
        colorBuffer = new Buffer(textColor);
    }

    if (message.flags.c) {
        colorBuffer = new Buffer([message.flags.c.r, message.flags.c.g, message.flags.c.b]);
    }

    imageArray = imageArray.map(buffer => {
        if (!buffer) {
            return;
        }

        if (Array.isArray(buffer)) {

            if (colorBuffer) {
                return Promise.all(buffer.map(async buffer => {

                    const resized = await sharp(buffer).resize(undefined, LINE_HEIGHT).png().toBuffer();
                    const imageBuffer = await addMockTint(resized, colorBuffer);

                    return imageBuffer;
                }));
            } else {
                return Promise.all(buffer.map(buffer => sharp(buffer).resize(undefined, LINE_HEIGHT).png().toBuffer({
                    resolveWithObject: true
                })));
            }
        } else {
            return sharp(buffer).resize(undefined, LINE_HEIGHT).png().toBuffer({
                resolveWithObject: true
            });
        }
    });

    imageArray = await Promise.all(imageArray);

    return [imageArray, colorBuffer];
}

async function calcCharacterPositions(seperatedText, charImages, message) {
    const characterPositions = []; // Array of the positions to place each of the characters
    let currentLine = 0, // Current line number
        currentMaxLineWidth = 0, // Largest width of any line so far
        currentLineWidth = 0, // Width of the current line
        currentHeight = 0; // Current height of text box

    for (var i in seperatedText) {
        const char = seperatedText[i];
        let charImage = charImages[char];

        if (!charImage) { // No image for this char, continue
            continue;
        }

        if (Array.isArray(charImage)) {
            charImage = charImage[0];
        }

        characterPositions.push({
            x: currentLineWidth,
            y: currentHeight
        });
        currentLineWidth += charImage.info.width + CHAR_SPACING;

        if ((currentLineWidth > SOFT_MAX_WIDTH && newLineChars.includes(char)) ||
            currentLineWidth > HARD_MAX_WIDTH ||
            char === `\n`) { // Make a new line

            currentMaxLineWidth = currentMaxLineWidth > currentLineWidth ? currentMaxLineWidth : currentLineWidth; // Update currentMaxLineWidth
            currentLineWidth = 0;
            currentHeight += LINE_HEIGHT;

            currentLine++;
            if (currentLine > MAX_LINES) {
                global.message.send(`MAXLINES`, message.channel);
                return;
            }
        }
    }

    currentHeight += LINE_HEIGHT; // CurrentHeight needs to store the heigh of the final stitched image
    currentMaxLineWidth = currentMaxLineWidth > currentLineWidth ? currentMaxLineWidth : currentLineWidth; // Update currentMaxLineWidth
    currentMaxLineWidth -= CHAR_SPACING; // Remove the extra spacing

    return [characterPositions, currentMaxLineWidth, currentHeight];
}

async function stichText(currentMaxLineWidth, currentHeight, seperatedText, charImages, message, characterPositions) {
    let rainbowIndex = 0; // This is used to cycle through the rainbow colors if the rainbow option is selected

    let stitchedText = sharp({
        create: {
            width: currentMaxLineWidth,
            height: currentHeight,
            channels: 4,
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 255
            }
        }
    });

    for (var i in seperatedText) { // Actually place the characters in the image
        const char = seperatedText[i];
        let charImage = charImages[char];

        if (!charImage) { // No image for this char, continue
            continue;
        }

        if (Array.isArray(charImage)) {

            if (message.flags.r || message.flags.g) {
                let charColorBuffer;
                if (message.flags.r) {

                    charColorBuffer = new Buffer([getRandomInt(63, 256), getRandomInt(63, 256), getRandomInt(63, 256)]);
                }

                if (message.flags.g) {

                    charColorBuffer = new Buffer(rainbowColors[rainbowIndex]);
                    rainbowIndex = (rainbowIndex + 1) % rainbowColors.length;
                }

                charImage = await addMockTint(charImage[Math.floor(Math.random() * charImage.length)].data, charColorBuffer);
            } else {

                charImage = charImage[Math.floor(Math.random() * charImage.length)];
            }
        }

        const charPosition = characterPositions[i];
        if (!charPosition) { // This shouldnt ever get called but just in case
            continue;
        }

        stitchedText = await stitchedText.composite([{input: charImage.data, 
            top: charPosition.y,
            left: charPosition.x
        }]).png().toBuffer();

        stitchedText = sharp(stitchedText);
    }

    return stitchedText;
}

async function stichTextAnimated(currentMaxLineWidth, currentHeight, seperatedText, charImages, message, characterPositions) {
    let rainbowIndex = 0; // This is used to cycle through the rainbow colors if the rainbow option is selected

    let stitchedTextFrames = [];
    stitchedTextFrames[0] = sharp({
        create: {
            width: currentMaxLineWidth,
            height: currentHeight,
            channels: 4,
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 255
            }
        }
    });
    stitchedTextFrames[1] = stitchedTextFrames[0].clone();
    stitchedTextFrames[2] = stitchedTextFrames[0].clone();

    for (var i in seperatedText) { // Actually place the characters in the image
        const char = seperatedText[i];
        let charImage = charImages[char];

        if (!charImage) { // No image for this char, continue
            continue;
        }

        if (Array.isArray(charImage)) {

            if (message.flags.r || message.flags.g) {
                if (message.flags.r) {
                    charImage = await Promise.all(charImage.map(char => addMockTint(char.data, new Buffer([getRandomInt(63, 256), getRandomInt(63, 256), getRandomInt(63, 256)]))));
                    //charColorBuffer = new Buffer([getRandomInt(63, 256), getRandomInt(63, 256), getRandomInt(63, 256)]);
                }

                if (message.flags.g) {
                    let rainbowOffset = 0;
                    charImage = await Promise.all(charImage.map(char => addMockTint(char.data, rainbowColors[(rainbowIndex + rainbowOffset++) % rainbowColors.length])));
                    //charColorBuffer = new Buffer(rainbowColors[rainbowIndex]);
                    rainbowIndex = (rainbowIndex + 1) % rainbowColors.length;
                }

                //charImage = await addMockTint(charImage[Math.floor(Math.random() * charImage.length)].data, charColorBuffer);
                //charImage = await Promise.all(charImage.map(char => addMockTint(char.data, charColorBuffer)));
            }
        }

        const charPosition = characterPositions[i];
        if (!charPosition) { // This shouldnt ever get called but just in case
            continue;
        }

        let charFrame = 0;

        stitchedTextFrames = await Promise.all(stitchedTextFrames.map(async frame => {
            frame = await frame.composite([{input: Array.isArray(charImage) ? charImage[(parseInt(charFrame++) + parseInt(i)) % charImage.length].data : charImage.data,
                top: charPosition.y,
                left: charPosition.x
            }]).png().toBuffer();

            return sharp(frame);
        }));
    }

    return stitchedTextFrames;
}

async function addDetails(stitchedText, currentMaxLineWidth, currentHeight, headBuffer, message, mouthHeight) {
    // Pad left and right side of text
    stitchedText.extend({
        left: EDGES_PADDING,
        right: EDGES_PADDING,
        top: TOP_PADDING,
        bottom: TOP_PADDING,
        background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 255
        }
    });
    currentMaxLineWidth += EDGES_PADDING + EDGES_PADDING; // So we don't have to keep adding when using this value later
    currentHeight += TOP_PADDING + TOP_PADDING;

    let [topChord, rightChord, bottomChord, leftChord, triangleBuffer, headObject] = await Promise.all([
        tangentChord.clone().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).png().toBuffer(),
        tangentChord.clone().rotate(90).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer(),
        tangentChord.clone().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).rotate(180).png().toBuffer(),
        tangentChord.clone().rotate(270).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer(),
        triangle.clone().resize(TRIANGLE_WIDTH, mouthHeight, {fit: `fill`}).png().toBuffer(), // Mouth height times two because the point on the triangle is half the height
        sharp(headBuffer).resize(message.flags.n ? TRIANGLE_WIDTH : undefined, HEAD_HEIGHT).png().toBuffer({ // n is a gag command
            resolveWithObject: true
        })
    ]);

    if (message.flags.w) {
        headObject = await sharp(headObject.data).resize(headObject.info.width * 2, headObject.info.height).png().toBuffer({
            resolveWithObject: true
        });
    }

    const textBoxHeight = VERTICAL_CHORD_HEIGHT + currentHeight + VERTICAL_CHORD_HEIGHT; // Height of the text box when finished
    const offsetFromLeft = TRIANGLE_WIDTH + headObject.info.width; // Offset created by the head and the triangle

    // Add blank borders around text including extra space on left for triangle and head
    stitchedText = sharp(await stitchedText.png().toBuffer()).extend({
        left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT,
        right: HORIZONTAL_CHORD_HEIGHT,
        top: VERTICAL_CHORD_HEIGHT,
        bottom: VERTICAL_CHORD_HEIGHT,
        background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0
        }
    });

    // Start drawing chords
    stitchedText.composite([{input: topChord, 
        top: 0,
        left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT
    }]);
    stitchedText = sharp(await stitchedText.png().toBuffer());

    stitchedText.composite([{input: rightChord, 
        top: 0 + VERTICAL_CHORD_HEIGHT,
        left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT + currentMaxLineWidth
    }]);
    stitchedText = sharp(await stitchedText.png().toBuffer());

    stitchedText.composite([{input: bottomChord, 
        top: 0 + VERTICAL_CHORD_HEIGHT + currentHeight,
        left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT
    }]);
    stitchedText = sharp(await stitchedText.png().toBuffer());

    stitchedText.composite([{input: leftChord, 
        top: 0 + VERTICAL_CHORD_HEIGHT,
        left: offsetFromLeft
    }]);
    stitchedText = sharp(await stitchedText.png().toBuffer());
    // End drawing chords

    // Draw triangle
    stitchedText.composite([{input: triangleBuffer, 
        top: textBoxHeight - mouthHeight - VERTICAL_CHORD_HEIGHT,
        left: headObject.info.width + HORIZONTAL_CHORD_HEIGHT
    }]);
    stitchedText = sharp(await stitchedText.png().toBuffer());

    // Draw head
    stitchedText.composite([{input: headObject.data, 
        top: textBoxHeight - headObject.info.height,
        left: 0
    }]);

    return stitchedText;
}

async function addDetailsAnimated(stitchedTextFrames, currentMaxLineWidth, currentHeight, headBuffer, message, mouthHeight) {
    // Pad left and right side of text
    stitchedTextFrames = await Promise.all(stitchedTextFrames.map(text => {
        text.extend({
            left: EDGES_PADDING,
            right: EDGES_PADDING,
            top: TOP_PADDING,
            bottom: TOP_PADDING,
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 255
            }
        });

        return text.png().toBuffer();
    }));

    currentMaxLineWidth += EDGES_PADDING + EDGES_PADDING; // So we don't have to keep adding when using this value later
    currentHeight += TOP_PADDING + TOP_PADDING;

    let [topChords, rightChords, bottomChords, leftChords, triangleBuffer, headObject] = await Promise.all([
        Promise.all([
            distortedChord.clone().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).png().toBuffer(),
            tangentChord.clone().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).png().toBuffer(),
            distortedChord.clone().flop().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).png().toBuffer()
        ]),
        Promise.all([
            distortedChord.clone().rotate(90).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer(),
            tangentChord.clone().rotate(90).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer(),
            distortedChord.clone().flip().rotate(90).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer()
        ]),
        Promise.all([
            distortedChord.clone().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).rotate(180).png().toBuffer(),
            tangentChord.clone().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).rotate(180).png().toBuffer(),
            distortedChord.clone().flop().resize(currentMaxLineWidth, VERTICAL_CHORD_HEIGHT, {fit: `fill`}).rotate(180).png().toBuffer()
        ]),
        Promise.all([
            distortedChord.clone().rotate(270).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer(),
            tangentChord.clone().rotate(270).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer(),
            distortedChord.clone().flip().rotate(270).resize(HORIZONTAL_CHORD_HEIGHT, currentHeight, {fit: `fill`}).png().toBuffer()
        ]),
        triangle.clone().resize(TRIANGLE_WIDTH, mouthHeight, {fit: `fill`}).png().toBuffer(), // Mouth height times two because the point on the triangle is half the height
        sharp(headBuffer).resize(message.flags.n ? TRIANGLE_WIDTH : undefined, HEAD_HEIGHT).png().toBuffer({
            resolveWithObject: true
        })
    ]);

    if (message.flags.w) {
        headObject = await sharp(headObject.data).resize(headObject.info.width * 2, headObject.info.height).png().toBuffer({
            resolveWithObject: true
        });
    }

    const textBoxHeight = VERTICAL_CHORD_HEIGHT + currentHeight + VERTICAL_CHORD_HEIGHT; // Height of the text box when finished
    const offsetFromLeft = TRIANGLE_WIDTH + headObject.info.width; // Offset created by the head and the triangle

    // Add blank borders around text including extra space on left for triangle and head 
    stitchedTextFrames = stitchedTextFrames.map(frame => sharp(frame).extend({
        left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT,
        right: HORIZONTAL_CHORD_HEIGHT,
        top: VERTICAL_CHORD_HEIGHT,
        bottom: VERTICAL_CHORD_HEIGHT,
        background: { // 0x36393EFF
            r: 0x36,
            g: 0x39,
            b: 0x3E,
            alpha: 0xFF
        }
    }));

    for (var i in stitchedTextFrames) {
        // Start drawing chords
        let currFrame = stitchedTextFrames[i];
        currFrame.composite([{input: topChords[i], 
            top: 0,
            left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT
        }]);
        currFrame = sharp(await currFrame.png().toBuffer());

        currFrame.composite([{input: rightChords[i], 
            top: 0 + VERTICAL_CHORD_HEIGHT,
            left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT + currentMaxLineWidth
        }]);
        currFrame = sharp(await currFrame.png().toBuffer());

        currFrame.composite([{input: bottomChords[i], 
            top: 0 + VERTICAL_CHORD_HEIGHT + currentHeight,
            left: offsetFromLeft + HORIZONTAL_CHORD_HEIGHT
        }]);
        currFrame = sharp(await currFrame.png().toBuffer());

        currFrame.composite([{input: leftChords[i], 
            top: 0 + VERTICAL_CHORD_HEIGHT,
            left: offsetFromLeft
        }]);
        currFrame = sharp(await currFrame.png().toBuffer());
        // End drawing chords

        // Draw triangle
        currFrame.composite([{input: triangleBuffer, 
            top: textBoxHeight - mouthHeight - VERTICAL_CHORD_HEIGHT,
            left: headObject.info.width + HORIZONTAL_CHORD_HEIGHT
        }]);
        currFrame = sharp(await currFrame.png().toBuffer());

        // Draw head
        currFrame.composite([{input: headObject.data, 
            top: textBoxHeight - headObject.info.height,
            left: 0
        }]);

        stitchedTextFrames[i] = currFrame;
    }

    return stitchedTextFrames;
}

async function say(message, character, text) {
    if (text.length > MAX_CHARACTERS) {
        global.message.send(`TOOLONG`, message.channel);
        return;
    }

    // Begin getting buffer of image for head
    const headData = await getCharacterHead(message, character);
    if (!headData) {
        return;
    }

    let [headBuffer, mouthHeight, textColor] = headData;
    // End getting buffer of image for head

    // Begin resolving characters into image promises
    const textData = await resolveText(text);
    if (!textData) {
        return;
    }

    const [imagePromises, imagePromiseKeys, seperatedText] = textData;
    // End resolving characters into image promises

    let imageArray = await Promise.all(imagePromises); // Load all character images

    // Begin resizing images and coloring text
    [imageArray, textColor] = await colorText(message, imageArray, textColor);
    // End resizing images and coloring text

    // This just takes the chars out of an array and puts them into a dict
    const charImages = mapArraysToDict(imagePromiseKeys, imageArray);

    // Begin calculating character positions
    const posData = await calcCharacterPositions(seperatedText, charImages, message);
    if (!posData) {
        return;
    }

    const [characterPositions, currentMaxLineWidth, currentHeight] = posData;
    // End calculating character positions


    // Begin stitching text
    let stitchedText = await stichText(currentMaxLineWidth, currentHeight, seperatedText, charImages, message, characterPositions);
    // End stitching text

    // Begin drawing chords, head, and triangle
    stitchedText = await addDetails(stitchedText, currentMaxLineWidth, currentHeight, headBuffer, message, mouthHeight);
    // End drawing chords, head, and triangle

    global.message.send(`IMAGE`, message.channel, await stitchedText.png().toBuffer(), `text.png`);

    // just debug stuff afterwards
    // fs.writeFileSync(`final.png`, await stitchedText.png().toBuffer());
    // fs.writeFileSync(`out.png`, headBuffer);

    // console.debug(seperatedText);
    // console.debug(characterPositions);
    // let imageIndex = 0;
    // for (var i in seperatedText) {
    //     if (!charImages[seperatedText[i]]) continue;
    //     if (Array.isArray(charImages[seperatedText[i]])) {
    //         fs.writeFileSync(`${imageIndex++}.png`, charImages[seperatedText[i]][0].data);
    //     } else {
    //         fs.writeFileSync(`${imageIndex++}.png`, charImages[seperatedText[i]].data);
    //     }
    // }
}

async function createGIF(stitchedTextFrames) {
    const encoder = new GIFEncoder(stitchedTextFrames[0].info.width, stitchedTextFrames[0].info.height);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(GIF_DELAY); // 10 frames at 60 fps
    encoder.setQuality(1);

    for (const i in stitchedTextFrames) {
        encoder.addFrame(stitchedTextFrames[i].data);
    }

    encoder.finish();

    // console.debug(stitchedTextFrames[0].info.width);
    // console.debug(stitchedTextFrames[0].info.height);
    // fs.writeFileSync(`frame1.dat`, stitchedTextFrames[0].data);
    // fs.writeFileSync(`frame2.dat`, stitchedTextFrames[1].data);
    // fs.writeFileSync(`frame3.dat`, stitchedTextFrames[2].data);

    return encoder.out.getData();
}

async function asay(message, character, text) {
    if (text.length > MAX_CHARACTERS) {
        global.message.send(`TOOLONG`, message.channel);
        return;
    }

    // Begin getting buffer of image for head
    const headData = await getCharacterHead(message, character);
    if (!headData) {
        return;
    }

    let [headBuffer, mouthHeight, textColor] = headData;
    // End getting buffer of image for head

    // Begin resolving characters into image promises
    const textData = await resolveText(text);
    if (!textData) {
        return;
    }

    const [imagePromises, imagePromiseKeys, seperatedText] = textData;
    // End resolving characters into image promises

    let imageArray = await Promise.all(imagePromises); // Load all character images

    // Begin resizing images and coloring text
    [imageArray, textColor] = await colorText(message, imageArray, textColor);
    // End resizing images and coloring text

    // This just takes the chars out of an array and puts them into a dict
    const charImages = mapArraysToDict(imagePromiseKeys, imageArray);

    // Begin calculating character positions
    const posData = await calcCharacterPositions(seperatedText, charImages, message);
    if (!posData) {
        return;
    }

    const [characterPositions, currentMaxLineWidth, currentHeight] = posData;
    // End calculating character positions


    // Begin stitching text
    let stitchedTextFrames = await stichTextAnimated(currentMaxLineWidth, currentHeight, seperatedText, charImages, message, characterPositions);
    // End stitching text

    // Begin drawing chords, head, and triangle
    stitchedTextFrames = await addDetailsAnimated(stitchedTextFrames, currentMaxLineWidth, currentHeight, headBuffer, message, mouthHeight);
    // End drawing chords, head, and triangle

    stitchedTextFrames = await Promise.all(stitchedTextFrames.map(addOpacity));

    // Begin encoding GIF // 36393E
    const finalGIF = await createGIF(stitchedTextFrames);
    // End encoding GIF

    global.message.send(`IMAGE`, message.channel, finalGIF, `text.gif`);

    // just debug stuff afterwards
    // fs.writeFileSync(`final.gif`, finalGIF);
    // fs.writeFileSync(`frame1.png`, await sharp(stitchedTextFrames[0].data, {raw: stitchedTextFrames[0].info}).png().toBuffer());
    // fs.writeFileSync(`frame2.png`, await sharp(stitchedTextFrames[1].data, {raw: stitchedTextFrames[1].info}).png().toBuffer());
    // fs.writeFileSync(`frame3.png`, await sharp(stitchedTextFrames[2].data, {raw: stitchedTextFrames[2].info}).png().toBuffer());

    // console.debug(seperatedText);
    // console.debug(characterPositions);
    // let imageIndex = 0;
    // for (var i in seperatedText) {
    //     if (!charImages[seperatedText[i]]) continue;
    //     if (Array.isArray(charImages[seperatedText[i]])) {
    //         fs.writeFileSync(`${imageIndex++}.png`, charImages[seperatedText[i]][0].data);
    //     } else {
    //         fs.writeFileSync(`${imageIndex++}.png`, charImages[seperatedText[i]].data);
    //     }
    // }
}


function getRandomInt(min, max) { // Used in random command
    return Math.floor(Math.random() * (max - min) + min);
}

async function addMockTint(buffer, rgbBuffer) {
    const image = sharp(buffer); // buffer contains a png buffer of the image I want to apply the effect to
    const metadata = await image.metadata();

    metadata.background = rgbBuffer; // RGB values
    const tintedImage  = await sharp(buffer)
        .boolean(await sharp({create: metadata}).png().toBuffer(), `and`)
        .png().toBuffer({resolveWithObject: true});

    // const tintedImage = await sharp(buffer).tint(rgbBuffer).png().toBuffer({resolveWithObject: true});

    return tintedImage;
}

async function addOpacity(image) {
    const metadata = await image.metadata();

    metadata.background = new Buffer([0, 0, 0, 0xFF]);

    const colorImageBuffer = await image.clone()
        .boolean(await sharp({
            create: metadata
        }).png().toBuffer(), `or`)
        .raw().toBuffer({
            resolveWithObject: true
        });


    return colorImageBuffer;
}

function mapArraysToDict(keys, values) {
    const result = {};
    for (var i in keys) {
        const value = values[i];

        result[keys[i]] = value;
    }

    return result;
}