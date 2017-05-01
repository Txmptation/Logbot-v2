let searchingGuilds = [];

function submitSearch() {

    checkSearchingGuilds();

    console.log(searchingGuilds);

    window.location.href = getRedirectUrl();
}

function checkSearchingGuilds() {
    for (let x = 0; x < visibleGuilds.length; x++) {
        let checkboxId = `checkbox_${visibleGuilds[x].id}`;
        let checkbox = document.getElementById(checkboxId);
        if (checkbox.checked) searchingGuilds.push(visibleGuilds[x].id);
    }
}

function getRedirectUrl() {
    let username = document.getElementById('search_username').value;
    let authorId = document.getElementById('search_author_id').value;
    let channelId = document.getElementById('search_channel_id').value;
    let messageId = document.getElementById('search_message_id').value;
    let displayDeleted = document.getElementById('search_deleted_messages').checked;


    let url = '/search/results?';

    url += `displayDeleted=${displayDeleted}`;
    if (searchingGuilds.length > 0) url += `&searchGuilds=${searchingGuilds}`;
    if (username) url += `&username=${username}`;
    if (authorId) url += `&authorId=${authorId}`;
    if (channelId) url += `&channelId=${channelId}`;
    if (messageId) url += `&messageId=${messageId}`;


    return url;
}