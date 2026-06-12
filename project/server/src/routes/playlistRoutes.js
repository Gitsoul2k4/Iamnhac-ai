const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');

// --- CÁC ROUTE LẤY DỮ LIỆU ---

// Lấy tất cả playlist của một người dùng cụ thể (Dùng cho trang Library)
router.get('/user/:userId', playlistController.getUserPlaylists);

// Lấy thông tin chi tiết của 1 playlist (Dùng cho trang PlaylistDetail)
router.get('/:id', playlistController.getPlaylistById);


// --- CÁC ROUTE THAY ĐỔI DỮ LIỆU ---

// Tạo mới một playlist
router.post('/', playlistController.createPlaylist);

// Thêm bài hát vào playlist
router.put('/:id/add', playlistController.addSongToPlaylist);

// Xóa bài hát khỏi playlist (Dùng cho nút Trash trong PlaylistDetail)
// URL gọi từ Frontend: /api/playlists/:id/remove
router.put('/:id/remove', playlistController.removeSongFromPlaylist);

// Xóa toàn bộ playlist (Dùng cho nút Xóa trong Library)
// URL gọi từ Frontend: /api/playlists/:id
router.delete('/:id', playlistController.deletePlaylist);

module.exports = router;