var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socket = require('socket.io');
var http = require('http');

const tmx = require('tmx-parser')

let map = null;

async function loadMap(){
  map = await new Promise((resolve, reject) => {

    tmx.parseFile('./maps/Grassland.tmx', function(err, mapLoad) {
      if (err) return  reject(err);
      resolve(mapLoad)
    });

  })
}

loadMap();



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var cors = require('cors')

var app = express();

var server = http.createServer(app)

server.listen(4000, ()=>{
  console.log('server listening on port 4000')
})

var io = socket(server);

io.on('connection', (socket) => {

  console.log('Made Socket Connection: ' +socket.id)


  console.log(map.layers[0])

  socket.on('click', (data) => {
    io.sockets.emit('click', data)
  })
})




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
