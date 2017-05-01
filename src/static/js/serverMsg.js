var currentPage = 1;
var currentChannelId = 'all';
var serverMessages;
var newMessageList;
var maxPages;

function loadServerMessages() {

    var xhrRequest = new XMLHttpRequest();
    xhrRequest.overrideMimeType("application/json");
    xhrRequest.open('GET', `${serverHost}/api/read?serverid=${guildId}`);
    xhrRequest.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {

            serverMessages = JSON.parse(xhrRequest.responseText);
            newMessageList = serverMessages;
            maxPages = Math.floor(serverMessages.length / entriesPerPage) + 1
            console.log('LOADING')
            loadDefaultPage();
        }
    };
    xhrRequest.send();
}

function changeChannelView(channelId) {
    if (channelId != currentChannelId) {

        let oldItem = document.getElementById('id_' + currentChannelId);
        oldItem.setAttribute('class', 'item');

        let newItem = document.getElementById(`id_${channelId}`);
        newItem.setAttribute('class', 'item active');

        if (channelId == 'all') {
            loadDefaultPage();
            return;
        }

        currentChannelId = channelId;
        maxPages = Math.floor(newMessageList.length / entriesPerPage) + 1;

        newMessageList = [];
        for (let x = 0; x < serverMessages.length; x++) {
            if (serverMessages[x].channelID == channelId) newMessageList.push(serverMessages[x]);
        }
        loadPage(1);
    }
}

function refresh() {
    //showSpinner();
    loadServerMessages();
    changeChannelView('all');

}

function getEntriesToStart(page) {
    return page * entriesPerPage - entriesPerPage;
}

function getEntriesToStop(page) {
    return page * entriesPerPage;
}

function checkNextPage() {
    const nextButton = document.getElementById("buttonNext");
    if (currentPage < maxPages) {
        nextButton.setAttribute("style", "display: inline-block");
        return true;
    } else {
        nextButton.setAttribute("style", "display: none");
        return false;
    }
}

function checkPreviousPage() {
    const backButton = document.getElementById("buttonBack");
    if (currentPage > 1) {
        backButton.setAttribute("style", "display: inline-block");
        return true;
    } else {
        backButton.setAttribute("style", "display: none");
        return false;
    }
}

function loadDefaultPage() {
    maxPages = Math.floor(serverMessages.length / entriesPerPage) + 1;
    newMessageList = serverMessages;
    loadPage(currentPage);
}

function loadNextPage() {
    if (checkNextPage()) {
        loadPage(currentPage + 1);
    }
}

function loadPreviousPage() {
    if (checkPreviousPage()) {
        loadPage(currentPage - 1);
    }
}

function clearEntries() {
    const messagesTable = document.getElementById("message_list_table");
    while (messagesTable.rows.length > 0) {
        messagesTable.deleteRow(0)
    }
}

function loadPage(page) {
    currentPage = page;

    clearEntries();

    let entriesToStart = getEntriesToStart(page);
    let entriestoStop = getEntriesToStop(page);

    for (let x = entriesToStart; x < entriestoStop; x++) {
        if (typeof newMessageList[x] !== 'undefined') {

            let messageObj = newMessageList[x];

            createMessage(messageObj.authorName, messageObj.channelName, messageObj.date, messageObj.message);
        }
    }

    checkNextPage();
    checkPreviousPage();

    hideSpinner();
    updateEntriesNum();

    let messagesTable = document.getElementById("message_list_table");
    if (messagesTable.rows.length === 0) {
        showBrokenTooltip();
    } else {
        hideBrokenTooltip();
    }
}

function createMessage(username, channel, date, message) {
    let parent = document.getElementById('message_list_table');

    let msg = document.createElement('tr');
    let space = document.createElement('td');
    msg.appendChild(space);

    let usernameSpace = document.createElement('td');
    usernameSpace.setAttribute('style', 'white-space: nowrap; overflow: hidden;');
    let usernameFormatting = document.createElement('b');
    let usernameText = document.createTextNode(username);
    usernameFormatting.appendChild(usernameText);
    usernameSpace.appendChild(usernameFormatting);
    msg.appendChild(usernameSpace);

    let channelSpace = document.createElement('td');
    channelSpace.setAttribute('style', 'white-space: nowrap; overflow: hidden;');
    let channelText = document.createTextNode(channel);
    channelSpace.appendChild(channelText);
    msg.appendChild(channelSpace);

    let dateSpace = document.createElement('td');
    dateSpace.setAttribute('style', 'white-space: nowrap; overflow: hidden;');
    let dateFormatting = document.createElement('i');
    let dateText = document.createTextNode(date);
    dateFormatting.appendChild(dateText);
    dateSpace.appendChild(dateFormatting);
    msg.appendChild(dateSpace);

    let messageSpace = document.createElement('td');
    let messageFormatting = document.createElement('i');
    let messageText = document.createTextNode(message);
    messageFormatting.appendChild(messageText);
    messageSpace.appendChild(messageFormatting);
    msg.appendChild(messageSpace);

    parent.appendChild(msg);
}

function showBrokenTooltip() {
    let notification = document.getElementById('noMessages');
    notification.setAttribute('style', 'display: block');
}

function hideBrokenTooltip() {

    let notification = document.getElementById('noMessages');
    notification.setAttribute('style', 'display: none');
}

function showSpinner() {
    let table = document.getElementById('message_list_table');
    let spinner = document.getElementById("loadingSpinner");

    table.setAttribute('style', 'display: none');
    spinner.setAttribute("style", "display: block;");
}

function hideSpinner() {
    let spinner = document.getElementById("loadingSpinner");

    spinner.setAttribute("style", "display: none;");
}

function updateEntriesNum() {
    let num = document.getElementById('totalEntries');
    num.innerHTML = `<b><i>${newMessageList.length}</i> total entries! With <i>${entriesPerPage}</i> per page!</b>`
}

loadServerMessages();