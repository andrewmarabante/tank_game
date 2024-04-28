var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socket = require('socket.io');
var http = require('http');
var cors = require('cors')
const loadMap = require('./loadMap.js')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var server = http.createServer(app)

server.listen(4000, ()=>{
  console.log('server listening on port 4000')
})

var io = socket(server);

const TICK_RATE = 30;
const SPEED = 3

const players = [];
const inputsMap = {}

function tick(){
    players.map((player)=> {

      const inputs = inputsMap[player.id]

      // console.log(inputs)

      if(inputs.up && inputs.left){
        player.y -= SPEED *.71
        player.x -= SPEED *.71
        player.direction = 'upLeft'
      }
      else if(inputs.up && inputs.right){
        player.y -= SPEED *.71
        player.x += SPEED  *.71   
        player.direction = 'upRight'
      }
      else if(inputs.down && inputs.right){
        player.y += SPEED *.71
        player.x += SPEED *.71    
        player.direction = 'downRight'  
       }
      else if(inputs.down && inputs.left){
        player.y += SPEED *.71
        player.x -= SPEED *.71 
        player.direction = 'downLeft'       
      }
      else if(inputs.up){
        player.y -= SPEED
        player.direction = 'up'
      }
      else if(inputs.down){
        player.y += SPEED
        player.direction = 'down'
      }
      else if(inputs.left){
        player.x -= SPEED
        player.direction = 'left'
      }
      else if(inputs.right){
        player.x += SPEED
        player.direction = 'right'
      }

    })

    io.emit('players', players)
}

async function main(){

  const map2D = await loadMap()

  io.on('connection', (socket) => {

    console.log('Made Socket Connection: ' +socket.id)
    players.push({
      id: socket.id,
      x: 0,
      y: 0,
      direction: 'up',
    })
    inputsMap[socket.id] = {
      up: false,
      down: false,
      right: false,
      left: false
    };

    socket.emit('map', map2D)
  
  
    socket.on('input', (inputs) => {
      console.log(inputs)
      inputsMap[socket.id] = inputs;
      console.log(inputsMap)
    })
  })

  setInterval(tick, 1000 / TICK_RATE)

}

main();






// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
