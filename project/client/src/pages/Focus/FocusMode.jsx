import React, { useState, useEffect } from 'react'; 
const FocusMode = () => { 
  const [seconds, setSeconds] = useState(1500); 
  const [isActive, setIsActive] = useState(false); 
  useEffect(() => { 
    let interval = null; 
    if (isActive && seconds > 0) { interval = setInterval(() => setSeconds(s => s - 1), 1000); } 
    else clearInterval(interval); 
    return () => clearInterval(interval); 
  }, [isActive, seconds]); 
  return ( 
    <div style={{ textAlign: 'center', padding: '100px', background: '#2c3e50', color: 'white', minHeight: '80vh' }}> 
      <h1>CHẾ ĐỘ TẬP TRUNG</h1> 
      <div style={{ fontSize: '100px', margin: '40px 0' }}>{Math.floor(seconds/60)}:{(seconds%60).toString().padStart(2,'0')}</div> 
      <button onClick={() => setIsActive(!isActive)} style={{ padding: '15px 40px', fontSize: '20px', borderRadius: '30px', border: 'none', cursor: 'pointer', background: '#1db954', color: 'white' }}>{isActive ? 'TẠM DỪNG' : 'BẮT ĐẦU'}</button> 
      <p style={{ marginTop: '20px' }}>Làm việc hiệu quả hơn cùng âm nhạc P2Tunes</p> 
    </div> 
  ); 
}; export default FocusMode; 
