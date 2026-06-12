import React, { createContext, useState, useRef, useContext, useEffect } from 'react';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);

  // --- LOGIC QUAN TRỌNG: TỰ ĐỘNG PHÁT KHI ĐỔI BÀI ---
  useEffect(() => {
    if (currentSong && isPlaying && audioRef.current) {
      // Khi currentSong thay đổi, trình duyệt cần một chút thời gian để load src mới
      // Sử dụng play() trong một Promise để tránh lỗi "The play() request was interrupted"
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Auto-play bị chặn bởi trình duyệt:", error);
          setIsPlaying(false); // Nếu lỗi thì chuyển trạng thái về pause
        });
      }
    }
  }, [currentSong]); // Chạy mỗi khi đổi bài hát (Next, Prev hoặc chọn bài mới)

  // Hàm kích hoạt phát nhạc
  const playMusic = (songList, index) => {
    if (!songList || songList.length === 0) return;
    
    setSongs(songList);
    setCurrentIndex(index);
    setCurrentSong(songList[index]);
    setIsPlaying(true);
    
    // Lưu ý: Không gọi audioRef.current.play() ở đây vì useEffect ở trên sẽ lo việc đó
  };

  const togglePlay = () => {
    if (!currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Lỗi khi nhấn Play:", err));
    }
  };

  // context/MusicContext.js
const toggleLikeGlobal = async (songId) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return alert("Vui lòng đăng nhập!");

  try {
    const res = await axios.put('http://localhost:5000/api/songs/like', {
      songId: songId,
      userId: user._id || user.id
    });

    // QUAN TRỌNG: Cập nhật state favorites của Context từ dữ liệu server trả về
    if (res.data && res.data.favorites) {
      setFavorites(res.data.favorites); 
      return res.data; // Trả về data để component dùng nếu cần
    }
  } catch (err) {
    console.error("Lỗi khi like:", err);
  }
};

  const handleNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true); // Đảm bảo luôn bật trạng thái phát
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prevIndex);
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  // Hàm bổ sung: Cập nhật danh sách nhạc mà không làm gián đoạn bài đang phát 
  // (Hữu ích khi bạn xóa bài hát khỏi danh sách chờ/playlist)
  const updatePlaylist = (newSongs) => {
    setSongs(newSongs);
    // Cập nhật lại currentIndex dựa trên bài đang phát
    const newIdx = newSongs.findIndex(s => s._id === currentSong?._id);
    setCurrentIndex(newIdx);
  };

  return (
    <MusicContext.Provider value={{ 
      songs, currentSong, isPlaying, setIsPlaying, currentIndex, 
      audioRef, playMusic, togglePlay, handleNext, handlePrev, updatePlaylist, toggleLikeGlobal
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);