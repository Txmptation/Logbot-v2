const utils = require('../utils');

exports.info = {
    name: 'help',
    usage: 'help [command]',
    description: 'Shows you help for all commands or just a single command'
};

exports.run = function (bot, msg, args) {
    if (args.length < 1) {

        var fields = [];
        for (const cmd in bot.commands) {
            fields.push(getHelp(bot, bot.commands[cmd]));
        }

        const embed = utils.getSimpleEmbed("Help", "All available commands for logbot", utils.getColour('red'));
        fields.forEach(field => {
            embed.addField(field);
        });
        msg.channel.sendEmbed(embed);

        return;
    }

    let command = bot.commands[args[0]];
    if (!command) {
        msg.reply(`:no_entry_sign: The command '${args[0]}' does not exist!`).then(m => m.delete(2000));
    } else {
        msg.channel.sendEmbed(utils.getSimpleEmbed('Help: ' + args[0], 'Logbot help!', utils.getColour('red')).addField(getHelp(bot, args[0])));
    }
};

const getHelp = function (bot, command) {
    return {
        name: `\`${command.info.name}\``,
        value: `Usage: \`${bot.config.prefix}${command.info.usage}\`\nDescription: ${command.info.description}`
    };
};