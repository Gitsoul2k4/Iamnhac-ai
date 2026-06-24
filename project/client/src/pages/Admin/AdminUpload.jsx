import React, { useState } from 'react';
import axios from 'axios';

const AdminUpload = () => {
    // 1. Khai báo đầy đủ các State
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [category, setCategory] = useState('Nhạc trẻ'); // Mặc định là Nhạc trẻ
    const [songFile, setSongFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        
        // 2. Lấy thông tin user và kiểm tra ID
        const user = JSON.parse(localStorage.getItem('user'));
        const currentUserId = user?._id || user?.id; // Chấp nhận cả _id và id

        if (!currentUserId) {
            alert("Lỗi: Không tìm thấy ID người dùng. Vui lòng đăng xuất và đăng nhập lại!");
            return;
        }

        if (!songFile || !imageFile) {
            alert("Vui lòng chọn đầy đủ file nhạc và file ảnh!");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('category', category); // Đã có biến category ở đây
        formData.append('songFile', songFile);
        formData.append('imageFile', imageFile);
        formData.append('userId', currentUserId);
        formData.append('uploaderName', user.username || "Người dùng");

        try {
            await axios.post('http://localhost:5000/api/songs/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Tải lên thành công bài hát: ' + title);
            // Reset form sau khi thành công
            setTitle('');
            setArtist('');
            window.location.href = '/'; // Quay về trang chủ
        } catch (err) {
            console.error(err);
            alert('Lỗi upload: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={formBoxStyle}>
                <h2 style={{ textAlign: 'center', color: '#1db954' }}>TẢI LÊN NHẠC MỚI</h2>
                <form onSubmit={handleUpload}>
                    <div style={inputGroup}>
                        <label>Tên bài hát:</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={inputGroup}>
                        <label>Ca sĩ:</label>
                        <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={inputGroup}>
                        <label>Thể loại:</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                            <option value="Nhạc trẻ">Nhạc trẻ</option>
                            <option value="Bolero">Bolero</option>
                            <option value="Remix">Remix</option>
                            <option value="Lofi">Lofi</option>
                        </select>
                    </div>

                    <div style={inputGroup}>
                        <label>File nhạc (MP3):</label>
                        <input type="file" accept="audio/*" onChange={(e) => setSongFile(e.target.files[0])} required />
                    </div>

                    <div style={inputGroup}>
                        <label>Ảnh bìa:</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required />
                    </div>

                    <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Đang tải lên...' : 'BẮT ĐẦU TẢI LÊN'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- CSS STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', padding: '50px 20px', background: '#f4f4f4', minHeight: '90vh' };
const formBoxStyle = { background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px' };
const inputGroup = { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ddd' };
const btnStyle = { width: '100%', padding: '12px', background: '#1db954', color: '#fff', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default AdminUpload;
