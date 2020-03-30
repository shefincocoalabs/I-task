var server = require('./server.js'); 
var routes = ['members'];
var serviceName = "members";
server.start(serviceName, routes);