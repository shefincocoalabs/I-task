var server = require('./server.js'); 
var routes = ['chats'];
var serviceName = "chats";
server.start(serviceName, routes);