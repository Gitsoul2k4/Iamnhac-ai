const Song = require('../models/Song');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const mlService = require('../services/mlService'); // === MACHINE LEARNING (mới) ===
const audioTranscodeService = require('../services/audioTranscodeService'); // === CHẤT LƯỢNG ÂM THANH (mới) ===
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

    // === MACHINE LEARNING (mới) ===
    // Tính embedding ngay khi upload để AI Agent có thể gợi ý bài hát này
    // ngay từ lượt chat đầu tiên, không cần chờ chạy script backfill.
    // Chạy "ngầm" SAU KHI đã trả response cho client để không làm chậm upload,
    // và không để lỗi gọi API (nếu có) ảnh hưởng tới trải nghiệm đăng nhạc.
    mlService.embedText(`${title} - ${artist} - ${category || ''}`)
      .then((vec) => {
        if (vec) return Song.findByIdAndUpdate(newSong._id, { embedding: vec });
      })
      .catch((err) => console.error('[songController] Lỗi tính embedding khi upload:', err.message));

    // === CHẤT LƯỢNG ÂM THANH (mới) ===
    // Tạo thêm bản 96kbps để trình phát có thể chuyển sang "chất lượng thấp"
    // khi người dùng muốn tiết kiệm dữ liệu di động. Chạy ngầm, không chặn
    // response upload; nếu ffmpeg lỗi/chưa cài, trình phát sẽ tự dùng lại
    // file gốc (xem songUrlLow default rỗng trong Song.js).
    if (req.files['songFile']) {
      const originalAbsPath = req.files['songFile'][0].path;
      const filename = req.files['songFile'][0].filename;
      audioTranscodeService.transcodeToLowQuality(originalAbsPath, filename)
        .then((lowUrl) => {
          if (lowUrl) return Song.findByIdAndUpdate(newSong._id, { songUrlLow: lowUrl });
        })
        .catch((err) => console.error('[songController] Lỗi transcode chất lượng thấp:', err.message));
    }
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

// Sửa thông tin bài hát (Admin hoặc chính chủ) — hoàn thiện CRUD cho nhạc
exports.updateSong = async (req, res) => {
  try {
    const { requesterId, role, title, artist, category } = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Không tìm thấy nhạc" });

    const isOwner = requesterId && song.userId && song.userId.toString() === requesterId.toString();
    const isAdmin = role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài hát này" });
    }

    if (title !== undefined) song.title = title;
    if (artist !== undefined) song.artist = artist;
    if (category !== undefined) song.category = category;
    await song.save();
    res.json(song);

    // Thể loại/tên bài hát đổi -> tính lại embedding để AI Agent gợi ý vẫn chính xác
    mlService.embedText(`${song.title} - ${song.artist} - ${song.category || ''}`)
      .then((vec) => { if (vec) return Song.findByIdAndUpdate(song._id, { embedding: vec }); })
      .catch((err) => console.error('[songController] Lỗi tính lại embedding sau khi sửa:', err.message));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Upload / đổi ảnh đại diện (Avatar) — dùng chung cho cả Admin và User thường
exports.uploadAvatar = async (req, res) => {
  try {
    const { requesterId, role } = req.body;
    const isOwner = requesterId && requesterId.toString() === req.params.id.toString();
    const isAdmin = role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền đổi ảnh đại diện này" });
    }
    if (!req.file) return res.status(400).json({ message: "Thiếu file ảnh" });

    const avatarUrl = '/uploads/images/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.params.id, { avatar: avatarUrl }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
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
    const { requesterId, role, username, bio } = req.body;

    // FIX BẢO MẬT: trước đây route này dùng req.body trực tiếp làm dữ liệu update
    // (findByIdAndUpdate(req.params.id, req.body)) — nghĩa là bất kỳ ai cũng có thể
    // gửi { "role": "admin" } hoặc đổi password/email của BẤT KỲ user nào khác,
    // vì không hề kiểm tra người gọi có phải chủ tài khoản hay không.
    if (!requesterId) {
      return res.status(401).json({ message: "Thiếu thông tin xác thực người dùng" });
    }
    const isOwner = requesterId.toString() === req.params.id.toString();
    const isAdmin = role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa hồ sơ này" });
    }

    // Chỉ cho phép cập nhật đúng 2 field công khai này qua route này.
    // Đổi email/password/role phải đi qua các luồng riêng có xác thực chặt hơn.
    const allowedUpdates = {};
    if (username !== undefined) allowedUpdates.username = username;
    if (bio !== undefined) allowedUpdates.bio = bio;

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
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
      { $sort: { likesCount: -1 } },
      { $limit: 10 }
    ]);
    res.json(topSongs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
