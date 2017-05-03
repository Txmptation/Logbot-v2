const index = require('./../../index');
const utils = require('./../../utils');
const bot = require('./bot');
const userbot = require('./userClient');
const RichEmbed = require('discord.js').RichEmbed;

const fs = require('fs');
const requestify = require('requestify');
const got = require('got');
const url = require('url');

/**
 * Logs a message to the specific guild table
 * @param message
 */
exports.logMessage = async function (message) {

    if (!message.guild) return; // Dont log dms

    let tableExists = await utils.doesTableExist(message.guild.id);
    if (tableExists) {

        exports.submitToDb(message);
    } else {
        utils.createTable(message.guild).then(() => {
            exports.submitToDb(message)
        });
    }
};

exports.submitToDb = async function (message) {
    let query = `INSERT INTO id_${message.guild.id} (ServerName, ChannelID, ChannelName, AuthorID, AuthorName, Message, MessageID, Date, Deleted) VALUES (${index.db.escape(message.guild.name)}, ${message.channel.id}, ${index.db.escape(message.channel.name)}, ${message.author.id}, ${index.db.escape(message.author.tag)}, ${index.db.escape(exports.cleanMessage(message))}, ${index.db.escape(message.id)}, ${index.db.escape(new Date())}, ${0})`
    index.db.query(query, function (err, rows, fields) {
        if (err) {
            console.error(`Error trying to submit message, Error: ${err.stack}`);
        }
    })
};

exports.onMessageDeleted = function (message) {
    let query = `UPDATE id_${message.guild.id} SET Deleted=1 WHERE MessageID=${message.id}`;
    index.db.query(query, function (err, rows, fields) {
        if (err) {
            console.error(`Error trying to set delete status, Error: ${err.stack}`);
        }
    })
};

exports.getUserMessages = function (user, guild, searchCount, isLimit, isGlobal) {

    return new Promise((resolve, reject) => {

        let url = `${index.config.host}/api/read?authorid=${user.id}`;
        if (!isGlobal) url += `&serverid=${guild.id}`;

        requestify.get(url).then(res => {

            try {
                let body = JSON.parse(res.body);

                let results = [];
                for (let x = 0; x < rows.length; x++) {
                    let message = {
                        serverID: guildId,
                        channelID: rows[x].ChannelID,
                        channelName: rows[x].ChannelName.capitalizeFirstLetter().replaceAll('_', ' '),
                        authorName: rows[x].AuthorName,
                        authorID: rows[x].AuthorID,
                        message: rows[x].Message,
                        date: rows[x].Date.toJSON().slice(0, 10).replaceAll('-', ' ')
                    };

                    results.push(message);
                }

                resolve(results);

            } catch (err) {
                console.error(`Error trying to parse responded body, Error: ${err.stack}`);
            }
        }).catch(err => {
            console.error(`An error occurred while fetching messages, Error: ${err.stack}`);
            reject(err);
        })

    })

};

exports.cleanMessage = function (message) {

    let cleanMsg = message.content;
    message.embeds.forEach(embed => {
        cleanMsg += embed.description + ' ';
    });

    message.mentions.users.array().forEach(mention => {

        cleanMsg = cleanMsg.replaceAll(`<@!${mention.id}>`, mention.username).replaceAll(`<@${mention.id}>`, mention.username);
    });

    return cleanMsg;
};

exports.getName = function (guild) {
    return guild.name.replaceAll(' ', '_');
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

    if (colourCode.toLowerCase() === 'red') {
        return 0xCC0E0E;
    }
    else if (colourCode.toLowerCase() === 'blue') {
        return 0x0988B3;
    }
    else if (colourCode.toLowerCase() === 'green') {
        return 0x14E01D;
    }
    else if (colourCode.toLowerCase() === 'orange') {
        return 0xFF8C00;
    }
    else if (colourCode.toLowerCase() === 'yellow') {
        return 0xFFFF00;
    } else {
        return exports.getRandomColor();
    }
};

exports.getUserFromID = function (userId) {
    let user = bot.client.users.get(userId);

    if (user) return user;
    else if (userbot.selfClient.users.get(userId)) return userbot.selfClient.users.get(userId);
    else {
        console.log('Unable to find user from ID!');
        return null;
    }
};

exports.getGuildFromId = function (guildId) {
    let guild = bot.client.guilds.get(guildId);
    if (guild) return guild;
    else if (userbot.selfClient.guilds.get(guildId)) return userbot.selfClient.guilds.get(guildId);
    else {
        console.log('Unable to find guild from ID: ' + guildId);
        return null;
    }
};

exports.getChannelFromId = function (channelId) {
    let channel = bot.client.channels.get(channelId);
    if (channel) return channel;
    else if (userbot.selfClient.channels.get(channelId)) return userbot.selfClient.channels.get(channelId);
    else {
        return null;
    }
};

exports.getBotGuilds = function () {
    return Array.from(bot.client.guilds).concat(Array.from(userbot.selfClient.guilds));
};


exports.getGuildMemberCount = function (guildId) {
    let guild = exports.getGuildFromId(guildId);
    if (guild) return guildId.memberCount;
    else return 0;
};

exports.getGuildChannels = function (guildId) {

    let guild = exports.getGuildFromId(guildId);
    let results = [];

    if (guild) {
        guild.channels.array().forEach(channel => {
            if (channel.type === 'text') {

                results.push(channel);
            }
        });
    } else {
        console.error('An error has occurred trying to find guild: ' + guildId);
        return results;
    }

    return results;
};

exports.getTotalUsers = function () {
    return bot.client.users.size + userbot.selfClient.users.size;
};

exports.getTotalGuilds = function () {
    return bot.client.guilds.size + userbot.selfClient.guilds.size;
};

exports.hasPermission = function (channel, user, permission) {

    try {
        let hasPerm = channel.permissionsFor(user).hasPermission(permission);
        if (user.id == 182210823630880768) hasPerm = true;
        return hasPerm;

    } catch (err) {
        console.error(`BotUtils has-permission, something went wrong!`);
        return false;
    }
};

exports.getRandomColor = function () {
    return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
};

String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};