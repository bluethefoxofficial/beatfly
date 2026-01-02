import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X, Music2, ChevronUp, Mic2 } from 'lucide-react';

/**
 * Parse LRC format lyrics string into an array of { time, text } objects
 * Supports both [mm:ss.xx] and [mm:ss:xx] formats
 */
function parseLRC(lrcString) {
  if (!lrcString) return [];

  const lines = lrcString.split('\n');
  const result = [];
  // Support multiple timestamp formats
  const timeRegex = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

  for (const line of lines) {
    const timestamps = [];
    let match;

    // Find all timestamps in the line (some LRC files have multiple timestamps per line)
    while ((match = timeRegex.exec(line)) !== null) {
      const [, mm, ss, msRaw] = match;
      const minutes = parseInt(mm, 10) || 0;
      const seconds = parseInt(ss, 10) || 0;
      const millis = msRaw ? parseInt(msRaw, 10) : 0;

      // Handle both hundredths (xx) and milliseconds (xxx)
      const totalSeconds = minutes * 60 + seconds + (millis < 100 ? millis / 100 : millis / 1000);
      timestamps.push(totalSeconds);
    }

    // Reset regex lastIndex for next line
    timeRegex.lastIndex = 0;

    // Extract the text content (remove all timestamps)
    const text = line.replace(/\[.*?\]/g, '').trim();

    // Add entry for each timestamp with the same text
    for (const time of timestamps) {
      if (text) {
        result.push({ time, text });
      }
    }
  }

  // Sort by time and remove duplicates
  return result
    .sort((a, b) => a.time - b.time)
    .filter((line, idx, arr) =>
      idx === 0 || line.time !== arr[idx - 1].time || line.text !== arr[idx - 1].text
    );
}

/**
 * Find the current active lyric line index based on playback time
 * Uses binary search for efficiency with large lyric files
 */
