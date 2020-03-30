var server = require('./server.js'); 
var routes = ['tasks'];
var serviceName = "tasks";
server.start(serviceName, routes);