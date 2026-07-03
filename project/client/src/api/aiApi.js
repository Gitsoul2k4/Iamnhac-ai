import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/ai';

/**
 * Bubble chat AI Agent — gửi 1 tin nhắn của người dùng, nhận lại câu trả lời
 * tự nhiên + danh sách bài hát gợi ý (nếu AI đã đủ ngữ cảnh để gợi ý).
 */
export const sendChatMessage = async ({ userId, message }) => {
  const res = await axios.post(`${BASE_URL}/chat`, { userId, message });
  return res.data; // { messageId, reply, recommendations }
};

/**
 * Lấy lại lịch sử trò chuyện (khi người dùng mở lại bubble chat / load lại trang).
 */
export const getChatHistory = async (userId) => {
  const res = await axios.get(`${BASE_URL}/chat/${userId}`);
  return res.data; // Array<{ role, text, recommendedSongIds, createdAt }>
};

/**
 * Xoá lịch sử trò chuyện, bắt đầu 1 cuộc hội thoại mới với AI Agent.
 */
export const clearChatHistory = async (userId) => {
  const res = await axios.delete(`${BASE_URL}/chat/${userId}`);
  return res.data;
};
