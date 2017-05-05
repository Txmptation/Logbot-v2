const index = require('./../../../index');
const utils = require('../botUtils');

exports.info = {
    name: 'search',
    usage: 'search [member | user ID] | channel [channel | channel ID]',
    description: 'Retrieves an amount of messages for that user / channel!'
};

exports.run = function (bot, msg, args) {

    if (args.length > 1) {
        if (args[0].toLowerCase() === 'user') {
            if (msg.mentions.users.size > 0) {
                msg.mentions.users.array().forEach(user => {
                    runUserSearch(msg, user);
                })

            } else {

                let userId = args[1];
                let user = msg.guild.members.get(userId);
                if (!user) {
                    sendInvalid(msg, 'The user you specified was invalid!');
                    return;
                }

                runUserSearch(msg, user);
            }

        } else if (args[0].toLowerCase() === 'channel') {
            if (msg.mentions.channels.size > 0) {
                msg.mentions.channels.array().forEach(channel => {
                    runChannelSearch(msg, channel);
                })
            } else {
                let channelId = args[1];
                let channel = msg.guild.channels.get(channelId);
                if (!channel) {
                    sendInvalid(msg, 'The channel you specified was invalid!');
                    return;
                }

                runChannelSearch(msg, channel);
            }

        } else {
            sendInvalid(msg, 'You must specify if you are searching for a channel or user!');
        }

    } else {
        sendInvalid(msg, "You're missing arguments!");
    }
};

function runUserSearch(msg, searchUser) {
    let guild = msg.guild;

    let embed = utils.getSimpleEmbed('Search Results', `Here are the log results for ${searchUser.tag}`, utils.getRandomColor());
    embed.addField('\u200b', '\u200b');
    embed.addField('Results', `[CLICK HERE](${index.config.host}/search/results?displayDeleted=true&searchGuilds=${guild.id}&authorId=${searchUser.id})`, true);

    msg.channel.send({embed})
}

function runChannelSearch(msg, channel) {
    let guild = msg.guild;

    let embed = utils.getSimpleEmbed('Search Results', `Here are the log results for ${channel.name}`, utils.getRandomColor());
    embed.addField('\u200b', '\u200b');
    embed.addField('Results', `[CLICK HERE](${index.config.host}/search/results?displayDeleted=true&searchGuilds=${guild.id}&channelid=${channel.id})`, true);

    msg.channel.send({embed})
}

function sendInvalid(msg, text) {

    let embed = utils.getSimpleEmbed('Invalid Parameters!', text, utils.getColour('red'), true);
    msg.channel.send({embed});
}