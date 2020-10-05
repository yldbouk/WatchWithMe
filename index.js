// init website
//set vars

var serverStatusLabel = document.getElementById("serverStatus");
var connectBtn = document.getElementById("connectBtn");
var watchBtn = document.getElementById("watchBtn");
var chatBtn = document.getElementById("chatBtn");
var usersBtn = document.getElementById("usersBtn");

var connection = {"open": false, ws: null};


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
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        alert('[WebSocket] Connection died. (code: ${event.code} | reason: ${event.reason})');
      }
}

function connectionOpened(name) {
    console.log("[WebSocket] Connection Established.");
    socket.send("[LOGIN] name="+name);
}

function changeConnectionStatus(mode, ip, name) {
    if (mode === "disconnect") {
        connection.open = false;
        serverStatusLabel.innerHTML = "Disconnected";
        serverStatusLabel.classList = "disconnected";
        connectBtn.style = "visibility: visible";
        watchBtn.style = "visibility: hidden";
        chatBtn.style = "visibility: hidden";
        usersBtn.style = "visibility: hidden";
    } else if (mode === "connect") {
        if (ip == "") {
            console.log(ip)
            connection.ws = new WebSocket(ip);
            socket.onopen = function(e) {connectionOpened(name)};
            socket.onclose = function(event) {connectionClosed(event)};
            socket.onerror = function(error) {console.error(`${error.message}`)};
            socket.onmessage = function(event) {
                let message = event.data;
                if (message.includes("[USERS]")) {
                    // parse and update users list
                } else if (message.includes("[CHAT]")) {
                    // parse and add chat message
                } if (message.includes("[SYNC]")) {
                    // parse and update video src and time
                }
            };
        } else { 
            throw "connectNoIpProvided"
        }
    }
    
}