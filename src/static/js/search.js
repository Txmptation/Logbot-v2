let searchStatus = {};
let searchingGuilds = [];

function submitSearch() {

    for (let guild in searchStatus) {
        if (searchStatus.hasOwnProperty(guild)) {

            if (searchStatus[guild] == 1) {
                searchingGuilds.push(guild);
            }
        }
    }
    console.log(searchingGuilds);

    window.location.href = getRedirectUrl();
}

function getRedirectUrl() {
    let username = document.getElementById('search_username').value;
    let authorId = document.getElementById('search_author_id').value;
    let messageId = document.getElementById('search_message_id').value;
    let displayDeleted = document.getElementById('search_deleted_messages').checked;


    let url = '/search/results?';

    url += `displayDeleted=${displayDeleted}`;
    if (searchingGuilds.length > 0) url += `&searchGuilds=${searchingGuilds}`;
    if (username) url += `&username=${username}`;
    if (authorId) url += `&authorId=${authorId}&`;
    if (messageId) url += `&messageId=${messageId}&`;


    return url;
}

function checkboxSwitched(guildId) {
    let guildCheckbox = document.getElementById(`checkbox_${guildId}`);

    if (!guildCheckbox) {
        console.error(`Unable to find guild with id: ` + guildId);
        return;
    }

    console.log(guildId);

    let isChecked = guildCheckbox.checked;
    if (isChecked) {
        searchStatus[guildId] = 1;
    } else {
        searchStatus[guildId] = 0;
    }

}