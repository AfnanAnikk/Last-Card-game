import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface AppContextType {
  nickname: string;
  setNickname: (name: string) => void;
  profilePic: string;
  setProfilePic: (pic: string) => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  nickname: '',
  setNickname: () => {},
  profilePic: 'profile1.png',
  setProfilePic: () => {},
  musicEnabled: true,
  setMusicEnabled: () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        audioRef.current = new Audio('/src/assets/bgmusic.mp3');
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
    <AppContext.Provider value={{ nickname, setNickname, profilePic, setProfilePic, musicEnabled, setMusicEnabled }}>
      {children}
    </AppContext.Provider>
  );
};
