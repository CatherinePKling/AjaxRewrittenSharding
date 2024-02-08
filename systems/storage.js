"use strict";

const mongoose = require(`mongoose`);

const token = require(`../config/token.js`);

const schemas = {
    'autoreaction' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Boolean
    }),
    'responses' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Mixed
    }),
    'botbans' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Array
    }),
    'prefix' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.String
    }),
    'logging' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.String
    }),
    'permissions' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Array
    }),
    'ping' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Number
    }),
    'ratelimit' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Array
    }),
    'shortcut' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Mixed
    }),
    'spamlimit' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Array
    }),
    'toggle' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Mixed
    }),
    'welcomeMessage' : new mongoose.Schema({
        _id: String,
        data: mongoose.Schema.Types.Mixed
    })
};

module.exports.init = async function() {
    // databases = {};

    mongoose.Promise = global.Promise;
    mongoose.connect(token.databaseUrl);
    const db = mongoose.connection;

    var cacheOpts = {
        max: 100,
        maxAge: 1000 * 60 * 2
    };
    require(`mongoose-cache`).install(mongoose, cacheOpts);

    await new Promise((resolve, reject) => {
        db.on(`error`, (err) => {
            console.severe(`Error connecting to MongoDB database`);
            console.debug(err);
            reject();
        });

        db.on(`open`, () => {
            console.log(`Successfully connected to MongoDB database`);
            resolve();
        });
    });

    for (const schema in schemas) {
        schemas[schema].statics.set = async function (id, data) {
            return await new Promise(async (resolve, reject) => {
                this.findByIdAndUpdate(id, {
                    data: data
                }, {
                    upsert: true
                }, (err, database) => {
                    if (err) {
                        console.warn(`Error updating database with name ` + id);
                        console.debug(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        };

        schemas[schema].statics.get = async function (id, data) {
            return await new Promise(async (resolve, reject) => {
                this.findById(id, (err, database) => {
                    if (err) {
                        console.warn(`Error updating database with name ` + id);
                        console.debug(err);
                        reject(err);
                    } else {
                        resolve(database && database.data);
                    }
                });
            });
        };

        schemas[schema].statics.setDefault = async function (id, data) {
            return await new Promise(async (resolve, reject) => {
                this.findById(id, (err, database) => {
                    if (err) {
                        console.warn(`Error updating database with name ` + id);
                        console.debug(err);
                        reject(err);
                    } else {
                        if (!database || database.data === undefined) {
                            this.findByIdAndUpdate(id, {
                                data: data
                            }, {
                                upsert: true
                            }, (err, database) => {
                                if (err) {
                                    console.warn(`Error updating database with name ` + id);
                                    console.debug(err);
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    }
                });
            });
        };

        schemas[schema].statics.update = async function (id, updateFunction) {
            return await new Promise(async (resolve, reject) => {
                this.findById(id, {
                    upsert: true
                }, async (err, database) => {
                    if (err) {
                        console.warn(`Error updating database with name ` + id);
                        console.debug(err);
                        reject(err);
                    } else {
                        const newData = await updateFunction.call(database.data, database.data);
                        this.findByIdAndUpdate(id, {
                            data: newData || database.data
                        }, {
                            upsert: true
                        }, (err, database) => {
                            if (err) {
                                console.warn(`Error updating database with name ` + id);
                                console.debug(err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        };

        schemas[schema] = mongoose.model(schema, schemas[schema]);
    }
};

module.exports.getDatabase = async function (schema) {
    return schemas[schema];
};

class Database {
    constructor(data) {
        this.data = data || {};
    }

    async get(key) {
        return this.data[key];
    }

    async reset() {
        this.data = {};
    }

    async set(key, data) {
        this.data[key] = data;
    }

    async setDefault(key, defaultData) {
        if (this.data[key] === undefined) {
            this.data[key] = defaultData;
        }
    }

    async update(key, updateFunction) {
        const newData = await updateFunction.call(this.data[key], this.data[key]);
        if (newData != undefined) {
            this.data[key] = newData;
        }
    }
}

module.exports.Database = Database;
