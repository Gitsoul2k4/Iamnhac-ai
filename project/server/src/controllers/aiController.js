const ChatMessage = require('../models/ChatMessage');
const Song = require('../models/Song');
const geminiService = require('../services/geminiService');
const mlService = require('../services/mlService');

// Số lượt hội thoại gần nhất gửi cho Gemini mỗi lần chat (giữ prompt gọn,
// tránh vượt hạn mức token của model free-tier).
const HISTORY_LIMIT = 12;
// Số bài hát ứng viên tối đa lấy từ MongoDB trước khi đưa qua bước ML xếp hạng.
const CANDIDATE_POOL_SIZE = 60;
// Số bài hát gợi ý cuối cùng trả về cho người dùng.
const RECOMMEND_TOP_K = 12;

// =============================================================================
// Lấy lịch sử trò chuyện (để hiển thị lại khi người dùng mở bubble chat / load
// lại trang) — có populate sẵn bài hát đã gợi ý để hiển thị lại luôn.
// =============================================================================
exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await ChatMessage.find({ userId })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate('recommendedSongIds');

    res.json(history);
  } catch (err) {
    console.error('Lỗi getHistory:', err.message);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử trò chuyện' });
  }
};

// =============================================================================
// Xoá lịch sử trò chuyện, bắt đầu 1 cuộc hội thoại mới với AI Agent.
// =============================================================================
exports.clearHistory = async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.params.userId });
    res.json({ message: 'Đã xoá lịch sử trò chuyện' });
  } catch (err) {
    console.error('Lỗi clearHistory:', err.message);
    res.status(500).json({ message: 'Lỗi server khi xoá lịch sử trò chuyện' });
  }
};

// =============================================================================
// LUỒNG CHÍNH — bubble chat AI Agent:
// 1) Lưu tin nhắn người dùng.
// 2) Gửi lịch sử hội thoại cho Gemini -> nhận câu trả lời + tiêu chí tìm nhạc.
// 3) Lọc sơ bộ bài hát ứng viên trong MongoDB theo tiêu chí đó.
// 4) MACHINE LEARNING: xếp hạng ứng viên bằng embedding + Cosine Similarity
//    (k-Nearest Neighbors) để chọn ra bài hát PHÙ HỢP NHẤT với đúng câu chat
//    hiện tại của người dùng (không chỉ theo category chung chung).
// 5) Lưu câu trả lời của AI Agent + trả kết quả về Frontend.
// =============================================================================
exports.sendMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message || !message.trim()) {
      return res.status(400).json({ message: 'Thiếu userId hoặc nội dung tin nhắn' });
    }

    await ChatMessage.create({ userId, role: 'user', text: message.trim() });

    // Lấy N lượt hội thoại gần nhất (kể cả tin nhắn vừa lưu) làm ngữ cảnh cho Gemini
    const recentHistory = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT);
    const historyForGemini = recentHistory.reverse().map((m) => ({ role: m.role, text: m.text }));

    // Danh sách thể loại đang có trên Web -> để Gemini chọn đúng, tránh bịa thể loại lạ
    const distinctCategories = await Song.distinct('category');
    const availableCategories = distinctCategories.length > 0
      ? distinctCategories
      : ['Nhạc trẻ', 'Bolero', 'Remix', 'Lofi'];

    const agentResult = await geminiService.chatWithAgent(historyForGemini, availableCategories);

    let recommendations = [];
    if (agentResult.shouldRecommend) {
      const orConditions = [];
      if (agentResult.categories.length) {
        orConditions.push({ category: { $in: agentResult.categories } });
      }
      if (agentResult.keywords.length) {
        const regexes = agentResult.keywords.map((k) => new RegExp(escapeRegex(k), 'i'));
        orConditions.push({ title: { $in: regexes } }, { artist: { $in: regexes } });
      }
      if (agentResult.preferredArtists.length) {
        const artistRegexes = agentResult.preferredArtists.map((a) => new RegExp(escapeRegex(a), 'i'));
        orConditions.push({ artist: { $in: artistRegexes } });
      }

      const filterQuery = orConditions.length > 0 ? { $or: orConditions } : {};
      let candidates = await Song.find(filterQuery).limit(CANDIDATE_POOL_SIZE);
      if (candidates.length === 0) {
        // Không tìm được theo tiêu chí cụ thể -> lấy 1 tập ứng viên chung để ML vẫn chọn được bài gần nhất
        candidates = await Song.find().limit(CANDIDATE_POOL_SIZE);
      }

      // === MACHINE LEARNING: xếp hạng bằng embedding + Cosine Similarity (kNN) ===
      recommendations = await mlService.rankSongsByRelevance(
        message,
        candidates,
        Song,
        RECOMMEND_TOP_K
      );
    }

    const savedAgentMessage = await ChatMessage.create({
      userId,
      role: 'agent',
      text: agentResult.reply,
      recommendedSongIds: recommendations.map((s) => s._id)
    });

    res.status(201).json({
      messageId: savedAgentMessage._id,
      reply: agentResult.reply,
      recommendations
    });
  } catch (err) {
    console.error('Lỗi sendMessage:', err.message);
    res.status(500).json({ message: 'Lỗi server khi trò chuyện với AI Agent' });
  }
};

// Escape ký tự đặc biệt của Regex để tránh lỗi khi người dùng gõ ký tự lạ trong keyword
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
