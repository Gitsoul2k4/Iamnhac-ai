const Playlist = require('../models/Playlist');

// 1. Lấy danh sách tất cả playlist của một User
exports.getUserPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner: req.params.userId })
            .populate('songs')
            .populate('owner', 'username email');
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách playlist: " + err.message });
    }
};

// 2. Lấy chi tiết một playlist theo ID
exports.getPlaylistById = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('songs')
            .populate('owner', 'username');
        
        if (!playlist) return res.status(404).json({ message: "Không tìm thấy playlist" });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy chi tiết playlist" });
    }
};

// 3. TẠO PLAYLIST MỚI (Đã sửa lỗi nhận mảng bài hát)
exports.createPlaylist = async (req, res) => {
  try {
    // Nhận cả 'songs' (mảng) và 'songId' (đơn lẻ) để linh hoạt
    const { title, userId, songs, songId } = req.body; 

    let initialSongs = [];
    if (songs && Array.isArray(songs)) {
        initialSongs = songs; // Ưu tiên mảng songs từ trang chủ
    } else if (songId) {
        initialSongs = [songId]; // Nếu chỉ có 1 bài lẻ
    }

    const newPlaylist = new Playlist({
      title: title || "Playlist mới",
      owner: userId,
      songs: initialSongs
    });

    const savedPlaylist = await newPlaylist.save();
    
    // Quan trọng: Populate lại để trả về dữ liệu có đầy đủ thông tin bài hát
    const populatedPlaylist = await Playlist.findById(savedPlaylist._id).populate('songs');

    res.status(201).json(populatedPlaylist);
  } catch (err) {
    console.error("Lỗi tạo playlist:", err);
    res.status(500).json({ message: "Không thể tạo playlist" });
  }
};

// 4. Thêm bài hát vào playlist sẵn có
exports.addSongToPlaylist = async (req, res) => {
    try {
        const { songId } = req.body;
        const playlistId = req.params.id;

        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $addToSet: { songs: songId } },
            { new: true }
        ).populate('songs');

        if (!playlist) return res.status(404).json({ message: "Không tìm thấy playlist" });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi thêm bài hát vào playlist" });
    }
};

// 5. Xóa một bài hát ra khỏi playlist
exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const { songId } = req.body;
        const playlistId = req.params.id;

        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { songs: songId } },
            { new: true }
        ).populate('songs');

        if (!playlist) return res.status(404).json({ message: "Không tìm thấy playlist" });

        res.json({ message: "Đã xóa bài hát khỏi playlist", playlist });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa bài hát khỏi playlist" });
    }
};

// 6. Xóa hoàn toàn một Playlist
exports.deletePlaylist = async (req, res) => {
    try {
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa playlist thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa playlist" });
    }
};