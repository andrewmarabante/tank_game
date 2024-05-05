import { useEffect, useState } from "react";
import tankMoving from '/src/assets/tankMoving.mp3'

export default function PlayerSounds({players, currentPlayer}){
    const [movingPlayers, setMovingPlayers] = useState([])
    const [tank1, setTank1] = useState(null)
    const [tank2, setTank2] = useState(null)
    const [tank3, setTank3] = useState(null)
    const [tank4, setTank4] = useState(null)
    const [tankMoveLoop, setTankMoveLoop] = useState(7)

    if(tank1 && tank1.currentTime >= tankMoveLoop){
        tank1.currentTime = 1
    }
    else if(tank2 && tank2.currentTime >= tankMoveLoop){
        tank2.currentTime = 1
    }
    else if(tank3 && tank3.currentTime >= tankMoveLoop){
        tank3.currentTime = 1
    }
    else if(tank4 && tank4.currentTime >= tankMoveLoop){
        tank4.currentTime = 1
    }

    useEffect(() => {
        players.map(player => {
            if(player.moving){
                if(movingPlayers && !movingPlayers.includes(player.id)){
                    if(player.Num === 1){
                        if(!tank1){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .1;
                            tankMove.currentTime = 0
                            tankMove.play();
                            setTank1(tankMove)
                        }
                        else{
                            tank1.currentTime = 0;
                            tank1.play()
                        }
                    }
                    if(player.Num === 2){
                        if(!tank2){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .1;
                            tankMove.currentTime = 0
                            tankMove.play();
                            setTank2(tankMove)
                        }
                        else{
                            tank2.currentTime = 0;
                            tank2.play()
                        }
                    }
                    if(player.Num === 3){
                        if(!tank3){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .1;
                            tankMove.currentTime = 0
                            tankMove.play();
                            setTank3(tankMove)
                        }
                        else{
                            tank3.currentTime = 0;
                            tank3.play()
                        }
                    }
                    if(player.Num === 4){
                        if(!tank4){
                            let tankMove;
                            tankMove = new Audio(tankMoving)
                            tankMove.volume = .1;
                            tankMove.currentTime = 0
                            tankMove.play();
                            setTank4(tankMove)
                        }
                        else{
                            tank4.currentTime = 0;
                            tank4.play()
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
                        tank1.pause()
                    }
                    if(player.Num === 2){
                        tank2.pause()
                    }
                    if(player.Num === 3){
                        tank3.pause()
                    }
                    if(player.Num === 4){
                        tank4.pause()
                    }

                    let currentMovingPlayers = movingPlayers;
                    let index = currentMovingPlayers.indexOf(player.id)
                    currentMovingPlayers.splice(index, 1)
                    setMovingPlayers(currentMovingPlayers)
                }
            }
        })
    }, [players])


    return(
        <div></div>
    )
}