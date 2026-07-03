import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Play, Loader2 } from 'lucide-react';
import { sendChatMessage, getChatHistory } from '../../api/aiApi';
import { useMusic } from '../../context/MusicContext';

// =============================================================================
// MoodBubble — giờ là bubble chat AI Agent ĐẦY ĐỦ (giao tiếp 2 chiều thật sự
// giữa người dùng và AI Agent), thay cho bản cũ chỉ khai báo 1 dòng tâm trạng.
//
// Đây là TÍNH NĂNG DUY NHẤT còn lại của AI Agent sau khi tinh giản: không còn
// theo dõi giờ giấc truy cập web hay lượt Like — mọi ngữ cảnh đều đến từ chính
// cuộc trò chuyện ở đây. Backend sẽ dùng Gemini để hiểu ý + lớp Machine
// Learning (embedding + Cosine Similarity) để chọn bài hát phù hợp nhất.
// =============================================================================

const STARTER_PROMPTS = [
  'Mình đang buồn, gợi ý nhạc tâm trạng nhé',
  'Đang học bài chạy deadline, cần nhạc tập trung',
  'Cho mình nhạc sôi động để tập gym',
  'Muốn nghe gì đó nhẹ nhàng để thư giãn'
];

const MoodBubble = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user'|'agent', text, recommendedSongIds? }
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);
  const { playMusic } = useMusic();

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userId = loggedInUser?._id || loggedInUser?.id;

  // Tải lại lịch sử trò chuyện khi mở bubble lần đầu
  useEffect(() => {
    if (!open || !userId || historyLoaded) return;
    (async () => {
      try {
        const history = await getChatHistory(userId);
        setMessages(history.map(m => ({
          role: m.role,
          text: m.text,
          recommendedSongIds: m.recommendedSongIds || []
        })));
      } catch (err) {
        console.error('Lỗi tải lịch sử trò chuyện:', err.message);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, [open, userId, historyLoaded]);

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  if (!userId) return null; // Chỉ hiện bubble khi đã đăng nhập (cần userId để lưu hội thoại)

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setMessages(prev => [...prev, { role: 'user', text: content }]);
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage({ userId, message: content });
      setMessages(prev => [...prev, {
        role: 'agent',
        text: res.reply,
        recommendedSongIds: res.recommendations || []
      }]);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn cho AI Agent:', err.message);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: 'Xin lỗi, có lỗi kết nối tới AI Agent. Bạn thử lại giúp mình nhé!',
        recommendedSongIds: []
      }]);
    } finally {
      setSending(false);
    }
  };

  const handlePlaySong = (songList, index) => {
    playMusic(songList, index);
  };

  return (
    <div style={wrapperStyle}>
      {open && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#1db954" /> AI Agent gợi ý nhạc
            </span>
            <button onClick={() => setOpen(false)} style={closeBtnStyle}><X size={18} /></button>
          </div>

          <div style={messagesAreaStyle} ref={scrollRef}>
            {messages.length === 0 && !sending && (
              <div>
                <p style={emptyHintStyle}>
                  Chào bạn! Nhắn cho mình biết bạn đang muốn nghe gì hoặc đang trong tâm trạng
                  gì, mình sẽ gợi ý nhạc phù hợp nhé 🎧
                </p>
                <div style={chipsRow}>
                  {STARTER_PROMPTS.map((p) => (
                    <button key={p} onClick={() => handleSend(p)} style={chipStyle} disabled={sending}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} style={m.role === 'user' ? userBubbleRow : agentBubbleRow}>
                <div style={m.role === 'user' ? userBubbleStyle : agentBubbleStyle}>
                  {m.text}
                </div>

                {m.role === 'agent' && m.recommendedSongIds && m.recommendedSongIds.length > 0 && (
                  <div style={songListStyle}>
                    {m.recommendedSongIds.map((song, songIndex) => (
                      <div
                        key={song._id}
                        style={songRowStyle}
                        onClick={() => handlePlaySong(m.recommendedSongIds, songIndex)}
                      >
                        <img src={`http://localhost:5000${song.imageUrl}`} alt={song.title} style={songThumbStyle} />
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={songTitleStyle}>{song.title}</div>
                          <div style={songArtistStyle}>{song.artist}</div>
                        </div>
                        <Play size={16} color="#1db954" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div style={agentBubbleRow}>
                <div style={{ ...agentBubbleStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  AI Agent đang soạn trả lời...
                </div>
              </div>
            )}
          </div>

          <div style={inputRow}>
            <input
              type="text"
              placeholder="Nhắn cho AI Agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              style={inputStyle}
              disabled={sending}
            />
            <button onClick={() => handleSend()} style={sendBtnStyle} disabled={sending || !input.trim()}>
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={bubbleBtnStyle} title="Trò chuyện với AI Agent gợi ý nhạc">
        <MessageCircle size={26} color="white" />
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* --- STYLES --- */
const wrapperStyle = { position: 'fixed', bottom: '110px', right: '25px', zIndex: 1500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' };
const bubbleBtnStyle = { width: '58px', height: '58px', borderRadius: '50%', background: '#1db954', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const panelStyle = { width: '340px', height: '460px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const panelHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #eee' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#666' };
const messagesAreaStyle = { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' };
const emptyHintStyle = { fontSize: '13px', color: '#666', margin: '0 0 12px 0' };
const chipsRow = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const chipStyle = { background: '#f1f8f4', border: '1px solid #1db954', color: '#1db954', borderRadius: '16px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', textAlign: 'left' };
const userBubbleRow = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' };
const agentBubbleRow = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' };
const userBubbleStyle = { background: '#1db954', color: 'white', borderRadius: '14px 14px 2px 14px', padding: '9px 13px', fontSize: '13px', maxWidth: '85%' };
const agentBubbleStyle = { background: '#f1f1f1', color: '#222', borderRadius: '14px 14px 14px 2px', padding: '9px 13px', fontSize: '13px', maxWidth: '85%' };
const songListStyle = { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', width: '100%' };
const songRowStyle = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fafafa', border: '1px solid #eee', borderRadius: '10px', padding: '6px 8px', cursor: 'pointer' };
const songThumbStyle = { width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 };
const songTitleStyle = { fontSize: '12.5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const songArtistStyle = { fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const inputRow = { display: 'flex', gap: '8px', padding: '12px 14px', borderTop: '1px solid #eee' };
const inputStyle = { flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', fontSize: '13px' };
const sendBtnStyle = { background: '#1db954', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };

export default MoodBubble;
