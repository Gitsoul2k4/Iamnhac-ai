import React from 'react'; 
const Profile = () => { 
  const user = JSON.parse(localStorage.getItem('user')); 
  if (!user) return <p>Vui lòng đăng nhập</p>; 
  return ( 
    <div style={{ padding: '50px', textAlign: 'center' }}> 
      <div style={{ background: '#f4f4f4', padding: '30px', borderRadius: '20px', display: 'inline-block' }}> 
        <div style={{ width: '100px', height: '100px', background: '#1db954', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px' }}>{user.username[0].toUpperCase()}</div> 
        <h2>{user.username}</h2> 
        <p style={{ color: '#666' }}>Thành viên của P2Tunes</p> 
        <button style={{ marginTop: '20px', padding: '10px 20px', border: '1px solid #1db954', borderRadius: '20px', background: 'none', cursor: 'pointer' }}>Chỉnh sửa hồ sơ</button> 
      </div> 
    </div> 
  ); 
}; export default Profile; 
