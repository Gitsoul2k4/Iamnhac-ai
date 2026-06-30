const mongoose = require('mongoose');

// =============================================================================
// NHÓM 2: "Lịch sử Tương tác Rõ ràng" (Explicit Feedback) - phần PLAY.
// Mỗi lần người dùng bấm nghe 1 bài, ghi lại 1 dòng ở đây để sau này thống kê
// được "Bài hát / Thể loại nghe nhiều nhất".
//
// Lưu ý: phần "Like" KHÔNG cần log ở model này, vì project đã có sẵn
// trường Song.likes (mảng userId) - chỉ cần query Song.find({likes:userId}).
// =============================================================================
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },

  // Lưu kèm snapshot title/artist/category để khỏi phải populate lại
  // từ Song mỗi lần build prompt gửi LLM (tối ưu truy vấn).
  songTitle: { type: String },
  artist: { type: String },
  category: { type: String },

  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
