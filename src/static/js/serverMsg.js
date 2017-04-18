let currentPage = 1;
let maxPages = Math.floor(serverMessages.length / entriesPerPage) + 1;

function changeChannelView(channelId) {
    let isAll = false;
    if (channelId === 'all') isAll = true;
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
    loadPage(currentPage);
}

function loadNextPage() {
    if (checkNextPage()) {
        clearEntries();
        loadPage(currentPage + 1);
    }
}

function loadPreviousPage() {
    if (checkPreviousPage()) {
        clearEntries();
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

    checkNextPage();
    checkPreviousPage();

    let entriesToStart = getEntriesToStart(page);
    let entriestoStop = getEntriesToStop(page);

    for (let x = entriesToStart; x < entriestoStop; x++) {
        if (typeof serverMessages[x] === 'undefined') return;

        let messageObj = serverMessages[x];

        createMessage(messageObj.authorName, messageObj.date, messageObj.message);
    }

    hideSpinner();

    if (serverMessages[entriestoStop] - serverMessages[entriesToStart] == 0) {
        showBrokenTooltip();
    }
}

function createMessage(username, date, message) {
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

loadDefaultPage();