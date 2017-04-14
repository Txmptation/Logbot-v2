const index = require('./../../index');
const bot = require('./bot');
const RichEmbed = require('discord.js').RichEmbed;

const fs = require('fs');
const requestify = require('requestify');
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

            let query = `CREATE TABLE IF NOT EXISTS ${index.config.sql_db}.id_${guild.id}
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

/**
 * Logs a message to the specific guild table
 * @param message
 */
exports.logMessage = async function (message) {

    let tableExists = await exports.doesTableExist(message.guild);
    if (tableExists) {
        let query = `INSERT INTO id_${message.guild.id} (ServerName, ChannelID, ChannelName, AuthorID, AuthorName, Message) VALUES (${index.db.escape(message.guild.name)}, ${message.channel.id}, ${index.db.escape(message.channel.name)}, ${message.author.id}, ${index.db.escape(message.author.username)}, ${index.db.escape(exports.cleanMessage(message))})`
        index.db.query(query, function (err, rows, fields) {
            if (err) {
                console.error(`Error trying to submit message, Error: ${err.stack}`);
            }
        })
    } else {
        await exports.createTable(message.guild);
    }
};

exports.getUserMessages = function (user, guild, searchCount, isLimit, isGlobal) {

    return new Promise((resolve, reject) => {

        if (!isGlobal) {
            let query = `SELECT ChannelName, AuthorName, AuthorID, Message FROM id_${guild.id} WHERE AuthorID = ${user.id}`;
            if (isLimit) query += ` LIMIT ${searchCount}`;

            index.db.query(query, function (err, rows, fields) {
                if (err) {
                    console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                    reject(err);
                    return;
                }

                let results = [];
                for (let x = 0; x < rows.length; x++) {
                    let string = `${rows[x].ChannelName} | ${rows[x].AuthorName} (${rows[x].AuthorID}) - ${rows[x].Message}`;
                    results.push(string);
                }

                resolve(results);
            })
        } else {

            exports.getAllGuildTables().then(tables => {
                tables.forEach(table => {
                    let query = `SELECT ChannelName, AuthorName, AuthorID, Message FROM id_${table.id} WHERE AuthorID = ${user.id}`;
                    index.db.query(query, function (err, rows, fields) {
                        if (err) {
                            console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                            reject(err);
                            return;
                        }

                        let results = [];
                        for (let x = 0; x < rows.length; x++) {
                            let string = `${rows[x].ChannelName} | ${rows[x].AuthorName} (${rows[x].AuthorID}) - ${rows[x].Message}`;
                            results.push(string);
                        }

                        resolve(results);
                    })
                })
            })
        }
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

exports.getAllGuildTables = function () {
    return new Promise((resolve, reject) => {

        let query = `select table_name from information_schema.tables`;
        index.db.query(query, function (err, rows, fields) {
            if (err) {
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
        .setURL(index.config.host)
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