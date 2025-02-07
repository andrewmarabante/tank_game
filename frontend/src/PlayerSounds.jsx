import { useEffect, useRef, useState, useCallback } from "react";
import tankMoving from '/src/assets/tankMoving.mp3'

export default function PlayerSounds({players, currentPlayer, masterVolume}){
    const [movingPlayers, setMovingPlayers] = useState([])
    const [tankMoveLoop, setTankMoveLoop] = useState(7)

    const tank1 = useRef(null);
    const tank2 = useRef(null);
    const tank3 = useRef(null);
    const tank4 = useRef(null);

    const tank1DistanceRef = useRef(0);
    const tank2DistanceRef = useRef(0);
    const tank3DistanceRef = useRef(0);
    const tank4DistanceRef = useRef(0);

    const intervalRef = useRef(null)
    const playersRef = useRef(players)
    const currentPlayerRef = useRef(currentPlayer)

    const baseVol = useRef(masterVolume*.1)

    useEffect(() => {
        if(tank1.current){
            tank1.current.volume = baseVol.current* tank1DistanceRef.current
        }
        if(tank2.current){
            tank2.current.volume = baseVol.current* tank2DistanceRef.current
        }
        if(tank3.current){
            tank3.current.volume = baseVol.current* tank3DistanceRef.current        }
        if(tank4.current){
            tank4.current.volume = baseVol.current* tank4DistanceRef.current
        }

        baseVol.current = .1*masterVolume

    },[masterVolume])

    useEffect(() => {
        currentPlayerRef.current = currentPlayer;
        playersRef.current = players
    },[players,currentPlayer])

    useEffect(() => {
        
        if (intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            
            playersRef.current.forEach(player => {
                const dx = currentPlayerRef.current.x - player.x;
                const dy = currentPlayerRef.current.y - player.y;
                const distance = dx*dx + dy*dy


                if(player.Num === 1 && tank1.current){
                    if(player.dead === true){return tank1.current.volume = 0}
                    tank1DistanceRef.current = calculateVolume(distance);
                    tank1.current.volume = baseVol.current*tank1DistanceRef.current;
                }
                else if(player.Num === 2 && tank2.current){
                    if(player.dead === true){return tank2.current.volume = 0}
                    tank2DistanceRef.current = calculateVolume(distance);
                    tank2.current.volume = baseVol.current*tank2DistanceRef.current;
                }
                else if(player.Num === 3){
                    if(player.dead === true){return tank3.current.volume = 0}
                    tank3DistanceRef.current = calculateVolume(distance);
                    tank3.current.volume = baseVol.current*tank3DistanceRef.current;                }
                else if(player.Num === 4){
                    if(player.dead === true){return tank4.current.volume = 0}
                    tank4DistanceRef.current = calculateVolume(distance);
                    tank4.current.volume = baseVol.current*tank4DistanceRef.current;                }
            });
          }, 200)
        
        }, [])


    useEffect(() => {

        if(tank1.current && tank1.current.currentTime >= tankMoveLoop){
            tank1.current.currentTime = 1
        }
        else if(tank2.current && tank2.current.currentTime >= tankMoveLoop){
            tank2.current.currentTime = 1
        }
        else if(tank3.current && tank3.current.currentTime >= tankMoveLoop){
            tank3.current.currentTime = 1
        }
        else if(tank4.current && tank4.current.currentTime >= tankMoveLoop){
            tank4.current.currentTime = 1
        }

        players.map(player => {
            if(player.moving){
                if(movingPlayers && !movingPlayers.includes(player.id)){
                    if(player.Num === 1){
                        if(!tank1.current){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .05;
                            tankMove.currentTime = 0
                            tankMove.play();
                            tank1.current = tankMove
                        }
                        else{
                            tank1.current.currentTime = 0;
                            tank1.current.play()
                        }
                    }
                    if(player.Num === 2){
                        if(!tank2.current){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .05;
                            tankMove.currentTime = 0
                            tankMove.play();
                            tank2.current = tankMove 
                        }
                        else{
                            tank2.current.currentTime = 0;
                            tank2.current.play()
                        }
                    }
                    if(player.Num === 3){
                        if(!tank3.current){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .05;
                            tankMove.currentTime = 0
                            tankMove.play();
                            tank3.current = tankMove
                        }
                        else{
                            tank3.current.currentTime = 0;
                            tank3.current.play()
                        }
                    }
                    if(player.Num === 4){
                        if(!tank4.current){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .05;
                            tankMove.currentTime = 0
                            tankMove.play();
                            tank4.current = tankMove
                        }
                        else{
                            tank4.current.currentTime = 0;
                            tank4.current.play()
                        }
                    }

                    let currentMovingPlayers = movingPlayers;
                    currentMovingPlayers.push(player.id)
                    setMovingPlayers(currentMovingPlayers)
                }
            }

            else if(!player.moving){
                if(movingPlayers && movingPlayers.includes(player.id)){
                    if(player.Num === 1){
                        tank1.current.pause()
                    }
                    if(player.Num === 2){
                        tank2.current.pause()
                    }
                    if(player.Num === 3){
                        tank3.current.pause()
                    }
                    if(player.Num === 4){
                        tank4.current.pause()
                    }

                    let currentMovingPlayers = movingPlayers;
                    let index = currentMovingPlayers.indexOf(player.id)
                    currentMovingPlayers.splice(index, 1)
                    setMovingPlayers(currentMovingPlayers)
                }
            }
        })
    }, [players])

    const calculateVolume = useCallback((distanceSquared) => {
        const k = 5 / 640000
        return masterVolume * Math.exp(-k * distanceSquared);
      }, []);
}