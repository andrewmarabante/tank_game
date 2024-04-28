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

  const inputs = {
    up: 'false',
    down: 'false',
    right: 'false',
    left: 'false',
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

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

    }}, [socket]);

  

  function handleKeyDown(e){

    if(e.key == 'w'){
      inputs['up'] = true
    }
    else if(e.key == 's'){
      inputs['down'] = true
    }
    else if(e.key == 'd'){
      inputs['right'] = true
    }
    else if(e.key == 'a'){
      inputs['left'] = true
    }

    console.log('down')
    socket.emit('input', inputs)  

  }


  function handleKeyUp(e){
    
    if(e.key == 'w'){
      inputs['up'] = false
    }
    else if(e.key == 's'){
      inputs['down'] = false
    }
    else if(e.key == 'd'){
      inputs['right'] = false
    }
    else if(e.key == 'a'){
      inputs['left'] = false
    }

    console.log('up')
    socket.emit('input', inputs)
  }


  return (
    <div style={{height:'200px'}}>
      {map && <Canvas map = {map} players = {players}/>}
    </div>
  )
}

export default App
