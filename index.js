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

function changeConnectionStatus(mode, ip) {
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



        } else { 
            throw "connectNoIpProvided"
        }
    }
    
}