var server = require('./server.js'); 
var routes = ['projects'];
var serviceName = "projects";
server.start(serviceName, routes);