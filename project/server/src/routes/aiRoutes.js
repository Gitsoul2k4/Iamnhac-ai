const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/chat', aiController.sendMessage);          // Gửi tin nhắn, nhận trả lời + gợi ý nhạc
router.get('/chat/:userId', aiController.getHistory);    // Lấy lại lịch sử trò chuyện
router.delete('/chat/:userId', aiController.clearHistory); // Xoá lịch sử, bắt đầu hội thoại mới

module.exports = router;
