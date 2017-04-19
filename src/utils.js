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
    Date DATE,
    Vip TINYINT
);`;

            index.db.query(query, function (err, rows, fields) {
                if (err) {
                    console.error(`Error trying to create database, Error ${err.stack}`);
                    reject(err);
                    return;
                }
                console.log(`Successfully created database for ${guild.name}!`);

                let configQuery = `INSERT INTO Configs (ServerId, ServerName, ViewAnyChannelPerm, MaintainerRoleId) VALUES (${guild.id}, ${index.db.escape(guild.name)}, 1, ${guild.ownerID})`;
                console.log(configQuery);
                index.db.query(configQuery, function (err, rows, fields) {
                    if (err) {
                        console.error(`Error trying to insert config, Error ${err.stack}`);
                        reject(err);
                        return;
                    }
                    console.log(`Successfully created config for ${guild.name}!`);
                });

                resolve();
            });
        })
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
    ViewAnyChannelPerm INT,
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
        let botGuilds = botUtils.getBotGuilds();

        for (let x = 0; x < botGuilds.length; x++) {
            let guild = botGuilds[x][1];

            exports.doesTableExist(guild.id).then(exists => {

                if (exists) {

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
                if ((x + 1) == botGuilds.length) resolve(results);
            });
        }
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
    return _.pick(permLevels, level) || null;
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

            resolve(rows[0].ViewAnyChannelPerm);
        })
    })
};

exports.checkUserChannelPerm = function (channel, userId) {
    let user = botUtils.getUserFromID(userId);
    if (user) {
        return botUtils.hasPermission(channel, user, 'READ_MESSAGES')
    } else return false;
};