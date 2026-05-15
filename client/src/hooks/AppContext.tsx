import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface AppContextType {
  nickname: string;
  setNickname: (name: string) => void;
  profilePic: string;
  setProfilePic: (pic: string) => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  playerId: string;
}

const AppContext = createContext<AppContextType>({
  nickname: '',
  setNickname: () => {},
  profilePic: 'profile1.png',
  setProfilePic: () => {},
  musicEnabled: true,
  setMusicEnabled: () => {},
  playerId: '',
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerId] = useState(() => {
    let id = localStorage.getItem('lc_playerId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('lc_playerId', id);
    }
    return id;
  });
  const [nickname, setNickname] = useState(localStorage.getItem('lc_nickname') || '');
  const [profilePic, setProfilePic] = useState(localStorage.getItem('lc_profilePic') || 'profile1.png');
  const [musicEnabled, setMusicEnabled] = useState(localStorage.getItem('lc_music') !== 'false');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('lc_nickname', nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('lc_profilePic', profilePic);
  }, [profilePic]);

  useEffect(() => {
    localStorage.setItem('lc_music', String(musicEnabled));
    if (musicEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/assets/bgmusic.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
      }
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [musicEnabled]);

  // Try to play audio on first user interaction if enabled
  useEffect(() => {
    const handleInteraction = () => {
      if (musicEnabled && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log(e));
      }
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, [musicEnabled]);

  return (
    <AppContext.Provider value={{ nickname, setNickname, profilePic, setProfilePic, musicEnabled, setMusicEnabled, playerId }}>
      {children}
    </AppContext.Provider>
  );
};
