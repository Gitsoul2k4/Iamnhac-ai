const mongoose = require('mongoose');

// =============================================================================
// NHÓM 3: "Tâm trạng khai báo trực tiếp" (Prompt-based Mood)
// Lưu lại nội dung người dùng tự nhập vào bubble chat trên Web
// (VD: "Đang code chạy deadline", "Focus", "Chill"...).
// Đây là tín hiệu MẠNH NHẤT vì do chính người dùng khai báo, không cần suy đoán.
// =============================================================================
const moodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Luôn lấy tâm trạng MỚI NHẤT của user -> index giảm dần theo thời gian
moodSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Mood', moodSchema);
