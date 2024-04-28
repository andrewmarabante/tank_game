const tmx = require('tmx-parser')


async function loadMap(){

    map = await new Promise((resolve, reject) => {
  
      tmx.parseFile('./maps/Grassland.tmx', function(err, mapLoad) {
        if (err) return  reject(err);
        resolve(mapLoad)
      })
    })

  const tiles = map.layers[0].tiles;

  console.log(map)
  const map2D = []

  for(let row = 0; row < map.height; row++){
    const tileRow = []
    for(let col = 0; col < map.width; col++){
      const tile = tiles[ row * map.width + col]
      tileRow.push({ id: tile.id, gid: tile.gid})
    }
    map2D.push(tileRow)
  }
  return map2D

}

module.exports = loadMap;