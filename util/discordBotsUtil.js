'use strict';

const request = require(`request`);
const token = require(`../config/token.js`);

module.exports.postGuildCount = async function(count) {
    return await new Promise((resolve, reject) => {
        request({
            method: `POST`,
            json: true,
            headers: {
                Authorization: token.discordBotsToken
            },
            url: `https://bots.discord.pw/api/bots/318558676241874945/stats`,
            body: {"server_count": count}
        }, (error, response, body) => {
            if (error) {
                reject(error);
            }
        });
        // request({
        //     method: `POST`,
        //     json: true,
        //     headers: {
        //         Authorization: token.discordBots2Token
        //     },
        //     url: `https://discordbots.org/api/bots/318558676241874945/stats`,
        //     body: {"server_count": count}
        // },  (error, response, body) => {
        //     if (error) {
        //         reject(error);
        //     }
        // });
    });
};
