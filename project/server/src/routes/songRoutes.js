const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const multer = require('multer');

// Cấu hình lưu file (Giữ nguyên logic upload của bạn)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'songFile') cb(null, 'uploads/music/');
        else cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ROUTES
router.get('/', songController.getAllSongs);
router.get('/search', songController.searchSongs);
router.get('/user/:userId', songController.getSongsByUserId);
router.get('/info/:userId', songController.getUserInfo);
router.post('/upload', upload.fields([{ name: 'songFile' }, { name: 'imageFile' }]), songController.createSong);
router.post('/like/:id', songController.toggleLike);
router.put('/user/:id', songController.updateProfile);
router.delete('/:id', songController.deleteSong);
router.post('/playlists', songController.createPlaylist); // Khớp với Home.jsx: /api/songs/playlists
router.get('/ranking', songController.getRanking);

module.exports = router;