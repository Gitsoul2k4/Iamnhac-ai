import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';

// Trang quản trị: chỉ Admin mới vào được (chặn ở cả route trong App.js lẫn ở đây
// để phòng trường hợp gõ thẳng URL /admin).
// Cho phép Admin CRUD (Sửa/Xoá) nhạc do BẤT KỲ user nào đăng lên — không chỉ của mình.
const AdminDashboard = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', artist: '', category: '' });
  const [saving, setSaving] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const { notify, showConfirm } = useNotification();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/songs');
      setSongs(res.data);
    } catch (err) {
      notify({ type: 'error', title: 'Lỗi tải dữ liệu', message: 'Không thể tải danh sách bài hát.' });
    } finally {
      setLoading(false);
    }
  };

  // Chặn truy cập nếu không phải Admin (kể cả khi cố tình gõ thẳng URL /admin)
  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const startEdit = (song) => {
    setEditingId(song._id);
    setEditForm({ title: song.title, artist: song.artist, category: song.category || 'Khác' });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (songId) => {
    setSaving(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/songs/${songId}`, {
        requesterId: loggedInUser._id || loggedInUser.id,
        role: loggedInUser.role,
        ...editForm
      });
      setSongs(songs.map((s) => (s._id === songId ? res.data : s)));
      setEditingId(null);
      notify({ type: 'success', title: 'Đã lưu', message: `Đã cập nhật "${res.data.title}".` });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Không thể lưu',
        message: err.response?.data?.message || 'Vui lòng thử lại sau.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (song) => {
    const ok = await showConfirm({
      type: 'danger',
      title: `Xoá "${song.title}"?`,
      message: `Bài hát này của "${song.uploaderName}". Hành động này không thể hoàn tác.`,
      confirmText: 'Xoá bài hát',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:5000/api/songs/${song._id}`, {
        data: { userId: loggedInUser._id || loggedInUser.id, role: loggedInUser.role }
      });
      setSongs(songs.filter((s) => s._id !== song._id));
      notify({ type: 'success', title: 'Đã xoá', message: `Đã xoá "${song.title}".` });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Không thể xoá',
        message: err.response?.data?.message || 'Vui lòng thử lại sau.'
      });
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 120px' }}>
      <h1 style={{ color: '#1db954' }}>🛠️ Quản trị hệ thống</h1>
      <p style={{ color: '#666', marginBottom: '25px' }}>
        Quản lý toàn bộ {songs.length} bài hát trong hệ thống — kể cả bài hát do người dùng khác đăng.
      </p>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {songs.map((song) => (
            <div key={song._id} style={rowStyle}>
              <img src={`http://localhost:5000${song.imageUrl}`} alt="" style={thumbStyle} />

              {editingId === song._id ? (
                <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    style={editInputStyle}
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Tên bài hát"
                  />
                  <input
                    style={editInputStyle}
                    value={editForm.artist}
                    onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                    placeholder="Ca sĩ"
                  />
                  <select
                    style={editInputStyle}
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="Nhạc trẻ">Nhạc trẻ</option>
                    <option value="Bolero">Bolero</option>
                    <option value="Remix">Remix</option>
                    <option value="Lofi">Lofi</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <button style={iconBtnGreen} onClick={() => saveEdit(song._id)} disabled={saving} title="Lưu">
                    <Save size={18} />
                  </button>
                  <button style={iconBtnGray} onClick={cancelEdit} disabled={saving} title="Huỷ">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>
                      {song.artist} · {song.category || 'Khác'} · đăng bởi <b>{song.uploaderName}</b>
                    </div>
                  </div>
                  <button style={iconBtnGray} onClick={() => startEdit(song)} title="Sửa">
                    <Pencil size={18} />
                  </button>
                  <button style={iconBtnRed} onClick={() => handleDelete(song)} title="Xoá">
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const rowStyle = { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '10px 15px' };
const thumbStyle = { width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 };
const editInputStyle = { flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' };
const iconBtnGray = { background: '#f2f2f2', border: 'none', borderRadius: '8px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333', flexShrink: 0 };
const iconBtnRed = { ...iconBtnGray, background: '#fdecea', color: '#e53935' };
const iconBtnGreen = { ...iconBtnGray, background: '#1db954', color: '#fff' };

export default AdminDashboard;
