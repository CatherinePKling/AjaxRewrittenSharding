"use strict";


const request = require(`request`);
const nodecache = require(`node-cache`);
const listings = new nodecache();

module.exports.getListing = async function (subreddit, options = {}) { // Amount is not guranteed to be accurate
    subreddit.replace(/^\/?r\//, ``); // Prevents errors

    switch (options.type) {
        case `hot`:
        case `h`:
        default:
            options.type = `hot`;
            break;
        case `new`:
        case `n`:
            options.type = `new`;
            break;
        case `top`:
        case `t`:
            options.type = `top`;
            break;
        case `controversial`:
        case `c`:
            options.type = `controversial`;
            break;
        case `rising`:
        case `r`:
            options.type = `rising`;
    }

    let listing = await getCachedListing(subreddit, options.nsfw, options.type);
    if (listing) {
        return listing;
    }


    if (!options.nsfw) { // Get sfw posts only, check to see if subreddit is nsfw
        const aboutData = getAboutData(subreddit);
        if (!aboutData) {
            return;
        }

        if (aboutData.over18) {
            return;
        }
    }

    options.amount = options.amount || 50;


    listing = await getMultipleListings(subreddit, options.type, options.amount);
    listing = await cleanListing(listing);

    if (!options.nsfw) {
        listing = await removeNSFW(listing);
    }

    setCachedListing(subreddit, options.nsfw, options.type, listing);

    return listing;
};

async function removeNSFW(listing) {
    return listing.filter(post => post.data && !post.data.over_18);
}

async function cleanListing(listing) {
    return listing.children.filter(post => post.kind && post.kind === `t3`); // Remove everything that isn't a link
}

async function getCachedListing(subreddit, nsfw, type) {
    return listings.get(`${subreddit}_${nsfw ? `nsfw` : `sfw`}_${type}`);
}

async function setCachedListing(subreddit, nsfw, type, listing) {
    return listings.set(`${subreddit}_${nsfw ? `nsfw` : `sfw`}_${type}`, listing, 3600);
}

async function getAboutData(subreddit) {
    return await new Promise((resolve, reject) => {

        request(`https://www.reddit.com/r/${subreddit}/about.json`, function (error, response, body) {
            if (error) {
                console.log(error);
                resolve(null);
                return;
            }

            try {
                var about = JSON.parse(body);
            } catch (exception) {
                resolve(null);
                return;
            }

            if (about.data != null) {
                resolve(about.data);
                return;
            }

            resolve(null);
        });
    });
}

async function getSingleListing(subreddit, type, amount, after) {
    return await new Promise((resolve, reject) => {
        request(`https://www.reddit.com/r/${subreddit}/${type}/.json?limit=${amount}${after ? `&after=${after}` : ``}`, function (error, response, body) {
            if (error) {
                console.warn(`Error getting reddit listing`, error);
                resolve(null);
                return;
            }

            try {
                var listing = JSON.parse(body);
            } catch (exception) {
                resolve(null);
                return;
            }

            resolve(listing.data);
        });
    });
}

async function getMultipleListings(subreddit, type, amount, currentListing = []) {
    if (amount <= 0) {
        return currentListing;
    } else {
        const listing = await getSingleListing(subreddit, type, amount, currentListing.after);

        if (!listing) {
            return currentListing;
        }
        listing.children.push.apply(listing.children, currentListing.children);
        currentListing = listing;
        amount -= 100;

        return await getMultipleListings(subreddit, type, amount, currentListing);
    }
}