const index = require('./../index');
const utils = require('./../utils');
const botUtils = require('./bot/botUtils');

const RateLimit = require("express-rate-limit");

exports.init = function (app, config) {

    app.use('/api/', new RateLimit({
        windowMs: 3600000,	// 150 requests/per hr
        max: 150,
        delayMs: 0
    }));

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

                    exports.getGuildMessages(req.user.id, guildId).then(messages => {

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
                }).catch(err => {
                    res.status(404).json({"error": "An unknown error has occurred, contact @XeliteXirish"});
                    console.error(err.stack);
                });

            } else {

                res.json({"error": "You must specify a guild to search for, using serverid as a query!"})

            }
        } catch (err) {
            console.error(`Error sorting out messages, Error: ${err.stack}`);
            res.status(404).json({"error": "An unknown error has occurred, contact @XeliteXirish"});
        }
    }));
};

function sendResponse(req, res, messages, countMessages) {

    try {
        if (messages.length > 0) {

            if (countMessages) {
                res.json({"messages": messages.length});
                return;
            }

            res.status(200).json(messages);

        } else {
            res.json({"null": "No results found for that request!"});
        }
    } catch (err) {
        console.error(`Unable to send response to user, Error: ${err.stack}`);
        res.status(404).json({"error": "An unknown error has occurred, contact @XeliteXirish"});
    }
}

function validChannelId(channelId, data) {
    return channelId === data;
}

function validAuthorId(authorId, data) {

    return authorId === data;
}

exports.getGuildMessages = function (userId, guildId) {

    return new Promise((resolve, reject) => {
        try {

            let results = [];
            let query = `SELECT * FROM id_${guildId} ORDER BY id DESC`;
            if (!index.config.maintainer_id.indexOf(userId) > -1) query += ` LIMIT ${index.config.max_send_messages}`;

            index.db.query(query, ((err, rows, fields) => {
                if (err) {
                    console.error(`An error occurred when reading messages, Error: ${err.stack}`);
                    reject(err);
                    return;
                }

                utils.checkGuildDeletedMsgsPerm(botUtils.getGuildFromId(guildId), userId).then(hasPerm => {
                    for (let x = 0; x < rows.length; x++) {

                        let channel = botUtils.getChannelFromId(rows[x].ChannelID);
                        if (channel) {
                            if (utils.checkUserChannelPerm(channel, userId)) {

                                let message = {
                                    serverId: guildId,
                                    serverName: rows[x].ServerName,
                                    channelID: rows[x].ChannelID,
                                    channelName: rows[x].ChannelName.capitalizeFirstLetter().replaceAll('_', ' '),
                                    authorName: rows[x].AuthorName,
                                    authorID: rows[x].AuthorID,
                                    message: rows[x].Message,
                                    messageID: rows[x].MessageID,
                                    date: getDateString(rows[x].Date),
                                    deleted: rows[x].Deleted
                                };

                                if (hasPerm) {

                                    results.push(message);
                                } else {
                                    if (message.deleted === 0) results.push(message);
                                }
                            }
                        }
                    }
                    resolve(results);
                }).catch(err => {
                    reject(err);
                })
            }))

        } catch (err) {
            console.error(`An error occurred when receiving guild messages, Error: ${err.stack}`);
            reject(err);
        }
    })
};

function getDateString(date) {
    return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}