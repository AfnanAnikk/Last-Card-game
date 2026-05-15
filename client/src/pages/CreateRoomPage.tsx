import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/SocketContext';
import { useApp } from '../hooks/AppContext';

const CreateRoomPage: React.FC = () => {
  const { nickname, setNickname, profilePic, playerId } = useApp();
  const [localNickname, setLocalNickname] = useState(nickname);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playWithStack, setPlayWithStack] = useState(true);
  const [playWithPlus6Plus10, setPlayWithPlus6Plus10] = useState(false);
  const [playWith07Swap, setPlayWith07Swap] = useState(false);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (data: { roomCode: string }) => {
      navigate(`/game/${data.roomCode}`);
    };

    socket.on('roomCreated', handleRoomCreated);
    return () => {
      socket.off('roomCreated', handleRoomCreated);
    };
  }, [socket, navigate]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNickname.trim()) return;
    setNickname(localNickname); // Save globally
    if (socket && isConnected) {
      socket.emit('createRoom', { 
        nickname: localNickname, 
        profilePic, 
        playerId,
        maxPlayers,
        settings: { playWithStack, playWithPlus6Plus10, playWith07Swap }
      });
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>Create Room</h2>
        
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Nickname</label>
            <input 
              type="text" 
              className="input-field" 
              value={localNickname} 
              onChange={(e) => setLocalNickname(e.target.value)} 
              placeholder="Enter your name" 
              maxLength={15}
              required 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Max Players</label>
            <select 
              className="input-field" 
              value={maxPlayers} 
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num} style={{ color: 'black' }}>{num} Players</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontWeight: 'bold' }}>House Rules</h3>
            <label style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={playWithStack} onChange={(e) => setPlayWithStack(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'orangered' }} />
              Play with Stack (Discard All)
            </label>
            <label style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" color="black" checked={playWithPlus6Plus10} onChange={(e) => setPlayWithPlus6Plus10(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'orangered' }} />
              Include +6 and +10 Cards
            </label>
            <label style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={playWith07Swap} onChange={(e) => setPlayWith07Swap(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'orangered' }} />
              Play with 0-7 Swap
            </label>
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }} disabled={!isConnected || !localNickname.trim()}>
            Create & Join Lobby
          </button>
          
          <button type="button" className="btn-primary" onClick={() => navigate('/')} style={{border: '1px solid var(--card-border)', marginTop: '0.5rem' }}>
            Back to Home
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomPage;
