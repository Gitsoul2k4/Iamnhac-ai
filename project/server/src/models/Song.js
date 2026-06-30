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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // === AI AGENT: bổ sung field này ===
  // AdminUpload.jsx ĐÃ có sẵn ô chọn "Thể loại" và đã gửi field "category"
  // lên backend (formData.append('category', ...)) từ trước, nhưng model gốc
  // chưa khai báo field này nên Mongoose âm thầm bỏ qua khi lưu (strict mode).
  // Thêm dòng dưới để dữ liệu "Thể loại" được lưu thật, phục vụ AI Agent
  // thống kê "Thể loại nghe nhiều nhất" (Explicit Feedback).
  category: { type: String, default: 'Khác' }
});

module.exports = mongoose.model('Song', songSchema);
