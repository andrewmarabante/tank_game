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

  useEffect(()=>{

    if(!initialized.current)
    {
    var socketInstance = io('http://localhost:4000', { transports : ['websocket'] });
    setSocket(socketInstance)
    initialized.current = true;

    socketInstance.on('connect', () => {
      console.log('Connected to server');
    });}
  
    return () => {
      socketInstance.off('click');
    };
  },[]);

  useEffect(() => {
    if (socket) {

      socket.on('map', function(map) {
        setMap(map)
      })

      socket.on('click', function (data) {
        console.log(data.message);
        const newMessage = data.message;
        setMessage(newMessage);
      });
    }
  }, [socket]);


  return (
    <div style={{height:'200px'}}>
      {map && <Canvas map = {map}/>}
    </div>
  )
}

export default App
