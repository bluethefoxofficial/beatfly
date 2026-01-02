import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Heart,
  Music2,
  Volume2,
  VolumeX,
  ListMusic,
  FileText,
  Sliders,
  Maximize2,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1
} from 'lucide-react';

/**
 * Enhanced Mini Player with glass morphism design
 * Optimized for performance with memoization
 */
const MiniPlayer = ({
  currentTrack,
  getTrackImage,
  formatTime,
  currentTime,
  duration,
  seek,
  togglePlay,
  playNext,
  playPrevious,
  toggleShuffle,
  toggleRepeat,
  shuffle,
  repeat,
  loading,
  isPlaying,
  isLiked,
  toggleLike,
  setShowExpanded,
  setShowQueue,
  showQueue,
  volume,
  handleVolumeChange,
  toggleMute,
  isMuted,
  showLyrics,
  setShowLyrics,
  setShowEQ,
  showEQ,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const miniPlayerRef = useRef(null);
  const lastTapRef = useRef(0);

  // Animation states
  const [showHeart, setShowHeart] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  const [touchInfo, setTouchInfo] = useState({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isActive: false
  });

  // Memoized progress calculation
  const progress = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  // Memoized track image with size optimization
  const trackImage = useMemo(() => {
    const base = getTrackImage();
    return isMobile ? `${base}?w=96` : `${base}?w=112`;
  }, [getTrackImage, isMobile]);

  // Navigate without closing player
  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  // Touch handlers for mobile gestures
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    if (!touch) return;
    setTouchInfo({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isActive: true
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchInfo.isActive) return;
    const touch = e.touches[0];
    if (!touch) return;
    setTouchInfo(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
  }, [touchInfo.isActive]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchInfo.isActive) return;

    const deltaX = touchInfo.currentX - touchInfo.startX;
    const deltaY = touchInfo.startY - touchInfo.currentY;
    const touchDuration = Date.now() - touchInfo.startTime;
    const isControl = e.target.closest('.player-control');

    if (!isControl) {
      if (touchDuration < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        setShowExpanded(true);
      } else if (deltaY > 50) {
        setShowExpanded(true);
      } else if (Math.abs(deltaX) > 80 && currentTrack) {
        if (deltaX < 0) {
          playNext();
          setSwipeFeedback('next');
        } else {
          playPrevious();
          setSwipeFeedback('prev');
        }
        setTimeout(() => setSwipeFeedback(null), 300);
      }
    }

    setTouchInfo({
      startX: 0, startY: 0, currentX: 0, currentY: 0, startTime: 0, isActive: false
    });
  }, [touchInfo, currentTrack, setShowExpanded, playNext, playPrevious]);

  // Double tap to like
  const handleDoubleTap = useCallback((e) => {
    if (e.target.closest('.player-control')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300 && currentTrack) {
      toggleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    lastTapRef.current = now;
  }, [currentTrack, toggleLike]);

  // Memoized control button component
  const ControlButton = useMemo(() => {
    return ({ onClick, active, icon: Icon, size = 18, className = '' }) => (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-2 transition-colors ${active ? 'text-pink-500' : 'text-gray-400 hover:text-white'} ${className}`}
      >
        <Icon size={size} className={active ? 'fill-current' : ''} />
      </motion.button>
    );
  }, []);

  // MOBILE LAYOUT - Liquid Glass Design
  if (isMobile) {
    return (
      <motion.div
        ref={miniPlayerRef}
        className="fixed bottom-[80px] left-3 right-3 rounded-[20px] overflow-hidden z-40"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,0.12) 0%,
              rgba(255,255,255,0.05) 40%,
              rgba(236,72,153,0.08) 60%,
              rgba(139,92,246,0.06) 100%
            )
          `,
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.35),
            0 2px 8px rgba(236,72,153,0.1),
            inset 0 1px 1px rgba(255,255,255,0.2),
            inset 0 -1px 1px rgba(0,0,0,0.1)
          `
        }}
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        {/* Liquid glass reflection highlight */}
        <div
          className="absolute inset-x-0 top-0 h-12 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
            borderRadius: '20px 20px 0 0'
          }}
        />

        {/* Swipe indicator */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/25 rounded-full" />

        {/* Content container */}
        <div className="relative h-[60px] px-4 pt-3 flex items-center justify-between">
          {/* Left: Track info */}
          <div className="flex items-center flex-1 min-w-0 mr-3">
            {currentTrack ? (
              <>
                <motion.div
                  className="relative w-11 h-11 rounded-[14px] overflow-hidden flex-shrink-0"
                  style={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={trackImage}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-album-art.png';
                    }}
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="font-semibold text-white text-[13px] truncate drop-shadow-sm">{currentTrack.title}</div>
                  <div className="text-white/60 text-[11px] truncate mt-0.5">{currentTrack.artist}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center text-white/50">
                <Music2 size={18} className="mr-2" />
                <span className="text-sm">No track playing</span>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-0.5">
            {currentTrack && (
              <>
                <motion.button
                  className="player-control p-2.5 rounded-xl"
                  onClick={(e) => { e.stopPropagation(); toggleLike(); }}
                  whileTap={{ scale: 0.85 }}
                  style={{
                    background: isLiked ? 'rgba(236,72,153,0.15)' : 'transparent'
                  }}
                >
                  <Heart size={18} className={isLiked ? 'text-pink-400 fill-current drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'text-white/60'} />
                </motion.button>

                <motion.button
                  className="player-control w-10 h-10 rounded-[14px] flex items-center justify-center mx-1"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,1)'
                  }}
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={17} className="text-black" />
                  ) : (
                    <Play size={17} className="text-black ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  className="player-control p-2.5 rounded-xl"
                  onClick={(e) => { e.stopPropagation(); setShowQueue(true); }}
                  whileTap={{ scale: 0.85 }}
                  style={{
                    background: showQueue ? 'rgba(139,92,246,0.15)' : 'transparent'
                  }}
                >
                  <ListMusic size={18} className={showQueue ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-white/60'} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar - liquid style */}
        {currentTrack && duration > 0 && (
          <div className="h-[3px] bg-white/10 mx-4 mb-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
                boxShadow: '0 0 12px rgba(236,72,153,0.5)',
                width: `${progress}%`
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        {/* Feedback overlays */}
        <AnimatePresence>
          {swipeFeedback && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {swipeFeedback === 'next' ? (
                <SkipForward size={36} className="text-white/70" />
              ) : (
                <SkipBack size={36} className="text-white/70" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHeart && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Heart size={50} className="text-pink-500 fill-current drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // DESKTOP LAYOUT - Liquid Glass Design
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-[72px] z-40"
      style={{
        background: `
          linear-gradient(180deg,
            rgba(255,255,255,0.08) 0%,
            rgba(255,255,255,0.03) 30%,
            rgba(6,9,18,0.9) 100%
          )
        `,
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        boxShadow: `
          0 -8px 32px rgba(0,0,0,0.25),
          inset 0 1px 1px rgba(255,255,255,0.15)
        `
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Top reflection line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)'
        }}
      />

      <div className="h-full max-w-screen-2xl mx-auto px-6 flex items-center">
        {/* Left section - Track info */}
        <div className="w-[30%] flex items-center min-w-0">
          {currentTrack ? (
            <>
              <motion.div
                className="relative group cursor-pointer flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowExpanded(true)}
              >
                <div
                  className="w-12 h-12 rounded-[14px] overflow-hidden"
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <img
                    src={trackImage}
                    alt={currentTrack.title || 'Album Art'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-album-art.png';
                    }}
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Maximize2 size={16} className="text-white drop-shadow-lg" />
                  </div>
                </div>
              </motion.div>

              <div className="ml-3 flex-1 min-w-0 mr-4">
                <div
                  onClick={() => handleNavigate(`/track/${currentTrack.id}`)}
                  className="text-[13px] font-semibold text-white truncate hover:text-pink-400 transition-colors cursor-pointer drop-shadow-sm"
                >
                  {currentTrack.title}
                </div>
                <div
                  onClick={() => handleNavigate(`/profile/${currentTrack.artistId}`)}
                  className="text-[11px] text-white/60 truncate hover:text-white/80 transition-colors cursor-pointer mt-0.5"
                >
                  {currentTrack.artist}
                </div>
              </div>

              <motion.button
                onClick={toggleLike}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: isLiked ? 'rgba(236,72,153,0.15)' : 'transparent'
                }}
              >
                <Heart
                  size={18}
                  className={isLiked ? 'text-pink-400 fill-current drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'text-white/50 hover:text-white/70'}
                />
              </motion.button>
            </>
          ) : (
            <div className="flex items-center text-white/50">
              <Music2 size={18} className="mr-2" />
              <span className="text-sm">Select a track to play</span>
            </div>
          )}
        </div>

        {/* Center section - Playback controls */}
        <div className="w-[40%] flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <motion.button
              onClick={toggleShuffle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-xl transition-all"
              style={{
                background: shuffle ? 'rgba(236,72,153,0.15)' : 'transparent',
                color: shuffle ? '#f472b6' : 'rgba(255,255,255,0.5)'
              }}
              disabled={!currentTrack}
            >
              <Shuffle size={14} className={shuffle ? 'drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]' : ''} />
            </motion.button>

            <motion.button
              onClick={playPrevious}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-white/70 hover:text-white transition-colors p-1"
              disabled={!currentTrack}
            >
              <SkipBack size={18} />
            </motion.button>

            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all"
              style={{
                background: currentTrack
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                  : 'rgba(255,255,255,0.1)',
                boxShadow: currentTrack
                  ? '0 4px 20px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,1)'
                  : 'none',
                cursor: currentTrack ? 'pointer' : 'not-allowed'
              }}
              disabled={!currentTrack || loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} className="text-black" />
              ) : (
                <Play size={18} className="text-black ml-0.5" />
              )}
            </motion.button>

            <motion.button
              onClick={playNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-white/70 hover:text-white transition-colors p-1"
              disabled={!currentTrack}
            >
              <SkipForward size={18} />
            </motion.button>

            <motion.button
              onClick={toggleRepeat}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-xl transition-all"
              style={{
                background: repeat !== 'none' ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: repeat !== 'none' ? '#a78bfa' : 'rgba(255,255,255,0.5)'
              }}
              disabled={!currentTrack}
            >
              {repeat === 'one' ? (
                <Repeat1 size={14} className={repeat !== 'none' ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]' : ''} />
              ) : (
                <Repeat size={14} className={repeat !== 'none' ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]' : ''} />
              )}
            </motion.button>
          </div>

          {/* Seek bar - liquid style */}
          <div className="w-full max-w-md flex items-center gap-2">
            <span className="text-[10px] text-white/50 w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full group cursor-pointer relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
                  boxShadow: '0 0 10px rgba(236,72,153,0.4)',
                  width: `${progress}%`
                }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `calc(${progress}% - 6px)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px rgba(236,72,153,0.3)'
                }}
              />
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                disabled={!currentTrack || !duration}
              />
            </div>
            <span className="text-[10px] text-white/50 w-9 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right section - Additional controls */}
        <div className="w-[30%] flex items-center justify-end gap-1">
          <motion.button
            onClick={() => setShowQueue(!showQueue)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl transition-all"
            style={{
              background: showQueue ? 'rgba(236,72,153,0.15)' : 'transparent',
              color: showQueue ? '#f472b6' : 'rgba(255,255,255,0.5)'
            }}
          >
            <ListMusic size={16} className={showQueue ? 'drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]' : ''} />
          </motion.button>

          <motion.button
            onClick={() => setShowLyrics(!showLyrics)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl transition-all"
            style={{
              background: showLyrics ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: showLyrics ? '#a78bfa' : 'rgba(255,255,255,0.5)'
            }}
          >
            <FileText size={16} className={showLyrics ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]' : ''} />
          </motion.button>

          <motion.button
            onClick={() => setShowEQ(!showEQ)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl transition-all"
            style={{
              background: showEQ ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: showEQ ? '#818cf8' : 'rgba(255,255,255,0.5)'
            }}
          >
            <Sliders size={16} className={showEQ ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]' : ''} />
          </motion.button>

          <div className="w-px h-5 bg-white/10 mx-2" />

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={toggleMute}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-white/50 hover:text-white/70 transition-colors p-1"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </motion.button>

            <div className="w-20 h-1 bg-white/10 rounded-full group cursor-pointer relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${volume * 100}%`,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.8))'
                }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Custom comparison to prevent unnecessary re-renders
// Only re-render if non-time values change OR if time changed significantly (for seek bar smoothness)
const arePropsEqual = (prevProps, nextProps) => {
  // Always update if these change (user interactions)
  if (
    prevProps.currentTrack?.id !== nextProps.currentTrack?.id ||
    prevProps.isPlaying !== nextProps.isPlaying ||
    prevProps.loading !== nextProps.loading ||
    prevProps.isLiked !== nextProps.isLiked ||
    prevProps.shuffle !== nextProps.shuffle ||
    prevProps.repeat !== nextProps.repeat ||
    prevProps.showQueue !== nextProps.showQueue ||
    prevProps.showLyrics !== nextProps.showLyrics ||
    prevProps.showEQ !== nextProps.showEQ ||
    prevProps.volume !== nextProps.volume ||
    prevProps.isMuted !== nextProps.isMuted ||
    prevProps.isMobile !== nextProps.isMobile ||
    prevProps.duration !== nextProps.duration
  ) {
    return false;
  }

  // For time updates, only re-render every 100ms to reduce work
  // This provides smooth UI while preventing excessive re-renders
  const timeDiff = Math.abs(nextProps.currentTime - prevProps.currentTime);
  if (timeDiff >= 0.1) {
    return false;
  }

  return true;
};

export default React.memo(MiniPlayer, arePropsEqual);
