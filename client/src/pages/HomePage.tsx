import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../hooks/AppContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { nickname, setNickname, profilePic, setProfilePic, musicEnabled, setMusicEnabled } = useApp();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempName, setTempName] = useState(nickname);

  const handleSaveProfile = () => {
    setNickname(tempName);
    setIsEditingProfile(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Top Left - Profile */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'white', borderRadius: '2rem', padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: 'pointer' }} onClick={() => setIsEditingProfile(true)}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', border: '2px solid #3b82f6' }}>
          <img src={`/src/assets/${profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' }} />
        </div>
        <div style={{ paddingRight: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{nickname || 'Guest'}</div>
          <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>Lv. 1</div>
        </div>
      </div>

      {/* Bottom Left - Settings */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setShowSettings(true)}>
        <div style={{ width: '60px', height: '60px', background: 'linear-gradient(to bottom, #fde047, #f59e0b)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          <Settings size={32} color="#1e293b" />
        </div>
        <span style={{ fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>SETTINGS</span>
      </div>

      {/* Center - Cards */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '2rem' }}>
        
        {/* Create Room Card */}
        <div 
          onClick={() => navigate('/create')}
          style={{
            width: '240px', height: '360px', background: 'white', borderRadius: '1rem', padding: '0.5rem',
            cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            transform: 'rotate(-5deg) translateY(0)', position: 'relative'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'rotate(-5deg) translateY(-20px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'rotate(-5deg) translateY(0)'}
        >
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '4px solid #1e293b', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontSize: '4rem', fontWeight: 900, color: 'white', textShadow: '3px 3px 0 #1e293b', transform: 'rotate(-15deg)' }}>CREATE</span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'white', textShadow: '2px 2px 0 #1e293b', transform: 'rotate(-15deg)', marginTop: '-10px' }}>ROOM</span>
          </div>
        </div>

        {/* Join Room Card */}
        <div 
          onClick={() => navigate('/join')}
          style={{
            width: '240px', height: '360px', background: 'white', borderRadius: '1rem', padding: '0.5rem',
            cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            transform: 'rotate(5deg) translateY(0)', position: 'relative'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'rotate(5deg) translateY(-20px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'rotate(5deg) translateY(0)'}
        >
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #22c55e 0%, #166534 100%)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '4px solid #1e293b', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontSize: '4rem', fontWeight: 900, color: 'white', textShadow: '3px 3px 0 #1e293b', transform: 'rotate(-15deg)' }}>JOIN</span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'white', textShadow: '2px 2px 0 #1e293b', transform: 'rotate(-15deg)', marginTop: '-10px' }}>ROOM</span>
          </div>
        </div>

      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="text-gradient" style={{ textAlign: 'center' }}>Edit Profile</h2>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nickname</label>
              <input type="text" className="input-field" value={tempName} onChange={e => setTempName(e.target.value)} maxLength={15} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Avatar</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {Array.from({ length: 10 }, (_, i) => `profile${i + 1}.png`).map(pic => (
                  <div 
                    key={pic} 
                    onClick={() => setProfilePic(pic)}
                    style={{ 
                      width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer',
                      border: profilePic === pic ? '3px solid var(--primary)' : '2px solid transparent',
                      background: '#334155', overflow: 'hidden'
                    }}
                  >
                    <img src={`/src/assets/${pic}`} alt={pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1, background: 'transparent', border: '1px solid gray' }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile}>Save</button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
};

export default HomePage;
