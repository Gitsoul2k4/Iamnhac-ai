import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';

// --- QUẢN LÝ TRẠNG THÁI TOÀN CỤC & TRÌNH PHÁT NHẠC ---
import { MusicProvider } from './context/MusicContext';
import GlobalPlayer from './components/GlobalPlayer';

// --- IMPORT CÁC TRANG CHỨC NĂNG ---
import Home from './pages/Home/Home';
import SearchPage from './pages/Search/Search';
import Ranking from './pages/Ranking/Ranking';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminUpload from './pages/Admin/AdminUpload';
import Library from './pages/Library/Library'; // Component Thư viện đã cập nhật
import PlaylistDetail from './pages/Playlist/PlaylistDetail';

// --- CSS IN JS (STYLING) ---
const navBarStyle = { 
  padding: '10px 40px', 
  background: '#1db954', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  color: 'white', 
  position: 'sticky', 
  top: 0, 
  zIndex: 1000,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
};

const logoStyle = { fontWeight: 'bold', textDecoration: 'none', color: 'white', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' };
const navLinkStyle = { textDecoration: 'none', color: 'white', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' };
const uploadBtnStyle = { background: '#000', color: '#fff', padding: '8px 15px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', transition: '0.3s' };
const registerBtnStyle = { textDecoration: 'none', color: 'white', fontWeight: '500', background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '5px' };
const logoutBtnStyle = { padding: '6px 15px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' };
const profileLinkStyle = { textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' };
const avatarStyle = { width: '30px', height: '30px', background: '#fff', color: '#1db954', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const footerStyle = { textAlign: 'center', padding: '40px', color: '#888', background: '#f8f9fa', marginTop: '40px', borderTop: '1px solid #eee' };

// Component bọc Profile để re-render khi đổi userId
const ProfileWrapper = () => {
  const { userId } = useParams();
  return <Profile key={userId} />;
};

// Placeholder cho chi tiết Playlist (Bạn có thể tạo file riêng sau)

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  // Theo dõi thay đổi của localStorage để cập nhật trạng thái đăng nhập
  useEffect(() => {
    const handleStorage = () => setUser(JSON.parse(localStorage.getItem('user')));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    if(window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi IAMNHAC?")) {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
    }
  };

  return (
    <MusicProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          
          {/* THANH ĐIỀU HƯỚNG (NAVIGATION BAR) */}
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
                    <span style={{fontWeight: 'bold'}}>
                        {String(user.username)} {user.role === 'admin' && <small>(Admin)</small>}
                    </span>
                  </Link>
                  <button onClick={handleLogout} style={logoutBtnStyle}>🚪 Thoát</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <Link to="/login" style={navLinkStyle}>Đăng nhập</Link>
                  <Link to="/register" style={registerBtnStyle}>Đăng ký</Link>
                </div>
              )}
            </div>
          </nav>

          {/* NỘI DUNG CHÍNH (DYNAMIC ROUTES) */}
          <main style={{ flex: 1, background: '#fff' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile/:userId" element={<ProfileWrapper />} />
              <Route path="/playlist/:id" element={<PlaylistDetail />} />
              
              {/* Private Routes (Yêu cầu đăng nhập) */}
              <Route 
                path="/upload" 
                element={user ? <AdminUpload /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/playlists/user/:userId" 
                element={user ? <Library /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/playlist/:playlistId" 
                element={<PlaylistDetail />} 
              />
              
              {/* Redirect 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* PLAYER TOÀN CỤC (Luôn hiển thị ở dưới cùng) */}
          <GlobalPlayer />

          {/* FOOTER */}
          <footer style={footerStyle}>
            <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}><b>IAMNHAC MUSIC</b></p>
            <p style={{ margin: 0, fontSize: '14px' }}>© 2025 - Nền tảng âm nhạc trực tuyến cho cộng đồng sinh viên</p>
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px' }}>
                <span>Điều khoản dịch vụ</span>
                <span>Chính sách bảo mật</span>
                <span>Liên hệ hỗ trợ</span>
            </div>
          </footer>
        </div>
      </Router>
    </MusicProvider>
  );
}

export default App;