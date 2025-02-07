import gameMusic from '/src/assets/gamemusic-6082.mp3';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './App.css';
import io from 'socket.io-client';
import Canvas from './Canvas';
import PlayerSounds from './PlayerSounds';
import ProjectileSounds from './ProjectileSounds';

function App() {
  const socketRef = useRef(null);
  const audioRef = useRef(new Audio());
  const masterVolumeRef = useRef(.5)
  const canvasRef = useRef(null);
  const initialized = useRef(false);
  const keys = useRef(new Map());

  const [socket, setSocket] = useState(null);
  const [map, setMap] = useState(null);
  const [players, setPlayers] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [game, setGame] = useState(false);
  const [leader, setLeader] = useState(false);
  const [winner, setWinner] = useState(null);
  const [full, setFull] = useState(false);
  const [playerFences, setPlayerFences] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [connected, setConnected] = useState(false);
  const [cont, setCont] = useState(false);
  const [explodedProjectiles, setExplodedProjectiles] = useState([[], [], [], [], []]);

  const inputs = useMemo(() => ({
    up: false,
    down: false,
    right: false,
    left: false,
    reg: false,
    big: false,
    fence: false,
    mine: false,
    grenade: false,
  }), []);

  const keyMap = useMemo(() => ({
    w: 'up',
    s: 'down',
    d: 'right',
    a: 'left',
    1: 'reg',
    2: 'big',
    3: 'fence',
    4: 'mine',
    5: 'grenade',
  }), []);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:8080/', { transports: ['websocket'] });
      setSocket(socketRef.current);
      
      socketRef.current.on('connect', () => setConnected(true));
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleFull = () => {
      console.log('full');
      socket.close();
      setFull(true);
    };

    const handleMap = (mapData) => setMap(mapData);
    
    const handlePlayers = (serverPlayers) => {
      const currentPlayer = serverPlayers.find(player => player.id === socket.id);
      if (currentPlayer?.Num === 1) setLeader(true);
      setCurrentPlayer(currentPlayer);
      setPlayers(serverPlayers);
    };

    const handleProjectiles = (serverProjectiles) => {
      setProjectiles(serverProjectiles)
    };

    const handleGameState = (gameState) => {
      setWinner(null);
      setGame(gameState);
    };

    const handleWinner = (winner) => setWinner(winner);

    const handlePlayerFences = (playerFencesData) => setPlayerFences(playerFencesData);

    const handleExplodedProjectiles = (serverExplodedProjectiles) => {
      setExplodedProjectiles(serverExplodedProjectiles)};

    socket.on('full', handleFull);
    socket.on('map', handleMap);
    socket.on('players', handlePlayers);
    socket.on('projectiles', handleProjectiles);
    socket.on('game', handleGameState);
    socket.on('winner', handleWinner);
    socket.on('playerFences', handlePlayerFences);
    socket.on('explodedProjectiles', handleExplodedProjectiles);

    return () => {
      socket.off('full', handleFull);
      socket.off('map', handleMap);
      socket.off('players', handlePlayers);
      socket.off('projectiles', handleProjectiles);
      socket.off('game', handleGameState);
      socket.off('winner', handleWinner);
      socket.off('playerFences', handlePlayerFences);
      socket.off('explodedProjectiles', handleExplodedProjectiles);
    };
  }, [socket]);

  const play = useCallback((sound) => {

    if (!audioRef.current) return;
    audioRef.current.src = sound;
    audioRef.current.loop = sound === gameMusic;
    audioRef.current.volume = 0;
    audioRef.current.play();
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!game || !keyMap[e.key]) return;
    keys.current.set(e.key, true);
    inputs[keyMap[e.key]] = true;
    socket.emit('input', inputs);
  }, [game, inputs]);

  const handleKeyUp = useCallback((e) => {
    if (!game || !keyMap[e.key]) return;
    keys.current.set(e.key, false);
    inputs[keyMap[e.key]] = false;
    socket.emit('input', inputs);
  }, [game, inputs]);

  const handleMouseDown = useCallback(() => {
    if (!game) return;
    socket.emit('grenadeHold', inputs);
  }, [game, inputs]);

  const handleMouseUp = useCallback((e) => {
    if (!game) return;
    const angle = Math.atan2(e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2);
    socket.emit('fire', angle);
  }, [game]);

  useEffect(() => {
    if (!game) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [game, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp]);

  const startGame = useCallback(() => {
    setCont(true);
    play(gameMusic);
  }, [play]);

  return (
    <div>
      {full ? (
        <div>Server is full, try again later</div>
      ) : !connected ? (
        <div>Attempting to connect</div>
      ) : !cont ? (
        <div><button onClick={startGame}>Continue to game</button></div>
      ) : (
        <>
          {map && (
            <Canvas 
              map={map} 
              players={players} 
              projectiles={projectiles} 
              socket={socket} 
              leader={leader} 
              game={game} 
              winner={winner}
              playerFences={playerFences} 
              currentPlayer={currentPlayer} 
              music = {audioRef.current}
              masterVolume = {masterVolumeRef}
            />
          )}
          <PlayerSounds players={players} currentPlayer={currentPlayer} masterVolume = {masterVolumeRef.current} />
          <ProjectileSounds projectiles={projectiles} currentPlayer={currentPlayer} explodedProjectiles={explodedProjectiles} playerFences={playerFences} masterVolume = {masterVolumeRef.current} />
        </>
      )}
    </div>
  );
}

export default App;
