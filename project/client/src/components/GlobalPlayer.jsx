import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const GlobalPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, audioRef, togglePlay, handleNext, handlePrev } = useMusic();
  const [progress, setProgress] = useState(0);

  // Đồng bộ trạng thái khi đổi bài hoặc play/pause
  useEffect(() => {
    if (currentSong && audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  if (!currentSong) return null;

  const onTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    setProgress((current / total) * 100 || 0);
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = seekTime;
    setProgress(e.target.value);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={playerContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '300px' }}>
        <img src={`http://localhost:5000${currentSong.imageUrl}`} style={playerImg} alt="" />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentSong.title}</div>
          <div style={{ fontSize: '13px', color: '#888' }}>{currentSong.artist}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <SkipBack size={24} style={{ cursor: 'pointer' }} onClick={handlePrev} />
          <button onClick={togglePlay} style={mainPlayBtn}>
            {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" style={{marginLeft: '4px'}} />}
          </button>
          <SkipForward size={24} style={{ cursor: 'pointer' }} onClick={handleNext} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px', gap: '12px' }}>
          <span style={timeText}>{formatTime(audioRef.current?.currentTime)}</span>
          <input type="range" min="0" max="100" value={progress} onChange={handleSeek} style={progressSlider} />
          <span style={timeText}>{formatTime(audioRef.current?.duration)}</span>
        </div>
      </div>

      <div style={{ width: '300px' }}></div>

      <audio 
        ref={audioRef} 
        src={`http://localhost:5000${currentSong.songUrl}`} 
        onTimeUpdate={onTimeUpdate}
        onEnded={handleNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

/* Styles */
const playerContainer = { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: '15px 60px', display: 'flex', alignItems: 'center', zIndex: 9999, boxShadow: '0 -5px 20px rgba(0,0,0,0.05)' };
const playerImg = { width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover' };
const mainPlayBtn = { background: '#1db954', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const progressSlider = { flex: 1, appearance: 'none', height: '5px', background: '#000', borderRadius: '5px', outline: 'none', cursor: 'pointer', accentColor: '#1db954' };
const timeText = { fontSize: '11px', color: '#666', width: '35px' };

export default GlobalPlayer;