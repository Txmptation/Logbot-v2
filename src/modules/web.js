const requestify = require('requestify');
const moment = require('moment');
const utils = require('./../utils');
const botUtils = require('./bot/botUtils');
const read = require('./read');
const fs = require('fs');

module.exports = function (app, config) {

    app.use(function (req, res, next) {
        req.session.redirect = req.path || '/';
        next();
    });

    app.get('/', (req, res) => {
        try {

            let uptime = process.uptime();
            res.render('index', {
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false,
                rawUptime: moment.duration(uptime, 'seconds').humanize(),
                roundedUptime: utils.getRoundedUptime(uptime),
                rawUserCount: botUtils.getTotalUsers(),
                rawServerCount: botUtils.getTotalGuilds()
            })
        } catch (err) {
            renderErrorPage(req, res, err);
        }
    });

    app.get('/servers', checkAuth, (req, res) => {
        try {
            utils.getUserVisibleGuilds(req.user.id).then(guilds => {

                res.render('servers', {
                    visibleServers: JSON.stringify(guilds),
                    loggedInStatus: req.isAuthenticated(),
                    userRequest: req.user || false
                })
            }).catch(err => {
                console.error(`Unable to fetch visible guilds for the user, Error: ${err.stack}`);
                renderErrorPage(req, res, err)
            });

        } catch (err) {
            renderErrorPage(req, res, err);
        }
    });

    app.get('/servers/:id', checkAuth, (req, res) => {
        let id = req.params.id;

        try {
            let guildChannels = JSON.stringify(utils.getUserVisibleGuildChannels(req.user.id, id));

            res.render('serverMsg', {
                serverHost: config.host,
                guildName: botUtils.getGuildFromId(id).name,
                guildId: id,
                guildChannels: guildChannels,
                guildChannelsLength: utils.getUserVisibleGuildChannels(req.user.id, id).length,
                guildMemberCount: botUtils.getGuildMemberCount(id),
                entriesPerPage: config.entriesPerPage,
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false
            })

        } catch (err) {
            console.error(`An error has occurred trying to parse body, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }
    });

    app.get('/add', (req, res) => {
        try {
            res.redirect(config.addBotUrl);

        } catch (err) {
            console.error(`An error occurred trying to redirect to the bot page, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }
    });

    app.get('/search', checkAuth, (req, res) => {
        try {
            utils.getUserVisibleGuilds(req.user.id).then(guilds => {
                res.render('search', {
                    loggedInStatus: req.isAuthenticated(),
                    userRequest: req.user || false,
                    visibleGuilds: guilds
                })
            });
        } catch (err) {
            console.error(`Unable to load search page, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }
    });

    app.get('/search/results', checkAuth, (req, res) => {
        try {

            let guildSearchsRaw = req.query.searchGuilds;

            if (!guildSearchsRaw) {
                renderErrorPage(req, res, null, 'Please specify a guild to search for!');
                return;
            }

            let guildSearchIds = guildSearchsRaw.split(',');
            let promises = [];

            for (let x = 0; x < guildSearchIds.length; x++) {
                promises.push(read.getGuildMessages(req.user.id, guildSearchIds[x]));
            }

            Promise.all(promises).then(messages => {
                let results = [];

                messages.forEach(guildMessages => {

                    guildMessages.forEach(msg => {

                        let remove = false;

                        if (req.query.username) {
                            if (!msg.authorName.includes(req.query.username)) remove = true;
                        }
                        if (req.query.authorId && req.query.authorId !== msg.authorID) remove = true;
                        if (req.query.messageId && req.query.messageId !== msg.messageID) remove = true;
                        if (req.query.channelId && req.query.channelId !== msg.channelID) remove = true;
                        if (req.query.displayDeleted) {
                            if (req.query.displayDeleted === false && msg.deleted !== 0) remove = true;
                        }

                        if (!remove) results.push(msg);
                    });
                });

                res.render('searchRes', {
                    loggedInStatus: req.isAuthenticated(),
                    userRequest: req.user || false,
                    searchResults: results
                })

            }).catch(err => {
                console.error(`Unable to load all searched messages, Error: ${err.stack}`);
                renderErrorPage(req, res, err);
            });

        } catch (err) {
            console.error(`Unable to load search results page, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }
    });

    app.get('/blog', (req, res) => { //TODO fix the url that is passed

        try {

            res.render('blog', {
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false
            })

        } catch (err) {
            console.error(`Unable to load blog page, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }

    });

    // Error
    app.get("/error", (req, res) => {
        try {
            res.render('error', {
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false,
                error_code: 500,
                error_text: "Why did you go to this URL? Normally an error message will be displayed here.",
                googleAnalyticsCode: config.googleAnalyticsCode
            })
        } catch (err) {
            console.error(`An error has occurred trying to load the error page, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }
    });

    //404 Error page (Must be the last route!)
    app.use(function (req, res, next) {
        try {
            res.render('error', {
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false,
                error_code: 404,
                error_text: "The page you requested could not be found or rendered. Please check your request URL for spelling errors and try again. If you believe this error is faulty, please contact a system administrator.",
            })
        } catch (err) {
            console.error(`An error has occurred trying to load the 404 page, Error: ${err.stack}`);
            renderErrorPage(req, res, err);
        }
    })

};

function checkAuth(req, res, next) {
    try {

        if (req.isAuthenticated()) return next();

        req.session.redirect = req.path;
        res.status(403);
        res.render('badLogin', {

            loggedInStatus: req.isAuthenticated(),
            userRequest: req.user || false,
        });
    } catch (err) {
        console.error(`An error has occurred trying to check auth, Error: ${err.stack}`);
        renderErrorPage(req, res, err);
    }
}

function renderErrorPage(req, res, err, errorText) {

    if (err) {
        console.error(`An error has occurred in Web.js, Error: ${err.stack}`);
        res.render('error', {
            loggedInStatus: req.isAuthenticated(),
            userRequest: req.user || false,
            error_code: 500,
            error_text: err
        })
    } else {
        res.render('error', {
            loggedInStatus: req.isAuthenticated(),
            userRequest: req.user || false,
            error_code: 500,
            error_text: errorText
        })
    }
}