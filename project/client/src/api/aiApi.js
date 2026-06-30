import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/ai';

/**
 * NHÓM 2 - Explicit Feedback: ghi nhận 1 lượt nghe.
 * Gọi "ngầm" (fire-and-forget), không chặn UI nếu lỗi.
 */
export const logPlay = async ({ userId, songId }) => {
  if (!userId || !songId) return;
  try {
    await axios.post(`${BASE_URL}/play`, { userId, songId });
  } catch (err) {
    console.error('Lỗi ghi nhận lượt nghe:', err.message);
  }
};

/**
 * NHÓM 3 - Prompt-based Mood: ghi nhận tâm trạng người dùng tự nhập.
 */
export const setMood = async ({ userId, text }) => {
  const res = await axios.post(`${BASE_URL}/mood`, { userId, text });
  return res.data;
};

/**
 * Lấy danh sách gợi ý nhạc do AI Agent (Gemini 2.5 Pro) phân tích.
 * Trả về: { reason, criteria, recommendations }
 */
export const getAIRecommendations = async (userId) => {
  const res = await axios.get(`${BASE_URL}/recommendations/${userId}`);
  return res.data;
};
