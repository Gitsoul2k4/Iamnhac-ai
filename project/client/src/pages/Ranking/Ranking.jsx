import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Heart, Music } from 'lucide-react';

const Ranking = () => {
    const [topSongs, setTopSongs] = useState([]);

    useEffect(() => {
        // Gọi API lấy bảng xếp hạng
        axios.get('http://localhost:5000/api/songs/ranking')
            .then(res => setTopSongs(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Trophy size={60} color="#FFD700" style={{ marginBottom: '10px' }} />
                <h1 style={{ color: '#1db954', margin: 0 }}>BẢNG XẾP HẠNG ÂM NHẠC</h1>
                <p style={{ color: '#888' }}>Top 10 bài hát được yêu thích nhất trên P2TUNES</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                {topSongs.map((song, index) => (
                    <div key={song._id} style={itemStyle(index)}>
                        {/* Thứ hạng */}
                        <div style={rankBadgeStyle(index)}>
                            {index + 1}
                        </div>

                        {/* Ảnh bìa */}
                        <img 
                            src={`http://localhost:5000${song.imageUrl}`} 
                            alt="cover" 
                            style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', marginRight: '20px' }} 
                        />

                        {/* Thông tin bài hát */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{song.title}</div>
                            <div style={{ color: '#777', fontSize: '14px' }}>{song.artist}</div>
                        </div>

                        {/* HIỂN THỊ SỐ LƯỢT LIKE */}
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4d' }}>
                                {song.likesCount || 0}
                            </span>
                            <Heart size={22} fill="#ff4d4d" color="#ff4d4d" />
                        </div>
                    </div>
                ))}
                
                {topSongs.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                        Chưa có dữ liệu xếp hạng.
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CSS STYLES ---
const itemStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
    background: index === 0 ? '#fffef0' : 'white', // Bài Top 1 có nền vàng nhạt
    transition: 'transform 0.2s',
    cursor: 'pointer'
});

const rankBadgeStyle = (index) => ({
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '20px',
    fontWeight: 'bold',
    fontSize: '18px',
    // Màu sắc huy chương cho Top 3
    background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#f0f0f0',
    color: index < 3 ? 'white' : '#888'
});

export default Ranking;