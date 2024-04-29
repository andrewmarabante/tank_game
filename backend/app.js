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
const SPEED = 3;
const PROJECTILE_SPEED = 7;
const TILE_SIZE = 16

let players = [];
let projectiles = [];
let terrain = []

const inputsMap = {}

function isColliding(object, terrain){
  if(!object.ammo){
    for(let structures = 0 ; structures < terrain.length; structures++){
      for(let i = 0; i < terrain[structures].length; i++){
        if(
            //working on this. TERRAIN IS 2 DIMENSIONAL!!!!!
          //checks if two rectangles are colliding
          object.x < terrain[structures][i].x + terrain[structures][i].w &&
          object.x + object.w > terrain[structures][i].x &&
          object.y < terrain[structures][i].y + terrain[structures][i].h &&
          object.y + object.h > terrain[structures][i].y
    ){
      return true
    }}
    }
      return false
  }else if(object.ammo === 'reg'){
// working on this!! need to do this
    let radius = 5;
    //checks if circle and rectangle are colliding
    var distX = Math.abs(object.x - terrain.x-terrain.w/2);
    var distY = Math.abs(object.y - terrain.y-terrain.h/2);

    if (distX > (terrain.w/2 + radius)) { return false; }
    if (distY > (terrain.h/2 + radius)) { return false; }

    if (distX <= (terrain.w/2)) { return true; } 
    if (distY <= (terrain.h/2)) { return true; }
  }
}

function tick(){
    players.map((player)=> {

      const inputs = inputsMap[player.id]

      const prevX = player.x
      const prevY = player.y

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
      
      if(isColliding(player, terrain)){
        player.x = prevX;
        player.y = prevY;
      }

    })

    projectiles.map( projectile => {
      projectile.x += Math.cos(projectile.angle) * PROJECTILE_SPEED
      projectile.y += Math.sin(projectile.angle) * PROJECTILE_SPEED

      players.map(player => {
        const distance = Math.sqrt((player.x - projectile.x) **2 + (player.y - projectile.y) **2 )

        if(distance <=25 && projectile.id !== player.id){
          player.x = 0
          player.y = 0 
        }
      })

      if(isColliding(projectile, terrain)){
        console.log('hit')
      }
    })


    io.emit('players', players)
    io.emit('projectiles', projectiles)
}

async function main(){

  const map2D = await loadMap()
  let fences = [];
  let water = [];

  for(let row = 0; row < map2D.length; row++){
    for(let col = 0; col < map2D[row].length; col++){
      if(map2D[row][col].gid >= 171){
        const terrain = {
          index: row*100 + col,
          id: map2D[row][col].id,
          gid: map2D[row][col].gid,
          x: col*TILE_SIZE +TILE_SIZE,
          y: row*TILE_SIZE +TILE_SIZE,
          w: TILE_SIZE,
          h: TILE_SIZE
        }
        water.push(terrain)
      }else if(map2D[row][col].gid >= 155){
        const terrain = {
          index: row*100 + col,
          id: map2D[row][col].id,
          gid: map2D[row][col].gid,
          x: col*TILE_SIZE +TILE_SIZE,
          y: row*TILE_SIZE +TILE_SIZE,
          w: TILE_SIZE,
          h: TILE_SIZE
        }
        fences.push(terrain)
      }
    }
  }
  
  terrain.push(fences)
  terrain.push(water)


  io.on('connection', (socket) => {

    console.log('Made Socket Connection: ' +socket.id)

    players.push({
      id: socket.id,
      x: 0,
      y: 0,
      w: 40,
      h: 40,
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
      inputsMap[socket.id] = inputs;
    })

    socket.on('fire', (angle) => {
      const player = players.find((player) => player.id === socket.id)
  
      projectiles.push({
        id: socket.id,
        angle : angle,
        x: player.x,
        y: player.y,
        ammo: 'reg',
      })

    })

    socket.on('disconnect', () => {
      players = players.filter((player) => { return player.id !== socket.id})
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
