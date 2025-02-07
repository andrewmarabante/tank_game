var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socket = require('socket.io');
var http = require('http');
var cors = require('cors')
const loadMap = require('./loadMap.js')

const { promiseHooks } = require('v8');

const { randomBytes } = require('crypto');

function generateRandomId(length = 5) {
    const bytes = randomBytes(Math.ceil(length / 2));
    return bytes.toString('hex').slice(0, length);
}

var app = express();

var server = http.createServer(app)

server.listen(8080, ()=>{
  console.log('server listening on port 8080')
})

var io = socket(server);

const TICK_RATE = 50;
const SPEED = 5;
const REG_SPEED = 9;
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
let explodedMines = []

//4 arrays for reg, big, mine, and grenade
let explodedProjectiles = [[],[],[],[],[]]

let grenadeIntervals = {};
let inputsMap = {}

function gameOver(winner) {
  const startPositions = {
    1: { x: p1Start.x, y: p1Start.y, direction: 'up' },
    2: { x: p2Start.x, y: p2Start.y, direction: 'down' },
    3: { x: p3Start.x, y: p3Start.y, direction: 'down' },
    4: { x: p4Start.x, y: p4Start.y, direction: 'up' }
  };

  players.forEach(player => {
    const { x, y, direction } = startPositions[player.Num] || {};

    if (x !== undefined && y !== undefined && direction) {
      player.x = x;
      player.y = y;
      player.direction = direction;
    }

    player.dead = false;
    player.waiting = false;
    player.health = 100;
    player.fenceAmmo = 7;
    player.moving = false;

    inputsMap[player.id] = { up: false, down: false, right: false, left: false };
  });

  gameState = false;
  playerFences = [];
  explodedMines = [];
  projectiles = [];
  explodedProjectiles = [[],[],[],[], []]

  io.emit('game', false);
  io.emit('winner', winner.Num);
  io.emit('playerFences', playerFences);
}


function circleRectCollide(circle, rectangle) {
  // Calculate the angle cosine and sine
  const cosAngle = Math.cos(rectangle.angle);
  const sinAngle = Math.sin(rectangle.angle);

  // Transform circle center to rectangle space
  const dx = circle.x - rectangle.x;
  const dy = circle.y - rectangle.y;
  const circleX = dx * cosAngle + dy * sinAngle;
  const circleY = dy * cosAngle - dx * sinAngle;

  // Find the closest point on the rectangle to the circle
  const closestX = Math.max(-rectangle.width / 2, Math.min(circleX, rectangle.width / 2));
  const closestY = Math.max(-rectangle.height / 2, Math.min(circleY, rectangle.height / 2));

  // Calculate distance between circle center and closest point on rectangle
  const distanceSquared = (circleX - closestX) ** 2 + (circleY - closestY) ** 2;

  // Check if the distance is less than or equal to the circle's radius squared
  return distanceSquared <= circle.radius ** 2;
}


function isColliding(object, terrain, isProjectile) {
  const checkRectangleCollision = (obj, rect) => {
    return obj.x < rect.x + rect.w && obj.x + obj.w > rect.x &&
           obj.y < rect.y + rect.h && obj.y + obj.h > rect.y;
  };

  const checkCircleRectCollision = (obj, radius, rect) => {
    let distX = Math.abs(obj.x - (rect.x + rect.w / 2));
    let distY = Math.abs(obj.y - (rect.y + rect.h / 2));
    return distX < (rect.w / 2 + radius) && distY < (rect.h / 2 + radius);
  };

  if (!isProjectile) {
    // Check for collisions with terrain
    for (let structures of terrain) {
      for (let rect of structures) {
        if (checkRectangleCollision(object, rect)) {
          return true;
        }
      }
    }

    // Check for collisions with player fences
    for (let fence of playerFences) {
      if (circleRectCollide(object, fence)) {
        return true;
      }
    }

    // Check for collisions with exploded mines
    for (let mine of explodedMines) {
      if (checkRectangleCollision(object, mine)) {
        return true;
      }
    }

    return false;
  } else if (object.ammo === 'reg' || object.ammo === 'big') {

    const radius = object.ammo === 'reg' ? 5 : 15;

    // Check for collisions with terrain
    for (let rect of terrain[0]) {
      if(checkCircleRectCollision(object, radius, rect)){
        object.ammo === 'reg' && explodedProjectiles[0].push({
          id: generateRandomId(),
          playerId: object.id,
          x: object.x,
          y: object.y,
          ammo: object.ammo,
          hit: 'fence'
        });
        return true;
      }
    }

    // Check for collisions with player fences
    for (let fence of playerFences) {
      if (circleRectCollide(object, fence)) {
        object.ammo === 'reg' && explodedProjectiles[0].push({
          id: generateRandomId(),
          playerId: object.id,
          x: object.x,
          y: object.y,
          ammo: object.ammo,
          hit: 'fence'
        });
        return true;
      }
    }

    return false;
  }

  return false;
}


