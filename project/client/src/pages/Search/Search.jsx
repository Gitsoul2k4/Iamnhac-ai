import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '../../context/MusicContext'; // Import context
import { Search as SearchIcon, Music, Play, ArrowLeft, XCircle } from 'lucide-react';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playMusic } = useMusic(); // Lấy hàm phát nhạc
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 0) {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/songs/search?q=${value}`);
        setResults(res.data);

        } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    } else {
      setResults([]);
    }
  };

  return (
    <div style={{ padding: '40px 60px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '150px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
          <button onClick={() => navigate('/')} style={backBtnStyle}><ArrowLeft size={24} /></button>
          <h1 style={{ color: '#1db954', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: '900' }}>
              <Music size={32} /> IAMNHAC
          </h1>
      </div>

      {/* SEARCH INPUT */}
      <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto 60px auto' }}>
        <SearchIcon style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#1db954' }} size={24} />
        <input 
          type="text"
          placeholder="Bạn muốn nghe gì trên IAMNHAC?"
          value={searchQuery}
          onChange={handleSearch}
          style={searchInputStyle}
        />
      </div>

      {/* RESULTS */}
      <div>
        {loading ? (
            <div style={{ textAlign: 'center', color: '#666' }}>Đang tìm kiếm...</div>
        ) : results.length > 0 ? (
          <div style={gridStyle}>
            {results.map((song, index) => (
              <div key={song._id} style={songCard} onClick={() => playMusic(results, index)}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '15px' }}>
                  <img src={`http://localhost:5000${song.imageUrl}`} alt="" style={imgStyle} />
                  <button style={playOverlayBtn}><Play fill="white" size={20} /></button>
                </div>
                <h3 style={{ margin: '15px 0 5px 0', fontSize: '17px' }}>{song.title}</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>{song.artist}</p>
              </div>
            ))}
          </div>
        ) : searchQuery && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <XCircle size={60} color="#ccc" />
            <p>Không tìm thấy kết quả nào cho "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- STYLES --- */
const searchInputStyle = { width: '100%', padding: '18px 30px 18px 65px', fontSize: '18px', borderRadius: '40px', border: '2px solid #eee', outline: 'none' };
const backBtnStyle = { background: '#f5f5f5', border: 'none', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' };
const songCard = { background: '#fff', padding: '15px', borderRadius: '20px', cursor: 'pointer', transition: '0.3s', border: '1px solid #f0f0f0' };
const imgStyle = { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px' };
const playOverlayBtn = { position: 'absolute', bottom: '12px', right: '12px', background: '#1db954', border: 'none', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default Search;
