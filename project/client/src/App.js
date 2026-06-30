import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';

// --- BƯỚC QUAN TRỌNG: IMPORT CONTEXT VÀ PLAYER ---
import { MusicProvider } from './context/MusicContext'; // Đảm bảo đúng đường dẫn tới file MusicContext.js
import GlobalPlayer from './components/GlobalPlayer';   // Đảm bảo đúng đường dẫn tới file GlobalPlayer.jsx
import MoodBubble from './components/MoodBubble/MoodBubble'; // === AI AGENT: bubble khai báo tâm trạng (Nhóm 3) ===

// --- IMPORT CÁC TRANG ---
import Home from './pages/Home/Home';
import SearchPage from './pages/Search/Search';
import Ranking from './pages/Ranking/Ranking';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminUpload from './pages/Admin/AdminUpload';

// --- STYLES (Giữ nguyên phong cách của bạn) ---
const navBarStyle = { padding: '10px 40px', background: '#1db954', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 1000 };
const logoStyle = { fontWeight: 'bold', textDecoration: 'none', color: 'white', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' };
const navLinkStyle = { textDecoration: 'none', color: 'white', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' };
const uploadBtnStyle = { background: '#000', color: '#fff', padding: '8px 15px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' };
const registerBtnStyle = { textDecoration: 'none', color: 'white', fontWeight: '500', background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '5px' };
const logoutBtnStyle = { padding: '6px 15px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' };
const profileLinkStyle = { textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' };
const avatarStyle = { width: '30px', height: '30px', background: '#fff', color: '#1db954', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const footerStyle = { textAlign: 'center', padding: '40px', color: '#888', background: '#f8f9fa', marginTop: '40px' };

const UserPlaylists = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>🎧 Thư viện Playlist</h2><p>Đang tải danh sách...</p></div>;
const PlaylistDetail = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>🎶 Đang phát Playlist</h2></div>;

const ProfileWrapper = () => {
  const { userId } = useParams();
  return <Profile key={userId} />;
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    const handleStorage = () => setUser(JSON.parse(localStorage.getItem('user')));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    if(window.confirm("Bạn muốn đăng xuất?")) {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
    }
  };

  return (
    // BỌC TOÀN BỘ ỨNG DỤNG TRONG MUSIC PROVIDER
    <MusicProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <nav style={navBarStyle}>
            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
              <Link to="/" style={logoStyle}>💿 IAMNHAC</Link>
              <Link to="/" style={navLinkStyle}>🏠 Trang chủ</Link>
              <Link to="/ranking" style={navLinkStyle}>🏆 BXH</Link>
              <Link to="/search" style={navLinkStyle}>🔍 Tìm kiếm</Link>
              
              {user && (
                <>
                  <Link to="/upload" style={uploadBtnStyle}>📤 Đăng nhạc</Link>
                  <Link to={`/playlists/user/${user._id || user.id}`} style={navLinkStyle}>📚 Thư viện</Link>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Link to={`/profile/${user._id || user.id}`} style={profileLinkStyle}>
                    <div style={avatarStyle}>{String(user.username || 'U').charAt(0).toUpperCase()}</div>
                    <span>{String(user.username)} {user.role === 'admin' ? '⭐ (Admin)' : ''}</span>
                  </Link>
                  <button onClick={handleLogout} style={logoutBtnStyle}>🚪 Thoát</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <Link to="/login" style={navLinkStyle}>Đăng nhập</Link>
                  <Link to="/register" style={registerBtnStyle}>Đăng ký</Link>
                </div>
              )}
            </div>
          </nav>

          <main style={{ flex: 1, background: '#fff' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile/:userId" element={<ProfileWrapper />} />
              
              <Route path="/upload" element={user ? <AdminUpload /> : <Navigate to="/login" />} />
              <Route path="/playlists/user/:userId" element={user ? <UserPlaylists /> : <Navigate to="/login" />} />
              <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* TRÌNH PHÁT NHẠC LUÔN HIỂN THỊ Ở ĐÂY */}
          <GlobalPlayer />

          {/* === AI AGENT: Bubble khai báo tâm trạng - hiển thị trên MỌI trang === */}
          <MoodBubble />

          <footer style={footerStyle}>
            <p><b>IAMNHAC MUSIC</b></p>
            <p>© 2025 - Nền tảng âm nhạc trực tuyến cho cộng đồng</p>
          </footer>
        </div>
      </Router>
    </MusicProvider>
  );
}

export default App;
