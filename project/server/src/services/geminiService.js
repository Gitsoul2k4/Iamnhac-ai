// =============================================================================
// geminiService.js
// "BỘ NÃO NGÔN NGỮ" của AI Agent — nhận lịch sử hội thoại (bubble chat) giữa
// người dùng và AI Agent, trả lời tự nhiên bằng tiếng Việt + trích xuất tiêu
// chí tìm nhạc (categories/keywords/preferredArtists) dưới dạng JSON để
// Backend dùng truy vấn MongoDB, rồi xếp hạng bằng lớp Machine Learning
// (mlService.js) trước khi trả bài hát thật cho người dùng.
//
// ĐÃ BỎ: Nhóm 1 (Temporal Context) và Nhóm 2 (Explicit Feedback: lượt
// nghe + lượt Like) — AI Agent giờ CHỈ dựa vào nội dung hội thoại trực tiếp.
// =============================================================================

// --- Model: đọc từ .env để dễ đổi mà không cần sửa code / build lại ---
// Mặc định dùng 'gemini-2.5-flash' — model MIỄN PHÍ mạnh nhất hiện có thể
// dùng ổn định với hạn mức free-tier rộng rãi trên Google AI Studio (không
// cần khai báo thanh toán). Nếu Google phát hành model mới miễn phí mạnh
// hơn sau thời điểm này, chỉ cần đổi GEMINI_MODEL trong file .env, KHÔNG
// cần sửa file này. Kiểm tra hạn mức/model mới nhất tại:
// https://ai.google.dev/gemini-api/docs/pricing
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `
Bạn là "IAMNHAC Bot" — một AI Agent trò chuyện trực tiếp với người dùng qua bubble
chat nổi trên website nghe nhạc "IAMNHAC". Nhiệm vụ của bạn:

1. Trò chuyện tự nhiên, thân thiện, ngắn gọn bằng tiếng Việt để hiểu người dùng
   đang muốn nghe thể loại nhạc nào / đang trong tâm trạng, ngữ cảnh gì (ví dụ:
   "đang buồn", "học bài deadline", "tập gym", "đang cần chill"...).
2. Nếu tin nhắn người dùng CHƯA đủ rõ (VD: chỉ chào hỏi), hãy hỏi lại 1 câu ngắn
   để làm rõ, và chưa gợi ý nhạc vội.
3. Nếu đã đủ ngữ cảnh, hãy xác nhận lại ngắn gọn và cho phép hệ thống gợi ý nhạc.

Sau MỖI tin nhắn của người dùng, bạn PHẢI trả về DUY NHẤT 1 object JSON hợp lệ
(không kèm markdown, không kèm giải thích, không có \`\`\`), đúng cấu trúc:
{
  "reply": "<câu trả lời trò chuyện tự nhiên bằng tiếng Việt>",
  "categories": ["<0-3 thể loại phù hợp NHẤT, lấy đúng tên trong danh sách được cung cấp>"],
  "keywords": ["<0-5 từ khoá để dò thêm trong tên bài hát / nghệ sĩ, có thể để trống>"],
  "preferredArtists": ["<0-5 nghệ sĩ nếu người dùng có nhắc tới, có thể để trống>"],
  "shouldRecommend": <true nếu ĐÃ đủ ngữ cảnh để gợi ý nhạc ngay, false nếu bạn cần hỏi thêm>
}

Không tự bịa thể loại ngoài danh sách được cung cấp. Không thêm field nào khác
ngoài 5 field trên.
`.trim();

/**
 * Ghép lịch sử hội thoại (nhiều lượt) thành định dạng "contents" mà Gemini
 * API yêu cầu (role: 'user' | 'model'), kèm 1 dòng hệ thống báo danh sách
 * thể loại nhạc hiện có để Gemini không bịa thể loại lạ.
 */
function buildContents(history, availableCategories) {
  const contextNote = {
    role: 'user',
    parts: [{ text: `(Hệ thống) Danh sách thể loại nhạc hiện có trên Web: ${JSON.stringify(availableCategories)}` }]
  };

  const turns = history.map((turn) => ({
    role: turn.role === 'agent' ? 'model' : 'user',
    parts: [{ text: turn.text }]
  }));

  return [contextNote, ...turns];
}

function getFallbackResult() {
  return {
    reply: 'Xin lỗi, AI Agent đang gặp chút trục trặc kết nối. Bạn thử nhắn lại giúp mình nhé! 🎵',
    categories: [],
    keywords: [],
    preferredArtists: [],
    shouldRecommend: false
  };
}

/**
 * Gửi lịch sử hội thoại (multi-turn) tới Gemini và parse JSON trả về.
 * @param {Array<{role:'user'|'agent', text:string}>} history
 * @param {string[]} availableCategories
 */
async function chatWithAgent(history, availableCategories) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[geminiService] Thiếu GEMINI_API_KEY trong file .env -> dùng fallback.');
    return getFallbackResult();
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: buildContents(history, availableCategories),
        generationConfig: {
          // Ép Gemini trả về đúng JSON, không kèm văn bản thừa
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[geminiService] Gemini API trả lỗi:', response.status, errText);
      return getFallbackResult();
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('[geminiService] Gemini không trả về nội dung hợp lệ:', JSON.stringify(data));
      return getFallbackResult();
    }

    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : 'Mình đây! Bạn đang muốn nghe gì nè? 🎧',
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      preferredArtists: Array.isArray(parsed.preferredArtists) ? parsed.preferredArtists : [],
      shouldRecommend: Boolean(parsed.shouldRecommend)
    };
  } catch (err) {
    console.error('[geminiService] Lỗi gọi Gemini:', err.message);
    return getFallbackResult();
  }
}

module.exports = { chatWithAgent };
