// Contains functions for interacting with voiceConnections and playing streams

"use strict";


const ffmpeg = require(`fluent-ffmpeg`);
const ytdl = require(`ytdl-core`);

const https = require(`https`);
const stream = require(`stream`);
const miscConfig = require(`../config/misc.js`);

module.exports.playYoutubeVideo = async function (connection, id, options = {}) {
    console.log("15");
    const rawAudioStream = ytdl(`https://www.youtube.com/watch?v=${id}`, {filter: `audioonly`, highWaterMark: 1 << 25});
    //const rawAudioStream = ytdl(id, {filter: `audioonly`});
    console.log("16");
    return await filterAndPlayStream(connection, rawAudioStream, options);
};

module.exports.playSoundcloudTrack = async function (connection, url, options = {}) {
    const mp3Stream = await new Promise((resolve, reject) => {
        https.get(url, function (response) {
            resolve(response);
        });
    });

    return await filterAndPlayStream(connection, mp3Stream, options);
};

async function filterAndPlayStream(connection, rawAudioStream, options) {
    let audioStream, passStream;
    console.log("17");
    try {
        console.log("18");
        if (options.audioFilters || options.complexFilters) {

            passStream = new stream.PassThrough();

            audioStream = ffmpeg(rawAudioStream)
                .withAudioCodec(`libvorbis`);


            options.audioFilters && audioStream.audioFilters(options.audioFilters); // Add audio filters
            options.complexFilters && audioStream.complexFilter(options.complexFilters);


            audioStream.on(`end`, () => console.log(`Finished!`))
                .on(`error`, (err) => console.warn(`Error in audiostream`, err))
                .format(`webm`)
                .pipe(passStream, { // Pipe to voice connection
                    end: true
                });

        } else {
            console.log("19");
            passStream = rawAudioStream;
        }

        audioStream && audioStream.on(`error`, error => {
            console.log("20");
            console.warn(`Error in stream.`, error);
        });
    } catch (err) {
        console.warn(`Error playing song`, err);
    }
    console.log("21");
    //return connection.play(passStream, {seek: 0, volume: 1 , passes: miscConfig.playStreamPasses});
    return connection.play(passStream, {seek: 0, volume: 1 , passes: miscConfig.playStreamPasses});
}