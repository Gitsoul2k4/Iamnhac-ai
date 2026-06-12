import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMusic } from '../../context/MusicContext';
import { Trophy, Heart, Headphones } from 'lucide-react';

const Ranking = () => {
  const [topSongs, setTopSongs] = useState([]);
  // Lấy toggleLikeGlobal từ Context (Đã sửa ở bước 1 nên sẽ không còn lỗi "not a function")
  const { favorites, toggleLikeGlobal } = useMusic();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/songs/ranking');
      setTopSongs(res.data);
    } catch (err) { console.error(err); }
  };

  const handleLike = async (songId) => {
    if (!user) return alert("Vui lòng đăng nhập!");

    // 1. Gọi hàm Like từ Context
    const data = await toggleLikeGlobal(songId);

    // 2. Cập nhật con số hiển thị ngay lập tức trên Bảng xếp hạng
    // Chúng ta cập nhật state topSongs dựa trên dữ liệu Backend vừa trả về
    if (data && data.song) {
      setTopSongs(prevSongs => 
        prevSongs.map(s => s._id === songId ? data.song : s)
      );
    }
  };

  return (
    <div style={{ padding: '40px', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', color: '#1db954' }}>BẢNG XẾP HẠNG</h1>
      
      <div style={{ background: '#181818', borderRadius: '10px', marginTop: '30px' }}>
        {topSongs.map((song, index) => {
          const isLiked = favorites?.includes(song._id);

          return (
            <div key={song._id} style={itemStyle}>
              <span style={{ width: '30px', fontWeight: 'bold' }}>{index + 1}</span>
              <img src={`http://localhost:5000${song.imageUrl}`} alt="" style={imgStyle} />
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                <div style={{ color: '#b3b3b3', fontSize: '14px' }}>{song.artist}</div>
              </div>

              {/* KHU VỰC HIỂN THỊ SỐ LIKE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Headphones size={16} />
                  <span>{song.playCount}</span>
                </div>

                <div 
                  onClick={() => handleLike(song._id)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <Heart 
                    size={18} 
                    fill={isLiked ? "#ff4d4d" : "none"} 
                    color={isLiked ? "#ff4d4d" : "#b3b3b3"} 
                  />
                  {/* ĐÂY LÀ CON SỐ LƯỢT LIKE BẠN CẦN HIỆN */}
                  <span style={{ color: isLiked ? "#ff4d4d" : "#fff", fontWeight: 'bold' }}>
                    {song.likes?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const itemStyle = { display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #282828' };
const imgStyle = { width: '50px', height: '50px', marginRight: '15px', borderRadius: '4px' };

export default Ranking;