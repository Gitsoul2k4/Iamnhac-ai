import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { setMood } from '../../api/aiApi';

// =============================================================================
// NHÓM 3: "Tâm trạng khai báo trực tiếp" (Prompt-based Mood)
// Bubble chat nổi ở góc màn hình, hiển thị trên MỌI trang (mount trong App.js),
// cho phép người dùng tự nhập ngữ cảnh hiện tại (VD: "Đang code chạy deadline")
// hoặc chọn nhanh các tâm trạng có sẵn ("Focus", "Chill"...).
// =============================================================================
const QUICK_MOODS = [
  { label: '🎯 Học tập / Focus', value: 'Đang học tập, cần tập trung (Focus)' },
  { label: '😌 Chill', value: 'Muốn nghe nhạc thư giãn (Chill)' },
  { label: '⚡ Năng lượng', value: 'Cần nhạc tạo năng lượng, sôi động' },
  { label: '😢 Tâm trạng buồn', value: 'Đang buồn, muốn nghe nhạc tâm trạng' }
];

const MoodBubble = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userId = loggedInUser?._id || loggedInUser?.id;

  if (!userId) return null; // Chỉ hiện bubble khi đã đăng nhập (cần userId để lưu tâm trạng)

  const submitMood = async (moodText) => {
    if (!moodText || !moodText.trim() || sending) return;
    setSending(true);
    try {
      await setMood({ userId, text: moodText.trim() });
      setSentMessage('Đã ghi nhận! AI sẽ gợi ý nhạc theo tâm trạng này 🎵');
      setText('');
      setTimeout(() => { setSentMessage(''); setOpen(false); }, 2200);
    } catch (err) {
      console.error('Lỗi gửi tâm trạng:', err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      {open && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <span style={{ fontWeight: 'bold' }}>Bạn đang muốn nghe gì? 🎧</span>
            <button onClick={() => setOpen(false)} style={closeBtnStyle}><X size={18} /></button>
          </div>

          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 12px 0' }}>
            Cho AI biết tâm trạng/ngữ cảnh hiện tại để gợi ý nhạc chuẩn hơn.
          </p>

          <div style={chipsRow}>
            {QUICK_MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => submitMood(m.value)}
                style={chipStyle}
                disabled={sending}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div style={inputRow}>
            <input
              type="text"
              placeholder='VD: "Đang code chạy deadline"...'
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitMood(text); }}
              style={inputStyle}
            />
            <button onClick={() => submitMood(text)} style={sendBtnStyle} disabled={sending}>
              <Send size={16} color="white" />
            </button>
          </div>

          {sentMessage && (
            <p style={{ color: '#1db954', fontSize: '13px', marginTop: '10px' }}>{sentMessage}</p>
          )}
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={bubbleBtnStyle} title="Khai báo tâm trạng nghe nhạc">
        <MessageCircle size={26} color="white" />
      </button>
    </div>
  );
};

/* --- STYLES --- */
const wrapperStyle = { position: 'fixed', bottom: '110px', right: '25px', zIndex: 1500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' };
const bubbleBtnStyle = { width: '58px', height: '58px', borderRadius: '50%', background: '#1db954', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const panelStyle = { width: '300px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '18px', marginBottom: '15px' };
const panelHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#666' };
const chipsRow = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' };
const chipStyle = { background: '#f1f8f4', border: '1px solid #1db954', color: '#1db954', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
const inputRow = { display: 'flex', gap: '8px' };
const inputStyle = { flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', fontSize: '13px' };
const sendBtnStyle = { background: '#1db954', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };

export default MoodBubble;
