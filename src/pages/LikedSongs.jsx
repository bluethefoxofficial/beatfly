import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, Heart, Music2, Loader2 } from 'lucide-react';
import { useAudio, useCurrentTrack, useIsPlaying } from '../contexts/AudioContext';
import MusicAPI from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../components/layout/MainLayout';

// Helper to build proper image URL from stored path
const buildImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  if (imagePath.startsWith('http')) return imagePath;
  const filename = imagePath.includes('/')
    ? imagePath.substring(imagePath.lastIndexOf('/') + 1)
    : imagePath;
  return `https://api.beatfly-music.xyz/xrpc/images/albumArt/${filename}`;
};

const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Track Row Component
const TrackRow = ({ song, index, isMobile }) => {
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const { playTrack, togglePlay } = useAudio();

  const isCurrentTrack = currentTrack?.id === song.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(song);
    }
  };

  const imageUrl = buildImageUrl(song.track_image);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => playTrack(song)}
      className={`group flex items-center gap-3 ${isMobile ? 'p-3' : 'p-4'} rounded-xl
        bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10
        backdrop-blur-sm cursor-pointer transition-all duration-200
        ${isCurrentTrack ? 'bg-accent/10 border-accent/20' : ''}`}
    >
      {/* Track Number / Play Button */}
      <div className={`${isMobile ? 'w-6' : 'w-8'} flex-shrink-0 text-center`}>
        {isCurrentlyPlaying ? (
          <div className="flex items-center justify-center gap-0.5">
            <span className="w-1 h-4 bg-accent rounded-full animate-pulse" />
            <span className="w-1 h-3 bg-accent rounded-full animate-pulse delay-75" />
            <span className="w-1 h-4 bg-accent rounded-full animate-pulse delay-150" />
          </div>
        ) : (
          <>
            <span className="text-white/40 text-sm group-hover:hidden">{index + 1}</span>
            <button onClick={handlePlay} className="hidden group-hover:block">
              <Play size={16} className="text-white mx-auto" fill="white" />
            </button>
          </>
        )}
      </div>

      {/* Album Art */}
      <div className={`relative ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} flex-shrink-0 rounded-lg overflow-hidden`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`${imageUrl ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-accent/30 to-purple-600/30 flex items-center justify-center`}>
          <Music2 size={isMobile ? 16 : 20} className="text-white/60" />
        </div>

        {/* Play overlay on hover */}
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCurrentlyPlaying ? (
            <Pause size={20} fill="white" className="text-white" />
          ) : (
            <Play size={20} fill="white" className="text-white" />
          )}
        </button>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isMobile ? 'text-sm' : ''} ${isCurrentTrack ? 'text-accent' : 'text-white'}`}>
          {song.title}
        </div>
        <div className={`text-white/50 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {song.artist}
        </div>
      </div>

      {/* Album (desktop only) */}
      {!isMobile && (
        <div className="hidden md:block w-1/4 truncate text-white/40 text-sm">
          {song.album || 'Unknown Album'}
        </div>
      )}

      {/* Date Added (desktop only) */}
      {!isMobile && (
        <div className="hidden lg:block w-32 text-white/40 text-sm">
          {song.dateAdded}
        </div>
      )}

      {/* Duration */}
      <div className={`text-white/40 ${isMobile ? 'text-xs' : 'text-sm'} flex-shrink-0`}>
        {song.duration}
      </div>
    </motion.div>
  );
};

const LikedSongs = () => {
  const { isMobile } = useResponsive();
  const { playTrack, setQueue } = useAudio();
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  const fetchLikedSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await MusicAPI.getFavoriteTracks();
      if (response.data && response.data.tracks) {
        const formattedTracks = response.data.tracks.map(track => ({
          ...track,
          dateAdded: formatDate(track.created_at),
          duration: formatDuration(track.duration),
          album: track.album_title || 'Unknown Album'
        }));
        setLikedSongs(formattedTracks);
      }
    } catch (err) {
      console.error('Error fetching liked songs:', err);
      setError('Failed to load liked songs');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs);
      playTrack(likedSongs[0]);
    }
  };

  const handleShuffle = () => {
    if (likedSongs.length > 0) {
      const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      playTrack(shuffled[0]);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Header with Glass Styling */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/30 via-accent/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />

        <div className={`relative z-10 ${isMobile ? 'px-4 pt-6 pb-4' : 'px-6 lg:px-8 pt-8 pb-6'}`}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMobile ? 'flex-col gap-4' : 'items-end gap-6'} mb-6`}
            >
              {/* Liked Songs Icon - Glass Card */}
              <div className={`${isMobile ? 'w-32 h-32 mx-auto' : 'w-48 h-48'} glass-hero rounded-2xl bg-gradient-to-br from-pink-500/40 to-purple-600/40 flex items-center justify-center shadow-2xl`}>
                <Heart size={isMobile ? 48 : 72} className="text-white drop-shadow-lg" fill="white" />
              </div>

              <div className={`${isMobile ? 'text-center' : ''} flex-1`}>
                <p className={`text-white/50 ${isMobile ? 'text-xs' : 'text-sm'} font-medium uppercase tracking-wider mb-1`}>
                  Playlist
                </p>
                <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl lg:text-5xl'} font-bold text-white mb-2`}>
                  Liked Songs
                </h1>
                <p className={`text-white/50 ${isMobile ? 'text-sm' : ''}`}>
                  {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            {likedSongs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={handlePlayAll}
                  className={`flex items-center gap-2 ${isMobile ? 'px-5 py-2.5 text-sm' : 'px-6 py-3'} rounded-full bg-accent hover:bg-accent/90 text-white font-medium transition-all shadow-lg shadow-accent/25`}
                >
                  <Play size={isMobile ? 18 : 20} fill="white" />
                  Play All
                </button>
                <button
                  onClick={handleShuffle}
                  className={`flex items-center gap-2 ${isMobile ? 'px-5 py-2.5 text-sm' : 'px-6 py-3'} rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all backdrop-blur-sm`}
                >
                  Shuffle
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${isMobile ? 'px-4' : 'px-6 lg:px-8'} mt-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                <Heart size={24} className="absolute inset-0 m-auto text-accent" />
              </div>
              <p className="mt-4 text-white/50">Loading your liked songs...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Heart size={32} className="text-red-400" />
              </div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchLikedSongs}
                className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && likedSongs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Heart size={40} className="text-white/20" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No liked songs yet</h3>
              <p className="text-white/50 max-w-md mx-auto">
                Start exploring and tap the heart icon on songs you love to add them here.
              </p>
            </motion.div>
          )}

          {/* Track List */}
          {!loading && !error && likedSongs.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              {/* Header (desktop only) */}
              {!isMobile && (
                <div className="hidden md:grid md:grid-cols-[auto,3fr,1fr,auto] lg:grid-cols-[auto,3fr,1fr,8rem,auto] gap-4 px-4 py-3 text-sm text-white/40 border-b border-white/10 bg-white/5">
                  <div className="w-8 text-center">#</div>
                  <div>Title</div>
                  <div className="hidden md:block">Album</div>
                  <div className="hidden lg:block">Date Added</div>
                  <div className="flex justify-end pr-2">
                    <Clock size={16} />
                  </div>
                </div>
              )}

              {/* Tracks */}
              <div className={`${isMobile ? 'p-2' : 'p-2'} space-y-1`}>
                <AnimatePresence>
                  {likedSongs.map((song, index) => (
                    <TrackRow
                      key={song.id}
                      song={song}
                      index={index}
                      isMobile={isMobile}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikedSongs;
