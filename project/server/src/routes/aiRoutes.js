const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// NHÓM 1 (Temporal Context): không cần API riêng, được tính tự động ngay
// lúc gợi ý (xem hàm getRecommendations / getTemporalContext).

// NHÓM 2 (Explicit Feedback) - ghi nhận lượt NGHE.
// (Lượt LIKE đã có sẵn ở route /api/songs/like/:id, không cần thêm ở đây)
router.post('/play', aiController.logPlay);

// NHÓM 3 (Prompt-based Mood) - ghi nhận tâm trạng người dùng tự nhập
router.post('/mood', aiController.setMood);

// Lấy gợi ý nhạc do AI Agent (Gemini 2.5 Pro) phân tích
router.get('/recommendations/:userId', aiController.getRecommendations);

module.exports = router;
