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
const { promiseHooks } = require('v8');

var app = express();

var server = http.createServer(app)

server.listen(4000, ()=>{
  console.log('server listening on port 4000')
})

var io = socket(server);

const TICK_RATE = 30;
const SPEED = 5;
const REG_SPEED = 7;
const BIG_SPEED = 10;
const GRENADE_SPEED = 7;


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
let terrain = [];
let playerFences = [];

let grenadeIntervals = {};
let inputsMap = {}

function gameOver(winner){

  players.map(player => {
    
    if(player.Num === 1){
      player.x = p1Start.x
      player.y = p1Start.y
      player.direction = 'up'
      player.health = 100
      player.fenceAmmo = 7
    }
    else if(player.Num === 2){
      player.x = p2Start.x
      player.y = p2Start.y
      player.direction = 'down'
      player.health = 100
      player.fenceAmmo = 7
    }
    else if(player.Num === 3){
      player.x = p3Start.x
      player.y = p3Start.y
      player.direction = 'down'
      player.health = 100
      player.fenceAmmo = 7
    }
    else if(player.Num === 4){
      player.x = p4Start.x
      player.y = p4Start.y
      player.direction = 'up'
      player.health = 100
      player.fenceAmmo = 7
    }
    
    player.dead = false
    player.waiting = false

    inputsMap[player.id] = {
      up: false,
      down: false,
      right: false,
      left: false,
    }
  })
  gameState = false
  playerFences = []
  projectiles = []

  io.emit('game', false)
  io.emit('winner', winner.Num)
  io.emit('playerFences', playerFences)
}

function circleRectCollide(circle, rectangle) {

  // Calculate the angle cosine and sine
  let cosAngle = Math.cos(rectangle.angle);
  let sinAngle = Math.sin(rectangle.angle);

  // Transform circle center to rectangle space
  let dx = circle.x - rectangle.x;
  let dy = circle.y - rectangle.y;
  let circleX = dx * cosAngle + dy * sinAngle;
  let circleY = dy * cosAngle - dx * sinAngle;

  // Find the closest point on the rectangle to the circle
  let closestX, closestY;
  if (circleX < -rectangle.width / 2) {
      closestX = -rectangle.width / 2;
  } else if (circleX > rectangle.width / 2) {
      closestX = rectangle.width / 2;
  } else {
      closestX = circleX;
  }
  if (circleY < -rectangle.height / 2) {
      closestY = -rectangle.height / 2;
  } else if (circleY > rectangle.height / 2) {
      closestY = rectangle.height / 2;
  } else {
      closestY = circleY;
  }

  // Calculate distance between circle center and closest point on rectangle
  let distanceX = circleX - closestX;
  let distanceY = circleY - closestY;
  let distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Check if the distance is less than or equal to the circle's radius squared
  return distanceSquared <= (circle.radius * circle.radius);
}


function isColliding(object, terrain, isProjectile){
  if(!isProjectile){
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

    for(let i = 0 ; i < playerFences.length; i++){
      if(circleRectCollide(object, playerFences[i])){
        return true
      }}
      
    return false
  }else if(object.ammo === 'reg' && isProjectile){

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

  for(let i=0; i<playerFences.length; i++){
    if(circleRectCollide(object, playerFences[i])){
    return true
  }}

   return false
  }
  else if(object.ammo === 'big' && isProjectile){

    let radius = 15;

    for(let i = 0; i < terrain[0].length; i++){

      var distX = Math.abs(object.x - terrain[0][i].x+terrain[0][i].w/2);
      var distY = Math.abs(object.y - terrain[0][i].y+terrain[0][i].h/2);

      if( (distX < (terrain[0][i].w/2 + radius)) && (distY < (terrain[0][i].h/2 + radius)) ){
       
        if (distX <= (terrain[0][i].w/2)) { return true; } 
        if (distY <= (terrain[0][i].h/2)) { return true; }
      }
  }

  for(let i=0; i<playerFences.length; i++){
    if(circleRectCollide(object, playerFences[i])){
    return true
  }}
   return false
    
  }
}

