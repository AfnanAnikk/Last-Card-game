/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/SocketContext';
import { useApp } from '../hooks/AppContext';
import Card from '../components/Card';
import { Card as CardType, ClientRoomState } from '../../../server/src/game/types';
import { LogOut, Settings as SettingsIcon, Volume2, VolumeX } from 'lucide-react';

interface GameState {
  room: ClientRoomState;
  hand: CardType[];
}

const GamePage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { musicEnabled, setMusicEnabled } = useApp();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState(false);
  const [drawnCardPopup, setDrawnCardPopup] = useState<CardType | null>(null);

  useEffect(() => {
    if (!socket) {
      navigate('/');
      return;
    }

    const handleGameStateUpdate = (state: GameState) => {
      console.log("RECEIVED GAME STATE UPDATE:", state);
      // Sort hand by color
      const colorOrder = { 'red': 1, 'blue': 2, 'green': 3, 'yellow': 4, 'black': 5 };
      state.hand.sort((a, b) => {
        if (colorOrder[a.color] !== colorOrder[b.color]) {
          return colorOrder[a.color] - colorOrder[b.color];
        }
        return String(a.value).localeCompare(String(b.value));
      });
      setGameState(state);
    };

    const handleGameMessage = (msg: string) => {
      setMessages(prev => [...prev.slice(-4), msg]); 
    };

    const handleInvalidMove = (msg: string) => {
      alert(`Invalid Move: ${msg}`);
    };

    const handleErrorMessage = (msg: string) => {
      alert(`Error: ${msg}`);
    };

    const handleGameOver = (data: { winner: string }) => {
      alert(`Game Over! Winner: ${data.winner}`);
    };

    const handleDrawnCardPopup = (card: CardType) => {
      setDrawnCardPopup(card);
    };

    socket.on('gameStateUpdated', handleGameStateUpdate);
    socket.on('gameMessage', handleGameMessage);
    socket.on('invalidMove', handleInvalidMove);
    socket.on('errorMessage', handleErrorMessage);
    socket.on('gameOver', handleGameOver);
    socket.on('drawnCardPopup', handleDrawnCardPopup);

    return () => {
      socket.off('gameStateUpdated', handleGameStateUpdate);
      socket.off('gameMessage', handleGameMessage);
      socket.off('invalidMove', handleInvalidMove);
      socket.off('errorMessage', handleErrorMessage);
      socket.off('gameOver', handleGameOver);
      socket.off('drawnCardPopup', handleDrawnCardPopup);
    };
  }, [socket, navigate]);

  const isMyTurn = () => {
    if (!gameState || !socket) return false;
    const myIndex = gameState.room.players.findIndex(p => p.socketId === socket.id);
    return myIndex === gameState.room.currentTurnIndex;
  };

  const isCardPlayable = (card: CardType) => {
    if (!isMyTurn() || !gameState) return false;
    const topCard = gameState.room.discardPileTop;
    if (!topCard) return true;

    if (card.color === 'black') return true;
    if (card.color === gameState.room.currentColor) return true;
    if (card.value === topCard.value) return true;

    return false;
  };

  const handlePlayCard = (card: CardType) => {
    if (!isCardPlayable(card)) return;

    if (drawnCardPopup?.id === card.id) {
      setDrawnCardPopup(null);
    }

    if (card.color === 'black') {
      setPendingCardId(card.id);
      setShowColorPicker(true);
    } else {
      socket?.emit('playCard', { roomCode, cardId: card.id });
    }
  };

  const handleKeepCard = () => {
    setDrawnCardPopup(null);
    socket?.emit('keepDrawnCard', { roomCode });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHoveringDropZone(false);
    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId || !gameState) return;
    
    const card = gameState.hand.find(c => c.id === cardId);
    if (card) {
      handlePlayCard(card);
    }
  };

  const handleDrawCard = () => {
    if (!isMyTurn()) return;
    socket?.emit('drawCard', { roomCode });
  };

  const handleColorPick = (color: string) => {
    if (pendingCardId && socket) {
      socket.emit('playCard', { roomCode, cardId: pendingCardId, chosenColor: color });
      setShowColorPicker(false);
      setPendingCardId(null);
    }
  };

  const handleLastCardClick = () => {
    if (iHaveOneCard && !myPlayer?.hasCalledLastCard) {
      socket?.emit('callLastCard', { roomCode });
    } else {
      socket?.emit('catchLastCard', { roomCode });
    }
  };

  if (!gameState) {
    return <div className="container" style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>Loading Game State...</div>;
  }

  const amIHost = gameState.room.hostId === socket?.id;

  if (!gameState.room.gameStarted) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'url(/assets/background.png)', backgroundSize: 'cover' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 className="text-gradient">Lobby: {gameState.room.roomCode}</h1>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem' }}>Leave</button>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Players ({gameState.room.players.length}/{gameState.room.maxPlayers})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {gameState.room.players.map(p => (
                <div key={p.socketId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                  <img src={`/assets/${p.profilePic || 'profile1.png'}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{p.nickname} {p.isHost && '👑'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>House Rules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: amIHost ? 'pointer' : 'default', opacity: amIHost ? 1 : 0.6 }}>
                <input 
                  type="checkbox" 
                  checked={gameState.room.settings.playWithStack} 
                  onChange={(e) => {
                    if (amIHost) {
                      socket?.emit('updateSettings', { roomCode, settings: { ...gameState.room.settings, playWithStack: e.target.checked } });
                    }
                  }}
                  disabled={!amIHost}
                  style={{ width: '1.5rem', height: '1.5rem' }} 
                />
                Play with Stack (Discard All)
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: amIHost ? 'pointer' : 'default', opacity: amIHost ? 1 : 0.6 }}>
                <input 
                  type="checkbox" 
                  checked={gameState.room.settings.playWithPlus6Plus10} 
                  onChange={(e) => {
                    if (amIHost) {
                      socket?.emit('updateSettings', { roomCode, settings: { ...gameState.room.settings, playWithPlus6Plus10: e.target.checked } });
                    }
                  }}
                  disabled={!amIHost}
                  style={{ width: '1.5rem', height: '1.5rem' }} 
                />
                Include +6 and +10 Cards
              </label>
            </div>
          </div>

          {amIHost ? (
            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
              onClick={() => {
                console.log("START GAME BUTTON CLICKED! Emitting to server...");
                socket?.emit('startGame', { roomCode });
              }}
              disabled={gameState.room.players.length < 2}
            >
              {gameState.room.players.length >= 2 ? 'Start Game' : 'Waiting for players...'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem', padding: '1rem' }}>
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sort opponents in clockwise order relative to me
  const myIndex = gameState.room.players.findIndex(p => p.socketId === socket?.id);
  const myPlayer = gameState.room.players[myIndex];
  
  let otherPlayers: ClientRoomState['players'] = [];
  if (myIndex !== -1) {
    const afterMe = gameState.room.players.slice(myIndex + 1);
    const beforeMe = gameState.room.players.slice(0, myIndex);
    otherPlayers = [...afterMe, ...beforeMe];
  } else {
    otherPlayers = gameState.room.players.filter(p => p.socketId !== socket?.id);
  }
  const iHaveOneCard = myPlayer?.cardCount === 1;

  // Calculate fan angles
  const fanRadius = 400; 
  const cardSpacingAngle = 10; 
  const totalAngle = (gameState.hand.length - 1) * cardSpacingAngle;
  const startAngle = -totalAngle / 2;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Top Left - Draw Pile & Quit */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 10 }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <LogOut size={16} /> Quit Game
        </button>

        <div onClick={handleDrawCard} style={{ cursor: isMyTurn() ? 'pointer' : 'default', transition: 'transform 0.2s', transform: isMyTurn() ? 'scale(1.05)' : 'none' }}>
          <Card card={{ id: 'back', color: 'black', type: 'number', value: '' }} isFaceDown />
          {isMyTurn() && (
            <div style={{ textAlign: 'center', color: '#facc15', fontWeight: 'bold', marginTop: '0.5rem', textShadow: '1px 1px 2px black' }}>Draw</div>
          )}
        </div>
      </div>

      {/* Top Right - Settings */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
        <button 
          onClick={() => setShowSettings(true)}
          style={{ background: 'rgba(30, 41, 59, 0.8)', color: 'white', border: '1px solid #475569', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <SettingsIcon size={24} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <h2 className="text-gradient">Settings</h2>
            
            <button 
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              {musicEnabled ? <Volume2 /> : <VolumeX />} 
              {musicEnabled ? 'Mute Music' : 'Enable Music'}
            </button>

            <button onClick={() => setShowSettings(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid gray', marginTop: '1rem', width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Opponents Layout */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        {otherPlayers.map((player, index) => {
          const isTurn = gameState.room.players.findIndex(p => p.socketId === player.socketId) === gameState.room.currentTurnIndex;
          const totalOpps = otherPlayers.length;
          
          // Determine position based on total opponents and index
          let posStyle: React.CSSProperties = {};
          let baseRotation = 0;
          
          if (totalOpps === 1) {
            // 2 Players total -> 1 Opponent
            posStyle = { top: '2rem', left: '50%', transform: 'translateX(-50%)' };
            baseRotation = 180;
          } else if (totalOpps === 2) {
            // 3 Players total
            if (index === 0) { posStyle = { top: '50%', left: '2rem', transform: 'translateY(-50%)' }; baseRotation = 90; }
            if (index === 1) { posStyle = { top: '50%', right: '2rem', transform: 'translateY(-50%)' }; baseRotation = -90; }
          } else if (totalOpps === 3) {
            // 4 Players total
            if (index === 0) { posStyle = { top: '50%', left: '2rem', transform: 'translateY(-50%)' }; baseRotation = 90; }
            if (index === 1) { posStyle = { top: '2rem', left: '50%', transform: 'translateX(-50%)' }; baseRotation = 180; }
            if (index === 2) { posStyle = { top: '50%', right: '2rem', transform: 'translateY(-50%)' }; baseRotation = -90; }
          } else if (totalOpps === 4) {
            // 5 Players total
            if (index === 0) { posStyle = { top: '50%', left: '2rem', transform: 'translateY(-50%)' }; baseRotation = 90; }
            if (index === 1) { posStyle = { top: '2rem', left: '15rem' }; baseRotation = 135; }
            if (index === 2) { posStyle = { top: '2rem', right: '15rem' }; baseRotation = -135; }
            if (index === 3) { posStyle = { top: '50%', right: '2rem', transform: 'translateY(-50%)' }; baseRotation = -90; }
          } else if (totalOpps === 5) {
            // 6 Players total
            if (index === 0) { posStyle = { bottom: '15rem', left: '2rem' }; baseRotation = 45; }
            if (index === 1) { posStyle = { top: '2rem', left: '15rem' }; baseRotation = 135; }
            if (index === 2) { posStyle = { top: '2rem', left: '50%', transform: 'translateX(-50%)' }; baseRotation = 180; }
            if (index === 3) { posStyle = { top: '2rem', right: '15rem' }; baseRotation = -135; }
            if (index === 4) { posStyle = { bottom: '15rem', right: '2rem' }; baseRotation = -45; }
          }

          // Fan out opponent's cards horizontally
          const oppFanRadius = 200;
          const oppCardSpacing = 8;
          const oppTotalAngle = (player.cardCount - 1) * oppCardSpacing;
          const oppStartAngle = -oppTotalAngle / 2;

          return (
            <div key={player.socketId} style={{ position: 'absolute', ...posStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: player.isConnected ? 1 : 0.5, zIndex: 5 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', zIndex: 10 }}>
                {/* Avatar */}
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#e2e8f0', overflow: 'hidden', border: isTurn ? '3px solid #22c55e' : '3px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '-10px', zIndex: 11 }}>
                  <img src={`/assets/${player.profilePic || 'profile1.png'}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Name Pill */}
                <div style={{ background: isTurn ? '#22c55e' : '#3b82f6', padding: '0.2rem 1rem', borderRadius: '1rem', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '2px solid #1e293b', zIndex: 12 }}>
                  {player.nickname}
                </div>
              </div>
              
              <div style={{ position: 'relative', width: '0px', height: '0px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: 'absolute', transform: `rotate(${baseRotation}deg)`, display: 'flex', justifyContent: 'center', top: '10px' }}>
                  <div style={{ position: 'relative', width: `${40 + (player.cardCount * 10)}px`, height: '80px', display: 'flex', justifyContent: 'center' }}>
                    {Array.from({ length: Math.min(player.cardCount, 15) }).map((_, i) => {
                      const angle = oppStartAngle + (i * oppCardSpacing);
                      const yOff = oppFanRadius - Math.sqrt(Math.pow(oppFanRadius, 2) - Math.pow((i - player.cardCount / 2) * 10, 2));
                      return (
                        <div key={i} style={{ position: 'absolute', transformOrigin: 'bottom center', transform: `translateX(${(i - player.cardCount / 2) * 10}px) translateY(${isNaN(yOff) ? 0 : Math.min(yOff, 20)}px) rotate(${angle}deg)` }}>
                          <div style={{ width: '40px', height: '60px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', borderRadius: '6px', overflow: 'hidden' }}>
                            <Card card={{ id: 'back', color: 'black', type: 'number', value: '' }} isFaceDown />
                          </div>
                        </div>
                      );
                    })}
                    {player.cardCount > 15 && <div style={{ position: 'absolute', right: -30, top: 20, color: 'white', fontWeight: 'bold', textShadow: '1px 1px 2px black' }}>+{player.cardCount - 15}</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EXACT MIDDLE - Discard Pile */}
      <div 
        style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '150px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: isHoveringDropZone ? '4px dashed #a855f7' : '4px dashed transparent',
          borderRadius: '1rem', transition: 'border 0.2s', zIndex: 5
        }}
        onDragOver={(e) => { e.preventDefault(); setIsHoveringDropZone(true); }}
        onDragLeave={() => setIsHoveringDropZone(false)}
        onDrop={handleDrop}
      >
        {gameState.room.discardPileTop ? (
          <div style={{ position: 'relative', pointerEvents: 'none' }}>
            <Card card={gameState.room.discardPileTop} />
            {gameState.room.currentColor && gameState.room.discardPileTop.color === 'black' && (
              <div style={{ position: 'absolute', top: -15, right: -15, width: 30, height: 30, borderRadius: '50%', background: `var(--${gameState.room.currentColor})`, border: '3px solid white', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
            )}
          </div>
        ) : (
          <div style={{ width: '100px', height: '150px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>Play Here</div>
        )}
      </div>

      {/* Bottom Right - Last Card Button */}
      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
        <button 
          onClick={handleLastCardClick}
          style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', fontWeight: 900, fontSize: '1.5rem', border: '6px solid white', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', animation: (iHaveOneCard && !myPlayer?.hasCalledLastCard) ? 'pulse 1s infinite' : 'none' }}
        >
          LAST<br/>CARD!
        </button>
      </div>

      {/* Bottom - Player Hand (Fan Shape) & My Avatar */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        {/* My Avatar */}
        <div style={{ width: '70px', height: '70px', borderRadius: '16px', background: '#e2e8f0', overflow: 'hidden', border: isMyTurn() ? '4px solid #22c55e' : '4px solid #3b82f6', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', marginBottom: '-15px', zIndex: 11 }}>
          <img src={`/assets/${myPlayer?.profilePic || 'profile1.png'}`} alt="My Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* My Name Pill */}
        <div style={{ background: isMyTurn() ? '#22c55e' : '#3b82f6', padding: '0.4rem 1.5rem', borderRadius: '1.5rem', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', border: '3px solid #1e293b', zIndex: 12 }}>
          {myPlayer?.nickname || 'Me'}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '250px', width: '100%', zIndex: 10 }}>
        {gameState.hand.map((card, index) => {
          const angle = startAngle + (index * cardSpacingAngle);
          // Calculate Y offset based on a circular path so cards array forms an arc
          const yOffset = fanRadius - Math.sqrt(Math.pow(fanRadius, 2) - Math.pow(index * 30 - (gameState.hand.length * 15), 2));
          
          return (
            <div 
              key={card.id} 
              style={{ 
                position: 'absolute',
                transformOrigin: 'bottom center',
                transform: `translateX(${(index - gameState.hand.length / 2) * 40}px) translateY(${isNaN(yOffset) ? 0 : Math.min(yOffset, 100)}px) rotate(${angle}deg)`,
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                zIndex: index
              }} 
              onMouseOver={(e) => { 
                e.currentTarget.style.zIndex = '100'; 
                e.currentTarget.style.transform = `translateX(${(index - gameState.hand.length / 2) * 40}px) translateY(-50px) rotate(0deg) scale(1.1)`;
              }} 
              onMouseOut={(e) => { 
                e.currentTarget.style.zIndex = String(index);
                e.currentTarget.style.transform = `translateX(${(index - gameState.hand.length / 2) * 40}px) translateY(${isNaN(yOffset) ? 0 : Math.min(yOffset, 100)}px) rotate(${angle}deg)`;
              }}
            >
              <Card 
                card={card} 
                playable={isCardPlayable(card)} 
                onClick={() => handlePlayCard(card)} 
              />
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <div style={{ position: 'absolute', left: '1rem', bottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', pointerEvents: 'none', zIndex: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#cbd5e1', fontSize: '1rem', animation: 'fadeIn 0.3s', fontWeight: 'bold' }}>
            {msg}
          </div>
        ))}
      </div>

      {/* Drawn Card Popup */}
      {drawnCardPopup && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2rem' }}>You Drawn a Card!</h2>
            <div style={{ transform: 'scale(1.5)', marginBottom: '1rem' }}>
              <Card card={drawnCardPopup} />
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
              <button onClick={handleKeepCard} className="btn-primary" style={{ flex: 1, background: 'transparent', border: '2px solid white' }}>
                Keep
              </button>
              <button 
                onClick={() => handlePlayCard(drawnCardPopup)} 
                className="btn-primary" 
                style={{ flex: 1, opacity: isCardPlayable(drawnCardPopup) ? 1 : 0.5, cursor: isCardPlayable(drawnCardPopup) ? 'pointer' : 'not-allowed' }}
                disabled={!isCardPlayable(drawnCardPopup)}
              >
                Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Choose Color</h2>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['red', 'blue', 'green', 'yellow'].map(color => (
                <button 
                  key={color} 
                  onClick={() => handleColorPick(color)}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', background: `var(--${color})`, border: '4px solid white', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GamePage;
