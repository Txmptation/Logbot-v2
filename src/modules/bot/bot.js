const Discord = require('discord.js');
const fs = require('fs');

const index = require('./../../index');
const client = exports.client = new Discord.Client();
const utils = require('./utils');

const commands = exports.commands = client.commands = {};

client.on('ready', () => {

    console.log(`Logbot v2: Connected to ${client.guilds.size} servers, for a total of ${client.channels.size} channels and ${client.users.size} users!`);

    loadCommands();
});

client.on('message', msg => {
    let command = msg.content.split(' ')[0].substr(index.config.prefix.length);
    const args = msg.content.split(' ').splice(1);

    utils.logMessage(msg);

    if (msg.author.id !== client.user.id) return;

    if (commands[command]){
        try {
            commands[command].run(client, msg, args);
        }catch (err){
            console.error(`Error while executing command, Error: ${err.stack}`);
        }
    }
});

exports.connect = function(){client.login(index.config.botToken);};

function loadCommands() {
    fs.readdirSync(__dirname + '/commands/').forEach(file => {
        if (file.startsWith('_') || !file.endsWith('.js')) return;

        let command = require(`./commands/${file}`);
        if (typeof command.run !== 'function' || typeof command.info !== 'object' || typeof command.info.name !== 'string'){
            console.error(`Invalid command file: ${file}`);
            return;
        }
        commands[command.info.name] = command;
    });
}