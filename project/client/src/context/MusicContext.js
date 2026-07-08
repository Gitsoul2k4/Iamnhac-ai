import React, { createContext, useState, useRef, useContext } from 'react';
// === AI AGENT: đã bỏ import logPlay — không còn theo dõi lượt nghe nữa ===

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);

  // Hàm kích hoạt phát nhạc từ bất kỳ đâu (Home, Search, bubble chat AI Agent...)
  const playMusic = (songList, index) => {
    const song = songList[index];
    setSongs(songList);
    setCurrentIndex(index);
    setCurrentSong(song);
    setIsPlaying(true);
    // Lưu ý: audioRef.current.play() sẽ được xử lý bằng useEffect trong GlobalPlayer
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

  const updatePlaylist = (nextSongs = []) => {
    setSongs(nextSongs);

    if (nextSongs.length === 0) {
      setCurrentIndex(-1);
      setCurrentSong(null);
      setIsPlaying(false);
      return;
    }

    const currentSongIndex = currentSong
      ? nextSongs.findIndex((song) => song._id === currentSong._id)
      : -1;
    if (currentSongIndex !== -1) {
      setCurrentIndex(currentSongIndex);
      return;
    }

    const fallbackIndex = Math.min(Math.max(currentIndex, 0), nextSongs.length - 1);
    setCurrentIndex(fallbackIndex);
    setCurrentSong(nextSongs[fallbackIndex]);
  };

  return (
    <MusicContext.Provider value={{
      songs, currentSong, isPlaying, setIsPlaying, currentIndex,
      audioRef, playMusic, togglePlay, handleNext, handlePrev, updatePlaylist
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
