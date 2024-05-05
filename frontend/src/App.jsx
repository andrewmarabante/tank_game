import gameMusic from '/src/assets/gamemusic-6082.mp3'
import bigHit from '/src/assets/bigHit.mp3'
import { useEffect, useState, useRef } from 'react'
import './App.css'
import io from 'socket.io-client'
import Canvas from './Canvas'
import PlayerSounds from './PlayerSounds'

function App() {
    // const [audioFiles] = useState({
    //   grenadeExplo: createAudio('/src/assets/grenadeExplo.mp3'),
    //   smallGun: createAudio('/src/assets/gunSound.mp3'),
    //   mineExplode: createAudio('/src/assets/mineExplode.mp3'),
    //   bigGun: createAudio('/src/assets/missileFire.mp3'),
    //   smallHit: createAudio('/src/assets/smallHit.mp3'),
    // });


  const [socket,setSocket] = useState(null)
  const [map, setMap] = useState(null)
  const canvasRef = useRef(null);
  const initialized = useRef(false)
  const [players, setPlayers] = useState([])
  const [projectiles, setProjectiles] = useState([])
  const [game, setGame] = useState(false)
  const [leader, setLeader] = useState(false);
  const [winner, setWinner] = useState(null);
  const [full, setFull] = useState(false)
  const [playerFences, setPlayerFences] = useState([])
  const [currentPlayer, setCurrentPlayer]= useState(null)
  const [connected, setConnected] = useState(false);
  const [sound, setSound] = useState(null)
  const [cont, setCont] = useState(false)


  const keys = new Map();

  const inputs = {
    up: false,
    down: false,
    right: false,
    left: false,
    reg: false,
    big: false,
    fence: false,
    mine: false,
    grenade: false,
  }

  useEffect(()=>{

    if(!initialized.current)
    {
    var socketInstance = io('http://localhost:4000', { transports : ['websocket'] });
    setSocket(socketInstance)
    initialized.current = true;

    socketInstance.on('connect', () => {
      setConnected(true)
    });
  }
  

  },[]);

  useEffect(() => {
    if (socket) {

      socket.on('full', () => {
        console.log('full')
        socket.close();
        setFull(true)
      })
      

      socket.on('map', function(map) {
        setMap(map)
      })

      socket.on('players', function (serverPlayers) {
       
        const currentPlayer = serverPlayers.find(player => player.id === socket.id)
          
        if(currentPlayer.Num === 1){
            setLeader(true)
          }
        setCurrentPlayer(currentPlayer)
        setPlayers(serverPlayers)
      });

      socket.on('projectiles', (serverProjectiles) => {
        setProjectiles(serverProjectiles)
      })

      socket.on('game', (gameState) => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('mousedown', handleMouseDown)
        setWinner(null)
        setGame(gameState)
      })

      socket.on('winner', winner => {
        setWinner(winner)
      })

      socket.on('playerFences', playerFences => {
        setPlayerFences(playerFences)
      })

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('mousedown', handleMouseDown)

    }}, [socket, game]);

  function play(sound){

   const audio = new Audio(sound)

   if(sound === gameMusic){
    audio.loop = true
    audio.play()
   }

  }

  function handleKeyDown(e){

    if(!game){return}

    if(e.key == 'w'){
      keys.set(e.key, true)
    }
    else if(e.key == 's'){
      keys.set(e.key, true)
    }
    else if(e.key == 'd'){
      keys.set(e.key, true)
    }
    else if(e.key == 'a'){
      keys.set(e.key, true)
    }
    else if(e.key == '1'){
      keys.set(e.key, true)
    }
    else if(e.key == '2'){
      keys.set(e.key, true)
    }
    else if(e.key == '3'){
      keys.set(e.key, true)
    }
    else if(e.key == '4'){
      keys.set(e.key, true)
    }
    else if(e.key == '5'){
      keys.set(e.key, true)
    }

    if(keys.get('w')){
      inputs["up"] = true
    }
    if(keys.get("s")){
      inputs["down"] = true
    }
    if(keys.get("d")){
      inputs["right"] = true
    }
    if(keys.get("a")){
      inputs["left"] = true
    }
    if(keys.get("1")){
      inputs["reg"] = true
    }
    if(keys.get("2")){
      inputs["big"] = true
    }
    if(keys.get("3")){
      inputs["fence"] = true
    }
    if(keys.get("4")){
      inputs["mine"] = true
    }
    if(keys.get("5")){
      inputs["grenade"] = true
    }

    socket.emit('input', inputs)  

  }


  function handleKeyUp(e){

    if(game === false){return}

    if(e.key == 'w'){
      keys.set(e.key, false)
    }
    else if(e.key == 's'){
      keys.set(e.key, false)
    }
    else if(e.key == 'd'){
      keys.set(e.key, false)
    }
    else if(e.key == 'a'){
      keys.set(e.key, false)
    }
    else if(e.key == '1'){
      keys.set(e.key, false)
    }
    else if(e.key == '2'){
      keys.set(e.key, false)
    }
    else if(e.key == '3'){
      keys.set(e.key, false)
    }
    else if(e.key == '4'){
      keys.set(e.key, false)
    }
    else if(e.key == '5'){
      keys.set(e.key, false)
    }

    if(!keys.get('w')){
      inputs["up"] = false
    }
    if(!keys.get("s")){
      inputs["down"] = false
    }
    if(!keys.get("d")){
      inputs["right"] = false
    }
    if(!keys.get("a")){
      inputs["left"] = false
    }
    if(!keys.get("1")){
      inputs["reg"] = false
    }
    if(!keys.get("2")){
      inputs["big"] = false
    }
    if(!keys.get("3")){
      inputs["fence"] = false
    }
    if(!keys.get("4")){
      inputs["mine"] = false
    }
    if(!keys.get("5")){
      inputs["grenade"] = false
    }
    
    
    socket.emit('input', inputs)

  }

  function handleMouseDown(){

    if(!game){return}

    play(bigHit)
    socket.emit('grenadeHold', inputs)
  }

  function handleMouseUp(e){

    if(!game){return}

    const angle = Math.atan2(
      e.clientY - window.innerHeight/2,
      e.clientX - window.innerWidth/2,
    )
    
    socket.emit('fire', angle)
  }

  function startGame(){
    setCont(true);
    play(gameMusic)
  }

  return (
    <div>
      {full && <div>Server is full, try again later</div>}
      {map && connected && cont && <Canvas map = {map} players = {players} projectiles = {projectiles} 
      socket = {socket} leader = {leader} game={game} winner={winner}
      playerFences = {playerFences} currentPlayer = {currentPlayer}
      />}
      {!connected && !full && <div>
        Attempting to connect
        </div>}
      {connected && !cont && <div>
        <button onClick={startGame}>Continue to game</button>
        </div>}
        <PlayerSounds players = {players} currentPlayer={currentPlayer}/>
    </div>
  )
}

export default App
