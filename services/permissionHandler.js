"use strict";

/** Permission levels .permissionlevel:
  * SERVEROWNER - Only owner of server can run
    SERVERADMIN - Server Admins
    SERVERMANAGER - Manage channels permission
    SERVERMOD - Manage messages permission
    KICK - Kick members permission
    BAN - Ban members permission
    BOTADMIN - Server admin or has "ajax admin" role
    BOTMOD - Server mod or server admin or has "ajax mod" role
    OWNER - Bot owner
    ADMIN - Admins registered by owner
  */


let permissionStorage;

module.exports.init = async function() {
    permissionStorage = await global.storage.getDatabase(`permissions`);
    await permissionStorage.setDefault(`admins`, []);

    const executorInput = await global.commands.getExecutorInput();
    await executorInput.addListener(2, checkPermissions);

    await global.commands.registerCommand(`addadmin`, {run: addAdmin, permissionlevel: `OWNER`, reqParameters: [`MEMBER`]});
    await global.commands.registerCommand(`removeadmin`, {run: removeAdmin, permissionlevel: `OWNER`, reqParameters: [[`MEMBER`, `SNOWFLAKEID`]]});
};

async function addAdmin(message, newAdmin, guildId) {
    await permissionStorage.update(`admins`, async function() {
        this[guildId] = newAdmin.id;
    });

    global.message.send(`ADDADMIN`, message.channel, newAdmin.user.username);
}

async function removeAdmin(message, guildId) {
    const adminList = await permissionStorage.get(`admins`);
    const currentAdmin = adminList[guildId];

    if (currentAdmin) {
        await global.message.send(`REMOVEADMIN`, message.channel, currentAdmin);
        delete adminList[guildId];

        await permissionStorage.set(`admins`, adminList);
        return;
    } else {
        await global.message.send(`ADMINNOTFOUND`, message.channel);
        return;
    }
}

async function checkPermissions(event) {
    if (event[0] === `command` && event[1].permissionlevel) {
        const message = event[3];
        const member = message.member;
        const permission = event[1].permissionlevel;

        if (!member) { // Message sent in DM
            global.message.send(`NODM`, message.channel);

            return null;
        }

        if (await hasBotPermission(`OWNER`, member)) { // I can use all commands on all servers because I want to

            return event;
        }

        if (Array.isArray(permission)) {
            for (var i in permission) {

                if (await hasBotPermission(permission[i], member)) {

                    return event;
                }
            }

            global.message.send(`MULTIPERMS`, message.channel, permission);
            return null;
        } else {
            if (await hasBotPermission(permission, member)) {

                return event;
            } else {

                global.message.send(`PERM`, message.channel, permission);
                return null;
            }
        }
    }

    return event;
}

async function hasBotPermission(permission, member) {
    switch(permission.toUpperCase()) {
        case `SERVEROWNER`:
            return member.id === member.guild.owner.id;
        case `SERVERADMIN`:
            return member.hasPermission(`ADMINISTRATOR`);
        case `SERVERMANAGER`:
            return member.hasPermission(`MANAGE_CHANNELS`);
        case `SERVERMOD`:
            return member.hasPermission(`MANAGE_MESSAGES`);
        case `KICK`:
            return member.hasPermission(`KICK_MEMBERS`);
        case `BAN`:
            return member.hasPermission(`BAN_MEMBERS`);
        case `BOTADMIN`:
            return (await hasBotPermission(`SERVERADMIN`, member) || member.roles.find(role => role.name.toLowerCase() === `ajax admin`));
        case `BOTMOD`:
            return (await hasBotPermission(`SERVERMOD`, member) || await hasBotPermission(`BOTADMIN`, member) || member.roles.find(role => role.name.toLowerCase() === `ajax mod`));
        case `OWNER`:
            return member.id === `150699865997836288` || member.id === `378923808024690698`;
        case `ADMIN`: {
            const admins = await permissionStorage.get(`admins`);
            return admins[member.guild.id] === member.user.id;
        }
        case `NODM`:
            return true;
    }

    return false;
}