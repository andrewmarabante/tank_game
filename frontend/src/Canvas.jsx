import { useEffect, useState, useRef } from 'react'


function Canvas(props){

  
    const canvasRef = useRef(null)
  
    useEffect(() => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      const w = window.innerWidth;
      const h = window.innerHeight;

      

      canvas.width = w;
      canvas.height = h;


      ctx.fillStyle = '#96EDE9'
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1; 

      ctx.fillRect(w*.6, h*.14, w*.2, h*.05)
      ctx.fillRect(w*.79, h*.14, h*.05, h*.2)
    }, [])
    
    return <canvas ref={canvasRef}/>

}

export default Canvas