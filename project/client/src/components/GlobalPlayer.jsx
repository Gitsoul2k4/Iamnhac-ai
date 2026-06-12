import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, SkipBack, SkipForward, ListPlus, Plus, Music, Volume2 } from 'lucide-react';
import axios from 'axios';

const GlobalPlayer = () => {
  const { currentSong, isPlaying, togglePlay, handleNext, handlePrev, audioRef } = useMusic();
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  // --- LOGIC 1: TỰ ĐỘNG TĂNG LƯỢT NGHE ---
  useEffect(() => {
    if (currentSong && isPlaying) {
      const incrementPlayCount = async () => {
        try {
          await axios.put(`http://localhost:5000/api/songs/${currentSong._id}/play`);
        } catch (err) {
          console.error("Không thể cập nhật lượt nghe:", err);
        }
      };
      incrementPlayCount();
    }
  }, [currentSong?._id]); // Chỉ chạy lại khi đổi ID bài hát

  // --- LOGIC 2: QUẢN LÝ MENU PLAYLIST ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPlaylists = async () => {
    if (!user) return alert("Vui lòng đăng nhập để dùng tính năng này!");
    try {
      const res = await axios.get(`http://localhost:5000/api/playlists/user/${user._id || user.id}`);
      setUserPlaylists(res.data);
      setShowMenu(!showMenu);
    } catch (err) { console.error(err); }
  };

  const handleAddToExisting = async (playlistId) => {
    try {
      await axios.put(`http://localhost:5000/api/playlists/${playlistId}/add`, { songId: currentSong._id });
      alert("Đã thêm vào playlist!");
      setShowMenu(false);
    } catch (err) { alert("Bài hát đã có trong playlist này."); }
  };

  // --- LOGIC 3: ĐIỀU KHIỂN AUDIO ---
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

  if (!currentSong) return null;

  return (
    <div style={playerContainer}>
      {/* Thông tin bài hát */}
      <div style={infoSection}>
        <img src={`http://localhost:5000${currentSong.imageUrl}`} style={playerImg} alt="" />
        <div style={{ overflow: 'hidden' }}>
          <div style={songTitle}>{currentSong.title}</div>
          <div style={songArtist}>{currentSong.artist}</div>
        </div>
      </div>

      {/* Bộ điều khiển chính */}
      <div style={controlsSection}>
        <div style={buttonGroup}>
          <SkipBack size={22} style={iconBtn} onClick={handlePrev} />
          <button onClick={togglePlay} style={mainPlayBtn}>
            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" style={{marginLeft:4}} />}
          </button>
          <SkipForward size={22} style={iconBtn} onClick={handleNext} />
        </div>
        <div style={progressBarContainer}>
          <span style={timeText}>{formatTime(audioRef.current?.currentTime)}</span>
          <input type="range" value={progress} onChange={handleSeek} style={sliderStyle} />
          <span style={timeText}>{formatTime(audioRef.current?.duration)}</span>
        </div>
      </div>

      {/* Menu thêm vào playlist */}
      <div style={extraSection} ref={menuRef}>
        <button onClick={fetchPlaylists} style={addPlaylistBtn}>
          <ListPlus size={18} />
          <span style={{fontSize: '13px'}}>Thêm vào Playlist</span>
        </button>

        {showMenu && (
          <div style={dropdownMenu}>
            <div style={menuHeader}>Lưu vào playlist của bạn</div>
            <div style={scrollArea}>
              {userPlaylists.map(pl => (
                <div key={pl._id} style={menuItem} onClick={() => handleAddToExisting(pl._id)}>
                  <Music size={14} /> <span>{pl.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <audio 
        ref={audioRef} 
        src={`http://localhost:5000${currentSong.songUrl}`} 
        onTimeUpdate={onTimeUpdate}
        onEnded={handleNext}
      />
    </div>
  );
};

/* --- STYLES --- */
const playerContainer = { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#181818', color: '#fff', padding: '15px 40px', display: 'flex', alignItems: 'center', zIndex: 10000, borderTop: '1px solid #282828' };
const infoSection = { width: '30%', display: 'flex', alignItems: 'center', gap: '15px' };
const playerImg = { width: '56px', height: '56px', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' };
const songTitle = { fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const songArtist = { fontSize: '12px', color: '#b3b3b3' };
const controlsSection = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' };
const buttonGroup = { display: 'flex', alignItems: 'center', gap: '25px' };
const iconBtn = { cursor: 'pointer', color: '#b3b3b3' };
const mainPlayBtn = { background: '#fff', color: '#000', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const progressBarContainer = { display: 'flex', alignItems: 'center', width: '100%', maxWidth: '500px', gap: '10px' };
const sliderStyle = { flex: 1, accentColor: '#1db954', cursor: 'pointer', height: '4px' };
const timeText = { fontSize: '11px', color: '#a7a7a7', minWidth: '35px' };
const extraSection = { width: '30%', display: 'flex', justifyContent: 'flex-end', position: 'relative' };
const addPlaylistBtn = { background: 'transparent', color: '#b3b3b3', border: '1px solid #404040', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const dropdownMenu = { position: 'absolute', bottom: '60px', right: 0, width: '220px', background: '#282828', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '5px 0' };
const menuHeader = { padding: '10px 15px', fontSize: '12px', color: '#b3b3b3', borderBottom: '1px solid #3e3e3e' };
const scrollArea = { maxHeight: '180px', overflowY: 'auto' };
const menuItem = { padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', hover: { background: '#3e3e3e' } };

export default GlobalPlayer;