const mongoose = require('mongoose');

// =============================================================================
// ChatMessage — NGUỒN DỮ LIỆU DUY NHẤT của AI Agent sau khi tinh giản.
// Đã bỏ hẳn Nhóm 1 (Temporal Context / giờ giấc truy cập) và Nhóm 2
// (Explicit Feedback / lượt nghe + lượt Like). Giờ đây AI Agent CHỈ giao tiếp
// và học ngữ cảnh qua đúng 1 kênh: bubble chat giữa người dùng và AI Agent.
//
// Mỗi lượt chat (của người dùng lẫn của AI Agent) được lưu thành 1 document
// để: (1) hiển thị lại lịch sử hội thoại khi người dùng mở lại bubble,
// (2) làm ngữ cảnh nhiều lượt (multi-turn) gửi cho Gemini ở lần chat kế tiếp.
// =============================================================================
const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // 'user'  = tin nhắn người dùng gõ vào bubble chat
  // 'agent' = câu trả lời của AI Agent (Gemini)
  role: { type: String, enum: ['user', 'agent'], required: true },

  text: { type: String, required: true },

  // Chỉ tin nhắn role='agent' mới có danh sách bài hát gợi ý kèm theo (nếu có)
  recommendedSongIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],

  createdAt: { type: Date, default: Date.now }
});

// Luôn truy vấn theo userId + thứ tự thời gian -> đánh index cho nhanh
chatMessageSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
