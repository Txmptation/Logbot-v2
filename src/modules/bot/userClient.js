const bot = require('./bot');
const config = require('./../../../config.json');
const botUtils = require('./botUtils');
const utils = require('./../../utils');

const Discord = require('discord.js');

const client = exports.selfClient = new Discord.Client();
exports.enabled = false;

client.on('ready', () => {
    console.log(`The logbot userbot has successfully logged on as ${client.user.username}, recording ${client.guilds.size} guilds!`);
});

client.on('message', msg => {

    botUtils.logMessage(msg);
});

client.on('messageDelete', msg => {
    botUtils.onMessageDeleted(msg);
});

exports.connect = function (selfToken) {
    exports.enabled = true;
    client.login(selfToken).catch(err => {
        console.error(`An error occurred while trying to connect the userbot, Error: ${err.stack}`);
    })
};