const utils = require('./../../../utils');
const botUtils = require('./../botUtils');

exports.onMsgDeleted = function (msg) {

};

/**
 * Checks to see if the message that was deleted was visible to everyone
 */
function checkEveryoneCanSeeMsg(msg) {

    utils.getGeneralRoleId(msg.guild).then(roleId => {

        let role = msg.guild.roles.get(roleId);
        if (!role) return false;



    })
}