import { useEffect, useState, useRef } from 'react'


function Canvas({map, players}){

    const canvasRef = useRef(null)
    const tileSize = 16;

    const grass = new Image();
    grass.src = '/src/assets/grassMap/Grass.png'

    const desert = new Image();
    desert.src = '/src/assets/grassMap/Tilled_Dirt.png'
    
    const fence = new Image();
    fence.src = '/src/assets/grassMap/Fences.png'
    
    const water = new Image();
    water.src = '/src/assets/grassMap/Water.png'

    const tank = new Image();
    tank.src = '/src/assets/tank.png'

    const quarterAngle = Math.PI/4;

  
    useEffect(() => {

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      let currentImage;
      let tilesInRow;


      const w = map.length * tileSize;
      const h = map.length *tileSize;


      canvas.width = w;
      canvas.height = h;


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
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
          )}
      }

      players.map((player)=>{

        ctx.translate(player.x, player.y)

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

        ctx.translate(-player.x, -player.y); 

        ctx.drawImage(
        tank,
        player.x -30,
        player.y -20,
        60,
        40
      )

      ctx.setTransform(1,0,0,1,0,0);
    
    })


    }, [players])
    
    return <canvas ref={canvasRef} style={{backgroundColor: '#c0d470'}}/>

}

export default Canvas