// TO-DO
// give a client an identifier and identify them that way instead of client id

"use strict";
process.title = 'WatchWithMe-Server';
var webSocketsServerPort = 21038;
var webSocketServer = require('websocket').server;
var http = require('http');
const { client } = require('websocket');
const { brotliDecompress } = require('zlib');

var clients = [ ],
    video = {state: "stopped", currentlyPlayingURL: null};

var server = http.createServer(function(request, response) {
});

function broadcast(message) {
    clients.forEach(client => {if(client !== null) client.send(message)});
}

function broadcastConnectedUsers() {
    var users = [];
    clients.forEach(client =>{try{if(client.state == "open") users.push(client["NAME"])}catch{}});
    broadcast("[USERS] " + JSON.stringify(users));
}
  
server.listen(webSocketsServerPort, function() {
  console.log((new Date()) + " Server is listening on port "+ webSocketsServerPort);
});
var wsServer = new webSocketServer({ httpServer: server });

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin); 
  
    var i = clients.push(connection) - 1;
    console.log((new Date()) + ' Connection from origin "' + request.origin + '" was accepted.');  

    connection.on('message', function(messageRaw) {
        let message = messageRaw.utf8Data;
        if (message.startsWith("[NAME] ")) {
            let chosenName = message.split("[NAME] ")[1];
            var allgood = true;
            if (chosenName == "SERVER") clients[i].close(4001, "This username is taken.");
            clients.forEach(client => {if(client !== null) if (client.state == "open" && chosenName == client["NAME"]) allgood = false});
            if (!allgood) { // disconnect the user
                clients[i].close(4001, "This username is taken.")
            } else {// ack the user and store name
                clients[i]["NAME"] = chosenName;
                clients[i]["PLAYERSTATE"] = "NOTREADY";
                console.log(new Date() + "Client "+i+ " has logged in with name: "+ clients[i]["NAME"]);
                clients[i].send("[ACK] " + clients[i]["NAME"]);
                broadcast("[CHAT] " + JSON.stringify({messageContent: chosenName + " connected.", username: "SERVER"}));
            }
        } 
    
        else 
        
        if (message.startsWith("[DISCONNECT] ")) {
            let reason = message.split("[DISCONNECT] ")[1];
            clients[i].close(4000, reason);
            console.warn(new Date() + "Client "+i+ " has asked to be disconnected: "+ reason);
        } 
    
        else 
        
        if (message === "[USERS]") {
            console.log(new Date() + "(Client "+i+ ") Query for Users.");
            broadcastConnectedUsers();
        } 
    
        else  
        
        if (message.startsWith("[CHAT]")) {
            var chatObject = {messageContent: message.split("[CHAT] ")[1], username: clients[i]["NAME"]};
            console.log(new Date() + `[CHAT] [${i}: ${clients[i]["NAME"]}] ${chatObject.messageContent}`);
            broadcast("[CHAT] " + JSON.stringify(chatObject));
        } 
      
        else 

        if (message.startsWith("[PLAY]")) {
            let VID = message.split("[PLAY] ")[1];
            console.log(new Date() + `CLient ${i} has requested to play URL: ${VID}`);
            if(video.state !== "stopped") {
                video.state = "stopped";
                broadcast("[SYNC] STOP");
                setTimeout(()=>{broadcast("[PLAY] " + VID)}, 1000);
            } 

            //reset everyone's state to not ready
            clients.forEach(client =>{if(client != null) client["PLAYERSTATE"] = "NOTREADY"});

             video.platform = "url";
             video.currentlyPlayingURL = VID;
             video.state = "waiting";

             broadcast("[PLAY] " + VID);
            
            
            //broadcast("[CHAT] " + JSON.stringify(chatObject));
        }
      
        else

        if (message.startsWith("[SYNC]")) {
            let action = message.split("[SYNC] ")[1];
            if(action.startsWith("READYTOSTART")){ // client is ready to play video
                //check if all clients are ready, else wait.
                console.log("Client "+ i + " is ready.")

                let URL = action.split("READYTOSTART ")[1];
                if (URL !== video.currentlyPlayingURL) clients[i].send("[PLAY] " + URL);
                clients[i]["PLAYERSTATE"] = "READY";
                var ready = true;
                clients.forEach(client => {
                    if(client !== null && client["PLAYERSTATE"] !== "READY") ready = false;
                });

                if(ready) {
                    console.log("All clients ready. Playing...");
                    broadcast("[SYNC] PLAY");
                    clients.forEach(client =>{if(client !==null){ client["PLAYERSTATE"] = "NOTREADY";}}) // reset states for later
                }
            }

            else

            if(action.includes("SEEK")) {
                let time = action.split("SEEK ")[1];
                console.log("Client " + i + " requested to seek to second " + time);
                broadcast("[SYNC] SEEK "+ time);
            }

            else 

            if (action === "PAUSE") {
                console.log("Client " + i + " requested to pause");
                broadcast("[SYNC] PAUSE");
            }
            
            else

            if (action === "PLAY") {
                console.log("Client " + i + " requested to play")
                broadcast("[SYNC] PLAY");
            }
        }

        else

        {
            console.error(new Date() + "unknown msg received: "+ message);
        }
    
    
    });
      
    connection.on('close', function(connection) {
        try {
            console.log((new Date()) + ` (${i}) disconnected.`);
            broadcast("[CHAT] " + JSON.stringify({messageContent: clients[i]["NAME"] + " disconnected.", username: "SERVER"})); 
        } catch (err){console.error(err)}
        clients[i] = null;
        broadcastConnectedUsers()
    });

});

// TODO
// on connection close with code 4001, that code means the name check failed