import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, ListMusic, ChevronDown, Music2, Trash2, Play } from 'lucide-react';
import MusicAPI from '../../../services/api';

/**
 * Mobile Queue Panel - Liquid Glass Design
 * Full-screen bottom sheet with swipe gestures
 */
const MobileQueuePanel = ({ queue: rawQueue, showQueue, setShowQueue, removeFromQueue, clearQueue }) => {
  const dragControls = useDragControls();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipingIndex, setSwipingIndex] = useState(null);

  // Ensure queue is always an array
  const queue = Array.isArray(rawQueue) ? rawQueue : [];

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (showQueue) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [showQueue]);

  // Handle back button on Android
  useEffect(() => {
    if (!showQueue) return;

    const handleBackButton = (e) => {
      e.preventDefault();
      setShowQueue(false);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [showQueue, setShowQueue]);

  // Navigate and close panel
  const handleNavigate = useCallback((path) => {
    setShowQueue(false);
    setTimeout(() => navigate(path), 150);
  }, [navigate, setShowQueue]);

  // Close panel
  const closePanel = useCallback(() => {
    setShowQueue(false);
  }, [setShowQueue]);

  // Handle drag end on panel
  const handleDragEnd = useCallback((e, info) => {
    setIsDragging(false);
    if (info.offset.y > 100 || info.velocity.y > 500) {
      closePanel();
    }
  }, [closePanel]);

  // Handle item removal with animation
  const handleRemoveItem = useCallback((index) => {
    setSwipingIndex(index);
    setTimeout(() => {
      removeFromQueue(index);
      setSwipingIndex(null);
    }, 200);
  }, [removeFromQueue]);

  // Handle swipe on queue item
  const handleSwipeItem = useCallback((index, info) => {
    if (info.offset.x < -80 || info.velocity.x < -400) {
      handleRemoveItem(index);
    }
  }, [handleRemoveItem]);

  if (!showQueue) return null;

  return (
    <AnimatePresence mode="wait">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={closePanel}
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />

      {/* Panel */}
      <motion.div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          maxHeight: '85vh',
          borderRadius: '28px 28px 0 0',
          background: `
            linear-gradient(180deg,
              rgba(255,255,255,0.12) 0%,
              rgba(255,255,255,0.06) 10%,
              rgba(20,20,35,0.95) 30%,
              rgba(15,15,25,0.98) 100%
            )
          `,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderBottom: 'none',
          boxShadow: `
            0 -20px 60px rgba(0,0,0,0.5),
            0 -4px 20px rgba(236,72,153,0.1),
            inset 0 1px 1px rgba(255,255,255,0.15)
          `
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 350
        }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {/* Top reflection highlight */}
        <div
          className="absolute inset-x-0 top-0 h-20 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
            borderRadius: '28px 28px 0 0'
          }}
        />

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <motion.div
            className="w-10 h-1 rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)'
            }}
            whileHover={{ scaleX: 1.2 }}
          />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
              }}
            >
              <ListMusic size={18} className="text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Queue</h2>
              <p className="text-xs text-white/50">
                {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </div>

          <motion.button
            onClick={closePanel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <ChevronDown size={20} className="text-white/60" />
          </motion.button>
        </div>

        {/* Divider */}
        <div
          className="mx-5 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent 100%)'
          }}
        />

        {/* Queue content */}
        <div
          className={`flex-1 overflow-y-auto overscroll-contain ${isDragging ? 'pointer-events-none' : ''}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)'
          }}
        >
          <div className="px-4 py-4 pb-32">
            {queue.length > 0 ? (
              <div className="space-y-2">
                {queue.map((track, index) => {
                  // Skip invalid tracks
                  if (!track || !track.id) return null;

                  return (
                    <motion.div
                      key={`${track.id}-${index}`}
                      className="relative overflow-hidden rounded-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: swipingIndex === index ? 0 : 1,
                        x: swipingIndex === index ? -100 : 0,
                        scale: swipingIndex === index ? 0.9 : 1
                      }}
                      transition={{
                        delay: Math.min(index * 0.04, 0.2),
                        type: 'spring',
                        stiffness: 400,
                        damping: 30
                      }}
                    >
                      {/* Swipe delete indicator */}
                      <div
                        className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.3) 100%)'
                        }}
                      >
                        <Trash2 size={20} className="text-red-400" />
                      </div>

                      {/* Track item */}
                      <motion.div
                        className="relative flex items-center gap-3 p-3 rounded-2xl"
                        style={{
                          background: `
                            linear-gradient(135deg,
                              rgba(255,255,255,0.08) 0%,
                              rgba(255,255,255,0.03) 100%
                            )
                          `,
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
                        }}
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(e, info) => handleSwipeItem(index, info)}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Track number */}
                        <div className="w-6 text-center text-sm text-white/30 font-medium">
                          {index + 1}
                        </div>

                        {/* Album art */}
                        <div
                          className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                          style={{
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)'
                          }}
                        >
                          <img
                            src={
                              track.track_image
                                ? MusicAPI.getImage('albumArt', track.track_image)
                                : '/default-album-art.png'
                            }
                            alt={track.title || 'Track'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/default-album-art.png';
                            }}
                            draggable="false"
                          />
                          {/* Playing indicator for first track */}
                          {index === 0 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play size={16} className="text-white fill-current" />
                            </div>
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold text-[14px] text-white truncate"
                            onClick={() => handleNavigate(`/track/${track.id}`)}
                          >
                            {track.title || 'Unknown Track'}
                          </div>
                          <div
                            className="text-[12px] text-white/50 truncate mt-0.5"
                            onClick={() => track.artistId && handleNavigate(`/profile/${track.artistId}`)}
                          >
                            {track.artist || 'Unknown Artist'}
                          </div>
                        </div>

                        {/* Remove button */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(index);
                          }}
                          className="p-2 rounded-xl"
                          style={{
                            background: 'rgba(255,255,255,0.05)'
                          }}
                          whileTap={{ scale: 0.85 }}
                        >
                          <X size={16} className="text-white/40" />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  className="p-6 rounded-3xl mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <Music2 size={48} className="text-white/20" />
                </div>
                <p className="text-base font-medium text-white/60">Queue is empty</p>
                <p className="text-sm mt-2 text-white/30">Add tracks to start listening</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Clear queue button */}
        {queue.length > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-5 pt-8"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(15,15,25,0.95) 30%, rgba(15,15,25,1) 100%)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => {
                clearQueue();
                setTimeout(closePanel, 200);
              }}
              className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.9) 0%, rgba(220,38,38,0.9) 100%)',
                boxShadow: '0 8px 24px rgba(239,68,68,0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={18} />
              Clear Queue
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(MobileQueuePanel);
