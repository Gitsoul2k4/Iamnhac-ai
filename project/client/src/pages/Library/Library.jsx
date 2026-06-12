import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, ListMusic, PlayCircle, PlusCircle, Trash2 } from 'lucide-react';

const Library = () => {
    const { userId } = useParams();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const loggedInUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchUserPlaylists();
    }, [userId]);

    const fetchUserPlaylists = async () => {
        try {
            setLoading(true);
            // Gọi API lấy danh sách playlist của User
            const res = await axios.get(`http://localhost:5000/api/songs/playlists/user/${userId}`);
            setPlaylists(res.data);
        } catch (err) {
            console.error("Lỗi tải playlist:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlaylist = async (e, playlistId) => {
        e.stopPropagation(); // Ngăn sự kiện click vào card
        if (!window.confirm("Bạn có chắc chắn muốn xóa playlist này?")) return;
        
        try {
            await axios.delete(`http://localhost:5000/api/playlists/${playlistId}`);
            setPlaylists(playlists.filter(p => p._id !== playlistId));
            alert("Đã xóa playlist thành công!");
        } catch (err) {
            console.error("Lỗi khi xóa playlist:", err);
        alert("Không thể xóa playlist. Vui lòng kiểm tra lại Backend.");
        }
    };

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '32px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <ListMusic size={40} color="#1db954" /> Thư viện của tôi
                    </h1>
                    <p style={{ color: '#666', marginTop: '10px' }}>Quản lý các danh sách phát cá nhân của bạn trên IAMNHAC</p>
                </div>
                <button onClick={() => navigate('/')} style={btnCreate}>
                    <PlusCircle size={20} /> TẠO MỚI (TẠI TRANG CHỦ)
                </button>
            </div>

            {/* DANH SÁCH PLAYLIST */}
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '100px', color: '#888' }}>Đang tải thư viện...</div>
            ) : playlists.length > 0 ? (
                <div style={gridStyle}>
                    {playlists.map((playlist) => (
                        <div 
                            key={playlist._id} 
                            style={playlistCard}
                            onClick={() => navigate(`/playlist/${playlist._id}`)}
                        >
                            <div style={playlistThumb}>
                                <Music size={50} color="#1db954" opacity={0.3} />
                                <div style={playOverlay}>
                                    <PlayCircle size={48} color="white" fill="#1db954" />
                                </div>
                            </div>
                            
                            <div style={{ padding: '15px' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>{playlist.title}</h3>
                                <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                                    {playlist.songs?.length || 0} bài hát
                                </p>
                                
                                {loggedInUser?._id === userId && (
                                    <button 
                                        onClick={(e) => handleDeletePlaylist(e, playlist._id)} 
                                        style={deleteBtn}
                                        title="Xóa playlist"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={emptyState}>
                    <ListMusic size={80} color="#eee" strokeWidth={1} />
                    <h3>Bạn chưa có playlist nào</h3>
                    <p>Hãy quay lại Trang chủ để tạo danh sách phát đầu tiên của mình!</p>
                    <button onClick={() => navigate('/')} style={btnPrimary}>KHÁM PHÁ NGAY</button>
                </div>
            )}
        </div>
    );
};

/* --- STYLES --- */
const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '30px'
};

const playlistCard = {
    background: '#fff',
    borderRadius: '15px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: '0.3s',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #eee'
};

const playlistThumb = {
    aspectRatio: '1/1',
    background: '#f9f9f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
};

const playOverlay = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: '0.3s'
};

const btnCreate = {
    background: '#1db954', color: 'white', border: 'none',
    padding: '12px 20px', borderRadius: '30px', fontWeight: 'bold',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
};

const deleteBtn = {
    position: 'absolute', bottom: '15px', right: '15px',
    background: 'none', border: 'none', color: '#ff4d4d',
    cursor: 'pointer', padding: '5px', borderRadius: '50%'
};

const emptyState = {
    textAlign: 'center', marginTop: '100px', color: '#999'
};

const btnPrimary = {
    background: '#000', color: '#fff', border: 'none',
    padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold',
    cursor: 'pointer', marginTop: '20px'
};

export default Library;