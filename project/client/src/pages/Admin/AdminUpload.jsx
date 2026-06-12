import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, ListMusic } from 'lucide-react';

const AdminUpload = () => {
    const navigate = useNavigate(); 
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [category, setCategory] = useState('Nhạc trẻ');
    const [songFile, setSongFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- PHẦN MỚI: QUẢN LÝ PLAYLIST ---
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(''); // ID playlist được chọn

    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?._id || user?.id;

    useEffect(() => {
        // Lấy danh sách playlist của user này để hiển thị vào ô chọn
        if (currentUserId) {
            axios.get(`http://localhost:5000/api/songs/playlists/user/${currentUserId}`)
                .then(res => setPlaylists(res.data))
                .catch(err => console.error("Lỗi lấy playlist:", err));
        }
    }, [currentUserId]);
    // ---------------------------------

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!currentUserId) return alert("Vui lòng đăng nhập!");
        if (!songFile || !imageFile) return alert("Vui lòng chọn đủ file!");

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('category', category);
        formData.append('songFile', songFile);
        formData.append('imageFile', imageFile);
        formData.append('userId', currentUserId);
        formData.append('uploaderName', user.username);
        
        // Gửi thêm ID của playlist nếu người dùng có chọn
        if (selectedPlaylist) {
            formData.append('playlistId', selectedPlaylist);
        }

        try {
            const res = await axios.post('http://localhost:5000/api/songs/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Tải lên thành công!');
            navigate('/'); 
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || "Server Error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={formBoxStyle}>
                <h2 style={{ textAlign: 'center', color: '#1db954', marginBottom: '30px' }}>
                    <Upload size={30} style={{verticalAlign: 'middle', marginRight: '10px'}}/> 
                    ĐĂNG NHẠC LÊN IAMNHAC
                </h2>
                
                <form onSubmit={handleUpload}>
                    <div style={inputGroup}>
                        <label style={labelStyle}>Tên bài hát</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} placeholder="VD: Lạc Trôi..." />
                    </div>

                    <div style={inputGroup}>
                        <label style={labelStyle}>Nghệ sĩ</label>
                        <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} required style={inputStyle} />
                    </div>

                    {/* Ô CHỌN PLAYLIST MỚI THÊM VÀO */}
                    <div style={inputGroup}>
                        <label style={labelStyle}><ListMusic size={16}/> Thêm vào Playlist (Tùy chọn)</label>
                        <select 
                            value={selectedPlaylist} 
                            onChange={(e) => setSelectedPlaylist(e.target.value)} 
                            style={inputStyle}
                        >
                            <option value="">-- Không thêm vào playlist nào --</option>
                            {playlists.map(p => (
                                <option key={p._id} value={p._id}>{p.title}</option>
                            ))}
                        </select>
                        <small style={{color: '#888'}}>Nếu chưa có playlist, hãy tạo ở trang chủ trước.</small>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                        <div style={inputGroup}>
                            <label style={labelStyle}>File nhạc (MP3)</label>
                            <input type="file" accept="audio/*" onChange={(e) => setSongFile(e.target.files[0])} required />
                        </div>
                        <div style={inputGroup}>
                            <label style={labelStyle}>Ảnh bìa</label>
                            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐĂNG NHẠC'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Styles (Giữ nguyên và tối ưu một chút)
const containerStyle = { display: 'flex', justifyContent: 'center', padding: '50px 20px', background: '#f0f2f5', minHeight: '90vh' };
const formBoxStyle = { background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px' };
const inputGroup = { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px' };
const btnStyle = { width: '100%', padding: '16px', background: '#1db954', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' };

export default AdminUpload;