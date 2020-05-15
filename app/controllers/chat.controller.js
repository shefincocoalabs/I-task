exports.getChat = (req, res) => {
//   res.sendFile(__dirname + '/chat.html');
res.send('hiii');
}

exports.chat = function (io) {
  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('joined', function (data) {
      console.log(data);
      socket.emit('acknowledge', 'Acknowledged');
    });
    socket.on('chat message', function (msg) {
      console.log('message: ' + msg);
      socket.emit('response message', msg + '  from server');
      //socket.broadcast.emit('response message', msg + '  from server');
    });
  });
};