function tick(){
    players.map((player)=> {

      //reg regen

      if(player.regAmmo < 10){
        player.regRate +=1;
        if(player.regRate%15 === 0){
          player.regAmmo ++;
        }
  
        if(player.regAmmo === 10){
          player.regRate = 1
        }
      }

      //big regen

      if(player.bigAmmo < 10){
        player.bigRate +=1;
        if(player.bigRate%75 === 0 && player.bigAmmo !== 1){
          player.bigAmmo ++;
        }
  
        if(player.bigAmmo === 1){
          player.bigRate = 1
        }
      }

      //mine regen

      if(player.mineAmmo < 10){
        player.mineRate +=1;
        if(player.mineRate%200 === 0 && player.mineAmmo !== 1){
          player.mineAmmo ++;
        }
  
        if(player.mineAmmo === 1){
          player.mineRate = 1
        }
      }


      //grenade regen

      if(player.grenadeAmmo < 10){
        player.grenadeRate +=1;
        if(player.grenadeRate%75 === 0 && player.grenadeAmmo !== 1){
          player.grenadeAmmo ++;
        }
  
        if(player.grenadeAmmo === 1){
          player.grenadeRate = 1
        }
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
          projectile.timer -= 40
        }
        else if(projectile.timer <= 0 && !projectile.exploded){
          speed = 0;
          projectile.exploded = true
          explodedProjectiles[4].push({
            id: projectile.uniqueId,
            x: projectile.x,
            y: projectile.y,
          })
        }

      }
      else if(projectile.ammo === 'mine'){

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
            
            explodedProjectiles[0].push({
              id: generateRandomId(),
              playerId: projectile.id,
              x: projectile.x,
              y: projectile.y,
              ammo: 'reg',
              hit: 'player'
            })

            player.health -= 7
          }
          else if(projectile.ammo === 'big'){

            explodedProjectiles[1].push({
              id: generateRandomId(),
              playerId: projectile.id,
              x: projectile.x,
              y: projectile.y,
              ammo: 'big',
              hit: 'player'
            })

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

          player.health -= 10
          
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
          
          player.health -= 35

          if(player.health <= 0){
            player.dead = true
          }

          projectile.exploded = true;

          explodedProjectiles[3].push({
            id: projectile.uniqueId,

            x: projectile.x,
            y: projectile.y,
          })

          explodedMines.push({
            x: projectile.x -10,
            y: projectile.y -10,
            w: 65,
            h: 65,
          })

          let distanceToOutside = 70 - distance

          if(player.direction === 'upLeft'){
            player.y += distanceToOutside *.71
            player.x += distanceToOutside *.71
          }
          else if(player.direction === 'upRight'){
              player.y += distanceToOutside *.71
              player.x -= distanceToOutside *.71
          }
          else if(player.direction === 'downRight'){
              player.y -= distanceToOutside *.71
              player.x -= distanceToOutside *.71
           }
          else if(player.direction === 'downRight'){
              player.y -= distanceToOutside *.71
              player.x += distanceToOutside *.71
          }
          else if(player.direction === 'up'){
              player.y += distanceToOutside 
          }
          else if(player.direction === 'down'){
              player.y -= distanceToOutside 
          }
          else if(player.direction === 'left'){
              player.x += distanceToOutside
          }
          else if(player.direction === 'right'){
              player.x -= distanceToOutside
          }

          player.ghostX = player.x
          player.ghostY = player.y
          //Checking if gameOver
          livingPlayers = players.filter(player => player.dead === false)
          if(livingPlayers.length === 1){
            gameOver(livingPlayers[0])
          }
        }
      })

      if(projectile.ammo === 'mine' && !projectile.exploded){
        projectiles.map(projectile2 => {
          if(projectile2.ammo === 'grenade' && projectile2.timer <= 0 && !projectile2.exploded ){
            let distance = Math.sqrt((projectile.x - projectile2.x)**2 + (projectile.y - projectile2.y)**2)
            
            if(distance <= 50){
              projectile.exploded = true

              explodedProjectiles[3].push({
                id: projectile.uniqueId,
                x: projectile.x,
                y: projectile.y,
              })

              explodedMines.push({
                x: projectile.x -10,
                y: projectile.y -10,
                w: 65,
                h: 65,
              })
              
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
    

    io.emit('explodedProjectiles', explodedProjectiles)
    io.emit('players', players)
    io.emit('projectiles', projectiles)
    io.emit('playerFences', playerFences)
}


async function main() {
  const map2D = await loadMap();
  let fences = [];
  let water = [];

  // Initialize terrain (fences and water)
  for (let row = 0; row < map2D.length; row++) {
    for (let col = 0; col < map2D[row].length; col++) {
      const tile = map2D[row][col];
      const terrain = {
        index: row * 100 + col,
        id: tile.id,
        gid: tile.gid,
        x: col * TILE_SIZE + TILE_SIZE,
        y: row * TILE_SIZE + TILE_SIZE,
        w: TILE_SIZE,
        h: TILE_SIZE
      };

      if (tile.gid >= 171) {
        water.push(terrain);
      } else if (tile.gid >= 155) {
        fences.push(terrain);
      }
    }
  }

  terrain.push(fences);
  terrain.push(water);

  io.on('connection', (socket) => {
    // Add player to players array
    let newPlayer;
    if (players.length < 4) {
      newPlayer = {
        id: socket.id,
        x: [p1Start, p2Start, p3Start, p4Start][players.length].x,
        y: [p1Start, p2Start, p3Start, p4Start][players.length].y,
        w: 40,
        h: 40,
        radius: 20,
        direction: players.length < 2 ? 'up' : 'down',
        Num: players.length + 1,
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
        moving: false,
      };
      players.push(newPlayer);
    } else {
      socket.emit('full');
      return;
    }

    if (gameState === true) {
      players.map(player => {
        if (player.id === socket.id) {
          player.ghostX = 800;
          player.ghostY = 800;
          player.dead = true;
          player.waiting = true;
        }
      });
    }

    console.log('Made Socket Connection: ' + socket.id);

    inputsMap[socket.id] = { up: false, down: false, right: false, left: false };
    socket.emit('map', map2D);
    socket.emit('game', gameState);

    // Game Start
    socket.on('game', action => {
      if (action === 'start') {
        gameState = true;
        io.emit('game', gameState);
      }
    });

    // Player Movement
    socket.on('input', (inputs) => {
      const player = players.find((player) => player.id === socket.id);
      if (inputs.up || inputs.down || inputs.right || inputs.left) {
        player.moving = true;
      } else {
        player.moving = false;
      }
      inputsMap[player.id] = inputs;
    });

    // Grenade Hold
    socket.on('grenadeHold', inputs => {
      const player = players.find((player) => player.id === socket.id);
      if (player.ammo === 'grenade' && player.grenadeAmmo === 1) {
        grenadeIntervals[player.id] = setInterval(() => {
          player.grenadeTimer += 40;
        }, 33.33);
      }
    });

    // Fire Event
    socket.on('fire', (angle) => {
      const player = players.find((player) => player.id === socket.id);
      if (player.dead) { return; }

      let radius;
      let grenadeTimer = 2000 - player.grenadeTimer;

      if (grenadeTimer < 10) { grenadeTimer = 10; }

      // Handle Ammo and Create Projectiles
      if (player.ammo === 'reg' && player.regAmmo > 0) {
        player.regAmmo--;
        projectiles.push({
          uniqueId: generateRandomId(),
          id: socket.id,
          angle: angle,
          x: player.x,
          y: player.y,
          ammo: player.ammo,
          collide: false,
          radius: 5,
        });
      } else if (player.ammo === 'big' && player.bigAmmo > 0) {
        player.bigAmmo--;
        projectiles.push({
          uniqueId: generateRandomId(),
          id: socket.id,
          angle: angle,
          x: player.x,
          y: player.y,
          ammo: player.ammo,
          collide: false,
          radius: 15,
        });
      } else if (player.ammo === 'mine' && player.mineAmmo > 0) {
        player.mineAmmo--;
        projectiles.push({
          uniqueId: generateRandomId(),
          id: socket.id,
          angle: angle,
          x: player.x,
          y: player.y,
          ammo: player.ammo,
          collide: false,
          timer: 1000,
          radius: 10,
        });
      } else if (player.ammo === 'grenade' && player.grenadeAmmo > 0) {
        player.grenadeAmmo--;
        radius = 10;
        projectiles.push({
          uniqueId: generateRandomId(),
          id: socket.id,
          angle: angle,
          spin: angle,
          x: player.x,
          y: player.y,
          ammo: player.ammo,
          collide: false,
          radius: radius,
          timer: grenadeTimer,
          exploded: false,
        });
        clearInterval(grenadeIntervals[player.id]);
        player.grenadeTimer = 0;
        return;
      } else if (player.ammo === 'fence' && player.fenceAmmo > 0) {
        const fenceX = player.x + Math.cos(angle) * 60;
        const fenceY = player.y + Math.sin(angle) * 60;

        playerFences.push({
          uniqueId: generateRandomId(),
          id: socket.id,
          angle: angle,
          x: fenceX,
          y: fenceY,
          height: 100,
          width: 20,
        });

        explodedProjectiles[2].push({
          id: generateRandomId(),
          playerId: player.id,
          ammo: 'fence',
          x: fenceX,
          y: fenceY,
        });

        player.fenceAmmo--;
      } else {
        return;
      }
    });

    // Disconnect Event
    socket.on('disconnect', () => {
      const leaver = players.find(player => player.id === socket.id);
      players = players.filter((player) => player.id !== socket.id);
      players.map(player => {
        if (player.Num > leaver.Num) {
          player.Num = player.Num - 1;
        }
      });
      livingPlayers = players.filter(player => !player.dead);
      if (livingPlayers.length === 1) {
        gameOver(livingPlayers[0]);
      }
    });
  });

  // Game Tick
  setInterval(tick, 1000 / TICK_RATE);
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


module.exports = app;
