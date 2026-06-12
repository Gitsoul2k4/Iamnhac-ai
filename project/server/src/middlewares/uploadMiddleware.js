const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục tồn tại, nếu không có thì tự tạo
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(uploadDir + 'music')) fs.mkdirSync(uploadDir + 'music');
if (!fs.existsSync(uploadDir + 'images')) fs.mkdirSync(uploadDir + 'images');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'songFile') {
            cb(null, 'uploads/music/');
        } else {
            cb(null, 'uploads/images/');
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // Giới hạn 20MB cho file nhạc
});

module.exports = upload;