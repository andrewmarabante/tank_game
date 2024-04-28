import { useEffect, useState, useRef } from 'react'


function Canvas({map, players}){

    const canvasRef = useRef(null)
    const tileSize = 16;
    const tilesInRow = 11;


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

  
    useEffect(() => {

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      let currentImage;


      const w = map.length * tileSize;
      const h = map.length *tileSize;


      canvas.width = w;
      canvas.height = h;


      for(let row = 0; row < map.length; row++){
        for(let col = 0; col < map.length; col++){
          const {id, gid} = map[row][col]

          const imageRow = parseInt(id/ tilesInRow)
          const imageCol = id % tilesInRow

        if(gid < 78){
          currentImage = grass
        }
        else if(gid < 155){
          currentImage = desert
        }
        else if(gid < 171){
          currentImage = fence
        }
        else{
          currentImage = water
        }

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

      console.log(players)
      players.map((player)=>{

        console.log(player)
        ctx.drawImage(
        tank,
        player.x,
        player.y,
        60,
        40
      )})


    }, [players])
    
    return <canvas ref={canvasRef} style={{backgroundColor: '#c0d470'}}/>

}

export default Canvas