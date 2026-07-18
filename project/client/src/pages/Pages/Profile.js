import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Heart, Trash2, Play, User as UserIcon, Calendar } from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const { notify, showConfirm } = useNotification();

  // Kiểm tra xem đây có phải là trang của chính người đang đăng nhập không
  const isOwner = loggedInUser?._id === userId || loggedInUser?.id === userId;

  const handleStartEdit = () => {
    setEditForm({ username: user.username || '', bio: user.bio || '' });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/songs/user/${userId}`, {
        requesterId: loggedInUser._id || loggedInUser.id,
        role: loggedInUser.role,
        username: editForm.username,
        bio: editForm.bio
      });
      setUser(res.data);
      setIsEditing(false);
      notify({ type: 'success', title: 'Đã lưu hồ sơ', message: 'Thông tin của bạn đã được cập nhật.' });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Không thể lưu hồ sơ',
        message: err.response?.data?.message || 'Vui lòng thử lại sau.'
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // 1. Lấy thông tin User
    axios.get(`http://localhost:5000/api/songs/info/${userId}`)
      .then(res => setUser(res.data))
      .catch(err => console.error("Lỗi lấy user:", err));

    // 2. Lấy danh sách nhạc của User này
    axios.get(`http://localhost:5000/api/songs/user/${userId}`)
      .then(res => setSongs(res.data))
      .catch(err => console.error("Lỗi lấy nhạc:", err));
  }, [userId]);

  const handleDelete = async (songId) => {
    const shouldDelete = await showConfirm({
      type: 'danger',
      title: 'Xoá bài hát?',
      message: 'Bài hát sẽ bị xoá khỏi hồ sơ và danh sách nhạc.',
      confirmText: 'Xoá bài hát',
      cancelText: 'Giữ lại'
    });
    if (!shouldDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/songs/${songId}`, {
        data: { userId: loggedInUser._id, role: loggedInUser.role }
      });
      setSongs(songs.filter(s => s._id !== songId));
    } catch (err) {
      notify({
        type: 'error',
        title: 'Không thể xoá bài hát',
        message: 'Vui lòng thử lại sau.'
      });
    }
  };

  if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải hồ sơ...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* HEADER HỒ SƠ */}
      <div style={headerStyle}>
        <div style={avatarContainer}>
          <UserIcon size={80} color="#fff" />
        </div>
        <div style={userInfoStyle}>
          <span style={roleBadge}>{user.role === 'admin' ? 'Quản trị viên' : 'Nghệ sĩ'}</span>

          {isEditing ? (
            <div style={editFormStyle}>
              <input
                style={editInputStyle}
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Tên hiển thị"
              />
              <textarea
                style={editTextareaStyle}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value.slice(0, 200) })}
                placeholder="Viết vài dòng giới thiệu về bạn..."
                maxLength={200}
                rows={3}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={saveBtnStyle} onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button style={cancelBtnStyle} onClick={() => setIsEditing(false)} disabled={saving}>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 style={userNameStyle}>{user.username}</h1>
              <div style={statsStyle}>
                <div style={statItem}><strong>{songs.length}</strong> bài hát</div>
                <div style={statItem}>
                    <strong>{songs.reduce((acc, s) => acc + (s.likes?.length || 0), 0)}</strong> lượt thích
                </div>
              </div>
              <p style={bioStyle}>{user.bio || "Chưa có tiểu sử công khai."}</p>
              {isOwner && (
                <button style={editProfileBtnStyle} onClick={handleStartEdit}>Chỉnh sửa hồ sơ</button>
              )}
            </>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '40px 0' }} />

      {/* DANH SÁCH BÀI HÁT TẢI LÊN */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <Music size={24} color="#1db954" />
        <h2 style={{ margin: 0 }}>Bài hát đã tải lên</h2>
      </div>

      <div style={songListContainer}>
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div key={song._id} style={songRowStyle}>
              <div style={{ width: '40px', color: '#888', fontWeight: 'bold' }}>{index + 1}</div>
              
              <img 
                src={`http://localhost:5000${song.imageUrl}`} 
                alt="cover" 
                style={songImgStyle} 
              />
              
              <div style={{ flex: 1 }}>
                <div style={songTitleStyle}>{song.title}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>{song.artist} • {song.category}</div>
              </div>

              <div style={songStatsStyle}>
                <Heart size={16} fill="#ff4d4d" color="#ff4d4d" />
                <span>{song.likes?.length || 0}</span>
              </div>

              <div style={actionGroupStyle}>
                <button onClick={() => navigate('/')} style={iconBtnStyle} title="Nghe ngay">
                  <Play size={18} fill="#1db954" color="#1db954" />
                </button>
                
                {isOwner && (
                  <button onClick={() => handleDelete(song._id)} style={deleteBtnStyle} title="Xóa bài">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Người dùng này chưa có bài hát nào.</div>
        )}
      </div>
    </div>
  );
};

// --- STYLES ---
const headerStyle = { display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '20px' };
const avatarContainer = { width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(45deg, #1db954, #191414)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' };
const userInfoStyle = { flex: 1 };
const userNameStyle = { fontSize: '48px', margin: '10px 0', fontWeight: 'bold' };
const roleBadge = { background: '#e1f5fe', color: '#01579b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' };
const statsStyle = { display: 'flex', gap: '20px', marginBottom: '15px' };
const statItem = { fontSize: '16px', color: '#555' };
const bioStyle = { color: '#888', fontStyle: 'italic' };
const editProfileBtnStyle = { marginTop: '12px', padding: '8px 18px', border: '1px solid #1db954', color: '#1db954', borderRadius: '20px', background: 'none', cursor: 'pointer', fontWeight: '600' };
const editFormStyle = { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', maxWidth: '420px' };
const editInputStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', fontWeight: 'bold' };
const editTextareaStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', resize: 'none', fontFamily: 'inherit' };
const saveBtnStyle = { padding: '8px 20px', background: '#1db954', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' };
const cancelBtnStyle = { padding: '8px 20px', background: '#eee', color: '#333', border: 'none', borderRadius: '20px', cursor: 'pointer' };

const songListContainer = { display: 'flex', flexDirection: 'column', gap: '10px' };
const songRowStyle = { display: 'flex', alignItems: 'center', padding: '12px 20px', borderRadius: '10px', background: '#fff', transition: 'all 0.2s', cursor: 'pointer', border: '1px solid transparent', hover: { background: '#f9f9f9' } };
const songImgStyle = { width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover', marginRight: '20px' };
const songTitleStyle = { fontWeight: 'bold', fontSize: '16px' };
const songStatsStyle = { display: 'flex', alignItems: 'center', gap: '5px', marginRight: '30px', color: '#666', fontSize: '14px' };
const actionGroupStyle = { display: 'flex', gap: '10px' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '8px' };
const deleteBtnStyle = { ...iconBtnStyle, color: '#ff4d4d' };
const emptyStyle = { textAlign: 'center', padding: '40px', color: '#888', background: '#f5f5f5', borderRadius: '15px' };

export default Profile;
