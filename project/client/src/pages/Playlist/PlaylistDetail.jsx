import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, Trash2, Music, ArrowLeft, Clock, User } from 'lucide-react';
import { useMusic } from '../../context/MusicContext'; // Giả định bạn có context này để phát nhạc

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playMusic } = useMusic(); // Lấy hàm phát nhạc từ context
  
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  // Hàm lấy dữ liệu (dùng useCallback để tránh render vòng lặp)
  const fetchPlaylistDetail = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/playlists/${id}`);
      setPlaylist(res.data);
      setError(null);
    } catch (err) {
      console.error("Lỗi tải playlist:", err);
      setError("Không thể tải thông tin playlist.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylistDetail();
  }, [fetchPlaylistDetail]);

  // Xóa bài hát khỏi playlist
  const { updatePlaylist, currentSong } = useMusic();

const handleRemoveSong = async (e, songId) => {
  e.stopPropagation();
  if (!window.confirm("Xóa bài này khỏi playlist?")) return;

  try {
    // 1. Gọi API xóa
    await axios.put(`http://localhost:5000/api/playlists/${id}/remove`, { songId });

    // 2. Cập nhật giao diện của trang PlaylistDetail
    const updatedSongs = playlist.songs.filter(s => s._id !== songId);
    setPlaylist({ ...playlist, songs: updatedSongs });

    // 3. QUAN TRỌNG: Cập nhật lại danh sách đang phát trong GlobalPlayer nếu cần
    // Nếu bài vừa xóa nằm trong danh sách đang phát thì cập nhật context
    updatePlaylist(updatedSongs);

    alert("Đã xóa bài hát!");
  } catch (err) {
    alert("Lỗi khi xóa bài hát");
  }
};

  // Phát nhạc từ Playlist
  const handlePlayFromPlaylist = (index) => {
    if (playlist.songs.length > 0) {
      playMusic(playlist.songs, index);
    }
  };

  if (loading) return <div style={centerStyle}>🔄 Đang tải danh sách nhạc...</div>;
  if (error) return <div style={centerStyle}>❌ {error}</div>;
  if (!playlist) return <div style={centerStyle}>Không tìm thấy playlist.</div>;

  // Kiểm tra quyền sở hữu
  const isOwner = loggedInUser?._id === playlist.owner?._id || loggedInUser?.id === playlist.owner?._id;

  return (
    <div style={containerStyle}>
      {/* Nút Quay lại */}
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={20} /> Quay lại
      </button>

      {/* HEADER: Thông tin Playlist */}
      <div style={headerStyle}>
        <div style={playlistImgStyle}>
          <Music size={80} color="#fff" strokeWidth={1.5} />
        </div>
        <div style={headerInfoStyle}>
          <p style={labelStyle}>PLAYLIST CỦA NGƯỜI DÙNG</p>
          <h1 style={titleStyle}>{playlist.title}</h1>
          <div style={metaDataStyle}>
            <User size={16} />
            <span style={{ fontWeight: 'bold' }}>{playlist.owner?.username || 'Ẩn danh'}</span>
            <span style={dotStyle}>•</span>
            <span>{playlist.songs?.length || 0} bài hát</span>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={actionBarStyle}>
        <button 
          style={playAllBtnStyle} 
          onClick={() => handlePlayFromPlaylist(0)}
          disabled={playlist.songs?.length === 0}
        >
          <Play fill="black" size={24} /> PHÁT TẤT CẢ
        </button>
      </div>

      {/* DANH SÁCH NHẠC */}
      <div style={listWrapperStyle}>
        <div style={listHeaderStyle}>
          <div style={{ width: '40px' }}>#</div>
          <div style={{ flex: 1 }}>TIÊU ĐỀ</div>
          <div style={{ width: '200px' }}>NGHỆ SĨ</div>
          <div style={{ width: '50px', textAlign: 'right' }}><Clock size={16} /></div>
        </div>

        {playlist.songs.length > 0 ? (
          playlist.songs.map((song, index) => (
            <div 
              key={song._id} 
              style={songRowStyle} 
              onClick={() => handlePlayFromPlaylist(index)}
            >
              <div style={indexStyle}>{index + 1}</div>
              
              <div style={songMainStyle}>
                <img 
                  src={`http://localhost:5000${song.imageUrl}`} 
                  alt={song.title} 
                  style={coverStyle} 
                />
                <div style={titleBoxStyle}>
                  <div style={songTitleStyle}>{song.title}</div>
                  <div style={mobileArtistStyle}>{song.artist}</div>
                </div>
              </div>

              <div style={artistColumnStyle}>{song.artist}</div>

              <div style={actionColumnStyle}>
                {isOwner && (
                  <button 
                    onClick={(e) => handleRemoveSong(e, song._id)} 
                    style={removeBtnStyle}
                    title="Xóa khỏi playlist"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Playlist này chưa có nhạc. Hãy thêm bài hát từ trang chủ!</div>
        )}
      </div>
    </div>
  );
};

/* --- HỆ THỐNG STYLES --- */
const containerStyle = { padding: '40px 60px', minHeight: '100vh', background: 'linear-gradient(to bottom, #2a2a2a 0%, #121212 30%)', color: '#fff' };
const centerStyle = { textAlign: 'center', padding: '100px', fontSize: '18px', color: '#888' };
const backBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' };

const headerStyle = { display: 'flex', gap: '30px', alignItems: 'flex-end', marginBottom: '30px' };
const playlistImgStyle = { width: '230px', height: '230px', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: '4px' };
const headerInfoStyle = { flex: 1 };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' };
const titleStyle = { fontSize: '72px', margin: '0 0 15px 0', fontWeight: '900', letterSpacing: '-2px' };
const metaDataStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#e0e0e0' };
const dotStyle = { margin: '0 5px' };

const actionBarStyle = { padding: '20px 0', marginBottom: '20px' };
const playAllBtnStyle = { background: '#1db954', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: '0.2s transform', transform: 'scale(1)', ':hover': { transform: 'scale(1.05)' } };

const listWrapperStyle = { background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px' };
const listHeaderStyle = { display: 'flex', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#b3b3b3', fontSize: '12px', letterSpacing: '1px', marginBottom: '10px' };
const songRowStyle = { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' };
// Ghi chú: Thêm hover effect trong CSS thực tế: background: 'rgba(255,255,255,0.1)'
const indexStyle = { width: '40px', color: '#b3b3b3' };
const songMainStyle = { flex: 1, display: 'flex', alignItems: 'center', gap: '15px' };
const coverStyle = { width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover' };
const titleBoxStyle = { display: 'flex', flexDirection: 'column' };
const songTitleStyle = { fontWeight: '500', color: '#fff' };
const mobileArtistStyle = { fontSize: '12px', color: '#b3b3b3', display: 'none' }; // Hiện khi mobile
const artistColumnStyle = { width: '200px', color: '#b3b3b3', fontSize: '14px' };
const actionColumnStyle = { width: '50px', textAlign: 'right' };
const removeBtnStyle = { background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', transition: 'color 0.2s' }; // :hover { color: '#fff' }
const emptyStyle = { textAlign: 'center', padding: '50px', color: '#555', fontStyle: 'italic' };

export default PlaylistDetail;