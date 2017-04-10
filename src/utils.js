const bot = require('./bot');
const RichEmbed = require('discord.js').RichEmbed;

const fs = require('fs');
const got = require('got');
const url = require('url');

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

            let query = `CREATE TABLE IF NOT EXISTS ${bot.config.sql_db}.id_${guild.id}
(
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerName TEXT,
    ChannelID VARCHAR(30),
    ChannelName TEXT,
    AuthorID VARCHAR(30),
    AuthorName TEXT,
    Message LONGTEXT,
    Vip TINYINT
);`;

            bot.db.query(query, function (err, rows, fields) {
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

exports.createListTable = function () {
    if (bot.config.needsSetup != 1) return;

    return new Promise((resolve, reject) => {
        let query = `CREATE TABLE IF NOT EXISTS ${bot.config.sql_db}.BotLists
(
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerId VARCHAR(30),
    ServerName TEXT,
    UserId VARCHAR(30),
    Username TEXT,
    Blacklist TINYINT,
    VipList TINYINT
);`;

        bot.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`Error trying to create database, Error ${err.stack}`);
                reject(err);
                return;
            }

            resolve();
        })
    })
};

/**
 * Logs a message to the specific guild table
 * @param message
 */
exports.logMessage = function (message) {

    exports.createTable(message.guild).then(() => {
        let query = `INSERT INTO id_${message.guild.id} (ServerName, ChannelID, ChannelName, AuthorID, AuthorName, Message, Vip) VALUES (${bot.db.escape(message.guild.name)}, ${message.channel.id}, ${bot.db.escape(message.channel.name)}, ${message.author.id}, ${bot.db.escape(message.author.username)}, ${bot.db.escape(exports.cleanMessage(message))}, ${exports.isUserVip(message)})`
        bot.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`Error trying to submit message, Error: ${err.stack}`);
            }
        })
    })
};

exports.getUserMessages = function (user, guild, searchCount, isLimit, isGlobal) {

    return new Promise((resolve, reject) => {

        if (!isGlobal) {
            let query = `SELECT Message FROM id_${guild.id} WHERE AuthorID = ${user.id}`;
            if (isLimit) query += ` LIMIT ${searchCount}`;

            bot.db.query(query, function (err, rows, fields) {
                if (err) {
                    console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                    reject(err);
                    return;
                }
console.log('OUTPUT MESSAGES' + rows);
                resolve(rows);
            })
        }else {

            exports.getAllGuildTables().then(tables => {
                tables.forEach(table => {
                    let query = `SELECT Message FROM id_${table.id} WHERE AuthorID = ${user.id}`;
                    bot.db.query(query, function (err, rows, fields) {
                        if (err) {
                            console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                            reject(err);
                            return;
                        }

                        resolve(rows);
                    })
                })
            })
        }
    })

};

exports.uploadToHaste = function (messages) {

    return new Promise((resolve, reject) => {
        got.post(url.resolve('https://hastebin.com', 'documents'), {
            body: JSON.stringify(messages),
            json: true,
            headers: {
                'Content-Type': 'text/plain'
            }
        }).then(res => {
            if (!res.body || !res.body.key) {
                console.error('Error occurred when uploading to haste!');
                reject();
                return;
            }
            let key = res.body.key || res.body;
            resolve(key);
        })
    });
};

exports.cleanMessage = function (message) {

    let cleanMsg = message.content;

    message.mentions.users.array().forEach(mention => {
        cleanMsg.replaceAll(`<${mention.id}>`, mention.username);
    });

    return cleanMsg;
};

exports.getName = function (guild) {
    return guild.name.replaceAll(' ', '_');
};

exports.doesTableExist = function (guild) {

    return new Promise((resolve, reject) => {

        let tableName = `id_${guild.id}`;

        bot.db.query(`select table_name from information_schema.tables where table_name = '${tableName}';`, function (err, rows, fields) {
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

exports.getAllGuildTables = function () {
    return new Promise((resolve, reject) => {

        let query = `select table_name from information_schema.tables`;
        bot.db.query(query, function (err, rows, fields) {
            if (err){
                console.error(`Error while getting tables, Error: ${err.stack}`);
                reject(err);
                return;
            }

            let results = [];
            rows.forEach(table => {
                if (table.startsWith('id_')) results.push(table);
            });

            resolve(results);
        })
    })
};

exports.getSimpleEmbed = function (title, text, colour, isBad = false) {

    let embedMsg = new RichEmbed()
        .setTitle(title)
        .setAuthor("Log Bot v2", bot.client.user.avatarURL)
        .setColor(colour || exports.getRandomColor())
        .setURL(bot.config.host)
        .setDescription(text);
    if (isBad) embedMsg.setThumbnail("https://cdn2.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-128.png");

    return embedMsg;
};

exports.getColour = function (colourCode) {

    if (colourCode.toLowerCase() == 'red') {
        return 0xCC0E0E;
    }
    else if (colourCode.toLowerCase() == 'blue') {
        return 0x0988B3;
    }
    else if (colourCode.toLowerCase() == 'green') {
        return 0x14E01D;
    }
    else if (colourCode.toLowerCase() == 'orange') {
        return 0xFF8C00;
    }
    else if (colourCode.toLowerCase() == 'yellow') {
        return 0xFFFF00;
    } else {
        return exports.getRandomColor();
    }
};

exports.getRandomColor = function () {
    return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
};

String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};