import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Heart, Trash2, Play, User as UserIcon, Settings } from 'lucide-react';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin user đang đăng nhập từ localStorage
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  // Kiểm tra quyền sở hữu (để hiện nút Xóa)
  const isOwner = loggedInUser?._id === userId || loggedInUser?.id === userId;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // 1. Lấy thông tin người dùng
        const userRes = await axios.get(`http://localhost:5000/api/songs/info/${userId}`);
        setUser(userRes.data);

        // 2. Lấy danh sách bài hát do người dùng này đăng
        const songsRes = await axios.get(`http://localhost:5000/api/songs/user/${userId}`);
        setSongs(songsRes.data);
      } catch (err) {
        console.error("Lỗi tải thông tin hồ sơ:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchProfileData();
  }, [userId]);

  // Hàm xử lý xóa bài hát
  const handleDeleteSong = async (songId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài hát này khỏi hệ thống?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/songs/${songId}`, {
        data: { 
          userId: loggedInUser._id || loggedInUser.id, 
          role: loggedInUser.role 
        }
      });
      // Cập nhật lại danh sách sau khi xóa thành công
      setSongs(songs.filter(s => s._id !== songId));
      alert("Đã xóa bài hát thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi: Bạn không có quyền xóa hoặc server gặp sự cố.");
    }
  };

  if (loading) return <div style={centerStyle}>Đang tải hồ sơ...</div>;
  if (!user) return <div style={centerStyle}>Không tìm thấy người dùng này.</div>;

  return (
    <div style={containerStyle}>
      
      {/* PHẦN 1: HEADER HỒ SƠ */}
      <div style={headerCardStyle}>
        <div style={avatarWrapperStyle}>
          {user.username ? user.username[0].toUpperCase() : <UserIcon size={50} />}
        </div>
        <div style={infoContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={nameStyle}>{user.username}</h1>
            <span style={roleBadgeStyle}>{user.role === 'admin' ? 'Quản trị viên' : 'Nghệ sĩ'}</span>
          </div>
          <p style={subTitleStyle}>Thành viên từ: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
          
          <div style={statsRowStyle}>
            <div style={statBoxStyle}><strong>{songs.length}</strong> bài hát</div>
            <div style={statBoxStyle}>
              <strong>{songs.reduce((acc, s) => acc + (s.likes?.length || 0), 0)}</strong> lượt thích
            </div>
          </div>

          {isOwner && (
            <button style={editBtnStyle} onClick={() => alert("Chức năng đang phát triển")}>
              <Settings size={16} /> Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* PHẦN 2: DANH SÁCH NHẠC ĐÃ ĐĂNG */}
      <div style={sectionTitleStyle}>
        <Music size={22} color="#1db954" />
        <h2 style={{ fontSize: '20px', margin: 0 }}>Danh sách bài hát đã đăng tải</h2>
      </div>

      <div style={listWrapperStyle}>
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div key={song._id} style={songCardStyle}>
              <div style={songIndexStyle}>{index + 1}</div>
              <img 
                src={`http://localhost:5000${song.imageUrl}`} 
                alt="cover" 
                style={coverStyle} 
                onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
              />
              <div style={{ flex: 1 }}>
                <div style={songNameStyle}>{song.title}</div>
                <div style={artistNameStyle}>{song.artist}</div>
              </div>

              <div style={songMetaStyle}>
                <Heart size={14} fill="#ff4d4d" color="#ff4d4d" />
                <span>{song.likes?.length || 0}</span>
              </div>

              <div style={btnGroupStyle}>
                <button onClick={() => navigate('/')} style={playBtnStyle} title="Phát nhạc">
                  <Play size={18} fill="#1db954" color="#1db954" />
                </button>
                
                {/* Chỉ hiện nút xóa nếu là chủ sở hữu */}
                {isOwner && (
                  <button onClick={() => handleDeleteSong(song._id)} style={delBtnStyle} title="Xóa bài hát">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={emptyBoxStyle}>Người dùng này chưa có bài hát nào công khai.</div>
        )}
      </div>
    </div>
  );
};

// --- HỆ THỐNG STYLES (CSS-in-JS) ---
const containerStyle = { maxWidth: '900px', margin: '0 auto', padding: '40px 20px' };
const centerStyle = { textAlign: 'center', padding: '100px', color: '#888' };

const headerCardStyle = { display: 'flex', gap: '30px', alignItems: 'center', background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '40px' };
const avatarWrapperStyle = { width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #1db954, #191414)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px', fontWeight: 'bold' };
const infoContentStyle = { flex: 1 };
const nameStyle = { fontSize: '32px', margin: 0 };
const subTitleStyle = { color: '#888', margin: '5px 0 15px 0' };
const roleBadgeStyle = { background: '#f0f0f0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#555', fontWeight: 'bold' };
const statsRowStyle = { display: 'flex', gap: '20px', marginBottom: '20px' };
const statBoxStyle = { fontSize: '15px', color: '#444' };
const editBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '14px' };

const sectionTitleStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' };
const listWrapperStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const songCardStyle = { display: 'flex', alignItems: 'center', padding: '12px 20px', background: '#fff', borderRadius: '15px', border: '1px solid #f0f0f0', transition: '0.2s hover' };
const songIndexStyle = { width: '30px', color: '#bbb', fontWeight: 'bold' };
const coverStyle = { width: '50px', height: '50px', borderRadius: '8px', marginRight: '15px', objectFit: 'cover' };
const songNameStyle = { fontWeight: 'bold', fontSize: '16px' };
const artistNameStyle = { fontSize: '13px', color: '#888' };
const songMetaStyle = { display: 'flex', alignItems: 'center', gap: '5px', marginRight: '20px', color: '#666', fontSize: '14px' };
const btnGroupStyle = { display: 'flex', gap: '10px' };
const playBtnStyle = { background: 'none', border: 'none', cursor: 'pointer' };
const delBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d' };
const emptyBoxStyle = { textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '20px', color: '#aaa' };

export default Profile;