function tick(){
    players.map((player)=> {

      //reg

      if(player.regAmmo < 10){
        player.regRate +=1;
      }

      if(player.regRate%15 === 0){
        player.regAmmo ++;
      }

      if(player.regAmmo === 10){
        player.regRate = 1
      }

      //big

      if(player.bigAmmo < 10){
        player.bigRate +=1;
      }

      if(player.bigRate%75 === 0 && player.bigAmmo !== 1){
        player.bigAmmo ++;
      }

      if(player.bigAmmo === 1){
        player.bigRate = 1
      }

      //mine

      if(player.mineAmmo < 10){
        player.mineRate +=1;
      }

      if(player.mineRate%100 === 0 && player.mineAmmo !== 1){
        player.mineAmmo ++;
      }

      if(player.mineAmmo === 1){
        player.mineRate = 1
      }

      //grenade

      if(player.grenadeAmmo < 10){
        player.grenadeRate +=1;
      }

      if(player.grenadeRate%75 === 0 && player.grenadeAmmo !== 1){
        player.grenadeAmmo ++;
      }

      if(player.grenadeAmmo === 1){
        player.grenadeRate = 1
      }

      
      
      const inputs = inputsMap[player.id]

      const prevX = player.x
      const prevY = player.y
      
      if(inputs.reg){
        player.ammo = 'reg'
      }
      else if(inputs.big){
        player.ammo = 'big'
      }
      else if(inputs.fence){
        player.ammo = 'fence'
      }
      else if(inputs.mine){
        player.ammo = 'mine'
      }
      else if(inputs.grenade){
        player.ammo = 'grenade'
      }

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
      
      if(isColliding(player, terrain, false)){

        player.x = prevX;
        player.y = prevY;
      }

    })
    

    projectiles.map( projectile => {


      let speed;

      if(projectile.ammo === 'reg'){
        speed = REG_SPEED;
      }
      else if(projectile.ammo === 'big'){
        speed = BIG_SPEED
      }
      else if(projectile.ammo === 'grenade'){

        if(projectile.timer > 0){
          speed = GRENADE_SPEED
          projectile.spin += 1/4
          projectile.timer -= 40;
        }
        else{
          speed = 0;
          projectile.exploded = true
        }

      }
      else if(projectile.ammo === 'mine'){
        //working on making the mine interactive. Just put a timer on it.
        if(projectile.timer >0 ){
        projectile.timer -= 20;
        }
        speed = 0

      }

      projectile.x += Math.cos(projectile.angle) * speed
      projectile.y += Math.sin(projectile.angle) * speed

      players.map(player => {
        const distance = Math.sqrt((player.x - projectile.x) **2 + (player.y - projectile.y) **2 )

        let hitDistance;
        // 1/2w player + r

        if(projectile.ammo === 'reg'){
          hitDistance = 25
        }else if(projectile.ammo === 'big'){
          hitDistance = 35
        }
        
        if(distance <=hitDistance && projectile.id !== player.id && (projectile.ammo === 'reg' || 'big')){

          projectile.collide = true;
          projectiles = projectiles.filter(projectile => projectile.collide !== true)
          
          if(projectile.ammo === 'reg'){
            player.health -= 3
          }
          else if(projectile.ammo === 'big'){
            player.health -= 20
          }

          if(player.health <= 0){
            player.dead = true
          }
          player.ghostX = player.x
          player.ghostY = player.y
          //Checking if gameOver
          livingPlayers = players.filter(player => player.dead === false)
          if(livingPlayers.length === 1){
            gameOver(livingPlayers[0])
          }
        }
        
        if(distance <= 50 && projectile.ammo === 'grenade' && projectile.timer <= 0 && !projectile.exploded){

          player.health -= 20
          
          if(player.health <= 0){
            player.dead = true

            player.ghostX = player.x
            player.ghostY = player.y
            //Checking if gameOver
            livingPlayers = players.filter(player => player.dead === false)
            if(livingPlayers.length === 1){
              gameOver(livingPlayers[0])
            }
          }
        }

        if(distance <= 50 && projectile.ammo === 'mine' && projectile.timer <= 0 && !projectile.exploded){
          
          player.health -= 60

          if(player.health <= 0){
            player.dead = true
          }

          projectile.exploded = true;
          player.ghostX = player.x
          player.ghostY = player.y
          //Checking if gameOver
          livingPlayers = players.filter(player => player.dead === false)
          if(livingPlayers.length === 1){
            gameOver(livingPlayers[0])
          }
        }
      })

      if(projectile.ammo === 'mine'){
        projectiles.map(projectile2 => {
          if(projectile2.ammo === 'grenade' && projectile2.timer <= 0 && !projectile2.exploded ){
            let distance = Math.sqrt((projectile.x - projectile2.x)**2 + (projectile.y - projectile2.y)**2)
            
            if(distance <= 50){
              projectile.exploded = true
            }
          }
        })
      }

      if(isColliding(projectile, terrain, true)){

        if(projectile.ammo === 'reg'){
        projectile.collide = true
        projectiles = projectiles.filter(projectile => projectile.collide !== true)
        }
        else if(projectile.ammo === 'big'){
          projectile.x -= Math.cos(projectile.angle) * speed/1.5
          projectile.y -= Math.sin(projectile.angle) * speed/1.5
        }

      }
    })
    


    io.emit('players', players)
    io.emit('projectiles', projectiles)
    io.emit('playerFences', playerFences)
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

    if( players.length === 0){
      players.push({
      id: socket.id,
      x: p1Start.x,
      y: p1Start.y,
      w: 40,
      h: 40,
      radius: 20,
      direction: 'up',
      Num: 1,
      dead: false,
      ammo: 'reg',
      grenadeTimer: 0,
      health: 100,
      regAmmo: 10,
      regRate: 1,
      bigAmmo: 1,
      bigRate: 1,
      mineAmmo: 1,
      mineRate: 1,
      grenadeAmmo: 1,
      grenadeRate: 1,
      fenceAmmo: 7,
    })}
    else if( players.length === 1){players.push({
      id: socket.id,
      x: p2Start.x,
      y: p2Start.y,
      w: 40,
      h: 40,
      radius: 20,
      direction: 'down',
      Num: 2,
      dead: false,
      ammo: 'reg',
      grenadeTimer: 0,
      health: 100,
      regAmmo: 10,
      regRate: 1,
      bigAmmo: 1,
      bigRate: 1,
      mineAmmo: 1,
      mineRate: 1,
      grenadeAmmo: 1,
      grenadeRate: 1,
      fenceAmmo: 7,
    })}
    else if( players.length === 2){players.push({
      id: socket.id,
      x: p3Start.x,
      y: p3Start.y,
      w: 40,
      h: 40,
      radius: 20,
      direction: 'down',
      Num: 3,
      dead: false,
      regAmmo: 10,
      ammo: 'reg',
      grenadeTimer: 0,
      health: 100,
      regRate: 1,
      bigAmmo: 1,
      bigRate: 1,
      mineAmmo: 1,
      mineRate: 1,
      grenadeAmmo: 1,
      grenadeRate: 1,
      fenceAmmo: 7,
    })}
    else if( players.length === 3){players.push({
      id: socket.id,
      x: p4Start.x,
      y: p4Start.x,
      w: 40,
      h: 40,
      radius: 20,
      direction: 'up',
      Num: 4,
      dead: false,
      ammo: 'reg',
      grenadeTimer: 0,
      health: 100,
      regAmmo: 10,
      regRate: 1,
      bigAmmo: 1,
      bigRate: 1,
      mineAmmo: 1,
      mineRate: 1,
      grenadeAmmo: 1,
      grenadeRate: 1,
      fenceAmmo: 7,
    })}
    else{
      socket.emit('full')
      return
    }

    if(gameState === true){
      players.map(player => {
        if(player.id === socket.id){
          player.ghostX = 800;
          player.ghostY = 800;
          player.dead = true;
          player.waiting = true;
        }
      })
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

      inputsMap[player.id] = inputs;
    })

    socket.on('grenadeHold', inputs => {

      const player = players.find((player) => player.id === socket.id)

      if(player.ammo === 'grenade' && player.grenadeAmmo === 1){
        grenadeIntervals[player.id] = setInterval(() =>{
          player.grenadeTimer += 40
        }, 33.33)
      }


    })

    socket.on('fire', (angle) => {

      const player = players.find((player) => player.id === socket.id)

      if(player.dead){return}

      let radius;
      let grenadeTimer = 2000 - player.grenadeTimer;

      if(grenadeTimer < 10){
        grenadeTimer = 10
      }

      if(player.ammo === 'reg'){
        if(player.regAmmo <= 0){
          return
        }
        radius = 5
        player.regAmmo--;
      }
      else if(player.ammo === 'big'){
        if(player.bigAmmo <= 0){
          return
        }
        radius = 15
        player.bigAmmo--
      }
      else if(player.ammo === 'mine'){
        if(player.mineAmmo <= 0){
          return
        }
        player.mineAmmo--
      }
      else if(player.ammo === 'grenade'){
        if(player.grenadeAmmo <= 0){
          return
        }
        player.grenadeAmmo--
      }


      if(player.ammo === 'fence'){

        if(player.fenceAmmo === 0){
          return
        }

        const fenceX = player.x + Math.cos(angle)*60
        const fenceY = player.y + Math.sin(angle)*60
        

        playerFences.push({
          id: socket.id,
          angle : angle,
          x: fenceX,
          y: fenceY,
          height: 100,
          width: 20,
        })

        player.fenceAmmo --;
      }
      else if(player.ammo === 'mine'){
        projectiles.push({
          id: socket.id,
          angle : angle,
          x: player.x,
          y: player.y,
          ammo: player.ammo,
          collide: false,
          radius: 10,
          timer: 1000,
          exploded: false,
        })
      }
      else if(player.ammo === 'grenade'){
        projectiles.push({
          id: socket.id,  
          angle : angle,
          spin: angle,
          x: player.x,
          y: player.y,
          ammo: player.ammo,
          collide: false,
          radius: 10,
          timer: grenadeTimer,
          exploded: false,
        })
        clearInterval(grenadeIntervals[player.id])
        player.grenadeTimer = 0
      }
      else {
        projectiles.push({
        id: socket.id,
        angle : angle,
        x: player.x,
        y: player.y,
        ammo: player.ammo,
        collide: false,
        radius: radius,
      })}
      
    })

    socket.on('disconnect', () => {

      const leaver = players.find(player => player.id === socket.id)

      players = players.filter((player) => { return player.id !== socket.id})

      players.map(player => {
        if(player.Num > leaver.Num){
          player.Num = player.Num-1
        }
      })

      livingPlayers = players.filter(player => player.dead === false)
      if(livingPlayers.length === 1){
        gameOver(livingPlayers[0])
      }
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
