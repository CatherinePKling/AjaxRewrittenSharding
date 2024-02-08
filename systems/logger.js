"use strict";

const chalk = require(`chalk`);
const { inspect } = require(`util`);

module.exports.init = async function() {
    const original = {
        log: console.log,
        error: console.error,
        info: console.info,
        debug: console.debug
    };

    console._original = original;

    function _log(prefix, message) {
        (console._original.log || console.log)(`${global.client.shard.ids} ${prefix} ${message}`);
    }

    console.log = (message) => {
        _log(chalk.green(`\u2713`), message);
    };

    console.warn = (message, error) => {
        _log(chalk.yellow(`!`), message);
        error && console.debug(error);
    };

    console.severe = (message, error) => {
        _log(chalk.red(`!`), message);
        error && console.debug(error);
    };

    console.debug = (message) => {
        console.log(inspect(message));
    };
};