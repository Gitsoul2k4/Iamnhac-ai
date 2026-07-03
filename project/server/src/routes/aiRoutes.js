const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// === AI AGENT: chỉ còn lại đúng 1 kênh giao tiếp — bubble chat ===
// (Đã bỏ /play và /mood của bản trước — không còn theo dõi thời gian
// truy cập hay lượt Like để nuôi AI Agent nữa.)

router.post('/chat', aiController.sendMessage);          // Gửi tin nhắn, nhận trả lời + gợi ý nhạc
router.get('/chat/:userId', aiController.getHistory);    // Lấy lại lịch sử trò chuyện
router.delete('/chat/:userId', aiController.clearHistory); // Xoá lịch sử, bắt đầu hội thoại mới

module.exports = router;
