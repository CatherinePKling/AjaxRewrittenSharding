// Contains functions for interacting with the Youtube API

"use strict";

const urlParser = require(`url`);
const moment = require(`moment`);

const token = require(`../config/token.js`);

const google = require(`googleapis`);
const youtube = google.youtube({
    version: `v3`,
    auth: token.googleAPIToken
});

module.exports.getDetailedVideoInfoFromId = async function(id) {
    const params = {
        "part": `snippet, contentDetails`,
        "id": id
    };

    const rawInfo = await new Promise((resolve, reject) => {
        youtube.videos.list(params, function(err, response) {
            if (err) {
                resolve(null);
            } else {
                if (response.items && response.items[0]) {
                    resolve(response.items[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });

    const info = {};
    info.id = rawInfo.id;
    info.title = rawInfo.snippet.title;
    info.duration = moment.duration(rawInfo.contentDetails.duration).asMilliseconds();
    info.thumbnail = rawInfo.snippet.thumbnails.default.url;
    info.description = rawInfo.snippet.description;
    info.channel = rawInfo.snippet.channelTitle;

    return info;
};

module.exports.getPlaylistInfo = async function(resolvable) {
    let id;

    id = await getPlaylistId(resolvable);

    if (!id) {
        id = await searchPlaylist(resolvable);
    }

    const [info, videos] = await Promise.all([getPlaylistData(id), getVideoInfoFromPlaylist(id)]);

    if (info && videos) {
        return {info: info, videos: videos};
    } else {
        return null;
    }
};

async function getPlaylistData(id) {
    const params = {
        "part": `snippet`,
        "id": id
    };

    const rawInfo = await new Promise((resolve, reject) => {
        youtube.playlists.list(params, function(err, response) {
            if (err) {
                resolve(null);
            } else {
                if (response.items && response.items[0]) {
                    resolve(response.items[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });

    const info = {};
    info.id = rawInfo.id;
    info.title = rawInfo.snippet.title;

    return info;
}

async function getVideoInfoFromPlaylist(id) {

    let params = {
        "part" : `contentDetails, snippet`,
        "maxResults" : 50,
        "playlistId" : id
    };

    const rawData = await new Promise((resolve, reject) => { // This gets video ids and titles
        const videoInfoList = [];

        youtube.playlistItems.list(params, onReturn);

        function onReturn(err, response) {
            if (err) {
                resolve(videoInfoList);
            } else {
                videoInfoList.push.apply(videoInfoList, response.items); // push.apply is faster than concat

                if (response.nextPageToken) {
                    params.pageToken = response.nextPageToken;

                    youtube.playlistItems.list(params, onReturn);
                } else {
                    resolve(videoInfoList);
                }
            }
        }
    });

    const ids = rawData.map(data => data.contentDetails.videoId);

    params = {
        maxResults: 50,
        part: `contentDetails`
    };

    const videoDetailPromises = [];
    let currentIds;
    while ((currentIds = ids.splice(0, 50)).length > 0) { // This gets the durations
        params.id = currentIds.join(`,`);

        videoDetailPromises.push(new Promise((resolve, reject) => {
            youtube.videos.list(params, (err, response) => {
                if (err) {
                    reject(null);
                } else {
                    resolve(response.items);
                }
            });
        }));
    }
    let videoDetails;
    try {
        videoDetails = await Promise.all(videoDetailPromises); // Resolve all at once to get the data faster

        if (!videoDetails)
            return null;
    } catch(err) {
        return null;
    }

    // videoDetails is now [[50 youtube video info with contentDetails], [50 youtube video info with contentDetails], etc]

    let rawDataIndex = 0;
    for (var i in videoDetails) { // Video details has the next 50 video durations in order
        const fiftyContentDetails = videoDetails[i];
        if (!fiftyContentDetails)
            return null;

        for (var j in fiftyContentDetails) {
            rawData[rawDataIndex].contentDetails = fiftyContentDetails[j].contentDetails;

            rawData[rawDataIndex] = { // Formats the info into the proper format
                id: rawData[rawDataIndex].snippet.resourceId.videoId,
                title: rawData[rawDataIndex].snippet.title,
                duration: moment.duration(fiftyContentDetails[j].contentDetails.duration).asMilliseconds()
            };

            rawDataIndex++;
        }
    }

    return rawData;
}

async function searchPlaylist(query) {
    const params = {
        part: `snippet`,
        maxResults: 1,
        q: query,
        type: `playlist`
    };

    return await new Promise((resolve, reject) => {
        youtube.search.list(params, async (err, response) => {
            if (err) {
                resolve(null);
            } else {
                if (response.items && response.items[0]) {
                    resolve(response.items[0].id.playlistId);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

module.exports.getVideoInfo = async function(resolvable) {
    let id = await getVideoId(resolvable);
    if (!id) {
        id = await searchVideo(resolvable);
    }
    
    if (id) {
        return await getInfoFromVideoId(id);
    } else {
        return null;
    }
};

const videoRegex = /^[a-zA-Z0-9-_]{11}$/;
async function getVideoId(url) { // Tests to see if it's a valid youtube url
    const parsed = urlParser.parse(url, true); // Enable query parsing
    let id;

    if (parsed.hostname === `youtu.be`) { // Different hostnames store the video id in different places
        id = parsed.pathname.substr(1); // Use substr to remove the / at the beginning
    } else if ((parsed.hostname === `youtube.com` || parsed.hostname === `www.youtube.com`) && parsed.pathname === `/watch`) {
        id = parsed.query.v;
    }

    if (!videoRegex.test(id)) { // If id is invalid
        id = undefined;
    }

    return id;
}

async function searchVideo(query) {
    const params = {
        part: `snippet`,
        maxResults: 2, // Get two incase the first one is a livestream
        q: query,
        type: `video`
    };

    return await new Promise((resolve, reject) => {
        youtube.search.list(params, async (err, response) => {
            if (err) {
                console.log(err)
                console.debug(err)
                resolve(null);
            } else {
                if (response.items && response.items[0]) {
                    if (response.items[0].snippet.liveBroadcastContent === `none`) { // First option is a video
                        resolve(response.items[0].id.videoId);
                    } else if (response.items[1].snippet.liveBroadcastContent === `none`) { // First option isn't a video and second option is
                        resolve(response.items[1].id.videoId);
                    } else { // Both options aren't videos
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            }
        });
    });
}

async function getInfoFromVideoId(id) {
    const params = {
        "part": `snippet, contentDetails`,
        "id": id
    };
    
    const rawInfo = await new Promise((resolve, reject) => {
        youtube.videos.list(params, function(err, response) {
            if (err) {
                console.warn(`Error in youtube.videos.list in getInfoFromVideoId`, err);
                resolve(null);
            } else {
                if (response.items && response.items[0]) {
                    resolve(response.items[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });

    if (rawInfo === null) {
        return null;
    }
    
    if (rawInfo.contentDetails.regionRestriction) {
        if (rawInfo.contentDetails.regionRestriction.blocked && rawInfo.contentDetails.regionRestriction.blocked.includes(`US`)) { // Video is blocked in US
            return null;
        }

        if (rawInfo.contentDetails.regionRestriction.allowed && !rawInfo.contentDetails.regionRestriction.allowed.includes(`US`)) { // Video is blocked in US
            return null;
        }
    }
    
    const info = {};
    info.id = rawInfo.id;
    info.title = rawInfo.snippet.title;
    info.duration = moment.duration(rawInfo.contentDetails.duration).asMilliseconds();

    return info;
}

const playlistRegex = /^[a-zA-Z0-9-_]{13,34}$/;
async function getPlaylistId(url) {
    const parsed = urlParser.parse(url, true);
    let id;

    if ((parsed.hostname === `youtube.com` || parsed.hostname === `www.youtube.com`) && (parsed.pathname === `/watch` || parsed.pathname === `/playlist`)) {
        id = parsed.query.list;
    }

    if (!playlistRegex.test(id)) {
        id = undefined;
    }

    return id;
}
