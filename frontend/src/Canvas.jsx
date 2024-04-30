import { useEffect, useState, useRef } from 'react'


function Canvas({map, players, socket, projectiles, leader, game, winner}){

    const canvasRef = useRef(null)
    const tileSize = 16;
    const [dead,setDead] = useState(false)
    const [waiting, setWaiting] = useState(false)

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
        w = 40
        h = 40
      }

      ctx.drawImage(
        ammoImage,
        projectile.x - camX -w/2,
        projectile.y - camY-h/2,
        w,
        h,
      )


        // ctx.fillStyle = 'blue';
        // ctx.beginPath();
        // //arc(x, y, radius, startAngle, endAngle, counterclockwise)
        // ctx.arc(projectile.x - camX, projectile.y - camY, 5, 0, 2*Math.PI)
        // ctx.fill();

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
      {game && <div className='absolute left-1/4 bottom-5 w-2/4 h-1/6 bg-black opacity-50 rounded-2xl flex justify-around items-center'>
        <div className='bg-white rounded-2xl border-black border-solid h-5/6 w-1/6'></div>
        <div className='bg-white rounded-2xl border-black border-solid h-5/6 w-1/6'></div>
        <div className='bg-white rounded-2xl border-black border-solid h-5/6 w-1/6'></div>
        <div className='bg-white rounded-2xl border-black border-solid h-5/6 w-1/6'></div>
        <div className='bg-white rounded-2xl border-black border-solid h-5/6 w-1/6'></div>
      </div>}
      {dead && <div className='absolute top-0 left-0  w-full h-full bg-black opacity-20'></div>}
      {dead && !waiting && <div className='absolute w-1/3 top-1/4 left-1/3 text-white text-2xl sm:text-6xl select-none text-center font-mono'>YOU SUCK LOSER</div>}
      {waiting && <div className='absolute w-1/3 top-1/4 left-1/3 text-white text-2xl sm:text-6xl select-none text-center font-mono'>Game in progress</div>}
    </div>
    )

}

export default Canvas