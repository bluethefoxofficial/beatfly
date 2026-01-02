import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, Heart, Clock, Share2, Plus, ListMusic, Disc, Sparkles, ThumbsDown } from 'lucide-react';
import { useAudio, useCurrentTrack, useIsPlaying, useQueue } from '../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import MusicAPI from '../services/api';

const buildImageUrl = (path, size = 320) => {
  if (!path) return '/default-album-art.png';
  const clean = path.split('?')[0];

  if (clean.startsWith('http')) {
    return clean.includes('?') ? `${clean}&w=${size}` : `${clean}?w=${size}`;
  }

  const filename = clean.split('/').pop();
  return `${MusicAPI.getImage('albumArt', filename)}?w=${size}`;
};

// Enhanced Explicit Icon
const ExplicitIcon = ({ size = 20, className = '' }) => (
  <motion.div
  className={`inline-flex items-center justify-center rounded ${className}`}
  style={{ width: size, height: size }}
  whileHover={{ scale: 1.1 }}
  >
  <span className="bg-gray-400 text-black text-xs font-bold px-1 rounded">E</span>
  </motion.div>
);

// Enhanced MarqueeText with gradient fade
const MarqueeText = ({ text, className = '' }) => {
  const duration = Math.max(20, text.length * 0.3);

  return (
    <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute left-0 top-0 bottom-0 w-12 z-10
    bg-gradient-to-r from-background to-transparent pointer-events-none" />
    <motion.div
    className="flex whitespace-nowrap"
    animate={{ x: [0, "-50%"] }}
    transition={{
      x: { duration, ease: "linear", repeat: Infinity, repeatType: "loop" }
    }}
    >
    <span className="pr-8">{text}</span>
    <span className="pr-8">{text}</span>
    </motion.div>
    <div className="absolute right-0 top-0 bottom-0 w-12 z-10
    bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};

// Enhanced Toast notification
const Toast = ({ message, isVisible }) => (
  <AnimatePresence>
  {isVisible && (
    <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-24 left-1/2 transform -translate-x-1/2
    bg-accent text-white px-6 py-3 rounded-full text-sm
    shadow-2xl z-50 flex items-center gap-2"
    >
    <Sparkles size={16} />
    {message}
    </motion.div>
  )}
  </AnimatePresence>
);

const AlbumDetail = () => {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [artistProfile, setArtistProfile] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [dislikedTracks, setDislikedTracks] = useState(new Set());
  const [hoveredTrack, setHoveredTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const { playTrack, togglePlay, addToQueue } = useAudio();
  const queue = useQueue();
  const [toast, setToast] = useState({ visible: false, message: '' });

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 640;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await MusicAPI.getAlbum(albumId);
        const data = response.data;

        if (cancelled) return;
        setAlbum(data);

        const artistPromise = data.user_id
          ? MusicAPI.getArtistProfile(data.user_id).catch(() => null)
          : Promise.resolve(null);

        const token = localStorage.getItem('token');
        const favouritePromise = token
          ? fetch(
            `https://api.beatfly-music.xyz/xrpc/music/favourite.album/check/${albumId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).then(res => res.ok ? res.json() : null).catch(() => null)
          : Promise.resolve(null);

        const favoriteTracksPromise = MusicAPI.getFavoriteTracks().catch(() => ({ data: { tracks: [] } }));
        const dislikedTracksPromise = MusicAPI.getDislikedTracks().catch(() => ({ data: { tracks: [] } }));

        const [artistResponse, likeData, favoritesResponse, dislikedResponse] = await Promise.all([
          artistPromise,
          favouritePromise,
          favoriteTracksPromise,
          dislikedTracksPromise,
        ]);

        if (cancelled) return;
        if (artistResponse?.data) {
          setArtistProfile(artistResponse.data);
        }
        if (likeData && typeof likeData.isLiked === 'boolean') {
          setIsLiked(!!likeData.isLiked);
        }

        const likedIds = new Set(favoritesResponse.data.tracks.map(t => t.id));
        setLikedTracks(likedIds);

        const dislikedIds = new Set(dislikedResponse.data.tracks.map(t => t.id));
        setDislikedTracks(dislikedIds);
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching album details:', error);
          setError('Failed to load album details');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAlbumDetails();

    return () => {
      cancelled = true;
    };
  }, [albumId]);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const addAlbumToQueue = () => {
    if (album && album.tracks.length > 0) {
      const queuedTracks = album.tracks.map(t => ({
        ...t,
        album_art: t.album_art || album.album_art,
      }));
      addToQueue(queuedTracks);
      showToast(`Added ${album.tracks.length} tracks to queue`);
    }
  };

  const addTrackToQueue = (track, event) => {
    event.stopPropagation();
    addToQueue({
      ...track,
      album_art: track.album_art || album?.album_art,
    });
    showToast(`Added "${track.title}" to queue`);
  };

  const heroArt = useMemo(
    () => buildImageUrl(album?.album_art, 420),
    [album?.album_art]
  );

  const coverArt = useMemo(
    () => buildImageUrl(album?.album_art, 232),
    [album?.album_art]
  );

  const tracks = useMemo(
    () => (album?.tracks || []).map((t) => ({
      ...t,
      album_art: t.album_art || album?.album_art,
    })),
    [album]
  );

  const formatDuration = (value) => {
    if (!value) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const toggleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Log in to manage favorites');
        return;
      }

      if (isLiked) {
        await MusicAPI.unfavoriteAlbum(albumId);
      } else {
        await MusicAPI.favoriteAlbum(albumId);
      }

      setIsLiked(prev => !prev);
      showToast(isLiked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Could not update favorite');
    }
  };

  const toggleLikeTrack = async (trackId, event) => {
    event.stopPropagation();
    try {
        if (likedTracks.has(trackId)) {
            await MusicAPI.unfavoriteTrack(trackId);
            setLikedTracks(prev => {
                const newSet = new Set(prev);
                newSet.delete(trackId);
                return newSet;
            });
            showToast('Removed from favorites');
        } else {
            await MusicAPI.favoriteTrack(trackId);
            setLikedTracks(prev => new Set(prev).add(trackId));
            showToast('Added to favorites');
        }
    } catch (err) {
        console.error('Error toggling like:', err);
    }
  };

  const toggleDislike = async (trackId, event) => {
    event.stopPropagation();
    try {
      if (dislikedTracks.has(trackId)) {
        await MusicAPI.removeDislike(trackId);
        setDislikedTracks(prev => {
            const newSet = new Set(prev);
            newSet.delete(trackId);
            return newSet;
        });
        showToast('Removed from dislikes');
      } else {
        await MusicAPI.dislikeTrack(trackId);
        setDislikedTracks(prev => new Set(prev).add(trackId));
        showToast('Added to dislikes');
      }
    } catch (err) {
      console.error('Error toggling dislike:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: album.title,
        text: `Check out ${album.title} by ${album.artist}`,
        url: window.location.href
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
      <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
      <Disc className="w-12 h-12 text-accent" />
      </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-400">Album not found</p>
      </div>
    );
  }

  const isAlbumPlaying = currentTrack && album.tracks.some(track => track.id === currentTrack.id) && isPlaying;

  return (
    <motion.div
    className="flex-1 overflow-auto"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    >
    {/* Album Header - Fixed spacing */}
    <div className="relative">
    {/* Background Image with Blur */}
    <div className="absolute inset-0 h-96">
    <img
    src={heroArt}
    alt=""
    className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 backdrop-blur-3xl bg-black/60" />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
    </div>

    {/* Content Container */}
    <div className="relative pt-32 pb-8 px-8">
    <div className="flex items-end gap-8 max-w-screen-2xl mx-auto">
    {/* Album Cover */}
    <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 100 }}
    className="flex-shrink-0"
    >
    <img
    src={coverArt}
    alt={album.title}
    className="w-56 h-56 shadow-2xl rounded"
    />
    </motion.div>

    {/* Album Info */}
    <div className="flex-1 mb-2">
    <motion.p
    className="text-sm font-medium text-white/80 mb-2"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    >
    Album
    </motion.p>

    <motion.h1
    className="text-6xl font-bold text-white mb-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    >
    {album.title}
    {album.isExplicit && (
      <ExplicitIcon size={24} className="ml-4 inline-block align-middle" />
    )}
    </motion.h1>

    <motion.div
    className="flex items-center gap-2 text-sm text-white/80"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    >
    {artistProfile?.profile_pic && (
      <img
      src={artistProfile.profile_pic + "?h=24"}
      alt={artistProfile.stage_name || album.artist}
      className="w-6 h-6 rounded-full"
      />
    )}
    {artistProfile ? (
      <Link
      to={`/profile/${artistProfile.user_id}`}
      className="font-semibold hover:underline"
      >
      {artistProfile.stage_name}
      </Link>
    ) : (
      <span className="font-semibold">{album.artist}</span>
    )}
    <span className="text-white/60">•</span>
    <span className="text-white/60">{new Date(album.created_at).getFullYear()}</span>
    <span className="text-white/60">•</span>
    <span className="text-white/60">{album.tracks.length} songs</span>
    </motion.div>
    </div>
    </div>
    </div>
    </div>

    {/* Controls Section */}
    <div className="px-8 py-4">
    <div className="max-w-screen-2xl mx-auto flex items-center gap-8">
    <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => {
      if (isAlbumPlaying) {
        togglePlay();
      } else if (album.tracks.length > 0) {
        playTrack(album.tracks[0]);
      }
    }}
    className="w-14 h-14 bg-accent rounded-full flex items-center justify-center
    shadow-lg hover:bg-accent/90 transition-colors"
    >
    {isAlbumPlaying ? (
      <Pause size={24} className="text-black" />
    ) : (
      <Play size={24} className="text-black ml-0.5" />
    )}
    </motion.button>

    <motion.button
    onClick={toggleLike}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className={`p-2 ${isLiked ? 'text-accent' : 'text-gray-400 hover:text-white'} transition-colors`}
    >
    <Heart size={32} fill={isLiked ? 'currentColor' : 'none'} />
    </motion.button>

    <motion.button
    onClick={addAlbumToQueue}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="p-2 text-gray-400 hover:text-white transition-colors"
    title="Add album to queue"
    >
    <ListMusic size={32} />
    </motion.button>

    <motion.button
    onClick={handleShare}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="p-2 text-gray-400 hover:text-white transition-colors"
    title="Share album"
    >
    <Share2 size={32} />
    </motion.button>
    </div>
    </div>

    {/* Track List */}
    <div className="px-8 pb-8">
    <div className="max-w-screen-2xl mx-auto">
    {/* Track List Header */}
    <div className="grid grid-cols-[16px_4fr_2fr_minmax(120px,1fr)] gap-4 px-4 py-2
    border-b border-white/10 text-sm text-gray-400 mb-2">
    <div>#</div>
    <div>Title</div>
    <div>Artist</div>
    <div className="text-right pr-8">
    <Clock size={16} className="inline" />
    </div>
    </div>

    {/* Tracks */}
    <div>
    {tracks.map((track, index) => (
      <motion.div
      key={track.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onMouseEnter={() => setHoveredTrack(track.id)}
      onMouseLeave={() => setHoveredTrack(null)}
      onClick={() => playTrack(track)}
      className={`grid grid-cols-[16px_4fr_2fr_minmax(120px,1fr)] gap-4 px-4 py-2
        rounded hover:bg-white/10 group cursor-pointer transition-colors
        ${currentTrack?.id === track.id ? 'text-accent' : ''}`}
        >
        <div className="flex items-center justify-center text-sm">
        {hoveredTrack === track.id ? (
          <button
          onClick={(e) => {
            e.stopPropagation();
            currentTrack?.id === track.id ? togglePlay() : playTrack(track);
          }}
          >
          {currentTrack?.id === track.id && isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
          </button>
        ) : currentTrack?.id === track.id && isPlaying ? (
          <div className="flex gap-0.5">
          <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse" />
          <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse delay-75" />
          <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse delay-150" />
          </div>
        ) : (
          <span className="text-gray-400">{index + 1}</span>
        )}
        </div>

        <div className="flex items-center min-w-0">
        <span className={`truncate ${currentTrack?.id === track.id ? 'text-accent' : ''}`}>
        {track.title}
        </span>
        </div>

        <div className="flex items-center text-gray-400 min-w-0">
        <span className="truncate">{track.artist}</span>
        </div>

        <div className="flex items-center justify-between text-gray-400 text-sm">
        <span>{formatDuration(track.duration)}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <button
                onClick={(e) => toggleLikeTrack(track.id, e)}
                className={`p-2 ${likedTracks.has(track.id) ? 'text-accent' : ''}`}
            >
                <Heart size={16} fill={likedTracks.has(track.id) ? 'currentColor' : 'none'} />
            </button>
            <button
                onClick={(e) => toggleDislike(track.id, e)}
                className={`p-2 ${dislikedTracks.has(track.id) ? 'text-red-500' : ''}`}
            >
                <ThumbsDown size={16} fill={dislikedTracks.has(track.id) ? 'currentColor' : 'none'} />
            </button>
            <button
                onClick={(e) => addTrackToQueue(track, e)}
                className="p-2"
            >
                <Plus size={16} />
            </button>
        </div>
        </div>
        </motion.div>
    ))}
    </div>

    {/* Album Info Section */}
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
      <div>
        <h3 className="text-white/60 mb-2">Released</h3>
        <p className="text-white">
          {new Date(album.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {album.description && (
        <div>
          <h3 className="text-white/60 mb-2">About Album</h3>
          <p className="text-white/80 leading-relaxed">{album.description}</p>
        </div>
      )}

      {artistProfile?.bio && (
        <div>
          <h3 className="text-white/60 mb-2">About the Artist ({artistProfile.stage_name})</h3>
          <p className="text-white/80 leading-relaxed">{artistProfile.bio}</p>
        </div>
      )}
    </div>
    </div>
    </div>

    <Toast message={toast.message} isVisible={toast.visible} />
    </motion.div>
  );
};

export default React.memo(AlbumDetail);
