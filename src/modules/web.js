const requestify = require('requestify');
const utils = require('./../utils');
const botUtils = require('./bot/botUtils');
const fs = require('fs');

module.exports = function (app, config) {

    app.use(function (req, res, next) {
        req.session.redirect = req.path || '/';
        next();
    });

    app.get('/', (req, res) => {
        try {

            res.render('index', {
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false
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
            });

        } catch (err) {
            renderErrorPage(req, res, err);
        }
    });

    app.get('/servers/:id', checkAuth, (req, res) => {
        let id = req.params.id;

        try {
            let guildChannels = JSON.stringify(utils.getUserVisibleGuildChannels(req.user.id, id)); //TODO check logged in user and replace my id

            res.render('serverMsg', {
                serverHost: config.host,
                guildName: botUtils.getGuildFromId(id).name,
                guildId: id,
                guildChannels: guildChannels,
                guildChannelsLength: utils.getUserVisibleGuildChannels('182210823630880768', id).length,
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

    app.get('/search', (req, res) => {
        try {


        } catch (err) {
            console.error(`Unable to load search page, Error: ${err.stack}`);
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

function renderErrorPage(req, res, err) {

    console.error(`An error has occurred in Web.js, Error: ${err.stack}`);
    if (err) {
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
            error_text: 'An unknown error has occurred!'
        })
    }
}