import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMusic } from '../../context/MusicContext'; // Import context
import { Heart, ListPlus, Play, Music, CheckCircle2, Circle, X } from 'lucide-react';

const Home = () => {
  const [songs, setSongs] = useState([]);
  
  // Lấy các hàm điều khiển nhạc từ Context
  const { playMusic, currentSong } = useMusic();
  
  // --- States cho chức năng tạo Playlist (Giữ nguyên của bạn) ---
  const [isSelecting, setIsSelecting] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState([]);

  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/songs');
      setSongs(res.data);
    } catch (err) { console.error("Lỗi tải nhạc:", err); }
  };

  const handleLike = async (songId) => {
    if (!loggedInUser) return alert("Vui lòng đăng nhập!");
    try {
      const res = await axios.post(`http://localhost:5000/api/songs/like/${songId}`, {
        userId: loggedInUser._id || loggedInUser.id
      });
      setSongs(songs.map(s => s._id === songId ? res.data : s));
    } catch (err) { console.error(err); }
  };

  const handleStartCreatePlaylist = () => {
    if (!loggedInUser) return alert("Vui lòng đăng nhập!");
    const title = prompt("Nhập tên cho Playlist mới tại IAMNHAC:");
    if (!title) return;
    setNewPlaylistTitle(title);
    setIsSelecting(true);
    setSelectedSongIds([]);
  };

  const toggleSongSelection = (songId) => {
    if (selectedSongIds.includes(songId)) {
      setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
    } else {
      setSelectedSongIds([...selectedSongIds, songId]);
    }
  };

  const handleSavePlaylist = async () => {
    if (selectedSongIds.length === 0) {
      if (!window.confirm("Bạn chưa chọn bài hát nào. Vẫn muốn tạo playlist trống?")) return;
    }
    try {
      await axios.post('http://localhost:5000/api/songs/playlists', {
        title: newPlaylistTitle,
        userId: loggedInUser._id || loggedInUser.id,
        songIds: selectedSongIds
      });
      alert(`Thành công! IAMNHAC đã tạo playlist "${newPlaylistTitle}"`);
      setIsSelecting(false);
      setSelectedSongIds([]);
    } catch (err) { alert("Lỗi khi lưu Playlist."); }
  };

  // HÀM QUAN TRỌNG: Gọi bộ phát nhạc toàn cục
  const handlePlaySong = (index) => {
    if (isSelecting) {
      toggleSongSelection(songs[index]._id);
    } else {
      playMusic(songs, index); // Gửi danh sách nhạc và bài đang chọn vào Context
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif', paddingBottom: '120px' }}>
      
      {/* SELECTION BAR (Khi đang tạo playlist) */}
      {isSelecting && (
        <div style={selectionBarStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Đang chọn nhạc cho: <b style={{ color: '#1db954' }}>{newPlaylistTitle}</b></span>
            <span style={countBadge}>{selectedSongIds.length} bài đã chọn</span>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={handleSavePlaylist} style={btnSave}>HOÀN TẤT</button>
            <button onClick={() => setIsSelecting(false)} style={btnCancel}><X size={20} /></button>
          </div>
        </div>
      )}

      {/* HEADER */}
      {!isSelecting && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#1db954', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Music size={36} /> IAMNHAC
          </h1>
          <button onClick={handleStartCreatePlaylist} style={btnPrimary}>
            <ListPlus size={18} color="black" strokeWidth={3} /> TẠO PLAYLIST
          </button>
        </div>
      )}

      {/* GRID NHẠC */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px', marginTop: isSelecting ? '100px' : '0' }}>
        {songs.map((song, index) => {
          const isSelected = selectedSongIds.includes(song._id);
          const isCurrentPlaying = currentSong?._id === song._id;
          
          return (
            <div 
              key={song._id} 
              style={{
                ...songCard, 
                border: isSelected ? '3px solid #1db954' : (isCurrentPlaying ? '3px solid #1db954' : '3px solid transparent'),
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
              onClick={() => handlePlaySong(index)}
            >
              <div style={{ position: 'relative' }}>
                <img src={`http://localhost:5000${song.imageUrl}`} alt={song.title} style={imgStyle} />
                {isSelecting ? (
                   <div style={checkIconContainer}>
                     {isSelected ? <CheckCircle2 color="#1db954" fill="white" size={32}/> : <Circle color="#ccc" size={32}/>}
                   </div>
                ) : (
                  <button style={playOverlayBtn}>
                    <Play fill="white" size={20} />
                  </button>
                )}
              </div>
              <h3 style={{ margin: '15px 0 5px 0', fontSize: '17px', fontWeight: 'bold' }}>{song.title}</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 12px 0' }}>{song.artist}</p>
              
              {!isSelecting && (
                <button onClick={(e) => { e.stopPropagation(); handleLike(song._id); }} style={likeBtnStyle}>
                    <Heart size={20} fill={song.likes?.includes(loggedInUser?._id) ? "red" : "none"} color={song.likes?.includes(loggedInUser?._id) ? "red" : "#666"} />
                    <span style={{ fontWeight: 'bold' }}>{song.likes?.length || 0}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- STYLES (GIỮ NGUYÊN) --- */
const selectionBarStyle = { position: 'fixed', top: 0, left: 0, right: 0, height: '80px', backgroundColor: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', zIndex: 2000, borderBottom: '2px solid #1db954' };
const countBadge = { background: '#333', padding: '5px 15px', borderRadius: '15px', fontSize: '14px', border: '1px solid #1db954' };
const btnSave = { background: '#1db954', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { background: '#f44336', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnPrimary = { background: '#ffffff', color: '#000000', border: '2px solid #000', padding: '12px 24px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const songCard = { background: '#fff', padding: '18px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer' };
const imgStyle = { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px' };
const playOverlayBtn = { position: 'absolute', bottom: '12px', right: '12px', background: '#1db954', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const checkIconContainer = { position: 'absolute', top: '12px', right: '12px' };
const likeBtnStyle = { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#666' };

export default Home;