import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from 'lucide-react';

const GlobalPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, audioRef, togglePlay, handleNext, handlePrev } = useMusic();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // === ÂM LƯỢNG (mới) ===
  const [volume, setVolume] = useState(1);       // 0 -> 1
  const [muted, setMuted] = useState(false);

  // === CHẤT LƯỢNG ÂM THANH (mới) ===
  // 'high' = file gốc (songUrl), 'low' = bản 96kbps (songUrlLow, nếu có)
  const [quality, setQuality] = useState('high');
  const pendingResumeRef = useRef(null); // giữ lại vị trí đang phát khi đổi chất lượng, để không bị tua về 0

  // Đồng bộ trạng thái khi đổi bài hoặc play/pause
  useEffect(() => {
    if (currentSong && audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  // Áp dụng âm lượng mỗi khi thay đổi (hoặc khi đổi bài, vì thẻ <audio> vẫn giữ nguyên qua các lần đổi src)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted, currentSong]);

  // Đổi bài hát mới -> luôn quay lại chất lượng mặc định "Cao" để tránh nhầm lẫn
  useEffect(() => {
    setQuality('high');
  }, [currentSong?._id]);

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

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value) / 100;
    setVolume(v);
    if (v > 0 && muted) setMuted(false);
  };

  const toggleMute = () => setMuted((m) => !m);

  const handleQualityChange = (nextQuality) => {
    if (nextQuality === quality) return;
    // Ghi lại vị trí hiện tại để phục hồi sau khi nguồn phát đổi (đổi src sẽ tua về 0 mặc định)
    pendingResumeRef.current = audioRef.current?.currentTime || 0;
    setQuality(nextQuality);
  };

  const handleLoadedMetadata = () => {
    if (pendingResumeRef.current !== null) {
      audioRef.current.currentTime = pendingResumeRef.current;
      pendingResumeRef.current = null;
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  };

  const handleThumbClick = () => {
    if (currentSong.userId) {
      navigate(`/profile/${currentSong.userId}`);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeSrc = (quality === 'low' && currentSong.songUrlLow)
    ? `http://localhost:5000${currentSong.songUrlLow}`
    : `http://localhost:5000${currentSong.songUrl}`;

  const VolumeIcon = muted || volume === 0 ? VolumeX : (volume < 0.5 ? Volume1 : Volume2);

  return (
    <div style={playerContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '260px' }}>
        <img
          src={`http://localhost:5000${currentSong.imageUrl}`}
          style={{ ...playerImg, cursor: currentSong.userId ? 'pointer' : 'default' }}
          alt=""
          title={currentSong.userId ? 'Xem trang cá nhân người đăng' : undefined}
          onClick={handleThumbClick}
        />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentSong.title}</div>
          <div style={{ fontSize: '13px', color: '#b3b3b3' }}>{currentSong.artist}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <SkipBack size={24} style={{ cursor: 'pointer' }} onClick={handlePrev} title="Bài trước" />
          <button onClick={togglePlay} style={mainPlayBtn}>
            {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" style={{marginLeft: '4px'}} />}
          </button>
          <SkipForward size={24} style={{ cursor: 'pointer' }} onClick={handleNext} title="Bài tiếp theo" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px', gap: '12px' }}>
          <span style={timeText}>{formatTime(audioRef.current?.currentTime)}</span>
          <input type="range" min="0" max="100" value={progress} onChange={handleSeek} style={progressSlider} />
          <span style={timeText}>{formatTime(audioRef.current?.duration)}</span>
        </div>
      </div>

      <div style={{ width: '260px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '18px' }}>
        {/* === CHẤT LƯỢNG ÂM THANH (mới) === */}
        <div style={qualityGroup} title="Chất lượng âm thanh">
          <button
            onClick={() => handleQualityChange('high')}
            style={quality === 'high' ? qualityBtnActive : qualityBtn}
          >
            Cao
          </button>
          <button
            onClick={() => handleQualityChange('low')}
            style={quality === 'low' ? qualityBtnActive : qualityBtn}
            disabled={!currentSong.songUrlLow}
            title={!currentSong.songUrlLow ? 'Bài hát này chưa có bản chất lượng thấp' : 'Tiết kiệm dữ liệu'}
          >
            Thấp
          </button>
        </div>

        {/* === ÂM LƯỢNG (mới) === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px' }}>
          <VolumeIcon size={20} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={toggleMute} />
          <input
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : Math.round(volume * 100)}
            onChange={handleVolumeChange}
            style={volumeSlider}
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={activeSrc}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

/* Styles */
const playerContainer = { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', borderTop: '1px solid #222', padding: '15px 40px', display: 'flex', alignItems: 'center', zIndex: 9999, boxShadow: '0 -5px 20px rgba(0,0,0,0.4)', color: '#fff' };
const playerImg = { width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover' };
const mainPlayBtn = { background: '#1db954', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const progressSlider = { flex: 1, appearance: 'none', height: '5px', background: '#4d4d4d', borderRadius: '5px', outline: 'none', cursor: 'pointer', accentColor: '#1db954' };
const timeText = { fontSize: '11px', color: '#b3b3b3', width: '35px' };
const volumeSlider = { flex: 1, appearance: 'none', height: '4px', background: '#4d4d4d', borderRadius: '5px', outline: 'none', cursor: 'pointer', accentColor: '#1db954' };
const qualityGroup = { display: 'flex', gap: '4px', background: '#1a1a1a', borderRadius: '14px', padding: '3px' };
const qualityBtn = { border: 'none', background: 'transparent', color: '#b3b3b3', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '11px', cursor: 'pointer' };
const qualityBtnActive = { ...qualityBtn, background: '#1db954', color: '#fff' };

export default GlobalPlayer;
