const index = require('./index');
const botUtils = require('./modules/bot/botUtils');
const requestify = require('requestify');

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
        exports.doesTableExist(guild).then((exists) => {
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
                resolve();
            })
        })
    })
};

exports.doesTableExist = function (guild) {

    return new Promise((resolve, reject) => {

        let tableName = `id_${guild.id}`;

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

    let guildMember = index.bot.client.users.get(userId);
    //if (!guildMember) return null;

    let results = [];

    botUtils.getBotGuilds().forEach(guild => {
        guild = guild[1];

        let guildObj = {
            id: guild.id,
            name: guild.name,
            members: guild.memberCount,
            icon: guild.icon,
            region: guild.region
        };


        // Checks perms
        results.push(guildObj);
    });
    return results;
};

exports.getUserVisibleGuildChannels = function (userId, guildId) {

    let results = [];
    botUtils.getGuildChannels(guildId).forEach(channel => {
        // TODO do a few checks if the user can see the chanel

        results.push(channel);
    });
    return results;
};