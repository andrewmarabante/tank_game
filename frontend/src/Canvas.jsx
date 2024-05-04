import { useEffect, useState, useRef } from 'react'


function Canvas({map, players, socket, projectiles, leader, game, winner, playerFences, currentPlayer}){

    const canvasRef = useRef(null)
    const tileSize = 16;
    const [dead,setDead] = useState(false)
    const [waiting, setWaiting] = useState(false)
    const [p1Blink, setP1Blink] = useState(0)
    const [p2Blink, setP2Blink] = useState(0)
    const [p3Blink, setP3Blink] = useState(0)
    const [p4Blink, setP4Blink] = useState(0)


    const grass = new Image();
    grass.src = '/src/assets/grassMap/Grass.png'

    const desert = new Image();
    desert.src = '/src/assets/grassMap/Tilled_Dirt.png'
    
    const fence = new Image();
    fence.src = '/src/assets/grassMap/Fences.png'
    
    const water = new Image();
    water.src = '/src/assets/grassMap/Water.png'

    const tank = new Image();
    tank.src = '/src/assets/Tank.png'

    const bullet = new Image();
    bullet.src = '/src/assets/Bullet.png'

    const fire = new Image();
    fire.src = '/src/assets/Fire.png'

    const big = new Image();
    big.src = '/src/assets/Purple.png'

    const playerFence = new Image();
    playerFence.src = '/src/assets/Barricade.png'

    const mine = new Image();
    mine.src = '/src/assets/Landmine.png'

    const grenade = new Image();
    grenade.src = '/src/assets/Grenade.png'

    const explosion = new Image();
    explosion.src = '/src/assets/Explosion.png'
    
    const redMeter = new Image();
    redMeter.src = '/src/assets/redMeter.png'

    const blueMeter = new Image();
    blueMeter.src = '/src/assets/blueMeter.png'

    const healthBar = new Image();
    healthBar.src = '/src/assets/Healthbar.png'

    const heart = new Image();
    heart.src = '/src/assets/Heart.png'



    


    const quarterAngle = Math.PI/4;

  
    useEffect(() => {

      const canvas = canvasRef.current
      canvas.height = window.innerHeight
      canvas.width = window.innerWidth
      const ctx = canvas.getContext('2d')

      let currentImage;
      let tilesInRow;

      let camX = 0;
      let camY = 0;



      if(players.length > 0){
        
        const myPlayer = players.find((player) => player.id == socket.id)

        camX = parseInt(myPlayer.x - canvas.width/2)
        camY = parseInt(myPlayer.y - canvas.height/2)

        if(myPlayer.dead){
          setDead(true)
          camX = parseInt(myPlayer.ghostX - canvas.width/2)
          camY = parseInt(myPlayer.ghostY - canvas.height/2)
        }else{
          setDead(false)
        }

        if(myPlayer.waiting){
          setWaiting(true)
        }else{
          setWaiting(false)
        }

      }


      const w = map.length * tileSize;
      const h = map.length *tileSize;




      for(let row = 0; row < map.length; row++){
        for(let col = 0; col < map.length; col++){
          const {id, gid} = map[row][col]

        if(gid < 78){
          currentImage = grass
          tilesInRow = 11
        }
        else if(gid < 155){
          currentImage = desert
          tilesInRow = 11
        }
        else if(gid < 171){
          currentImage = fence
          tilesInRow = 4
        }
        else{
          currentImage = water
          tilesInRow = 4
        }

        const imageRow = parseInt(id/ tilesInRow)
        const imageCol = id % tilesInRow

        ctx.drawImage(
              currentImage,
              imageCol * tileSize,
              imageRow * tileSize,
              tileSize,
              tileSize,
              col * tileSize - camX,
              row * tileSize -camY,
              tileSize,
              tileSize
          )
        
        }
      }

      players.map((player)=>{

        if(player.ammo === 'grenade' && player.grenadeTimer !== 0){

          let leftOffset;
          let topOffset;
          let blueHeight = (player.grenadeTimer%2000/2000)*33

          if(player.grenadeTimer >= 2000){
            blueHeight = 33
          }
        
          
          if(player.direction === 'upLeft'){
            leftOffset = 40
            topOffset = 20
            }
            else if(player.direction === 'up'){
              leftOffset = 30
              topOffset = 20   
            }
            else if(player.direction === 'upRight'){
              leftOffset = 30
              topOffset = 20
            }
            else if(player.direction === 'right'){
              leftOffset = 20
              topOffset = 20           
             }
            else if(player.direction === 'downRight'){
              leftOffset = 30
              topOffset = 10         
             }
            else if(player.direction === 'down'){
              leftOffset = 30
              topOffset = 10           
             }
            else if(player.direction === 'downLeft'){
              leftOffset = 40
              topOffset = 10            
            }
            else if(player.direction === 'left')
            {
              leftOffset = 40
              topOffset = 20            
            }
          
            ctx.drawImage(
            redMeter,
            player.x -leftOffset -camX,
            player.y -topOffset -camY,
            5,
            33
        )

        ctx.translate(player.x -leftOffset +2.5 -camX, player.y -topOffset +16.5 -camY,)

        ctx.rotate(Math.PI)

        ctx.translate(-player.x +leftOffset -2.5 +camX, -player.y +topOffset -16.5 +camY,)

          ctx.drawImage(
            blueMeter,
            player.x -leftOffset -camX,
            player.y -topOffset -camY,
            5,
            blueHeight,
        )

         ctx.setTransform(1,0,0,1,0,0);
      }

      //Drawing HealthBar

      if(player.health >= 0){

      let leftOffset, topOffset;
      let healthLeft = (player.health/100)*40

      let heartSize = 12;

      if(player.health <= 15){
        if(player.Num === 1){
          let current = p1Blink;
          current++;
          if(p1Blink%15){
            heartSize = 16
          }
          setP1Blink(current)
      }
      else if(player.Num === 2){
        let current = p2Blink;
        current++;
        if(p2Blink%15){
          heartSize = 16
        }
        setP2Blink(current)
    }
    else if(player.Num === 3){
      let current = p3Blink;
      current++;
      if(p3Blink%15){
        heartSize = 16
      }
      setP3Blink(current)
  }
  else if(player.Num === 4){
    let current = p4Blink;
    current++;
    if(p4Blink%15){
      heartSize = 16
    }
    setP4Blink(current)
}
      }

      
      if(player.direction === 'upLeft'){
        leftOffset = 20
        topOffset = 25
        }
        else if(player.direction === 'up'){
          leftOffset = 20
          topOffset = 25
        }
        else if(player.direction === 'upRight'){
          leftOffset = 20
          topOffset = 25
        }
        else if(player.direction === 'right'){
          leftOffset = 10
          topOffset = 30         
         }
        else if(player.direction === 'downRight'){
          leftOffset = 20
          topOffset = 35        
         }
        else if(player.direction === 'down'){
          leftOffset = 20
          topOffset = 35          
         }
        else if(player.direction === 'downLeft'){
          leftOffset = 20
          topOffset = 35          
        }
        else if(player.direction === 'left')
        {
          leftOffset = 25
          topOffset = 30            
        }

      ctx.fillStyle = '#F0F5EF';
      ctx.fillRect(player.x -leftOffset -camX, player.y +topOffset -camY, 40, 8)

      ctx.fillStyle = '#FF0074';
      ctx.fillRect(player.x -leftOffset -camX, player.y +topOffset -camY, healthLeft, 8)

      ctx.drawImage(
        heart,
        player.x -leftOffset -6 -camX,
        player.y +topOffset -2 -camY,
        heartSize,
        heartSize,
    )
  }
      

        ctx.translate(player.x -camX, player.y - camY)

        if(player.direction === 'upLeft'){
        ctx.rotate(quarterAngle)
        }
        else if(player.direction === 'up'){
          ctx.rotate(2*quarterAngle)
        }
        else if(player.direction === 'upRight'){
          ctx.rotate(3*quarterAngle)
        }
        else if(player.direction === 'right'){
          ctx.rotate(4*quarterAngle)
        }
        else if(player.direction === 'downRight'){
          ctx.rotate(5*quarterAngle)
        }
        else if(player.direction === 'down'){
          ctx.rotate(6*quarterAngle)
        }
        else if(player.direction === 'downLeft'){
          ctx.rotate(7*quarterAngle)
        }
        else if(player.direction === 'left')
        {
          ctx.rotate(0)
        }
        
        
        ctx.translate(-player.x + camX, -player.y + camY); 

        //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        ctx.drawImage(
        tank,
        player.x -30 -camX,
        player.y -20 -camY,
        40,
        40
      )


      ctx.setTransform(1,0,0,1,0,0);

      if(player.dead){
        ctx.drawImage(
          fire,
          player.x -10 -camX,
          player.y -20 -camY,
          30,
          30
        )


      }

      ctx.fillText(
        'P' + player.Num,
        player.x -30 -camX + 20,
        player.y -20 -camY -10,
        10
       )
    })

    playerFences.map(fence => {
      ctx.translate(fence.x -camX, fence.y - camY)
      ctx.rotate(fence.angle +Math.PI/2)
      ctx.translate(-fence.x +camX, -fence.y + camY)
      ctx.drawImage(
        playerFence,
        fence.x - camX -50,
        fence.y - camY-10,
        100,
        20,
      )
      
      ctx.setTransform(1,0,0,1,0,0);
    })

    projectiles.map(projectile => {
      
      let ammoImage = bullet;
      let w;
      let h;
      

      if(projectile.ammo === 'reg'){
        ammoImage = bullet
        w = 10
        h = 10
      }
      else if(projectile.ammo === 'big'){
        ammoImage = big
        w = 30
        h = 30
      }
      else if(projectile.ammo === 'mine'){
        ammoImage = mine
        w = 20
        h = 20
      }
      else if(projectile.ammo === 'grenade'){
        ammoImage = grenade
        w = 15
        h = 30
      }

      if(projectile.ammo === 'mine' && projectile.exploded){
        ctx.drawImage(
          explosion,
          projectile.x - camX -40,
          projectile.y - camY-40,
          80,
          80,
        )
      }

      if(projectile.ammo === 'mine' && projectile.timer <= 0){return}

      if(projectile.ammo === 'grenade' && !projectile.exploded){

        ctx.translate(projectile.x - camX, projectile.y -camY)

        ctx.rotate(projectile.spin)

        ctx.translate(-projectile.x + camX, - projectile.y + camY)
        ctx.drawImage(
          grenade,
          projectile.x - camX -7.5,
          projectile.y - camY-15,
          15,
          30,
        )

        ctx.setTransform(1,0,0,1,0,0)

        if(projectile.timer < 100){
          ctx.drawImage(
            fire,
            projectile.x - camX -25,
            projectile.y - camY-25,
            50,
            50,
          )
        }
      }
      else if(projectile.ammo === 'grenade' && projectile.exploded){
        ctx.drawImage(
          explosion,
          projectile.x - camX -10,
          projectile.y - camY-10,
          20,
          20,
        )
      }

      if(projectile.ammo === 'grenade'){return}


      ctx.drawImage(
        ammoImage,
        projectile.x - camX -w/2,
        projectile.y - camY-h/2,
        w,
        h,
      )

    })
    


    }, [players])
    
    function handleStart(){
      socket.emit('game', 'start')
}

    return (
    <div className='relative'>
      <canvas ref={canvasRef} style={{backgroundColor: '#c0d470'}}/>
      {leader && !game && <div className='bg-black opacity-55 p-10 rounded-2xl absolute top-1/3 h-1/3 w-full flex justify-center items-center'>
        {players.length > 1 && <div className='text-white text-2xl sm:text-6xl select-none hover:text-blue-500' onClick={handleStart}>Start Game</div>}
        {players.length === 1 && <div className='text-white text-2xl sm:text-6xl select-none hover:text-blue-500'>Need More Players...</div>}
      </div>}
      {!leader && !game && <div className='bg-black opacity-55 p-10 rounded-2xl absolute top-1/3 h-1/3 w-full flex justify-center items-center'>
        <div className='text-white text-2xl sm:text-6xl select-none'>Waiting for Player 1</div>
      </div>}
      {winner &&  <div className='absolute left-1/3 w-1/3 top-10 opacity-60 text-black bg-white shadow-2xl p-5 rounded-2xl font-mono text-center text-2xl sm:text-4xl'>Player {winner} Wins!!</div>}
      {!game && <div className='absolute w-1/3 left-1/3 top-2/3 text-red-500 font-mono text-center translate-y-1 text-2xl sm:text-6xl'>{players.length} /4</div>}
      {game && <div className='absolute left-1/4 bottom-5 w-2/4 h-1/6 bg-black opacity-50 rounded-2xl flex justify-around items-center p-2 pt-4 pb-4'>
        <div className={`relative bg-white rounded-2xl border-solid h-5/6 w-1/6 flex flex-col justify-center items-center ${currentPlayer && currentPlayer.ammo === 'reg' ? 'border-5 mb-3' : 'opacity-40'}`}>
          <img src='/src/assets/Bullet.png' className='w-4/6 select-none'  alt="Bullet" />
          <div className='absolute right-2 bottom-2 text-xs'>{currentPlayer && currentPlayer.regAmmo}</div>
        </div>
        <div className={`relative bg-white rounded-2xl border-solid h-5/6 w-1/6 flex flex-col justify-center items-center ${currentPlayer && currentPlayer.ammo === 'big' ? 'border-5 mb-3' : 'opacity-40'}`}>
          <img src='/src/assets/Purple.png' className='w-4/6 select-none'  alt="Purple" />
          <div className='absolute right-2 bottom-2 text-xs'>{currentPlayer && currentPlayer.bigAmmo}</div>
        </div>
        <div className={`relative bg-white rounded-2xl border-solid h-5/6 w-1/6 flex flex-col justify-center items-center ${currentPlayer && currentPlayer.ammo === 'fence' ? 'border-5 mb-3' : 'opacity-40'}`}>
        <img src='/src/assets/Barricade.png' className='w-4/6 select-none'  alt="Fence" />
        <div className='absolute right-2 bottom-2 text-xs'>{currentPlayer && currentPlayer.fenceAmmo}</div>

        </div>
        <div className={`relative bg-white rounded-2xl border-solid h-5/6 w-1/6 flex flex-col justify-center items-center ${currentPlayer && currentPlayer.ammo === 'mine' ? 'border-5 mb-3' : 'opacity-40'}`}>
        <img src='/src/assets/Landmine.png' className='w-4/6 select-none'  alt="Mine" />
        <div className='absolute right-2 bottom-2 text-xs'>{currentPlayer && currentPlayer.mineAmmo}</div>
        </div>
        <div className={`relative bg-white rounded-2xl border-solid h-5/6 w-1/6 flex flex-col justify-center items-center ${currentPlayer && currentPlayer.ammo === 'grenade' ? 'border-5 mb-3' : 'opacity-40'}`}>
        <img src='/src/assets/Grenade.png' className='h-4/6 select-none'  alt="Grenade" />
        <div className='absolute right-2 bottom-2 text-xs'>{currentPlayer && currentPlayer.grenadeAmmo}</div>
        </div>
      </div>}
      {dead && <div className='absolute top-0 left-0  w-full h-full bg-black opacity-20'></div>}
      {dead && !waiting && <div className='absolute w-1/3 top-1/4 left-1/3 text-white text-2xl sm:text-6xl select-none text-center font-mono'>YOU SUCK LOSER</div>}
      {waiting && <div className='absolute w-1/3 top-1/4 left-1/3 text-white text-2xl sm:text-6xl select-none text-center font-mono'>Game in progress</div>}
    </div>
    )

}

export default Canvas