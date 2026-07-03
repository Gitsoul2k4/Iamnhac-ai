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
  category: { type: String, default: 'Khác' },

  // === MACHINE LEARNING (mới) ===
  // Vector embedding (nhúng ngữ nghĩa) của "title - artist - category", được
  // tính bằng Gemini Embedding API và LƯU CACHE lại ở đây để không phải gọi
  // API lại mỗi lần gợi ý. AI Agent dùng vector này để so khớp bằng thuật
  // toán Cosine Similarity / k-Nearest Neighbors với ngữ cảnh chat của người
  // dùng (xem server/src/services/mlService.js).
  embedding: { type: [Number], default: [] }
});

module.exports = mongoose.model('Song', songSchema);
