// Functions for interacting with soundcloud and downloading tracks

"use strict";

const request = require(`request`);

module.exports.getTrackInfo = async function (resolvable) {
    let rawInfo;

    rawInfo = await getSongInfoFromUrl(resolvable);

    if (!rawInfo) {
        rawInfo = await getSongInfoFromQuery(resolvable);
    }

    if (!rawInfo) {
        return;
    }

    const streamUrl = await getStreamUrl(rawInfo.id);
    if (!streamUrl) {
        return;
    }

    return {
        title: `${rawInfo.user.username} - ${rawInfo.title}`,
        duration: rawInfo.duration,
        url: streamUrl,
        id: rawInfo.id
    };
};

module.exports.getDetailedTrackInfoFromId = async function (id) {
    const rawInfo = await getSongInfoFromId(id);

    const info = {};
    info.id = rawInfo.id;
    info.title = rawInfo.title;
    info.duration = rawInfo.duration;
    info.artwork = rawInfo.artwork_url;
    info.description = rawInfo.description;
    info.creator = rawInfo.user.username;
    info.url = rawInfo.permalink_url;
    info.genre = rawInfo.genre;

    return info;
};

// Note: Most of the code below was taken and modified from the npm library soundcloud-dl

async function getStreamUrl(id) {
    return await new Promise(async (resolve, reject) => {
        request(`https://api.soundcloud.com/i1/tracks/${id}/streams?client_id=${(await getClientId())}`, function (error, response, body) {
            resolve(JSON.parse(body).http_mp3_128_url);
        });
    });
}


async function getSongInfoFromQuery(query) {
    return await new Promise(async (resolve, reject) => {
        request(`http://api.soundcloud.com/tracks?client_id=${(await getClientId())}&q=${query}`, (error, response, body) => {
            resolve(JSON.parse(body)[0]);
        });
    });
}

async function getSongInfoFromId(id) {
    return await new Promise(async (resolve, reject) => {
        request(`https://api.soundcloud.com/tracks/${id}?client_id=${(await getClientId())}`, (error, response, body) => {
            resolve(JSON.parse(body));
        });
    });
}

async function getSongInfoFromUrl(url) {
    if (!url) {
        return;
    }

    const options = {
        url: url,
        headers: {
            'User-Agent': `User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36`
        }
    };

    return await new Promise((resolve, reject) => {
        request(options, async (error, response, body) => {
            if (!body) {
                resolve(null);
            } else {
                const id = body.split(`soundcloud://sounds:`)[1].split(`"`)[0];

                resolve(await getSongInfoFromId(id));
            }
        });
    });
}


let _latestAppBundle, _clientId;

async function getClientId() {
    if (_clientId) {
        return _clientId;
    }

    _latestAppBundle = await new Promise((resolve, reject) => {
        request(`https://soundcloud.com/`, (error, response, body) => {
            const spliter = `assets/app-`;
            let appUrl = body.split(spliter);
            appUrl[0] = appUrl[1].split(`"`);
            appUrl[0] = appUrl[0][appUrl[0].length - 1];
            appUrl[1] = appUrl[2].split(`"`)[0];
            appUrl = appUrl[0] + spliter + appUrl[1];
            resolve(appUrl);
        });
    });

    _clientId = await new Promise((resolve, reject) => {
        request(_latestAppBundle, (error, response, body) => {
            const clientId = body.split(`client_id`)[1].split(`"`)[1];

            resolve(clientId);
        });
    });

    return _clientId;
}