import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/SocketContext';
import { useApp } from '../hooks/AppContext';

const JoinRoomPage: React.FC = () => {
  const { nickname, setNickname, profilePic } = useApp();
  const [localNickname, setLocalNickname] = useState(nickname);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data: { roomCode: string }) => {
      navigate(`/game/${data.roomCode}`);
    };

    const handleErrorMessage = (msg: string) => {
      setError(msg);
    };

    socket.on('roomJoined', handleRoomJoined);
    socket.on('errorMessage', handleErrorMessage);

    return () => {
      socket.off('roomJoined', handleRoomJoined);
      socket.off('errorMessage', handleErrorMessage);
    };
  }, [socket, navigate]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!localNickname.trim() || !roomCode.trim()) return;
    setNickname(localNickname); // Save globally
    if (socket && isConnected) {
      socket.emit('joinRoom', { nickname: localNickname, profilePic, roomCode: roomCode.toUpperCase() });
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>Join Room</h2>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Room Code</label>
            <input 
              type="text" 
              className="input-field" 
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
              placeholder="e.g. AB12C" 
              maxLength={5}
              required 
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={!isConnected || !localNickname.trim() || !roomCode.trim()}>
            Join Lobby
          </button>
          
          <button type="button" className="btn-primary" onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid var(--card-border)', marginTop: '0.5rem' }}>
            Back to Home
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomPage;
