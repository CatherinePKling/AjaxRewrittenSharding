'use strict';

const request = require(`request`);

module.exports.requestImage = async function(url) {
    return await new Promise((resolve, reject) => {
        request.get({ url: url, encoding: null }, (err, res, body) => { // Encoding: null causes it to return the raw buffer
            if (err) resolve();

            resolve(body);
        });
    });
};