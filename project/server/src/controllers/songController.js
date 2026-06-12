const Song = require('../models/Song');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const path = require('path');
const fs = require('fs');

// ==========================================
// 1. QUẢN LÝ BÀI HÁT (SONGS)
// ==========================================

// Lấy tất cả bài hát
exports.getAllSongs = async (req, res) => {
    try {
        const songs = await Song.find().sort({ createdAt: -1 });
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách nhạc: " + err.message });
    }
};

// Tìm kiếm bài hát
exports.searchSongs = async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    try {
        const songs = await Song.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { artist: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tìm kiếm: " + err.message });
    }
};

// Tạo bài hát mới (Upload)
exports.createSong = async (req, res) => {
    try {
        const { title, artist, category, userId, uploaderName, playlistId } = req.body;
        
        const songUrl = req.files['songFile'] ? '/uploads/music/' + req.files['songFile'][0].filename : '';
        const imageUrl = req.files['imageFile'] ? '/uploads/images/' + req.files['imageFile'][0].filename : '';

        const newSong = new Song({
            title,
            artist,
            category,
            songUrl,
            imageUrl,
            userId,
            uploaderName,
            playCount: 0, // Khởi tạo lượt nghe
            likes: []
        });

        await newSong.save();

        // Nếu người dùng chọn playlist khi upload, thêm bài hát vào playlist đó luôn
        if (playlistId) {
            await Playlist.findByIdAndUpdate(playlistId, { $push: { songs: newSong._id } });
        }

        res.status(201).json(newSong);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lưu bài hát: " + err.message });
    }
};

// Tăng lượt nghe (playCount) - MỚI
exports.incPlayCount = async (req, res) => {
    try {
        const song = await Song.findByIdAndUpdate(
            req.params.id,
            { $inc: { playCount: 1 } },
            { new: true }
        );
        res.json(song);
    } catch (err) {
        res.status(500).json({ message: "Không thể tăng lượt nghe" });
    }
};

// Xóa bài hát (Cập nhật: Xóa cả trong playlist để tránh lỗi)
exports.deleteSong = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const songId = req.params.id;
        const song = await Song.findById(songId);
        
        if (!song) return res.status(404).json({ message: "Không tìm thấy bài hát" });

        if (role === 'admin' || (song.userId && song.userId.toString() === userId)) {
            
            // 1. Xóa file vật lý
            const rootDir = path.resolve(__dirname, '../../'); 
            const songPath = path.join(rootDir, song.songUrl);
            const imgPath = path.join(rootDir, song.imageUrl);
            if (fs.existsSync(songPath)) fs.unlinkSync(songPath);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

            // 2. LOGIC MỚI: Xóa ID bài hát này khỏi tất cả các Playlist đang chứa nó
            await Playlist.updateMany({}, { $pull: { songs: songId } });

            // 3. Xóa bài hát trong DB
            await Song.findByIdAndDelete(songId);
            return res.json({ message: "Đã xóa bài hát thành công" });
        }
        res.status(403).json({ message: "Bạn không có quyền xóa bài hát này" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa bài hát" });
    }
};

// ==========================================
// 2. QUẢN LÝ PLAYLIST
// ==========================================

// Tạo playlist
exports.createPlaylist = async (req, res) => {
    try {
        const { title, userId, songIds } = req.body;
        const newPlaylist = new Playlist({
            title,
            owner: userId,
            songs: songIds || []
        });
        await newPlaylist.save();
        res.status(201).json(newPlaylist);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tạo playlist" });
    }
};

// Lấy danh sách playlist của User (Populate bài hát để hiện danh sách)
exports.getUserPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner: req.params.userId })
            .populate('songs') // Hiện đầy đủ bài hát khi ấn vào playlist
            .populate('owner', 'username'); // Hiện người đăng playlist
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy playlist" });
    }
};

// Xóa Playlist - SỬA LỖI
exports.deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ message: "Playlist không tồn tại" });
        
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa playlist thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa playlist" });
    }
};

// Xóa bài hát ra khỏi playlist (không xóa khỏi hệ thống) - MỚI
exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const { songId } = req.body;
        const playlistId = req.params.id;
        await Playlist.findByIdAndUpdate(playlistId, { $pull: { songs: songId } });
        res.json({ message: "Đã xóa bài hát khỏi playlist" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa bài hát khỏi playlist" });
    }
};

// ==========================================
// 3. TƯƠNG TÁC & THỐNG KÊ
// ==========================================

// Like / Unlike
exports.toggleLike = async (req, res) => {
    try {
        const { userId } = req.body;
        const songId = req.params.id;
        if (!userId) return res.status(400).json({ message: "Vui lòng đăng nhập" });

        const song = await Song.findById(songId);
        const isLiked = song.likes.includes(userId);

        const updatedSong = await Song.findByIdAndUpdate(
            songId,
            isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
            { new: true }
        );
        res.json(updatedSong);
    } catch (err) {
        res.status(500).json({ message: "Lỗi xử lý Like" });
    }
};

// Bảng xếp hạng theo LƯỢT NGHE (playCount) - CẬP NHẬT
// controllers/songController.js

exports.getRanking = async (req, res) => {
    try {
        const topSongs = await Song.aggregate([
            {
                // Bước 1: Tạo thêm một trường likesCount bằng độ dài của mảng likes
                $addFields: {
                    likesCount: { $size: { $ifNull: ["$likes", []] } } 
                }
            },
            {
                // Bước 2: Sắp xếp theo likesCount giảm dần (-1)
                // Nếu like bằng nhau thì bài nào nhiều lượt nghe (playCount) hơn sẽ lên trên
                $sort: { 
                    likesCount: -1, 
                    playCount: -1 
                }
            },
            {
                // Bước 3: Chỉ lấy Top 10
                $limit: 10
            }
        ]);

        res.status(200).json(topSongs);
    } catch (err) {
        console.error("Lỗi lấy Ranking:", err);
        res.status(500).json({ message: "Lỗi lấy bảng xếp hạng" });
    }
};

// Lấy nhạc của một user (Trang Profile)
exports.getSongsByUserId = async (req, res) => {
    try {
        const songs = await Song.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 4. THÔNG TIN NGƯỜI DÙNG
// ==========================================
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật profile" });
    }
};