// =============================================================================
// timeContext.js
// NHÓM 1: "Thói quen Thời gian" (Temporal Context)
// KHÔNG cần lưu vào MongoDB - chỉ cần đọc giờ hệ thống ngay lúc người dùng
// request gợi ý là đủ để biết "đang là sáng Thứ Hai" hay "tối Thứ Bảy".
// =============================================================================

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function getTimeSegment(hour) {
  if (hour >= 5 && hour < 11) return 'sáng';
  if (hour >= 11 && hour < 13) return 'trưa';
  if (hour >= 13 && hour < 18) return 'chiều';
  if (hour >= 18 && hour < 22) return 'tối';
  return 'khuya';
}

/**
 * @param {Date} date - mặc định là thời điểm hiện tại
 * @returns {{hour:number, dayOfWeek:number, dayName:string, timeSegment:string, isWeekend:boolean}}
 */
function getTemporalContext(date = new Date()) {
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Chủ Nhật ... 6 = Thứ Bảy
  const dayName = DAY_NAMES[dayOfWeek];
  const timeSegment = getTimeSegment(hour);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return { hour, dayOfWeek, dayName, timeSegment, isWeekend };
}

module.exports = { getTemporalContext };