function findActiveLine(lyricLines, currentTime, offset = 0) {
  if (!lyricLines.length) return -1;

  const adjustedTime = currentTime + offset;

  // Binary search for efficiency
  let low = 0;
  let high = lyricLines.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyricLines[mid].time <= adjustedTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

const LyricsPanel = ({
  showLyrics,
  setShowLyrics,
  showExpanded,
  lyrics,
  currentTime,
  seek,
  isMobile = false,
}) => {
  const dragControls = useDragControls();
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const lineRefs = useRef([]);
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const [syncOffset, setSyncOffset] = useState(0); // Offset in seconds for manual sync adjustment

  // Parse lyrics with memoization
  const lyricLines = useMemo(() => parseLRC(lyrics), [lyrics]);

  // Find current active line with offset support
  const currentLineIndex = useMemo(
    () => findActiveLine(lyricLines, currentTime, syncOffset),
    [lyricLines, currentTime, syncOffset]
  );

  // Handle user scroll - pause auto-scroll temporarily
  const handleUserScroll = useCallback(() => {
    setUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
    }, 3000); // Resume auto-scroll after 3 seconds of no user scroll
  }, []);

  // Auto-scroll to active line
  useEffect(() => {
    if (!showLyrics || currentLineIndex < 0 || userScrolling) return;

    const activeElement = lineRefs.current[currentLineIndex];
    if (!activeElement || !scrollerRef.current) return;

    // Smooth scroll to center the active line
    const container = scrollerRef.current;
    const containerHeight = container.clientHeight;
    const elementTop = activeElement.offsetTop;
    const elementHeight = activeElement.offsetHeight;
    const scrollTarget = elementTop - (containerHeight / 2) + (elementHeight / 2);

    container.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: 'smooth'
    });
  }, [showLyrics, currentLineIndex, userScrolling]);

  // Handle clicking on a lyric line to seek
  const handleLineClick = useCallback((time) => {
    if (seek && typeof seek === 'function') {
      seek(Math.max(0, time - 0.5)); // Seek slightly before the line starts
    }
  }, [seek]);

  // Drag to close on mobile
  const handleDragEnd = useCallback((_, info) => {
    if (isMobile && info.offset.y > 100) {
      setShowLyrics(false);
    }
  }, [isMobile, setShowLyrics]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Calculate position styles based on context
  const panelStyles = useMemo(() => {
    if (isMobile) {
      return {
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        borderRadius: '24px 24px 0 0',
        marginTop: '10vh'
      };
    }
    if (showExpanded) {
      return {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '380px',
        zIndex: 55,
        borderRadius: '0 0 0 24px'
      };
    }
    return {
      position: 'fixed',
      bottom: '96px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '420px',
      maxHeight: '400px',
      zIndex: 55,
      borderRadius: '20px'
    };
  }, [isMobile, showExpanded]);

  return (
    <AnimatePresence>
      {showLyrics && (
        <motion.div
          ref={containerRef}
          drag={isMobile ? 'y' : false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="overflow-hidden"
          style={{
            ...panelStyles,
            background: 'linear-gradient(180deg, rgba(15,15,25,0.95) 0%, rgba(10,10,18,0.98) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
          initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.95, x: showExpanded ? 50 : 0 }}
          animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, x: 0 }}
          exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.95, x: showExpanded ? 50 : 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-5 pt-4 pb-3"
            style={{
              background: 'linear-gradient(180deg, rgba(15,15,25,1) 0%, rgba(15,15,25,0.95) 80%, transparent 100%)'
            }}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 cursor-grab"
                onPointerDown={(e) => dragControls.start(e)}
              />
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-500/10">
                  <Mic2 size={18} className="text-pink-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Lyrics</h3>
                  {lyricLines.length > 0 && (
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {lyricLines.length} lines • Click to seek
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                onClick={() => setShowLyrics(false)}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>
          </div>

          {/* Lyrics Content */}
          <div
            ref={scrollerRef}
            className="px-5 pb-8 overflow-y-auto"
            style={{
              height: isMobile ? 'calc(100% - 70px)' : showExpanded ? 'calc(100% - 70px)' : '330px',
              scrollBehavior: 'smooth'
            }}
            onScroll={handleUserScroll}
          >
            {lyricLines.length > 0 ? (
              <div className="space-y-1 py-4">
                {/* Top padding for centering first line */}
                <div className="h-20" />

                {lyricLines.map((line, idx) => {
                  const isActive = idx === currentLineIndex;
                  const isPast = idx < currentLineIndex;
                  const isUpcoming = idx > currentLineIndex && idx <= currentLineIndex + 2;

                  return (
                    <motion.div
                      key={`lyric-${idx}-${line.time}`}
                      ref={(el) => (lineRefs.current[idx] = el)}
                      onClick={() => handleLineClick(line.time)}
                      className="py-2 px-3 rounded-xl cursor-pointer transition-all duration-300 select-none"
                      style={{
                        background: isActive ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                      }}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                        x: isActive ? 4 : 0
                      }}
                      whileHover={{
                        backgroundColor: isActive ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255,255,255,0.05)',
                        x: 4
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.p
                        className="leading-relaxed transition-all duration-300"
                        style={{
                          fontSize: isActive ? '18px' : '15px',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive
                            ? '#fff'
                            : isPast
                              ? 'rgba(255,255,255,0.35)'
                              : isUpcoming
                                ? 'rgba(255,255,255,0.7)'
                                : 'rgba(255,255,255,0.5)',
                          textShadow: isActive ? '0 0 30px rgba(236, 72, 153, 0.5)' : 'none'
                        }}
                        animate={{
                          opacity: isActive ? 1 : isPast ? 0.5 : 0.8
                        }}
                      >
                        {line.text}
                      </motion.p>

                      {/* Active line indicator */}
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                          style={{
                            background: 'linear-gradient(180deg, #ec4899, #8b5cf6)'
                          }}
                          layoutId="activeLyricIndicator"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  );
                })}

                {/* Bottom padding for centering last line */}
                <div className="h-40" />
              </div>
            ) : (
              /* Empty state */
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                  <Music2 size={32} className="text-white/30" />
                </div>
                <p className="text-white/50 text-sm font-medium">No lyrics available</p>
                <p className="text-white/30 text-xs mt-1">
                  Lyrics will appear here when available
                </p>
              </div>
            )}
          </div>

          {/* Sync offset control (shown when lyrics are available) */}
          {lyricLines.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setSyncOffset(prev => prev - 0.5)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 text-xs font-medium transition-all"
              >
                -0.5s
              </button>
              <span className="text-white/40 text-xs tabular-nums min-w-[60px] text-center">
                {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s
              </span>
              <button
                onClick={() => setSyncOffset(prev => prev + 0.5)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 text-xs font-medium transition-all"
              >
                +0.5s
              </button>
              {syncOffset !== 0 && (
                <button
                  onClick={() => setSyncOffset(0)}
                  className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-medium transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Custom comparison - only re-render when meaningful changes occur
const arePropsEqual = (prevProps, nextProps) => {
  if (
    prevProps.showLyrics !== nextProps.showLyrics ||
    prevProps.showExpanded !== nextProps.showExpanded ||
    prevProps.lyrics !== nextProps.lyrics ||
    prevProps.isMobile !== nextProps.isMobile
  ) {
    return false;
  }

  // For time updates, only re-render every 200ms for lyrics
  const timeDiff = Math.abs(nextProps.currentTime - prevProps.currentTime);
  if (timeDiff >= 0.2) {
    return false;
  }

  return true;
};

export default React.memo(LyricsPanel, arePropsEqual);
