// =============================================================================
// backfillLowQuality.js
// Script chạy 1 lần (tương tự backfillEmbeddings.js) để tạo bản nhạc 96kbps
// cho những bài hát ĐÃ TỒN TẠI trong DB TRƯỚC khi tính năng "Chất lượng âm
// thanh" được thêm vào — vì các bài đó chưa có Song.songUrlLow.
//
// Yêu cầu: server đã cài ffmpeg (`sudo apt install ffmpeg`).
//
// Cách chạy (đứng trong thư mục server/):
//   node backfillLowQuality.js
// =============================================================================
const mongoose = require('mongoose');
const path = require('path');
const Song = require('./src/models/Song');
const audioTranscodeService = require('./src/services/audioTranscodeService');
require('dotenv').config();

(async () => {
  console.log('Dang ket noi Database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('SUCCESS! Dang tim bai hat chua co ban chat luong thap...');

  const songs = await Song.find({
    $or: [{ songUrlLow: { $exists: false } }, { songUrlLow: '' }]
  });

  console.log(`Tim thay ${songs.length} bai hat can transcode.`);
  console.log('------------------------------------------------');

  let success = 0, failed = 0;
  for (const song of songs) {
    if (!song.songUrl) { failed++; continue; }
    // songUrl luu dang "/uploads/music/xxx.mp3" -> quy doi ve duong dan tuyet doi tren dia
    const relativePath = song.songUrl.replace(/^\/uploads\//, '');
    const originalAbsPath = path.join(__dirname, 'uploads', relativePath);
    const filename = path.basename(originalAbsPath);

    const lowUrl = await audioTranscodeService.transcodeToLowQuality(originalAbsPath, filename);
    if (lowUrl) {
      song.songUrlLow = lowUrl;
      await song.save();
      success++;
      console.log(`OK  -> ${song.title} (${song.artist})`);
    } else {
      failed++;
      console.log(`LOI -> ${song.title} (${song.artist}) - kiem tra file goc / cai dat ffmpeg`);
    }
  }

  console.log('------------------------------------------------');
  console.log(`Hoan tat! Thanh cong: ${success} | That bai: ${failed}`);
  process.exit(0);
})();
