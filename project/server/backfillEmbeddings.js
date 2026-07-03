// =============================================================================
// backfillEmbeddings.js
// Script chạy 1 lần (tương tự view_data_tool.js đã có) để tính embedding
// (Machine Learning) cho những bài hát ĐÃ TỒN TẠI trong DB TRƯỚC khi tính
// năng ML này được thêm vào — vì các bài đó chưa có Song.embedding.
//
// Cách chạy (đứng trong thư mục server/):
//   node backfillEmbeddings.js
// =============================================================================
const mongoose = require('mongoose');
const Song = require('./src/models/Song');
const mlService = require('./src/services/mlService');
require('dotenv').config();

(async () => {
  console.log('Dang ket noi Database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('SUCCESS! Dang tim bai hat chua co embedding...');

  const songs = await Song.find({
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }]
  });

  console.log(`Tim thay ${songs.length} bai hat can tinh embedding.`);
  console.log('------------------------------------------------');

  let success = 0, failed = 0;
  for (const song of songs) {
    const text = `${song.title} - ${song.artist} - ${song.category || ''}`;
    const vec = await mlService.embedText(text);
    if (vec) {
      song.embedding = vec;
      await song.save();
      success++;
      console.log(`OK  -> ${song.title} (${song.artist})`);
    } else {
      failed++;
      console.log(`LOI -> ${song.title} (${song.artist}) - kiem tra lai GEMINI_API_KEY`);
    }
  }

  console.log('------------------------------------------------');
  console.log(`Hoan tat! Thanh cong: ${success} | That bai: ${failed}`);
  process.exit(0);
})();
