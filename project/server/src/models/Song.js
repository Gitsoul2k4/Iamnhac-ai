const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    songUrl: { type: String, required: true },
    imageUrl: { type: String },
    // THÊM 2 DÒNG NÀY ĐỂ LIÊN KẾT PROFILE
    
    uploaderName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [String], default: [] }, // PHẢI CÓ DÒNG NÀY
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Song', songSchema);
