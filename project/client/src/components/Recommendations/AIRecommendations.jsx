import React, { useEffect, useState } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { getAIRecommendations } from '../../api/aiApi';

// Khối "Gợi ý dành cho bạn" - kết quả Output của AI Agent (Gemini 2.5 Pro)
// sau khi đã được Backend dùng để truy vấn MongoDB và trả về danh sách bài hát thật.
const AIRecommendations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playMusic } = useMusic();

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userId = loggedInUser?._id || loggedInUser?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchRecommendations = async () => {
      try {
        const res = await getAIRecommendations(userId);
        setData(res);
      } catch (err) {
        console.error('Lỗi lấy gợi ý từ AI Agent:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [userId]);

  if (!userId) return null; // Chỉ hiện gợi ý cá nhân hoá khi đã đăng nhập
  if (loading) {
    return (
      <div style={{ padding: '20px 0', color: '#666' }}>
        🤖 AI Agent đang phân tích thói quen nghe nhạc của bạn...
      </div>
    );
  }
  if (!data || !data.recommendations || data.recommendations.length === 0) return null;

  return (
    <div style={{ marginBottom: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Sparkles color="#1db954" size={26} />
        <h2 style={{ margin: 0, color: '#1db954' }}>Gợi ý dành cho bạn</h2>
      </div>
      {data.reason && (
        <p style={{ color: '#666', marginTop: 0, marginBottom: '20px', fontStyle: 'italic' }}>
          "{data.reason}"
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
        {data.recommendations.map((song, index) => (
          <div
            key={song._id}
            style={songCard}
            onClick={() => playMusic(data.recommendations, index)}
          >
            <div style={{ position: 'relative' }}>
              <img src={`http://localhost:5000${song.imageUrl}`} alt={song.title} style={imgStyle} />
              <button style={playOverlayBtn}><Play fill="white" size={18} /></button>
            </div>
            <h4 style={{ margin: '12px 0 4px 0', fontSize: '15px' }}>{song.title}</h4>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{song.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const songCard = { background: '#fff', padding: '15px', borderRadius: '18px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', cursor: 'pointer', transition: '0.3s' };
const imgStyle = { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px' };
const playOverlayBtn = { position: 'absolute', bottom: '10px', right: '10px', background: '#1db954', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

export default AIRecommendations;
