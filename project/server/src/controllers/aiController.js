const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Mood = require('../models/Mood');
const Song = require('../models/Song');
const geminiService = require('../services/geminiService');
const { getTemporalContext } = require('../utils/timeContext');

const MOOD_MAX_AGE_HOURS = 24; // tâm trạng cũ hơn mức này sẽ không còn được tính là "hiện tại"

// =============================================================================
// NHÓM 2 (Explicit Feedback) - Ghi nhận 1 lượt NGHE.
// (Hành động LIKE không cần log riêng, vì đã có sẵn trong Song.likes)
// =============================================================================
exports.logPlay = async (req, res) => {
  try {
    const { userId, songId } = req.body;
    if (!userId || !songId) {
      return res.status(400).json({ message: 'Thiếu userId hoặc songId' });
    }

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: 'Không tìm thấy bài hát' });

    await Activity.create({
      userId,
      songId,
      songTitle: song.title,
      artist: song.artist,
      category: song.category
    });

    res.status(201).json({ message: 'Đã ghi nhận lượt nghe' });
  } catch (err) {
    console.error('Lỗi logPlay:', err.message);
    // Không để lỗi ghi log làm hỏng trải nghiệm nghe nhạc chính
    res.status(500).json({ message: 'Lỗi server khi ghi nhận lượt nghe' });
  }
};

// =============================================================================
// NHÓM 3 (Prompt-based Mood) - Ghi nhận tâm trạng người dùng tự nhập từ bubble chat.
// =============================================================================
exports.setMood = async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text || !text.trim()) {
      return res.status(400).json({ message: 'Thiếu userId hoặc nội dung tâm trạng' });
    }

    await Mood.create({ userId, text: text.trim().slice(0, 200) });
    res.status(201).json({ message: 'Đã ghi nhận tâm trạng của bạn' });
  } catch (err) {
    console.error('Lỗi setMood:', err.message);
    res.status(500).json({ message: 'Lỗi server khi ghi nhận tâm trạng' });
  }
};

/**
 * Tổng hợp ĐÚNG 3 nhóm dữ liệu thói quen tối giản thành ngữ cảnh gửi cho Gemini.
 */
async function buildUserContext(userId) {
  // ----- NHÓM 1: Temporal Context (tính trực tiếp, không lưu DB) -----
  const temporal = getTemporalContext();

  // ----- NHÓM 2: Explicit Feedback -----
  const recentPlays = await Activity.find({ userId }).sort({ createdAt: -1 }).limit(100);

  const categoryCount = {};
  const songCountMap = {}; // key: songId -> { title, artist, count }
  recentPlays.forEach(p => {
    if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    const key = p.songId.toString();
    if (!songCountMap[key]) songCountMap[key] = { title: p.songTitle, artist: p.artist, count: 0 };
    songCountMap[key].count += 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);

  const topSongs = Object.values(songCountMap)
    .sort((a, b) => b.count - a.count).slice(0, 5)
    .map(s => ({ title: s.title, artist: s.artist }));

  // Bài hát đã Like - lấy TRỰC TIẾP từ Song.likes (đã có sẵn trong project, không cần log riêng)
  const likedSongsDocs = await Song.find({ likes: userId }).select('title artist category').limit(20);
  const likedSongs = likedSongsDocs.map(s => ({ title: s.title, artist: s.artist, category: s.category }));

  // ----- NHÓM 3: Prompt-based Mood -----
  const latestMood = await Mood.findOne({ userId }).sort({ createdAt: -1 });
  let mood = null;
  if (latestMood) {
    const minutesAgo = Math.round((Date.now() - latestMood.createdAt.getTime()) / 60000);
    if (minutesAgo <= MOOD_MAX_AGE_HOURS * 60) {
      mood = { text: latestMood.text, minutesAgo };
    }
  }

  // Danh sách thể loại đang có trên Web -> để Gemini chọn đúng, tránh bịa thể loại lạ
  const distinctCategories = await Song.distinct('category');
  const availableCategories = distinctCategories.length > 0
    ? distinctCategories
    : ['Nhạc trẻ', 'Bolero', 'Remix', 'Lofi'];

  // Các songId đã nghe gần đây -> dùng để loại trừ, tránh gợi ý lặp lại
  const recentSongIds = recentPlays.slice(0, 15).map(p => p.songId.toString());

  return {
    temporal,
    explicitFeedback: { topCategories, topSongs, likedSongs },
    mood,
    availableCategories,
    recentSongIds
  };
}

// =============================================================================
// REASONING + ACTION: gửi 3 nhóm context cho Gemini 2.5 Pro -> nhận JSON
// -> dùng JSON đó query MongoDB lấy danh sách bài hát thật.
// =============================================================================
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'userId không hợp lệ' });
    }

    // ----- INPUT: 3 nhóm dữ liệu thói quen -----
    const context = await buildUserContext(userId);

    // ----- REASONING (Gemini 2.5 Pro) -----
    const criteria = await geminiService.generateRecommendationCriteria(context);

    // ----- ACTION: build query MongoDB từ JSON do LLM trả về -----
    const orConditions = [];

    if ((criteria.categories || []).length > 0) {
      orConditions.push({ category: { $in: criteria.categories } });
    }
    (criteria.keywords || []).forEach(kw => {
      orConditions.push({ title: { $regex: escapeRegex(kw), $options: 'i' } });
      orConditions.push({ artist: { $regex: escapeRegex(kw), $options: 'i' } });
    });
    (criteria.preferredArtists || []).forEach(artist => {
      orConditions.push({ artist: { $regex: escapeRegex(artist), $options: 'i' } });
    });

    const excludeIds = [
      ...(criteria.excludeSongIds || []),
      ...context.recentSongIds
    ].filter(id => mongoose.Types.ObjectId.isValid(id));

    const query = {};
    if (orConditions.length > 0) query.$or = orConditions;
    if (excludeIds.length > 0) query._id = { $nin: excludeIds };

    let recommendations = await Song.find(query)
      .sort({ createdAt: -1 })
      .limit(criteria.limit || 12);

    // Fallback: nếu tiêu chí quá hẹp / không khớp bài nào, lấy tạm Top bài hát
    // được thích nhiều nhất để trang không bị trống.
    if (recommendations.length === 0) {
      recommendations = await Song.aggregate([
        { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
        { $sort: { likesCount: -1 } },
        { $limit: criteria.limit || 12 }
      ]);
    }

    res.json({
      reason: criteria.reason,
      criteria,
      recommendations
    });
  } catch (err) {
    console.error('Lỗi getRecommendations:', err.message);
    res.status(500).json({ message: 'Lỗi server khi tạo gợi ý nhạc' });
  }
};

// Tránh lỗi/regex injection khi đưa chuỗi do LLM sinh ra vào $regex
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
