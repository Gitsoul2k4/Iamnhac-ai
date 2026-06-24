const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const songRoutes = require('./src/routes/songRoutes'); // Kiểm tra dòng này

dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());

// Cho phép truy cập thư mục uploads từ trình duyệt
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes); // Đảm bảo CÓ dòng này để nhận file upload

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server dang chay tai port ' + PORT));