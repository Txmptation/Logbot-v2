const Discord = require('discord.js');
const nodemon = require('nodemon');
const mysql = require('mysql');
const fs = require('fs');

const client = exports.client = new Discord.Client();
const config = exports.config = client.config = require('./../config.json');
const utils = require('./utils');

const commands = exports.commands = client.commands = {};

let connection = exports.db = mysql.createConnection({
    host: config.sql_host,
    user: config.sql_user,
    password: config.sql_pass,
    database: config.sql_db
});

client.on('ready', () => {
    console.log(`Logbot v2: Connected to ${client.guilds.size} servers, for a total of ${client.channels.size} channels and ${client.users.size} users!`);

    try {
        //utils.createListTable();  TODO do this at a later date
    }catch (err){console.error(err.stack)}

    loadCommands();
});

client.on('message', msg => {
    let command = msg.content.split(' ')[0].substr(config.prefix.length);
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

client.login(config.botToken);

process.on('uncaughtException', (err) => {
    let errorMsg = err.stack.replace(new RegExp(`${__dirname}\/`, 'g'), './');
    console.error("Uncaught Exception" + errorMsg);
});

function loadCommands() {
    fs.readdirSync(__dirname + '/commands/').forEach(file => {
        if (file.startsWith('_') || !file.endsWith('.js')) return;

        let command = require(`./commands/${file}`);
        if (typeof command.run !== 'function' || typeof command.info !== 'object' || typeof command.info.name !== 'string'){
            console.error(`Invalid command file: ${file}`);
            return;
        }
        commands[command.info.name] = command;
    })
}
