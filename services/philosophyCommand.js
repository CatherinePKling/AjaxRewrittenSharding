'use strict';

const wiki = require(`wikijs`).default;
const cheerio = require(`cheerio`);
const request = require(`request`);

module.exports.init = async function() {
    await global.commands.registerCommand(`philosophy`, {
        run: philosophy,
        reqParameters: [`STRING`],
        userRatelimit: [2, 5000],
        helpCategory: `misc`,
        briefHelp: ` [wikipedia page] - Starts at the given wikipedia page and clicks the first link on each page until it reaches Philosophy or it loops.`,
        longHelp: ` {command} - 
Starts at the given wikipedia page and clicks the first link on each page until it reaches Philosophy or it loops. Put in "random" to start at a random page.`
    });
};

async function philosophy(message, query) {
    let startPage;

    if (query.toLowerCase() === `random`) {
        startPage = await wiki().random(1);

        if (startPage) {
            startPage = startPage[0];
        } else {
            await global.message.send(`ERRGETTINGPAGE`, message.channel);
            return;
        }
    } else if (query.toLowerCase() === `philosophy`) {
        await global.message.send(`INCEPTION`, message.channel);
        return;
    } else {
        startPage = await wiki().search(query, 1);

        if (startPage && startPage.results[0]) {

            startPage = startPage.results[0];
        } else {
            await global.message.send(`ERRNORESULTS`, message.channel, query);
            return;
        }
    }

    await global.message.send(`STARTPHILOSOPHY`, message.channel, startPage);

    const pastPages = [];
    let count = 1;

    const result = await processPage(startPage);

    await global.message.send(`PHILOSOPHY`, message.channel, pastPages, result);

    async function processPage(nextPage) { // Returns false on failure
        pastPages.push(nextPage);

        const html = await getWikiPageHTML(nextPage);

        if (!html) {
            return false;
        }

        let firstLink = await getFirstLink(html);

        if (!firstLink) {
            return `NONEWLINKS`;
        }

        firstLink = firstLink.replace(/ /g,`_`); // Replace spaces with underscores

        if (pastPages.includes(firstLink)) { // We found a loop
            pastPages.push(firstLink);
            return `LOOP`;
        } else if (firstLink === `Philosophy`) {
            pastPages.push(firstLink);
            return `PHILOSOPHY`;
        } else if (count > 100) {
            return `TOOBIG`;
        } else {

            count++;
            return await processPage(firstLink);
        }

    }
}

function getFirstLink(html) {
    let $;
    try {
        $ = cheerio.load(html);
    } catch (err) {
        return null;
    }

    let continueIteration = true;

    const elems = $(`div.mw-parser-output`).children(`ul, p`);
    let count = elems.length;

    if (count == 0) {
        return;
    }

    return new Promise((resolve, reject) => {
        elems.each(function (index) {
            $(this).html(strip_brackets($(this).html()));

            $(this).find(`a:not(span *, .extiw, .new)`).each(function(index2) {
                var hasTitle = false;
                var nextUrl = ``;

                if (this.attribs.href) {
                    nextUrl = this.attribs.href;
                }

                if (this.attribs.title) {
                    hasTitle = true;
                }

                if (!hasTitle) {
                    return continueIteration;
                }

                continueIteration = false;
                resolve(nextUrl.substring(6));

                return continueIteration;
            });

            if (!--count && continueIteration) {
                resolve(null);
            }

            return continueIteration;
        });
    });
}

function getWikiPageHTML(page) {
    return new Promise((resolve, reject) => {
        request(`https://en.wikipedia.org/wiki/` + encodeURIComponent(page), function (error, response, body) {
            if (error) {
                console.warn(`Error getting wikipedia page:`, error);
                resolve(null);
            }

            resolve(body);
        });
    });
}

function strip_brackets(element) {
    let d = 0;
    let k = 0;
    let out = ``;

    for (var i = 0; i < element.length; i++) {
        if (d < 1) {
            if (element[i] === `>`) k -= 1;
            if (element[i] === `<`) k += 1;
        }

        if (k < 1) {
            if (element[i] === `(`) d += 1;

            if (d > 0) out += ` `;
            else out += element[i];

            if (element[i] === `)`) d -= 1;
        } else {
            out += element[i];
        }
    }

    return out;
}