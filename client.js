// init website
//set vars

var serverStatusLabel = document.getElementById("serverStatus"),
    connectionBtn = document.getElementById("connectionBtn"),
    watchBtn = document.getElementById("watchBtn"),
    chatBtn = document.getElementById("chatBtn"),
    usersBtn = document.getElementById("usersBtn"),
    nameInput = document.getElementById("NameInput"),
    IPInput = document.getElementById("IPInput"),
    connectBtn = document.getElementById("connectBtn"),
    usersList = document.getElementById("usersList"),
    chatDiv = document.getElementById("chatDiv"),
    chatInput = document.getElementById("chatBoxInput"),
    videoURLInput = document.getElementById("videoURLInput"),
    playerLocal = document.getElementById("playerlocal"),
    youtubeVideoID,
    localPlayerURL,
    player = {
        playVideo: function(){document.getElementById("player").play()},
        pauseVideo: function(){document.getElementById("player").pause()},
        play: function(url){
            document.getElementById("player").style = "visibility: visible";
            document.getElementById("player").innerHTML = "";
            var newSource = '<source src=' + url + '>';
            document.getElementById("player").insertAdjacentHTML('beforeend', newSource);
            document.getElementById("player").load(url)
        },
        destroy: function(){
            document.getElementById("player").innerHTML = ""; 
            document.getElementById("player").load()
        }
    }

    var connection = { ws: null, users: [], video: {} };
    window.onbeforeunload = function(){if(connection.ws !== null){connection.ws.close(); return "haha";}};


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
        console.error(`[WebSocket] Connection DIED. (code: ${event.code} | reason: ${event.reason})`);
    }
    if (event.code == "1006") alert("Disconnected: The server did not respond."); else
    if (event.code == "4001") alert("Disconnected: This username is already taken."); 
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

function queueVideo(url) {
    //check for youtube
    if (url.includes("https://www.youtube.com/" || "https://yt.be/")){ watchVideoYT(url); return }
        
    connection.ws.send("[PLAY] " + url);
        console.log("sent status");
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
        player.destroy();
        nameInput.disabled = false;
        connection.ws = null;
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
                    var color = "lightgrey";
                    if (content["username"] === "SERVER") color = "orange";
                    chatDiv.innerHTML = chatDiv.innerHTML + `<b style="color:${color};">(${content["username"]})</b> ${content["messageContent"]}<br>`;
                } 
                else

                if (message.startsWith("[SYNC]")) {
                    // parse and do stuff
                    let action = message.split("[SYNC] ")[1];

                    if(action === "PLAY") player.playVideo(); else
                    if(action === "PAUSE") player.pauseVideo(); else
                    if(action === "STOP") player.destroy(); else
                    if(action.includes("SEEK")){
                        let time = action.split("SEEK ")[1];
                        player.seekTo(time);
                        player.pauseVideo();
                    }
                }

                else

                if (message.startsWith("[REJECT]")) {
                    // the server rejected the last action
                    alert("The server rejected your request.");
                }
                
                else

                if (message.startsWith("[PLAY]")) {
                   currentlyPlayingURL = message.split("[PLAY] ")[1];
                } 

                if (message.startsWith("[PLAY]")) {
                    let url = message.split("[PLAY] ")[1];
                    localPlayerURL = url;
                    player.play(url);
                    
                    
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