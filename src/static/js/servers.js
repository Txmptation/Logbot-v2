function loadAllGuilds() {
    for (let x = 0; x < visibleGuilds.length; x++) {

        if (typeof visibleGuilds[x] === "undefined") return;
        createGuild(visibleGuilds[x].id, visibleGuilds[x].name, visibleGuilds[x].members, visibleGuilds[x].region, visibleGuilds[x].icon);
    }
}

function createGuild(guildId, guildName, guildMembers, region, profilePic) {

    // Check details

    let parent = document.getElementById("guild_list_table");

    let guild = document.createElement('tr');
    guild.onclick = function () {
        location.href = `./servers/${guildId}`
    };

    let space = document.createElement('td');
    guild.appendChild(space);

    let profilePicSpace = document.createElement('td');
    let profileSpan = document.createElement('span');
    profileSpan.setAttribute('class', 'icon is-medium');
    let picture = document.createElement('img');
    picture.setAttribute('src', `https://cdn.discordapp.com/icons/${guildId}/${profilePic}.jpg`);
    picture.setAttribute('style', 'border-radius: 100%;');

    profileSpan.appendChild(picture);
    profilePicSpace.appendChild(profileSpan);
    guild.appendChild(profilePicSpace);

    let guildNameSpace = document.createElement('td');
    let guildFormatting = document.createElement('b');
    let guildNameText = document.createTextNode(guildName);

    guildFormatting.appendChild(guildNameText);
    guildNameSpace.appendChild(guildFormatting);
    guild.appendChild(guildNameSpace);

    let guildMembersSpace = document.createElement('td');
    let guildMembersFormatting = document.createElement('b');
    let guildMembersText = document.createTextNode(guildMembers);
    guildMembersFormatting.appendChild(guildMembersText);
    guildMembersSpace.appendChild(guildMembersFormatting);
    guild.appendChild(guildMembersSpace);

    let regionSpace = document.createElement('td');
    let regionText = document.createTextNode(region);
    regionSpace.appendChild(regionText);
    guild.appendChild(regionSpace);

    parent.appendChild(guild);
}

function searchGuildTable() {
    let table = document.getElementById('guild_list_table');
    let inputSearch = document.getElementById('input_search_guild');

    let filter = inputSearch.value.toUpperCase();
    let tr = table.getElementsByTagName('tr');

    for (let i = 0; i < tr.length; i++) {
        let td = tr[i].getElementsByTagName("td")[2];
        if (td) {
            if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

loadAllGuilds();