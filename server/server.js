"use strict";
process.title = 'WatchWithMe-Server';
var webSocketsServerPort = 21038;
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [ ];

var server = http.createServer(function(request, response) {
});

function broadcast(message) {
    clients.forEach(client => {client.send(message)});
}
  
server.listen(webSocketsServerPort, function() {
  console.log((new Date()) + " Server is listening on port "+ webSocketsServerPort);
});
var wsServer = new webSocketServer({ httpServer: server });

wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');  

  var connection = request.accept(null, request.origin); 
  
  var i = clients.push(connection) - 1;
   console.log((new Date()) + ' Connection accepted.');  

  connection.on('message', function(messageRaw) {
      let message = messageRaw.utf8Data;


    if (message.startsWith("[NAME] ")) {
        clients[i]["NAME"] = message.split("[NAME] ")[1];
        console.log("Client "+i+ " has given name: "+ clients[i]["NAME"]);
        // ack the user
        clients[i].send("[ACK] " + clients[i]["NAME"]);
    } 

    else 
    
    if (message.startsWith("[DISCONNECT] ")) {
        let reason = message.split("[DISCONNECT] ")[1];
        clients[i].close(4000, reason);
        console.warn("Client "+i+ " has asked to be disconnected: "+ reason);
    } 

    else 
    
    if (message === "[USERS]") {
          console.log("("+i+ ") Query for Users.");
          var users = [];
          clients.forEach(client => {users.push(client["NAME"])});
          broadcast("[USERS] " + JSON.stringify(users));


    } 

    else  
    
    if (message.startsWith("[CHAT]")) {
        var chatObject = {messageContent: message.split("[CHAT] ")[1], username: clients[i]["NAME"]};
        console.log(`[CHAT] [${i}: ${clients[i]["NAME"]}] ${chatObject.messageContent}`);
        broadcast("[CHAT] " + JSON.stringify(chatObject));
    } 
  
    else
    
    {
        console.log("msg received: "+ message);
    }


    });
  
    connection.on('close', function(connection) {
        console.log((new Date()) + ` "${clients[i]["NAME"]}" (${i}) disconnected.`);      
        clients.splice(i, 1);
        var users = [];
        clients.forEach(client => {users.push(client["NAME"])});
        broadcast("[USERS] " + JSON.stringify(users));
    });
});

// TODO
// on connection close with code 4001, that code means the name check failed