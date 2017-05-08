const index = require('./index');
const botUtils = require('./modules/bot/botUtils');
const requestify = require('requestify');
const _ = require('underscore');

let permLevels = {1: 'ADMINISTRATOR', 2: 'MANAGE_GUILD', 3: 'MANAGE_CHANNELS', 4: 'MANAGE_MESSAGES'}

exports.getAllGuildTableNames = function () {

    return new Promise((resolve, reject) => {
        let query = `select table_name from information_schema.tables`;
        index.db.query(query, (err, rows, fields) => {
            if (err) {
                console.error(`Error while getting tables, Error: ${err.stack}`);
                reject(err);
                return;
            }

            let results = [];
            rows.forEach(table => {

                if (table.table_name.startsWith('id_')) results.push(table.table_name);
            });

            resolve(results);
        })
    })
};

/**
 * Creates the log table for each guild
 * @param guild
 * @returns {Promise}
 */
exports.createTable = function (guild) {

    return new Promise((resolve, reject) => {
        exports.doesTableExist(guild.id).then((exists) => {
            if (exists) return;

            console.log(`Creating table for ${guild.name}`);

            let query = `CREATE TABLE IF NOT EXISTS ${index.config.sql_db}.id_${guild.id}
(
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerName TEXT,
    ChannelID VARCHAR(30),
    ChannelName TEXT,
    AuthorID VARCHAR(30),
    AuthorName TEXT,
    Message LONGTEXT,
    MessageID VARCHAR(30),
    Date DATETIME,
    Vip TINYINT,
    Deleted TINYINT
);`;

            index.db.query(query, function (err, rows, fields) {
                if (err) {
                    console.error(`Error trying to create database, Error ${err.stack}`);
                    reject(err);
                    return;
                }
                console.log(`Successfully created database for ${guild.name}!`);
                resolve();
            });

            exports.addConfigEntry(guild);
        })
    })
};

exports.addConfigEntry = function (guild) {
    return new Promise((resolve, reject) => {
        let configQuery = `INSERT INTO Configs (ServerId, ServerName, ViewAnyChannelPerm, ViewDeletedMsgsPerm, MaintainerRoleId) VALUES (${guild.id}, ${index.db.escape(guild.name)}, 1, 1, ${guild.ownerID})`;

        index.db.query(configQuery, function (err, rows, fields) {
            if (err) {
                console.error(`Error trying to insert config, Error ${err.stack}`);
                reject(err);
                return;
            }
            console.log(`Successfully created config for ${guild.name}!`);
            resolve();
        });
    })
};

exports.doesTableExist = function (guildId) {

    return new Promise((resolve, reject) => {

        let tableName = `id_${guildId}`;

        index.db.query(`select table_name from information_schema.tables where table_name = '${tableName}';`, function (err, rows, fields) {
            try {

                if (rows.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }

            } catch (err) {
                console.error(`Error checking if table exists, Error: ${err.stack}`);
                reject(err);
            }
        });
    })
};

exports.uploadToHaste = async function (messages) {

    try {

        let response = await requestify.post(url.resolve('https://hastebin.com', 'documents'), {
            "Messages": messages
        });

        let res = JSON.parse(response.body);
        return res.key || res;

    } catch (err) {
        console.error(`Failed to upload: ${err.stack}`);
    }

};

exports.createConfigTable = function () {

    return new Promise((resolve, reject) => {
        let query = `CREATE TABLE IF NOT EXISTS ${index.config.sql_db}.Configs
(
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerId VARCHAR(30),
    ServerName TEXT,
    ViewAnyChannelPerm INT(11),
    ViewDeletedMsgsPerm INT(11),
    MaintainerRoleId VARCHAR(30)
);`;
        index.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`Error trying to create database, Error ${err.stack}`);
                reject(err);
                return;
            }

            resolve();
        })
    })
};

exports.createListTable = function () {
    if (index.config.needsSetup != 1) return;

    return new Promise((resolve, reject) => {
        let query = `CREATE TABLE IF NOT EXISTS ${index.config.sql_db}.BotLists
(
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerId VARCHAR(30),
    ServerName TEXT,
    UserId VARCHAR(30),
    Username TEXT,
    Blacklist TINYINT,
    VipList TINYINT
);`;

        index.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`Error trying to create database, Error ${err.stack}`);
                reject(err);
                return;
            }

            resolve();
        })
    })
};

exports.countGuildMessages = function (guildId) {
    return new Promise((resolve, reject) => {
        requestify.get(`${index.config.host}/api/read?serverid=${guildId}&count=true`).then(res => {
            try {
                let body = JSON.parse(res.body);
                resolve(body.message);

            } catch (err) {
                console.error(`An error has occurred trying to count messages, Error: ${err.stack}`);
                reject(err);
            }
        })
    })
};

