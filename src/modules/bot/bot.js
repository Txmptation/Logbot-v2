const Discord = require('discord.js');
const fs = require('fs');

const index = require('./../../index');
const client = exports.client = new Discord.Client();
const botUtils = require('./botUtils');

const commands = exports.commands = client.commands = {};

client.on('ready', () => {

    console.log(`Logbot v2: Connected to ${client.guilds.size} servers, for a total of ${client.channels.size} channels and ${client.users.size} users!`);
    console.log(`The bot is in the following servers: ${client.guilds.array()}`);

    client.user.setGame(index.config.host);

    loadCommands();
});

client.on('message', msg => {
    const args = msg.content.split(' ').splice(2);
    let command = msg.content.split(' ')[1];

    botUtils.logMessage(msg);

    if (commands[command]){
        try {
            commands[command].run(client, msg, args);
        }catch (err){
            console.error(`Error while executing command, Error: ${err.stack}`);
        }
    }
});

client.on('messageDelete', msg => {
    botUtils.onMessageDeleted(msg);
});

client.on('guildCreate', guild => {
    guild.defaultChannel.sendEmbed(botUtils.getSimpleEmbed('Initial Setup', 'You need to change the default permission to view channels!'));
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
