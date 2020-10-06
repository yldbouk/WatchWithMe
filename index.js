// init website
//set vars

var serverStatusLabel = document.getElementById("serverStatus");
var connectionBtn = document.getElementById("connectionBtn");
var watchBtn = document.getElementById("watchBtn");
var chatBtn = document.getElementById("chatBtn");
var usersBtn = document.getElementById("usersBtn");
var nameInput = document.getElementById("NameInput");
var IPInput = document.getElementById("IPInput");
var connectBtn = document.getElementById("connectBtn");
var usersList = document.getElementById("usersList");
var chatDiv = document.getElementById("chatDiv");
var chatInput = document.getElementById("chatBoxInput");

var connection = { ws: null, users: [], video: {} };


// define functions

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
  }

function connectionClosed(event) {
    if (event.wasClean) {
        console.log(`[WebSocket] Connection closed (code: ${event.code} | reason: ${event.reason})`);
      } else { // check codes
        console.error(`[WebSocket] Connection DIED. (code: ${event.code} | reason: ${event.reason})`);
        if (event.code == "1006") alert("Disconnected: The server did not respond."); 
    }
    changeConnectionStatus("disconnect");
}

function connectionOpened(name) {
    console.log("[WebSocket] Connection Established.");
    document.getElementById("serverStatus").classList = "";
    document.getElementById("serverStatus").innerHTML="Connected";
    watchBtn.style = "visibility: visible";
    chatBtn.style = "visibility: visible";
    usersBtn.style = "visibility: visible";
    connectBtn.onclick = function(){changeConnectionStatus('disconnect')};
    connectBtn.innerHTML="Disconnect";
    nameInput.disabled = true;
    IPInput.disabled = true; 
    connection.ws.send("[NAME] " + name);
}

function sendChatMessage(message) {
    if (message == "") return;
    connection.ws.send("[CHAT] " + message);
    chatInput.value = "";
}

function changeConnectionStatus(mode, ip, name) {
    if (mode === "disconnect") {
        if(connection.ws !== null) connection.ws.close();
        serverStatusLabel.innerHTML = "Disconnected";
        serverStatusLabel.classList = "disconnected";
        connectBtn.onclick = function(){changeConnectionStatus('connect', document.getElementById('IPInput').value, document.getElementById('NameInput').value)};
        connectBtn.innerHTML="Connect";
        watchBtn.style = "visibility: hidden";
        chatBtn.style = "visibility: hidden";
        usersBtn.style = "visibility: hidden";
        chatDiv.innerHTML = "";
        nameInput.disabled = false;
        IPInput.disabled = false;
        var evObj = document.createEvent('Events');
        evObj.initEvent("click", true, false);
        connectionBtn.dispatchEvent(evObj);
    } else if (mode === "connect") {
        if (ip !== "") {
            console.log(ip)
            connection.ws = new WebSocket("ws://"+ ip + ":21038");
            connection.ws.onopen = function(e) {connectionOpened(name)};
            connection.ws.onclose = function(event) {connectionClosed(event)};
            connection.ws.onerror = function(error) {console.error(`${error.message}`)};
            connection.ws.onmessage = function(event) {
                let message = event.data;
                if (message.startsWith("[ACK]")) {
                    console.debug("received ACK: "+message);
                    // confirm username
                    let name = message.split("[ACK] ")[1];
                    if (name !== document.getElementById('NameInput').value) {
                        // Instead of disconnecting client side, we ask the server to disconnect us so
                        // the server knows what went wrong (code and reason didnt work with me on client).
                        console.warn("Disconnecting: Name Handshake Failed");
                        connection.ws.send("[DISCONNECT] Name Handshake Failed");
                        alert("An error occured while connecting. Please try again.");
                    } else {
                        console.debug("ACK succeeded. Querying Users...");
                        connection.ws.send("[USERS]");
                    }


                } 
                else 
                
                if (message.startsWith("[USERS]")) {
                    // parse and update users list
                    console.log("Received New User List")
                    let json = message.split("[USERS] ")[1];
                    connection.users = JSON.parse(json);
                    usersList.innerHTML = connection.users.join("<br><br>");
                } 
                else 
                
                if (message.startsWith("[CHAT]")) {
                    // dont mind my complicated way of doing things
                    console.debug("New Chat: " + message);
                    let content = JSON.parse(message.split("[CHAT] ")[1]);
                    chatDiv.innerHTML = chatDiv.innerHTML + `<b style="color:lightgray;">(${content["username"]})</b> ${content["messageContent"]}<br>`;
                } 
                else

                if (message.startsWith("[SYNC]")) {
                    // parse and update video src and time
                } 
                else 
                
                console.error("Invalid Command Received: " + message)
            };
        } else { 
            throw "connectNoIpProvided"
        }
    }
    
}

// Finally, call disconnect to get things started

changeConnectionStatus("disconnect");