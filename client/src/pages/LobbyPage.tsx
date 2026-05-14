import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/SocketContext';
import { Users, Copy, Check, Play } from 'lucide-react';
import { ClientPlayer } from '../../../server/src/game/types'; // We'll redefine this locally later, for now we can just use any or redefine

interface LobbyPlayer {
  socketId: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
}

const LobbyPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [copied, setCopied] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) {
      navigate('/');
      return;
    }

    const handleLobbyUpdate = (updatedPlayers: LobbyPlayer[]) => {
      setPlayers(updatedPlayers);
    };

    const handleGameStarted = () => {
      navigate(`/game/${roomCode}`);
    };

    socket.on('lobbyUpdated', handleLobbyUpdate);
    socket.on('gameStarted', handleGameStarted);

    return () => {
      socket.off('lobbyUpdated', handleLobbyUpdate);
      socket.off('gameStarted', handleGameStarted);
    };
  }, [socket, navigate, roomCode]);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    if (socket && roomCode) {
      socket.emit('startGame', { roomCode });
    }
  };

  const isHost = players.find(p => p.socketId === socket?.id)?.isHost || false;
  const canStart = isHost && players.length >= 2;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Lobby</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Room Code:</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '4px', color: 'white' }}>{roomCode}</span>
            <button 
              onClick={handleCopyCode} 
              style={{ background: 'transparent', border: 'none', color: copied ? '#22c55e' : '#cbd5e1', cursor: 'pointer', padding: '0.5rem' }}
              title="Copy Code"
            >
              {copied ? <Check size={24} /> : <Copy size={24} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#cbd5e1' }}>
            <Users size={20} />
            <h3 style={{ fontSize: '1.2rem' }}>Players ({players.length})</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map(player => (
              <div key={player.socketId} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem', 
                background: player.socketId === socket?.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                border: player.socketId === socket?.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: player.isConnected ? '#22c55e' : '#ef4444',
                    boxShadow: player.isConnected ? '0 0 10px #22c55e' : 'none'
                  }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: player.socketId === socket?.id ? 'bold' : 'normal', color: player.isConnected ? 'white' : '#64748b' }}>
                    {player.nickname} {player.socketId === socket?.id && '(You)'}
                  </span>
                </div>
                {player.isHost && (
                  <span style={{ fontSize: '0.8rem', background: '#f59e0b', color: 'black', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                    HOST
                  </span>
                )}
              </div>
            ))}
            
            {players.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Waiting for players...
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')} 
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--card-border)' }}
          >
            Leave
          </button>
          
          {isHost && (
            <button 
              className="btn-primary" 
              onClick={handleStartGame} 
              disabled={!canStart}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: canStart ? 1 : 0.5 }}
            >
              <Play size={20} />
              Start Game
            </button>
          )}
          
          {!isHost && (
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', color: '#94a3b8' }}>
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
