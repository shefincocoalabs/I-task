const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
var consoleArguments = require('minimist');
var argv = consoleArguments(process.argv.slice(2));
// Configuring the database
var env = process.env.NODE_ENV;
env = env ? env : "development";
console.log("Environment is " + env);
const dbConfig = require('./config/database.config.js')[env];

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// create express app
const app = express();

//jwttoken and verification
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);
var chats  = require('./app/controllers/chat.controller');
 
chats.chat(io);



app.use(cors());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json());

module.exports = {
  connectToDb: function (callback) {

    mongoose.connect(dbConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then(() => {
      console.log("Successfully connected to the database");
      if (callback) {
        callback();
      }
    }).catch(err => {
      console.log('Could not connect to the database. Exiting now...', err);
      process.exit();
    });
  },
  start: function (serviceName, routes) {
    this.connectToDb(function () {

      var port = process.env.port ? process.env.port : null;
      port = port ? port : argv.port ? argv.port : null;
      if (!port) {
        console.log("PORT not set for " + serviceName + " service");

        process.exit(0);
      }
      if (routes) {
        var len = routes.length ? routes.length : 0;
        var i = 0;
        var route = null;
        while (i < len) {
          route = routes[i];
          console.log("Loading route " + route);
          require('./app/routes/' + route + '.routes.js')(app);
          i++;
        }
        server.listen(port, () => {
          console.log("Server is listening on port " + port);
        });

      }

    });

  }

};
