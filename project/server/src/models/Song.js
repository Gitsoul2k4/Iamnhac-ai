const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    songUrl: { type: String, required: true },
    imageUrl: { type: String },
    category: { type: String, default: 'Nhạc trẻ' }, // Thêm để khớp với form upload
    
    // Sửa lỗi: Bỏ required true hoặc thêm default để tránh crash bài hát cũ
    uploaderName: { type: String, default: 'Người dùng IAMNHAC' }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    likes: { type: [String], default: [] }, 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', songSchema);