"use strict";

/** Parameter requirements .reqParameters
 * STRING - Anything
 * WORD - A word
 * ID - Correctly formatted snowflake id
 * MEMBER - Member of guild
 * MEMBERDEFAULT - Member of guild; Has special case where if the user doesn't put in the value, instead of erroring it defaults to the user executing the command
 * USER - User
 * NUMBER - Parseable number
 * EMOJI - Valid custom emoji, returns emoji id
 * GUILDCHANNEL - Channel in guild
 */

/** User status requirements .reqStatus
  * INVC - User is in a voice channel
  */

/** Flags handler .potentialFlags
 * Put an array of flags to be detected - Ex: ["-help", "-loud"]
 * Detected flags are put in message.flags - Ex: message.flags = {help: true, loud: true}
 * Put an array of flags to be detected with resolvables - Ex: ["-help", ["-loud", `NUMBER`]]
 * Detected flags are put in message.flags - Ex: message.flags = {help: true, loud: 45}
 */

const discordUtil = require(`../util/discordUtil.js`);

module.exports.init = async function() {
    const executorInput = await global.commands.getExecutorInput();
    await executorInput.addListener(1, checkParameters);
};

async function checkParameters(event) {
    if (event[0] != `command`) {
        return event;
    }

    const message = event[3];
    const parameters = Array.from(event[2]);
    const reqParameters = event[1].reqParameters;
    let reqStatus = event[1].reqStatus;
    let potentialFlags = event[1].potentialFlags;

    message.flags = {}; // Make every command have a flags object to prevent errors
    if (potentialFlags) {
        potentialFlags = typeof potentialFlags === `string` ? [potentialFlags] : potentialFlags; // Convert to array if it's just one

        for (var g in potentialFlags) {
            const potentialFlag = potentialFlags[g];
            const indexOfFlag = parameters.indexOf(Array.isArray(potentialFlag) ? potentialFlag[0] : potentialFlag);


            if (indexOfFlag === -1) {
                continue;
            }

            if (Array.isArray(potentialFlag)) {
                const option = parameters[indexOfFlag + 1];
                const parseKeys = typeof potentialFlag[1] === `string` ? [potentialFlag[1]] : potentialFlag[1];
                let data;

                for (var l in parseKeys) {

                    data = await resolveData(option, parseKeys[l], message);
                    if (data) {

                        message.flags[potentialFlag[0].substr(1)] = data; // Removes first character of flags to get rid of dash
                        parameters.splice(indexOfFlag, 2);
                        break;
                    }
                }

                if (!data) {
                    global.message.send(`INVALIDFLAGS`, message.channel, potentialFlag[0], parseKeys);
                    return null;
                }
            } else {

                message.flags[potentialFlag.substr(1)] = true; // Removes first character of flags to get rid of dash
                parameters.splice(indexOfFlag, 1);
            }
        }
    }

    if (reqParameters) {
        if (!Array.isArray(event[1].reqParameters)) {
            console.warn(`Invalid parameter setup for command ${event[2][0]}`);
            return event;
        }

        parameters.splice(0, 1);

        message.parsedParameters = []; // For seeing what they were parsed as

        for (var i in reqParameters) {
            // Begin special cases
            if (reqParameters[i] === `STRING` && parseInt(i) === reqParameters.length - 1) {

                event[2][parseInt(i) + 1] = parameters.slice(i).join(` `);

                message.parsedParameters.push(reqParameters[i]);

                continue;
            }
            // End special cases

            if (!Array.isArray(reqParameters[i]))
                reqParameters[i] = [reqParameters[i]];

            if (!parameters[i] && reqParameters[i][0] !== `MEMBERDEFAULT`) { // Missing required parameter // MEMBERDEFAULT has a special case if there is no parameter
                global.message.send(`MISSPARAMS`, message.channel);
                return null;
            }

            let data;
            for (var j in reqParameters[i]) {
                data = await resolveData(parameters[i], reqParameters[i][j], message);
                if (data) {
                    event[2][parseInt(i) + 1] = data; // i + i because we splice out the first part of parameters later
                    message.parsedParameters.push(reqParameters[i][j]);
                    break;
                }
            }

            if (!data) {
                global.message.send(`INVALIDPARAMS`, message.channel, [reqParameters[i]]);
                message.parsedParameters = undefined;
                return null;
            }
        }
    }

    if (reqStatus) {
        if (!Array.isArray(reqStatus)) {
            reqStatus = [reqStatus];
        }

        for (var k in reqStatus) {
            if (!await checkStatus(reqStatus[k], message)) {
                return null;
            }
        }
    }

    return event;
}

async function checkStatus(status, message) {
    switch(status.toUpperCase()) {
        case `INVC`: {
            const invc = Boolean(message.member.voice.channel);
            !invc && global.message.send(`JOINVC`, message.channel);
            return invc;
        }
    }
}

async function resolveData(data, key, message) {
    let resolved;
    switch(key.toUpperCase()) {
        case `MEMBER`:
            resolved = await discordUtil.resolveMember(data, message.guild);
            break;
        case `USER`:
            resolved = (await discordUtil.resolveMember(data, message.guild)).user;
            break;
        case `SNOWFLAKEID`:
            resolved = (await discordUtil.isSnowflakeId(data)) ? data : undefined;
            break;
        case `NUMBER`:
            resolved = isNaN(data) ? undefined : parseInt(data);
            break;
        case `EMOJI`:
            resolved = await discordUtil.resolveEmojiId(data);
            break;
        case `RGBCODE`:
            resolved = hexToRgb(data);
            break;
        case `GUILDCHANNEL`:
            resolved = await discordUtil.resolveChannel(data, message.guild);
            break;
        case `MEMBERDEFAULT`:
            resolved = data ? await discordUtil.resolveMember(data, message.guild) : message.member;
            break;
        default:
            resolved = data;
    }

    return resolved;
}

function hexToRgb(hex) { // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}