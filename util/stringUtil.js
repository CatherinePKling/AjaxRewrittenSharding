// Contains string manipulation functions

"use strict";

const moment = require(`moment`);

String.prototype.splice = function(start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

module.exports.capitalizeFirstLetter = async function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

module.exports.removeMentions = function (string) {
    return string.replace(`@`, ``);
};

module.exports.formatMillisecondsHHMMSS = function (milliseconds) {
    const duration = moment.duration(milliseconds);
    return Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(`:mm:ss`);
};

module.exports.ballProgressBar = function (percent, length) {
    return `▬`.repeat(length).splice(Math.floor((length - 2) * percent), 0, `🔘`);
};

module.exports.truncateWithEllipsis = function (string, maxLines) {
    const stringLines = getLines(string);
    const lines = string.length / 20 + stringLines.length; // Let's say 20 characters is a new line
    if (lines > maxLines)
        return stringLines.splice(0, maxLines).join(`\n`) + `...`;
    else
        return string;
};

function getLines(string) {
    return string.split(/\r\n|\r|\n/g);
}