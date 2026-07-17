// =============================================================================
// mlService.js
//   1) Biểu diễn (Representation Learning): dùng model embedding của Gemini để
//      biến mỗi bài hát ("title - artist - category") và mỗi câu chat của
//      người dùng thành 1 vector số thực nhiều chiều.
//   2) Suy luận (Inference): dùng thuật toán k-Nearest Neighbors — đo độ
//      tương đồng Cosine Similarity giữa vector câu chat và vector từng bài
//      hát ứng viên — để XẾP HẠNG bài hát nào "gần" với ý muốn của người
//      dùng nhất.
//
// Embedding của mỗi bài hát được tính 1 lần rồi LƯU CACHE vào Song.embedding
// (MongoDB) để các lượt chat sau không cần gọi lại API => vừa nhanh vừa tiết
// kiệm quota free-tier.
// =============================================================================

const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;

// Giảm số chiều vector xuống 256 (Matryoshka Representation Learning - model
// gemini-embedding-001 hỗ trợ cắt chiều) để lưu MongoDB nhẹ hơn và so sánh
// nhanh hơn, độ chính xác vẫn đủ tốt cho bài toán so khớp thể loại/tâm trạng.
const EMBEDDING_DIMENSIONS = 256;

/**
 * Gọi Gemini Embedding API để biến 1 đoạn text thành 1 vector số thực.
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
async function embedText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text || !text.trim()) return null;

  try {
    const response = await fetch(`${EMBEDDING_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: text.trim().slice(0, 2000) }] },
        outputDimensionality: EMBEDDING_DIMENSIONS
      })
    });

    if (!response.ok) {
      console.error('[mlService] Embedding API trả lỗi:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return Array.isArray(data?.embedding?.values) ? data.embedding.values : null;
  } catch (err) {
    console.error('[mlService] Lỗi gọi Embedding API:', err.message);
    return null;
  }
}

/**
 * Độ tương đồng Cosine giữa 2 vector cùng chiều -> trong khoảng [-1, 1],
 * càng gần 1 nghĩa là càng "giống nhau" về ngữ nghĩa.
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Đảm bảo mỗi bài hát trong danh sách đã có embedding. Bài nào chưa có
 * (upload từ trước khi có tính năng ML, hoặc lần gọi API upload bị lỗi) sẽ
 * được tính lại và lưu cache vào MongoDB ngay tại đây.
 */
async function ensureEmbeddings(songs, SongModel) {
  for (const song of songs) {
    if (!song.embedding || song.embedding.length === 0) {
      const text = `${song.title} - ${song.artist} - ${song.category || ''}`;
      const vec = await embedText(text);
      if (vec) {
        song.embedding = vec;
        await SongModel.findByIdAndUpdate(song._id, { embedding: vec }).catch(() => {});
      }
    }
  }
  return songs;
}

/**
 * THUẬT TOÁN k-NEAREST NEIGHBORS: nhúng câu chat của người dùng thành vector,
 * rồi xếp hạng danh sách bài hát ứng viên theo Cosine Similarity giảm dần,
 * trả về Top-K bài gần nhất.
 *
 * @param {string} queryText - nội dung chat / ngữ cảnh cần tìm nhạc phù hợp
 * @param {Array} candidateSongs - danh sách bài hát ứng viên (đã lọc sơ bộ theo tiêu chí của Gemini)
 * @param {import('mongoose').Model} SongModel
 * @param {number} topK
 */
async function rankSongsByRelevance(queryText, candidateSongs, SongModel, topK = 12) {
  if (!candidateSongs || candidateSongs.length === 0) return [];

  const queryVec = await embedText(queryText);
  await ensureEmbeddings(candidateSongs, SongModel);

  if (!queryVec) {
    // Không có API key / API lỗi -> không thể chạy bước ML, trả về nguyên
    // thứ tự ứng viên (đã được Gemini lọc theo category/keyword ở bước trước).
    return candidateSongs.slice(0, topK);
  }

  const scored = candidateSongs.map((song) => ({
    song,
    score: cosineSimilarity(queryVec, song.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((s) => s.song);
}

module.exports = {
  embedText,
  cosineSimilarity,
  ensureEmbeddings,
  rankSongsByRelevance
};
