import { useEffect, useState } from "react";
import smallGun from '/src/assets/gunSound.mp3'
import bigGun from '/src/assets/missileFire.mp3'
import fenceHit from '/src/assets/hitFence.mp3'
import smallPlayerHit from '/src/assets/smallPlayerHit.mp3'
import bigPlayerHit from '/src/assets/bigHit.mp3'
import placeFence from '/src/assets/placeFence.mp3'
import mineExplode from '/src/assets/mineExplode.mp3'
import grenadeExplo from '/src/assets/grenadeExplo.mp3'



export default function ProjectileSounds({projectiles, currentPlayer, explodedProjectiles}){

    const [projectilesArray, setProjectilesArray] = useState([])
    const [explodedArray, setExplodedArray] = useState([])

    //   smallHit: createAudio('/src/assets/smallHit.mp3'),

    useEffect(()=>{

        projectiles.map(projectile => {

            if(projectilesArray && !projectilesArray.includes(projectile.uniqueId) && !projectile.exploded){

                let distance = Math.sqrt((projectile.x-currentPlayer.x)**2 + (projectile.y-currentPlayer.y)**2)

                if(projectile.ammo === 'reg'){
                    const ammoSound = new Audio(smallGun);
                    ammoSound.volume = .4 * calculateVolume(distance)
                    ammoSound.play()

                    let currProjectilesArray = projectilesArray;
                    currProjectilesArray.push(projectile.uniqueId)
                    setProjectilesArray(currProjectilesArray)   
                }
                else if(projectile.ammo === 'big'){
                    const ammoSound = new Audio(bigGun);
                    ammoSound.volume = .8 * calculateVolume(distance)
                    ammoSound.currentTime = 1
                    ammoSound.play()

                    let currProjectilesArray = projectilesArray;
                    currProjectilesArray.push(projectile.uniqueId)
                    setProjectilesArray(currProjectilesArray)
                }
            }
        })
        //maps regular exploded projectiles
        explodedProjectiles[0].map(projectile => {

            if(explodedArray && !explodedArray.includes(projectile.id)){
                let distance = Math.sqrt((projectile.x-currentPlayer.x)**2 + (projectile.y-currentPlayer.y)**2)

                if(projectile.hit === 'fence'){
                    const sound = new Audio(fenceHit);
                    sound.volume = .5*calculateVolume(distance)
                    sound.play()
                    
                    let currExplodedArray = explodedArray;
                    currExplodedArray.push(projectile.id)
                    setExplodedArray(currExplodedArray)
                }
                else if(projectile.hit === 'player'){
                    const sound = new Audio(smallPlayerHit);
                    if(projectile.playerId === currentPlayer.id){
                        sound.volume = .8
                    }
                    else{sound.volume = .8*calculateVolume(distance)}
                    sound.play()
                    
                    let currExplodedArray = explodedArray;
                    currExplodedArray.push(projectile.id)
                    setExplodedArray(currExplodedArray)
                }
            }
        })

        //maps big projectiles
        explodedProjectiles[1].map(projectile => {
            if(explodedArray && !explodedArray.includes(projectile.id)){
                let distance = Math.sqrt((projectile.x-currentPlayer.x)**2 + (projectile.y-currentPlayer.y)**2)
                const sound = new Audio(bigPlayerHit);
                if(projectile.playerId === currentPlayer.id){
                    sound.volume = 1
                }
                else{sound.volume = 1*calculateVolume(distance/2)}
                sound.play()
                
                let currExplodedArray = explodedArray;
                currExplodedArray.push(projectile.id)
                setExplodedArray(currExplodedArray)
            }
        })

        explodedProjectiles[2].map(fence => {

            if(explodedArray && !explodedArray.includes(fence.id)){
                let distance = Math.sqrt((fence.x-currentPlayer.x)**2 + (fence.y-currentPlayer.y)**2)
                
                const sound = new Audio(placeFence);
                sound.volume = 1 * calculateVolume(distance/2)
                sound.play()
                
                let currExplodedArray = explodedArray;
                currExplodedArray.push(fence.id)
                setExplodedArray(currExplodedArray)
            }
        })

        explodedProjectiles[3].map(mine => {

            if(explodedArray && !explodedArray.includes(mine.id)){
                let distance = Math.sqrt((mine.x-currentPlayer.x)**2 + (mine.y-currentPlayer.y)**2)

                const sound = new Audio(mineExplode);
                sound.currentTime = 2.2
                sound.volume = .7 * calculateVolume(distance/2)
                sound.play()
                
                let currExplodedArray = explodedArray;
                currExplodedArray.push(mine.id)
                setExplodedArray(currExplodedArray)
            }
        })

        explodedProjectiles[4].map(grenade => {
            if(explodedArray && !explodedArray.includes(grenade.id)){
                let distance = Math.sqrt((grenade.x-currentPlayer.x)**2 + (grenade.y-currentPlayer.y)**2)

                const sound = new Audio(grenadeExplo);
                sound.volume = 1 * calculateVolume(distance/2)
                sound.play()
                
                let currExplodedArray = explodedArray;
                currExplodedArray.push(grenade.id)
                setExplodedArray(currExplodedArray)
            }
        })

        





    }, [projectiles])

    function calculateVolume(distance) {
        let volume = (-distance+500)/500
        return Math.max(0, Math.min(volume, 1));
    }
}