import { useEffect, useState, useRef } from 'react'
import './App.css'
import io from 'socket.io-client'
import Canvas from './Canvas'

function App() {
  const [socket,setSocket] = useState(null)
  const [message, setMessage] = useState('old')
  const [map, setMap] = useState(null)
  const canvasRef = useRef(null);
  const initialized = useRef(false)
  const [players, setPlayers] = useState([])
  const [projectiles, setProjectiles] = useState([])

  const keys = new Map();

  const inputs = {
    up: false,
    down: false,
    right: false,
    left: false,
  }

  useEffect(()=>{

    if(!initialized.current)
    {
    var socketInstance = io('http://localhost:4000', { transports : ['websocket'] });
    setSocket(socketInstance)
    initialized.current = true;

    socketInstance.on('connect', () => {
      console.log('Connected to server');
    });
  }
  

  },[]);

  useEffect(() => {
    if (socket) {

      socket.on('map', function(map) {
        setMap(map)
      })

      socket.on('players', function (serverPlayers) {
       setPlayers(serverPlayers)
      });

      socket.on('projectiles', (serverProjectiles) => {
        setProjectiles(serverProjectiles)
      })

      socket.on('full', () => {
        console.log('server full')
      })

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('click', handleClick)

    }}, [socket]);

  

  function handleKeyDown(e){

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

    socket.emit('input', inputs)  

  }


  function handleKeyUp(e){

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
    
    socket.emit('input', inputs)

  }

  function handleClick(e){

    const angle = Math.atan2(
      e.clientY - window.innerHeight/2,
      e.clientX - window.innerWidth/2,
    )
    
    socket.emit('fire', angle)
  }
  return (
    <div style={{height:'200px'}}>
      {map && <Canvas map = {map} players = {players} projectiles = {projectiles} socket = {socket}/>}
    </div>
  )
}

export default App
