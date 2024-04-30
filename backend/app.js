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
const SPEED = 20;
const PROJECTILE_SPEED = 7;
const TILE_SIZE = 16

let gameState = false;

let p1Start = {
  x: 63,
  y: 1540,
}

let p2Start = {
  x: 1535,
  y: 55,
}

let p3Start = {
  x: 65,
  y: 55,
}

let p4Start = {
  x: 1535,
  y: 1540,
}

let players = [];
let projectiles = [];
let terrain = []

const inputsMap = {}

function gameOver(winner){
  players.map(player => {
    if(player.Num === 1){
      player.x = p1Start.x
      player.y = p1Start.y
      player.direction = 'up'
    }
    else if(player.Num === 2){
      player.x = p2Start.x
      player.y = p2Start.y
      player.direction = 'down'
    }
    else if(player.Num === 3){
      player.x = p3Start.x
      player.y = p3Start.y
      player.direction = 'down'
    }
    else if(player.Num === 4){
      player.x = p4Start.x
      player.y = p4Start.y
      player.direction = 'up'
    }
    
    player.dead = false
  })
  gameState = false

  io.emit('game', false)
  io.emit('winner', winner.Num)
}


function isColliding(object, terrain){
  if(!object.ammo){
    for(let structures = 0 ; structures < terrain.length; structures++){
      for(let i = 0; i < terrain[structures].length; i++){
        if(
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

    let radius = 5;

    //checks if circle and rectangle are colliding
    for(let i = 0; i < terrain[0].length; i++){

      var distX = Math.abs(object.x - terrain[0][i].x+terrain[0][i].w/2);
      var distY = Math.abs(object.y - terrain[0][i].y+terrain[0][i].h/2);

      if( (distX < (terrain[0][i].w/2 + radius)) && (distY < (terrain[0][i].h/2 + radius)) ){
       
        if (distX <= (terrain[0][i].w/2)) { return true; } 
        if (distY <= (terrain[0][i].h/2)) { return true; }
      }
  }
   return false
  }
}

function tick(){
    players.map((player)=> {

      const inputs = inputsMap[player.id]

      const prevX = player.x
      const prevY = player.y

      if(inputs.up && inputs.left){

        if(player.dead){
          player.ghostY -= SPEED *.71
          player.ghostX -= SPEED *.71
        }
        else{player.y -= SPEED *.71
        player.x -= SPEED *.71
        player.direction = 'upLeft'}
      }
      else if(inputs.up && inputs.right){
        if(player.dead){
          player.ghostY -= SPEED *.71
          player.ghostX += SPEED *.71
        }
        else{
          player.y -= SPEED *.71
          player.x += SPEED  *.71   
          player.direction = 'upRight'}
      }
      else if(inputs.down && inputs.right){
        
        if(player.dead){
          player.ghostY += SPEED *.71
          player.ghostX += SPEED *.71
        }
        else{
          player.y += SPEED *.71
          player.x += SPEED *.71    
          player.direction = 'downRight' } 
       }
      else if(inputs.down && inputs.left){
        
        if(player.dead){
          player.ghostY += SPEED *.71
          player.ghostX -= SPEED *.71
        }
        else{
          player.y += SPEED *.71
          player.x -= SPEED *.71 
          player.direction = 'downLeft'   }    
      }
      else if(inputs.up){
        
        if(player.dead){
          player.ghostY -= SPEED 
        }
        else{
          player.y -= SPEED
          player.direction = 'up'}
      }
      else if(inputs.down){
        if(player.dead){
          player.ghostY += SPEED 
        }
        else{
          player.y += SPEED
          player.direction = 'down'}
      }
      else if(inputs.left){
        if(player.dead){
          player.ghostX -= SPEED 
        }
        else{
          player.x -= SPEED
          player.direction = 'left'}
      }
      else if(inputs.right){
        if(player.dead){
          player.ghostX += SPEED 
        }
        else{
          player.x += SPEED
          player.direction = 'right'}
      }
      
      if(isColliding(player, terrain)){
        player.x = prevX;
        player.y = prevY;
      }

    })

    //Determines if player is shot
    projectiles.map( projectile => {
      projectile.x += Math.cos(projectile.angle) * PROJECTILE_SPEED
      projectile.y += Math.sin(projectile.angle) * PROJECTILE_SPEED

      players.map(player => {
        const distance = Math.sqrt((player.x - projectile.x) **2 + (player.y - projectile.y) **2 )

        if(distance <=25 && projectile.id !== player.id){
          projectiles = projectiles.filter(projectile => projectile.id !== projectile.id)
          player.dead = true
          player.ghostX = player.x
          player.ghostY = player.y


          //Checking if gameOver
          livingPlayers = players.filter(player => player.dead === false)
          if(livingPlayers.length === 1){
            gameOver(livingPlayers[0])
          }
        }
      })

      if(isColliding(projectile, terrain)){
        projectile.collide = true
        projectiles = projectiles.filter(projectile => projectile.collide !== true)
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

    if( players.length === 0){players.push({
      id: socket.id,
      x: p1Start.x,
      y: p1Start.y,
      w: 40,
      h: 40,
      direction: 'up',
      Num: 1,
      dead: false,
    })}
    else if( players.length === 1){players.push({
      id: socket.id,
      x: p2Start.x,
      y: p2Start.y,
      w: 40,
      h: 40,
      direction: 'down',
      Num: 2,
      dead: false,
    })}
    else if( players.length === 2){players.push({
      id: socket.id,
      x: p3Start.x,
      y: p3Start.y,
      w: 40,
      h: 40,
      direction: 'down',
      Num: 3,
      dead: false,
    })}
    else if( players.length === 3){players.push({
      id: socket.id,
      x: p4Start.x,
      y: p4Start.x,
      w: 40,
      h: 40,
      direction: 'up',
      Num: 4,
      dead: false,
    })}
    else{
      socket.emit('full')
      return
    }

    console.log('Made Socket Connection: ' +socket.id)


    inputsMap[socket.id] = {
      up: false,
      down: false,
      right: false,
      left: false
    };

    socket.emit('map', map2D)
    socket.emit('game', gameState)

    socket.on('game', action => {
      if(action === 'start'){
        gameState = true;
        io.emit('game', gameState)
      }
    })
  
    socket.on('input', (inputs) => {
      const player = players.find((player) => player.id === socket.id)

      inputsMap[socket.id] = inputs;
    })

    socket.on('fire', (angle) => {
      const player = players.find((player) => player.id === socket.id)

      if(player.dead){return}
  
      projectiles.push({
        id: socket.id,
        angle : angle,
        x: player.x,
        y: player.y,
        ammo: 'reg',
        collide: false,
      })

    })

    socket.on('disconnect', () => {

      const leaver = players.find(player => player.id === socket.id)

      players = players.filter((player) => { return player.id !== socket.id})

      players.map(player => {
        if(player.Num > leaver.Num){
          player.Num = player.Num-1
        }
      })
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
