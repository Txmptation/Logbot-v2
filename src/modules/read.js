const index = require('./../index');
const utils = require('./../utils');
const botUtils = require('./bot/botUtils');

module.exports = function (app, config) {

    app.get('/api/read', ((req, res) => {

        if (!req.isAuthenticated()) {
            res.status(401).send('Session not authenticated!');
            return;
        }

        try {

            let checkChannelId = false;
            let checkAuthorId = false;
            let countMessages = false;

            if (req.query.channelid) checkChannelId = true;
            if (req.query.authorid) checkAuthorId = true;
            if (req.query.count) countMessages = true;

            if (req.query.serverid) {
                // Has a server id

                let guildId = req.query.serverid;

                utils.doesTableExist(guildId).then(exists => {
                    if (!exists) return res.json({"error": "Sorry but that table doesn't exist"});

                    getGuildMessages(req, guildId).then(messages => {

                        let results = [];
                        messages.forEach(msg => {
                            let removeMsg = false;

                            if (checkChannelId) {
                                if (!validChannelId(req.query.channelid, msg.channelID)) removeMsg = true;
                            }

                            if (checkAuthorId) {
                                if (!validAuthorId(req.query.authorid, msg.authorID)) removeMsg = true;
                            }

                            if (!removeMsg) results.push(msg);
                        });

                        sendResponse(req, res, results, countMessages);

                    }).catch(err => {
                        res.status(404).json({"error": "An unknown error has occurred, contact @XeliteXirish"});
                        console.error(err.stack);
                    });
                });

            } else {

                getAllMessages(req).then(messages => {
                    let results = [];

                    messages.forEach(msg => {
                        let removeMsg = false;

                        if (checkChannelId) {
                            if (!validChannelId(req.query.channelid, msg.channelID)) removeMsg = true;
                        }

                        if (checkAuthorId) {
                            if (!validAuthorId(req.query.authorid, msg.authorID)) removeMsg = true;
                        }

                        if (!removeMsg) results.push(msg);
                    });

                    sendResponse(req, res, results, countMessages);
                }).catch(err => {
                    res.status(404).json({"error": "An unknown error has occurred, contact @XeliteXirish"});
                    console.error(err.stack);
                })
            }
        } catch (err) {
            console.error(`Error sorting out messages, Error: ${err.stack}`)
        }
    }));
};

function sendResponse(req, res, messages, countMessages) {

    if (messages.length > 0) {

        if (countMessages) {
            res.json({"messages": messages.length});
            return;
        }

        res.status(200).json(messages);

    } else {
        res.json({"null": "No results found for that request!"});
    }
}

function validChannelId(channelId, data) {
    return channelId === data;
}

function validAuthorId(authorId, data) {
    //console.log('CHECKING AUTHOR ID : ' + authorId + " vs " + data);
    return authorId === data;
}

function getGuildMessages(req, guildId) {

    return new Promise((resolve, reject) => {
        try {

            let results = [];
            let query = `SELECT * FROM id_${guildId} ORDER BY id DESC`;

            index.db.query(query, ((err, rows, fields) => {
                if (err) {
                    console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                    reject(err);
                    return;
                }

                for (let x = 0; x < rows.length; x++) {

                    let channel = botUtils.getChannelFromId(rows[x].ChannelID);
                    if (channel) {
                        if (utils.checkUserChannelPerm(channel, req.user.id)) {

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
                    }
                }
                resolve(results);
            }))

        } catch (err) {
            console.error(`An error occurred when receiving guild messages, Error: ${err.stack}`);
            reject(err);
        }
    })
}

function getAllMessages(req) {

    return new Promise((resolve, reject) => {
        try {

            utils.getAllGuildTableNames().then(tables => {
                let results = [];

                for (let x = 0; x < tables.length; x++) {
                    let table = tables[x];

                    let query = `SELECT * FROM ${table} ORDER BY id DESC`;
                    index.db.query(query, function (err, rows, fields) {
                        if (err) {
                            console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                            reject(err);
                            return;
                        }

                        let guildId = table.split('id_')[1];

                        for (let x = 0; x < rows.length; x++) {

                            let channel = botUtils.getChannelFromId(rows[x].ChannelID);
                            if (channel) {

                                if (utils.checkUserChannelPerm(channel, req.user.id)) {

                                    let message = {
                                        serverId: guildId,
                                        serverName: rows[x].ServerName,
                                        channelID: rows[x].ChannelID,
                                        channelName: rows[x].ChannelName.capitalizeFirstLetter().replaceAll('_', ' '),
                                        authorName: rows[x].AuthorName,
                                        authorID: rows[x].AuthorID,
                                        message: rows[x].Message,
                                        date: rows[x].Date.toJSON().slice(0, 10).replaceAll('-', ' ')
                                    };
                                    results.push(message);
                                }
                            }
                        }

                        // it'll only continue when its the last one
                        if (x === tables.length - 1) resolve(results);
                    })
                }

            }).catch(err => {
                console.error(err.stack)
            });

        } catch (err) {
            console.error(`Error trying to receive all messages, Error: ${err.stack}`);
            reject(err);
        }
    })
}