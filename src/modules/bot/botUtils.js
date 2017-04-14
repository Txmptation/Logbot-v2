const index = require('./../../index');
const utils = require('./../../utils');
const bot = require('./bot');
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

    let tableExists = await utils.doesTableExist(message.guild);
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

        let url = `${index.config.host}/api/read?authorid=${user.id}`;
        if (isGlobal) url += `serverid=${guild.id}`;

        requestify.get(`${index.config.host}/api/read?serverid=${guild.id}&authorid=${user.id}`).then(res => {

            try {
                let body = JSON.parse(res.body);

                let results = [];
                for (let x = 0; x < rows.length; x++) {
                    let message = {
                        serverID: guildId,
                        channelID: rows[x].ChannelID,
                        channelName: rows[x].ChannelName,
                        authorName: rows[x].AuthorName,
                        authorID: rows[x].AuthorID,
                        message: rows[x].Message
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

    message.mentions.users.array().forEach(mention => {
        cleanMsg.replaceAll(`<${mention.id}>`, mention.username);
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