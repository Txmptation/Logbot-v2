let currentPage = 1;
let currentChannelId = 'all';
let newMessageList = serverMessages;
let maxPages = Math.floor(serverMessages.length / entriesPerPage) + 1;

function changeChannelView(channelId) {
    if (channelId !== currentChannelId) {

        if (channelId == 'all') {
            loadDefaultPage();
            return;
        }

        currentChannelId = channelId;

        newMessageList = [];
        for (let x = 0; x < serverMessages.length; x++) {
            if (serverMessages[x].channelID == channelId) {
                newMessageList.push(serverMessages[x]);
                console.log(serverMessages[x])
            }
        }
        loadPage(1);
    }
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

    checkNextPage();
    checkPreviousPage();

    let entriesToStart = getEntriesToStart(page);
    let entriestoStop = getEntriesToStop(page);

    for (let x = entriesToStart; x < entriestoStop; x++) {
        if (typeof newMessageList[x] === 'undefined') return;

        let messageObj = newMessageList[x];

        createMessage(messageObj.authorName, messageObj.channelName, messageObj.date, messageObj.message);
    }

    hideSpinner();
    updateEntriesNum();

    if (serverMessages[entriestoStop] - serverMessages[entriesToStart] == 0) {
        showBrokenTooltip();
    }
}

function createMessage(username, channel, date, message) {
    let parent = document.getElementById('message_list_table');

    let msg = document.createElement('tr');
    let space = document.createElement('td');
    msg.appendChild(space);

    let usernameSpace = document.createElement('td');
    let usernameFormatting = document.createElement('b');
    let usernameText = document.createTextNode(username);
    usernameFormatting.appendChild(usernameText);
    usernameSpace.appendChild(usernameFormatting);
    msg.appendChild(usernameSpace);

    let channelSpace = document.createElement('td');
    let channelText = document.createTextNode(channel);
    channelSpace.appendChild(channelText);
    msg.appendChild(channelSpace);

    let dateSpace = document.createElement('td');
    let dateText = document.createTextNode(date);
    dateSpace.appendChild(dateText);
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

}

function hideSpinner() {
    let spinner = document.getElementById("loadingSpinner");

    spinner.setAttribute("style", "display: none;");
}

function updateEntriesNum() {
    let num = document.getElementById('totalEntries');
    num.innerHTML = `<b><i>${newMessageList.length}</i> total entries!</b>`
}

loadDefaultPage();