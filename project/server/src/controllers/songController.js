const Song = require('../models/Song');
const User = require('../models/User');
const Playlist = require('../models/playlist');
const path = require('path');
const fs = require('fs');

// Lấy tất cả bài hát
exports.getAllSongs = async (req, res) => {
    try {
        const songs = await Song.find().sort({ createdAt: -1 });
        res.json(songs);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Tìm kiếm bài hát
exports.searchSongs = async (req, res) => {
    const query = req.query.q;
    try {
        const songs = await Song.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { artist: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(songs);
    } catch (err) { res.status(500).json({ message: "Lỗi tìm kiếm" }); }
};

// Tạo bài hát mới (Upload)
exports.createSong = async (req, res) => {
    try {
        const { title, artist, category, userId, uploaderName } = req.body;
        const songUrl = req.files['songFile'] ? '/uploads/music/' + req.files['songFile'][0].filename : '';
        const imageUrl = req.files['imageFile'] ? '/uploads/images/' + req.files['imageFile'][0].filename : '';

        const newSong = new Song({
            title, artist, category, songUrl, imageUrl, userId, uploaderName, likes: []
        }); 

        await newSong.save();
        res.status(201).json(newSong);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Like / Unlike bài hát (Favorite)
exports.toggleLike = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "Thiếu UserId" });

        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ message: "Không thấy nhạc" });

        // Đảm bảo mảng likes tồn tại
        if (!song.likes) song.likes = [];

        if (song.likes.includes(userId)) {
            song.likes = song.likes.filter(id => id.toString() !== userId.toString());
        } else {
            song.likes.push(userId);
        }

        await song.save();
        res.json(song);
    } catch (err) {
        console.error("Lỗi tại toggleLike:", err);
        res.status(500).json({ message: "Lỗi Server nội bộ" });
    }
};

// Xóa bài hát (Kiểm tra quyền Admin hoặc Chủ bài viết)
exports.deleteSong = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ message: "Không tìm thấy nhạc" });

        if (role === 'admin' || song.userId.toString() === userId) {
            // Xóa file vật lý trong thư mục uploads
            const songPath = path.join(__dirname, '../', song.songUrl);
            const imgPath = path.join(__dirname, '../', song.imageUrl);
            if (fs.existsSync(songPath)) fs.unlinkSync(songPath);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

            await Song.findByIdAndDelete(req.params.id);
            return res.json({ message: "Xóa thành công" });
        }
        res.status(403).json({ message: "Không có quyền xóa" });
    } catch (err) { res.status(500).json(err); }
};

// Lấy danh sách nhạc của 1 User cụ thể
exports.getSongsByUserId = async (req, res) => {
    try {
        const songs = await Song.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(songs);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Lấy thông tin Profile của User
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: "User không tồn tại" });
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Cập nhật Profile User (Sửa Bio, Tên)
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(user);
    } catch (err) { res.status(500).json(err); }
};

// Chức năng Tạo Playlist
exports.createPlaylist = async (req, res) => {
    try {
        const { title, userId, songIds } = req.body;
        if (!title || !userId) return res.status(400).json({ message: "Thiếu dữ liệu" });

        const newPlaylist = new Playlist({
            title,
            owner: userId,
            songs: songIds || []
        });

        await newPlaylist.save();
        res.status(201).json(newPlaylist);
    } catch (err) {
        console.error("Lỗi tại createPlaylist:", err);
        res.status(500).json({ message: err.message });
    }
};

// Lấy danh sách Playlist của User
exports.getUserPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner: req.params.userId }).populate('songs');
        res.json(playlists);
    } catch (err) { res.status(500).json(err); }
};


// Lấy Top 10 bài hát có nhiều lượt Like nhất
exports.getRanking = async (req, res) => {
    try {
        // Sử dụng aggregation để tính độ dài mảng likes và sắp xếp
        const topSongs = await Song.aggregate([
            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ["$likes", []] } }
                }
            },
            { $sort: { likesCount: -1 } }, // Sắp xếp giảm dần
            { $limit: 10 } // Lấy top 10
        ]);
        res.json(topSongs);
    } catch (err) {
        console.error("Lỗi lấy BXH:", err);
        res.status(500).json({ message: "Không thể lấy bảng xếp hạng" });
    }
};