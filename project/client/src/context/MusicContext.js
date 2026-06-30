import React, { createContext, useState, useRef, useContext } from 'react';
import { logPlay } from '../api/aiApi'; // === AI AGENT: ghi nhận "lượt nghe" (Explicit Feedback) ===

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);

  // Hàm kích hoạt phát nhạc từ bất kỳ đâu (Home, Search, AIRecommendations...)
  const playMusic = (songList, index) => {
    const song = songList[index];
    setSongs(songList);
    setCurrentIndex(index);
    setCurrentSong(song);
    setIsPlaying(true);

    // === GHI NHẬN THÓI QUEN CHO AI AGENT (Nhóm 2 - Explicit Feedback) ===
    // Đây là điểm duy nhất xử lý phát nhạc trong toàn app nên đặt log "play" ở đây
    // để không phải thêm lại ở từng trang (Home, Search, Ranking, Profile...).
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    const userId = loggedInUser?._id || loggedInUser?.id;
    if (userId && song) {
      logPlay({ userId, songId: song._id });
    }
    // Lưu ý: Việc thực hiện audioRef.current.play() sẽ được xử lý bằng useEffect trong GlobalPlayer
  };

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(songs[nextIndex]);
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prevIndex);
    setCurrentSong(songs[prevIndex]);
  };

  return (
    <MusicContext.Provider value={{ 
      songs, currentSong, isPlaying, setIsPlaying, currentIndex, 
      audioRef, playMusic, togglePlay, handleNext, handlePrev 
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
