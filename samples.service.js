var server = require('./server.js'); 
var routes = ['sample'];
var serviceName = "samples";
server.start(serviceName, routes);