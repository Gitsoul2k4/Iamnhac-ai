// =============================================================================
// audioTranscodeService.js
// Sinh thêm 1 bản nhạc nén ở bitrate thấp (96kbps) từ file gốc vừa upload,
// phục vụ tính năng "Chất lượng âm thanh" ở trình phát nhạc (GlobalPlayer.jsx).
//
// Dùng trực tiếp ffmpeg qua child_process (KHÔNG thêm dependency npm mới) —
// yêu cầu server đã cài đặt ffmpeg (`sudo apt install ffmpeg` trên Linux).
// Nếu máy chủ chưa có ffmpeg, hàm sẽ tự fail êm và trình phát sẽ tự động
// dùng lại file gốc (songUrl) — không ảnh hưởng tới upload bình thường.
// =============================================================================
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOW_QUALITY_DIR = path.join(__dirname, '../../uploads/music_low');
const LOW_QUALITY_BITRATE = '96k';

function ensureLowQualityDir() {
  if (!fs.existsSync(LOW_QUALITY_DIR)) {
    fs.mkdirSync(LOW_QUALITY_DIR, { recursive: true });
  }
}

/**
 * Transcode 1 file nhạc gốc thành bản 96kbps.
 * @param {string} originalAbsPath - đường dẫn tuyệt đối tới file gốc trong uploads/music/
 * @param {string} filename - tên file gốc (dùng để đặt tên file output)
 * @returns {Promise<string|null>} - trả về đường dẫn public "/uploads/music_low/xxx.mp3" hoặc null nếu lỗi
 */
function transcodeToLowQuality(originalAbsPath, filename) {
  return new Promise((resolve) => {
    try {
      ensureLowQualityDir();
      const outputName = filename.replace(/\.[^/.]+$/, '') + '.mp3';
      const outputAbsPath = path.join(LOW_QUALITY_DIR, outputName);

      execFile('ffmpeg', [
        '-y',                 // ghi đè nếu đã tồn tại
        '-i', originalAbsPath,
        '-b:a', LOW_QUALITY_BITRATE,
        '-vn',                // bỏ qua video/ảnh bìa gắn kèm (nếu có) để tránh lỗi codec
        outputAbsPath
      ], { timeout: 120000 }, (err) => {
        if (err) {
          console.error('[audioTranscodeService] Lỗi transcode (có thể do chưa cài ffmpeg):', err.message);
          return resolve(null);
        }
        resolve('/uploads/music_low/' + outputName);
      });
    } catch (err) {
      console.error('[audioTranscodeService] Lỗi không xác định:', err.message);
      resolve(null);
    }
  });
}

module.exports = { transcodeToLowQuality };
