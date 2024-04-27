import { useEffect, useState } from 'react'
import './App.css'
import io from 'socket.io-client'

function App() {
  const [socket,setSocket] = useState(null)
  const [message, setMessage] = useState('old')

  useEffect(()=>{
    var socketInstance = io('http://localhost:4000', { transports : ['websocket'] });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
    });
  
    return () => {
      socketInstance.off('click');
    };
  },[]);

  useEffect(() => {
    if (socket) {
      socket.on('click', function (data) {
        console.log(data.message);
        const newMessage = data.message;
        setMessage(newMessage);
      });
    }
  }, [socket]);


function handleClick(){
  console.log('handler')
  socket.emit('click', {
    message: 'new'
  })
}

  return (
    <div>
      <div>{message}</div>
      <button onClick={handleClick}>Do Something</button>
    </div>
  )
}

export default App