exports.getUserVisibleGuilds = function (userId) {

    return new Promise((resolve, reject) => {

        let results = [];
        let tablePromises = [];
        let channelPermPromises = [];

        let botGuilds = botUtils.getBotGuilds();

        for (let x = 0; x < botGuilds.length; x++) { //TODO fix with promise.all
            let guild = botGuilds[x][1];

            tablePromises.push(exports.doesTableExist(guild.id));
            channelPermPromises.push(exports.checkGuildChannelPerm(guild, userId));

        }

        Promise.all(tablePromises).then(tableExists => {
            Promise.all(channelPermPromises).then(allowedPerm => {

                for (let y = 0; y < botGuilds.length; y++) {

                    let guild = botGuilds[y][1];
                    let exists = tableExists[y];
                    let allowed = allowedPerm[y];

                    if (exists && allowed) {

                        let guildObj = {
                            id: guild.id,
                            name: guild.name,
                            members: guild.memberCount,
                            icon: guild.icon,
                            region: guild.region
                        };

                        // Checks perms
                        results.push(guildObj);
                    }
                }
                resolve(results);
            }).catch(err => {
                reject(err)
            })
        }).catch(err => {
            reject(err)
        })
    });
};

exports.getUserVisibleGuildChannels = function (userId, guildId) {

    let results = [];
    botUtils.getGuildChannels(guildId).forEach(channel => {

        if (exports.checkUserChannelPerm(channel, userId)) {

            let data = {name: channel.name.capitalizeFirstLetter().replaceAll('_', ' '), id: channel.id};

            results.push(data);
        }
    });
    return results;
};

exports.convertPermLevel = function (level) {
    return permLevels[level] || null;
};

exports.getGuildPerm = function (guild) {

    return new Promise((resolve, reject) => {
        let query = `SELECT ViewAnyChannelPerm FROM Configs WHERE ServerId = ${guild.id}`;
        index.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`An error as occurred trying to fetch guild perm level, Error: ${err.stack}`);
                reject(err);
                return;
            }
            if (rows.length === 0) {
                exports.addConfigEntry(guild);
                resolve(exports.convertPermLevel(1)); // If its null, set it to admin
                return;
            }

            let permLevel = rows[0].ViewAnyChannelPerm;

            resolve(exports.convertPermLevel(permLevel));
        })
    })
};

exports.getGuildDeletedMsgsPerm = function (guild) {
    return new Promise((resolve, reject) => {

        let query = `SELECT ViewDeletedMsgsPerm FROM Configs WHERE ServerId=${guild.id}`;

        index.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`An error as occurred trying to fetch guild deleted messages perm level, Error: ${err.stack}`);
                console.log(`Error query: ${query}`);
                reject(err);
                return;
            }

            if (rows.length === 0) {
                exports.addConfigEntry(guild);
                resolve(exports.convertPermLevel(1)); // If its null, set it to admin
                return;
            }

            let permLevel = rows[0].ViewDeletedMsgsPerm;

            resolve(exports.convertPermLevel(permLevel));
        })
    })
};

exports.getGeneralRoleId = function (guildId) {

    return new Promise((resolve, reject) => {
        let query = `SELECT GeneralRoleId FROM Configs WHERE ServerId=${guildId}`;
        index.db.query(query, function (err, rows, fields) {
            if (err){
                console.error(`An error occurred trying to fetch general role Id, Error: ${err.stack}`);
                reject(err);
                return;
            }

            let guild = botUtils.getGuildFromId(guildId);
            if (!guild){
                console.error(`Invalid guild, Id: ${guildId}`);
                return;
            }

            if (rows.length === 0){
                exports.addConfigEntry(guild);
                resolve(guild.defaultRole.id);
            }else {
                let roleId = rows[0].GeneralRoleId;
                resolve(roleId);
            }
        })
    });
};

exports.checkUserChannelPerm = function (channel, userId) {
    try {

        if (index.config.maintainer_id.indexOf(userId) > -1 || userId == 182210823630880768) {
            return true;
        }

        let user = botUtils.getUserFromID(userId);
        if (user) {
            return botUtils.hasPermission(channel, user, 'READ_MESSAGES');

        } else return false;
    } catch (err) {
        console.error(`An error occurred trying to check user channel perms, Error: ${err.stack}`);
        return false;
    }
};

exports.checkGuildChannelPerm = function (guild, userId) {
    return new Promise((resolve, reject) => {
        try {
            if (!guild) reject();

            exports.getGuildPerm(guild).then(perm => {

                if (index.config.maintainer_id.indexOf(userId) > -1 || userId == 182210823630880768) {
                    resolve(true);
                    return;
                }

                let guildMember = guild.members.get(userId);
                if (guildMember) {

                    let hasPerm = guildMember.hasPermission(perm);
                    resolve(hasPerm);
                } else resolve(false);
            })
        } catch (err) {
            console.error(`An error occurred trying to check guild perms, Error: ${err.stack}`);
            reject(err);
        }
    })
};

exports.checkGuildDeletedMsgsPerm = function (guild, userId) {
    return new Promise((resolve, reject) => {
        try {
            if (!guild) reject();

            exports.getGuildDeletedMsgsPerm(guild).then(perm => {
                if (index.config.maintainer_id.indexOf(userId) > -1 || userId == 182210823630880768) {
                    resolve(true);
                    return;
                }

                let guildMember = guild.members.get(userId);
                if (guildMember) {

                    let hasPerm = guildMember.hasPermission(perm);
                    resolve(hasPerm);
                } else resolve(false);
            })
        } catch (err) {
            console.error(`An error occurred trying to check deleted msgs perm, Error: ${err.stack}`);
            reject(err);
        }
    })
};

exports.getRoundedUptime = uptime => {
    return uptime > 86400 ? (`${Math.floor(uptime / 86400)}d`) : (`${Math.floor(uptime / 3600)}h`);
};