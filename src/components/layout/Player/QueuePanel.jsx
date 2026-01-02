import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListMusic, Music2, Trash2, Play } from 'lucide-react';
import MusicAPI from '../../../services/api';

/**
 * Desktop Queue Panel - Liquid Glass Design
 * Slide-in panel from the right side
 */
const QueuePanel = ({ queue: rawQueue, showExpanded, setShowQueue, removeFromQueue, clearQueue, showQueue }) => {
  const navigate = useNavigate();
  const [removingIndex, setRemovingIndex] = useState(null);

  // Ensure queue is always an array
  const queue = Array.isArray(rawQueue) ? rawQueue : [];

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showQueue) {
        setShowQueue(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showQueue, setShowQueue]);

  // Handle item removal with animation
  const handleRemoveItem = useCallback((index) => {
    setRemovingIndex(index);
    setTimeout(() => {
      removeFromQueue(index);
      setRemovingIndex(null);
    }, 200);
  }, [removeFromQueue]);

  // Navigate to track or artist
  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <AnimatePresence>
      {showQueue && (
        <motion.div
          className="fixed right-0 top-0 w-80 z-40 flex flex-col overflow-hidden"
          style={{
            bottom: showExpanded ? 0 : '72px',
            background: `
              linear-gradient(180deg,
                rgba(255,255,255,0.08) 0%,
                rgba(255,255,255,0.04) 10%,
                rgba(15,15,28,0.95) 30%,
                rgba(10,10,20,0.98) 100%
              )
            `,
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `
              -20px 0 60px rgba(0,0,0,0.4),
              -4px 0 20px rgba(236,72,153,0.05),
              inset 1px 0 1px rgba(255,255,255,0.1)
            `
          }}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 30
          }}
        >
          {/* Left edge highlight */}
          <div
            className="absolute left-0 inset-y-0 w-px pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)'
            }}
          />

          {/* Header */}
          <div className="relative flex-shrink-0 p-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <ListMusic size={16} className="text-pink-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Queue</h2>
                  <p className="text-[11px] text-white/50">
                    {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={() => setShowQueue(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <X size={16} className="text-white/60" />
              </motion.button>
            </div>

            {/* Divider */}
            <div
              className="mt-3 h-px"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
              }}
            />
          </div>

          {/* Queue content */}
          <div
            className="flex-1 overflow-y-auto px-3 pb-4"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)'
            }}
          >
            {queue.length > 0 ? (
              <div className="space-y-1.5">
                {queue.map((track, index) => {
                  // Skip invalid tracks
                  if (!track || !track.id) return null;

                  return (
                    <motion.div
                      key={`${track.id}-${index}`}
                      className="relative rounded-xl overflow-hidden group"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{
                        opacity: removingIndex === index ? 0 : 1,
                        x: removingIndex === index ? 50 : 0,
                        scale: removingIndex === index ? 0.9 : 1
                      }}
                      transition={{
                        delay: Math.min(index * 0.03, 0.15),
                        type: 'spring',
                        stiffness: 400,
                        damping: 30
                      }}
                    >
                      <motion.div
                        className="relative flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}
                        whileHover={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                        }}
                      >
                        {/* Track number */}
                        <div className="w-5 text-center text-[11px] text-white/30 font-medium">
                          {index + 1}
                        </div>

                        {/* Album art */}
                        <div
                          className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                          style={{
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)'
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
                          {/* Now playing indicator */}
                          {index === 0 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play size={14} className="text-white fill-current" />
                            </div>
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-[13px] text-white truncate hover:text-pink-400 transition-colors"
                            onClick={() => handleNavigate(`/track/${track.id}`)}
                          >
                            {track.title || 'Unknown Track'}
                          </div>
                          <div
                            className="text-[11px] text-white/50 truncate hover:text-white/70 transition-colors"
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
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: 'rgba(255,255,255,0.05)'
                          }}
                          whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.2)' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={14} className="text-white/50 group-hover:text-red-400" />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center h-full py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  className="p-5 rounded-2xl mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <Music2 size={36} className="text-white/20" />
                </div>
                <p className="text-sm font-medium text-white/50">Queue is empty</p>
                <p className="text-xs mt-1 text-white/30">Add tracks to get started</p>
              </motion.div>
            )}
          </div>

          {/* Clear queue button */}
          {queue.length > 0 && (
            <motion.div
              className="flex-shrink-0 p-4 pt-2"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,20,0.9) 100%)'
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                onClick={() => {
                  clearQueue();
                  setTimeout(() => setShowQueue(false), 200);
                }}
                className="w-full py-2.5 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(220,38,38,0.8) 100%)',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.25), inset 0 1px 1px rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(239,68,68,0.35)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 size={15} />
                Clear Queue
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(QueuePanel);
