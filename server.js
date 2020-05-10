var express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const path = require('path');
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (req, res) {
  res.sendFile('index.html');
});

var gameId = 1;
var numGrid = [];
var gameIdPrefix = "GAMEID-"
var numsAnn = [];

io.on('connection', (socket) => {
  socket.on('joinGame', gameId => {
    console.log("inside joinGame : " + gameId);
    if (io.nsps['/'].adapter.rooms[gameId] && io.nsps['/'].adapter.rooms[gameId].length > 0) {
      console.log("inside joinGame -2");
      socket.join(gameId);
      io.to(gameId).emit('GameConnected', 'You joined Game ID - ' + gameId);
      console.log(io.nsps['/'].adapter.rooms[gameId]);
      if (numsAnn.length!==0){
        console.log("sending boardstate for new joiner");
          socket.emit("boardState", numsAnn);
      }
    }
    else {
      console.log("Invalid Game Id");
      socket.emit('InvalidGameId', "Game Id: " + gameId + " does not exists.");
    }
  })
  socket.on('createGame', function () {
    if (io.nsps['/'].adapter.rooms[gameIdPrefix + gameId] && io.nsps['/'].adapter.rooms[gameIdPrefix + gameId].length > 0) {
      gameId++;
    }
    numGrid[gameId] = [];
    for (let i = 1; i < 91; i++) {
      var tempNG = { num: i };
      numGrid[gameId].push(tempNG);
    }
    socket.join(gameIdPrefix + gameId);
    //io.sockets.in('gameId').emit('GameConnected','Your Game ID is 1111');
    io.sockets.in(gameIdPrefix + gameId).emit('GameCreated', gameIdPrefix + gameId);
  })
  socket.on('getNewNum', data => {
    var gameInt = data.split("-");
    var gameId = gameInt[1];
    var rangeup = numGrid[gameId].length;
    var randomNum = Math.floor(Math.random() * rangeup) + 1;
    var currNum = numGrid[gameId][randomNum - 1].num;
    numGrid[gameId].splice(randomNum - 1, 1);
    console.log('Current Number :' + currNum);
    numsAnn.push(currNum);
    io.sockets.in(data).emit('newNum', currNum);
  })
  socket.on('disconnet', () => {
    socket.disconnect();
  });
  socket.on('reconnect', ()=> {
    socket.emit('reconnected');
  });
  console.log('a user connected:' + gameId);
});
http.listen(8080, () => {
  console.log('listening on *:8080');
});