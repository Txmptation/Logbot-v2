const bot = require('./bot');
const config = require('./../../../config.json');
const botUtils = require('./botUtils');
const utils = require('./../../utils');

const Discord = require('discord.js');

const client = exports.selfClient = new Discord.Client();

client.on('ready', () => {
    console.log(`The logbot userbot has successfully logged on, recording ${client.guilds.size} guilds!`);
});

client.on('message', msg => {

    botUtils.logMessage(msg);
});

exports.connect = function (selfToken) {
    client.login(selfToken).catch(err => {
        console.error(`An error occurred while trying to connect the userbot, Error: ${err.stack}`);
    })
};