const index = require('./../../../index');
const utils = require('../botUtils');

exports.info = {
    name: 'user',
    usage: 'user [member | userid] [no. messages] [global]',
    description: 'Retrieves an amount of messages for that user! [Global is for all guilds]'
};

exports.run = function (bot, msg, args) {

    console.log('User command, Args : ' + args);

    if (args.length === 3) {

        let isGlobalSearch = false;
        if (typeof args[args.length - 1] === 'boolean') {
            if (args[args.length - 1] == 'true') {
                isGlobalSearch = true;
            }
        }

        let searchMessages = index.config.default_message_search;
        if (typeof args[args.length - 2] == 'number') {
            searchMessages = args[args.length - 2];
        }

        runSearch(msg, searchMessages, isGlobalSearch);

    } else if (args.length == 2) {

        let searchMessages = index.config.default_message_search;
        if (typeof args[args.length - 1] == 'number') {
            searchMessages = args[args.length - 1];
        }

        runSearch(msg, searchMessages, false);

    } else if (args.length == 1) {

        let searchMessages = index.config.default_message_search;
        runSearch(msg, searchMessages, false);

    } else {
        msg.channel.sendEmbed(utils.getSimpleEmbed("Missing Parameters!", 'You need to at least include a user to search for!', utils.getColour('red'), true)).then(m => {m.delete(index.config.msg_delete_time)})
    }
};

function runSearch(msg, searchCount, global) {

    let isLimit = true;
    if (index.config.maintainer_id.indexOf(msg.author.id) > -1) isLimit = false;

    // Mentions
    msg.mentions.users.array().forEach(user => {

        utils.getUserMessages(user, msg.guild, searchCount, isLimit, global).then(messages => {
            utils.uploadToHaste(messages).then(key => {

                let embed = utils.getSimpleEmbed(`Messages: ${user.username}`, `Click [HERE](https://hastebin.com/${key}) to view the messages!`);
                msg.channel.sendEmbed(embed);

            }).catch(err => {
                console.error(`Error uploading to haste, Error: ${err.stack}`)
            })
        })

    })
}