// =============================================================================
// geminiService.js
// "BỘ NÃO" của AI Agent — nhận đúng 3 nhóm dữ liệu thói quen tối giản:
//   1) Temporal Context        2) Explicit Feedback        3) Prompt-based Mood
// rồi gửi cho Gemini 2.5 Pro để nhận về JSON tiêu chí gợi ý nhạc.
// =============================================================================

const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(context) {
  const { temporal, explicitFeedback, mood, availableCategories } = context;

  return `
Bạn là một AI Agent gợi ý nhạc cho website nghe nhạc "IAMNHAC".
Hãy phân tích 3 nhóm dữ liệu thói quen dưới đây và trả về DUY NHẤT một đối tượng JSON
(không kèm văn bản giải thích, không markdown, không dấu \`\`\`) để backend dùng JSON đó
truy vấn MongoDB tìm bài hát phù hợp.

### 1) Thói quen Thời gian (Temporal Context)
- Hôm nay: ${temporal.dayName}, ${temporal.hour}h (buổi ${temporal.timeSegment})
- ${temporal.isWeekend ? 'Đang là CUỐI TUẦN' : 'Đang là NGÀY THƯỜNG trong tuần'}
(Gợi ý tham khảo: sáng Thứ Hai thường cần nhạc tạo năng lượng để đi làm/học; tối Thứ Bảy
thường hợp nhạc thư giãn/giải trí; khuya thường hợp nhạc nhẹ, du dương.)

### 2) Lịch sử Tương tác Rõ ràng (Explicit Feedback)
- Thể loại nghe nhiều nhất: ${JSON.stringify(explicitFeedback.topCategories)}
- Bài hát nghe nhiều nhất gần đây: ${JSON.stringify(explicitFeedback.topSongs)}
- Các bài hát đã bấm Thích (Like): ${JSON.stringify(explicitFeedback.likedSongs)}

### 3) Tâm trạng khai báo trực tiếp (Prompt-based Mood)
${mood
    ? `- Người dùng vừa tự nhập: "${mood.text}" (cách đây ${mood.minutesAgo} phút)
- ĐÂY LÀ TÍN HIỆU QUAN TRỌNG NHẤT. Hãy ưu tiên tâm trạng này hơn cả lịch sử nghe nhạc và giờ giấc.`
    : '- (Người dùng chưa khai báo tâm trạng nào gần đây, hãy dựa vào 2 nhóm dữ liệu còn lại)'}

### Danh sách thể loại nhạc hiện có trên Web (chỉ chọn trong danh sách này cho "categories")
${JSON.stringify(availableCategories)}

### Yêu cầu output - CHỈ trả về một JSON đúng cấu trúc sau, không thêm gì khác:
{
  "categories": ["<chọn 1-3 thể loại PHÙ HỢP NHẤT, lấy đúng tên trong danh sách thể loại ở trên>"],
  "keywords": ["<tối đa 5 từ khóa để dò thêm trong tên bài hát/nghệ sĩ, có thể để trống>"],
  "preferredArtists": ["<tối đa 5 nghệ sĩ nên ưu tiên, dựa trên lịch sử nghe/like, có thể để trống>"],
  "excludeSongIds": [],
  "limit": 12,
  "reason": "<1-2 câu TIẾNG VIỆT giải thích ngắn gọn, NHẮC ĐẾN tâm trạng (nếu có) hoặc giờ giấc/thói quen, để hiển thị cho người dùng>"
}
`.trim();
}

function getFallbackCriteria(context) {
  return {
    categories: (context.explicitFeedback?.topCategories || []).slice(0, 2),
    keywords: [],
    preferredArtists: [],
    excludeSongIds: [],
    limit: 12,
    reason: 'Chưa đủ dữ liệu để AI phân tích sâu, đây là các bài hát nổi bật gần đây.'
  };
}

/**
 * Gửi 3 nhóm dữ liệu thói quen tới Gemini 2.5 Pro và parse JSON trả về.
 * @param {object} context - { temporal, explicitFeedback, mood, availableCategories }
 * @returns {Promise<object>} JSON tiêu chí gợi ý nhạc
 */
async function generateRecommendationCriteria(context) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[geminiService] Thiếu GEMINI_API_KEY trong file .env -> dùng fallback.');
    return getFallbackCriteria(context);
  }

  const prompt = buildPrompt(context);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      return getFallbackCriteria(context);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('[geminiService] Gemini không trả về nội dung hợp lệ:', JSON.stringify(data));
      return getFallbackCriteria(context);
    }

    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const criteria = JSON.parse(cleaned);

    return {
      categories: Array.isArray(criteria.categories) ? criteria.categories : [],
      keywords: Array.isArray(criteria.keywords) ? criteria.keywords : [],
      preferredArtists: Array.isArray(criteria.preferredArtists) ? criteria.preferredArtists : [],
      excludeSongIds: Array.isArray(criteria.excludeSongIds) ? criteria.excludeSongIds : [],
      limit: Number(criteria.limit) > 0 ? Number(criteria.limit) : 12,
      reason: criteria.reason || 'Gợi ý dựa trên thói quen nghe nhạc của bạn.'
    };
  } catch (err) {
    console.error('[geminiService] Lỗi khi gọi Gemini hoặc parse JSON:', err.message);
    return getFallbackCriteria(context);
  }
}

module.exports = { generateRecommendationCriteria, buildPrompt };
