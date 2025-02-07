import { useEffect, useRef, useState } from "react";

export default function ProjectileSounds({projectiles, currentPlayer, explodedProjectiles, playerFences, masterVolume}){

    const projectilesArrayRef = useRef([])
    const explodedArrayRef = useRef([])
    const placedFencesRef = useRef([])

    const projectileSoundsRef = useRef({})
    //   smallHit: createAudio('/src/assets/smallHit.mp3'),

    useEffect(()=>{

        if(Object.keys(projectileSoundsRef.current).length === 0){

            const audioSources = {
                smallGun: '/src/assets/gunSound.mp3',
                bigGun: '/src/assets/missileFire.mp3',
                fenceHit: '/src/assets/hitFence.mp3',
                smallPlayerHit: '/src/assets/smallPlayerHit.mp3',
                bigPlayerHit: '/src/assets/bigHit.mp3',
                placeFence: '/src/assets/placeFence.mp3',
                mineExplode: '/src/assets/mineExplode.mp3',
                grenadeExplo: '/src/assets/grenadeExplo.mp3',
            }
    
              const loadedAudio = {};
              Object.keys(audioSources).forEach((key) => {
                  const audio = new Audio();
                  audio.src = audioSources[key];
                  loadedAudio[key] = audio;
              });
          
              projectileSoundsRef.current = loadedAudio;
              console.log('Projectile Sounds Loaded', projectileSoundsRef.current)
        }

        projectiles.map(projectile => {


            if(!projectilesArrayRef.current.includes(projectile.uniqueId) && !projectile.exploded || projectile.ammo === 'mine'){

                let distance;
                //fence calc is separate and grenades/mines last for about 2 seconds before exploding
                //causing around 80 unnecessary calculations
                if(projectile.ammo !== 'fence' && projectile.ammo !== 'grenade' && projectile.ammo !== 'mine'){
                    console.log('projectileCalc')
                    const dx = projectile.x - currentPlayer.x;
                    const dy = projectile.y - currentPlayer.y;
                    distance = dx * dx + dy * dy;
              }

                if(projectile.ammo === 'reg'){

                    const ammoSound = projectileSoundsRef.current.smallGun
                    ammoSound.volume = .3 * calculateVolume(distance)
                    ammoSound.currentTime = 0;
                    ammoSound.play()

                    projectilesArrayRef.current.push(projectile.uniqueId)
                }
                else if(projectile.ammo === 'big'){
                    const ammoSound = projectileSoundsRef.current.bigGun
                    ammoSound.volume = .8 * calculateVolume(distance)
                    ammoSound.currentTime = 1
                    ammoSound.play()
                    projectilesArrayRef.current.push(projectile.uniqueId)

                }
                else if(projectile.ammo === 'grenade' && projectile.timer === 0 && !explodedArrayRef.current.includes(projectile.uniqueId)){

                    console.log('grenadeCalc')
                    const dx = projectile.x - currentPlayer.x;
                    const dy = projectile.y - currentPlayer.y;
                    distance = dx * dx + dy * dy;

                    const ammoSound = projectileSoundsRef.current.grenadeExplo
                    ammoSound.volume = calculateVolume(distance)
                    ammoSound.currentTime = 0
                    ammoSound.play()

                    explodedArrayRef.current.push(projectile.uniqueId)
                    projectilesArrayRef.current.push(projectile.uniqueId)

                }
                else if(projectile.ammo === 'mine' && projectile.exploded === true && !explodedArrayRef.current.includes(projectile.uniqueId)){

                    console.log('mineCalc')
                    const dx = projectile.x - currentPlayer.x;
                    const dy = projectile.y - currentPlayer.y;
                    distance = dx * dx + dy * dy;
                    const ammoSound = projectileSoundsRef.current.mineExplode
                    ammoSound.volume = .4*calculateVolume(distance)
                    ammoSound.currentTime = 2
                    ammoSound.play()
                    projectilesArrayRef.current.push(projectile.uniqueId)
                    explodedArrayRef.current.push(projectile.uniqueId)
                }
            }
        })
        //maps regular exploded projectiles

        explodedProjectiles.map(ammo => {

            ammo.map(projectile => {

                if(!explodedArrayRef.current.includes(projectile.id)){

                    console.log('here')
                    let distance;

                    if(projectile.ammo !== 'fence'){
                        let dx = projectile.x - currentPlayer.x;
                        let dy = projectile.y - currentPlayer.y;
                        distance = dx * dx + dy * dy;
                    }
                    else if(projectile.ammo === 'fence'){
                        //playerFences is not the same as projectile.fences... idk wtf I was doing but 
                        //now this is looping playerFences within projectile.fences loop because projectile.fences
                        //does NOT have x,y values. Good luck future Andrew. 
    
                        playerFences.map((fence)=> {
                            
                            if(!placedFencesRef.current.includes(fence.uniqueId)){
    
                                console.log('fenceCalc')
                                let dx = fence.x - currentPlayer.x;
                                let dy = fence.y - currentPlayer.y;
                                let fenceDistance = dx * dx + dy * dy;
                                
                                const ammoSound = projectileSoundsRef.current.placeFence
                                ammoSound.volume = masterVolume*calculateVolume(fenceDistance)
                                ammoSound.currentTime = 0
                                ammoSound.play()
                                placedFencesRef.current.push(fence.id)
                                explodedArrayRef.current.push(projectile.id)
                                projectilesArrayRef.current.push(projectile.id)
                        }
                        })
                    }
    
                    if(projectile.hit === 'fence'){
                        const sound = projectileSoundsRef.current.fenceHit
                        sound.volume = .5*masterVolume*calculateVolume(distance)
                        sound.currentTime = 0;
                        sound.play()
                        
                        explodedArrayRef.current.push(projectile.id)
                    }
                    else if(projectile.hit === 'player'){
                        
                        if(projectile.ammo === 'reg'){
                            const sound = projectileSoundsRef.current.smallPlayerHit
                            sound.currentTime = 0;
                            if(projectile.playerId === currentPlayer.id){
                                sound.volume = .8*masterVolume
                            }
                            else{sound.volume = .8*masterVolume*calculateVolume(distance)}
                            sound.play()
                        }
                        else if(projectile.ammo === 'big'){
                            const sound = projectileSoundsRef.current.bigPlayerHit
                            sound.currentTime = 0;
                            if(projectile.playerId === currentPlayer.id){
                                sound.volume = .8*masterVolume
                            }
                            else{sound.volume = .8*masterVolume*calculateVolume(distance)}
                            sound.play()
                        }
                        
                        explodedArrayRef.current.push(projectile.id)

                    }
                }
            })
        })

    }, [projectiles, explodedProjectiles])

    function calculateVolume(distanceSquared) {
        const k = 5 / 640000
        return masterVolume * Math.exp(-k * distanceSquared);
    }
    
}