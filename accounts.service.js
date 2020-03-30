var server = require('./server.js'); 
var routes = ['accounts'];
var serviceName = "accounts";
server.start(serviceName, routes);