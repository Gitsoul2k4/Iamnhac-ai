const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const songRoutes = require('./src/routes/songRoutes'); 
const Song = require('./src/models/Song');
const playlistRoutes = require('./src/routes/playlistRoutes');

// 1. Cấu hình môi trường
dotenv.config();

// 2. Kết nối Database
connectDB();

const app = express();

// 3. Middlewares
app.use(cors());
// Tăng giới hạn dung lượng body để nhận file base64 hoặc dữ liệu lớn nếu cần
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Cấu hình static folder (Quan trọng để xem được ảnh và nghe được nhạc)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Định nghĩa Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);

app.use('/api/playlists', playlistRoutes);


// 6. Cấu hình Port (Đổi hẳn sang 5001 để tránh lỗi EADDRINUSE 5000)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📂 Thư mục nhạc: ${path.join(__dirname, 'uploads/music')}`);
});

// 7. Logic vá dữ liệu cũ (Đảm bảo các bài hát cũ không làm crash ứng dụng)
mongoose.connection.once('open', async () => {
    console.log("--- Kiểm tra tính toàn vẹn dữ liệu ---");
    try {
        const result = await Song.updateMany(
            { uploaderName: { $exists: false } }, 
            { $set: { uploaderName: "Thành viên IAMNHAC" } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ Đã cập nhật tên người đăng cho ${result.modifiedCount} bài hát.`);
        }
    } catch (err) {
        console.error("❌ Lỗi vá dữ liệu:", err);
    }
});