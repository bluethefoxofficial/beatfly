import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, Sun, Coffee, Sunset, Moon, Cloud,
  Search as SearchIcon, ListMusic, Heart, Sparkles
} from 'lucide-react';
import { useAudio, useCurrentTrack, useIsPlaying } from '../contexts/AudioContext';
import { useNavigate } from 'react-router-dom';
import MusicAPI from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Fixed MarqueeText with stable animation
const MarqueeText = ({ text, className = '', speed = 30 }) => {
  // Use a stable key to prevent re-mounting
  const stableKey = useRef(Math.random()).current;
  const duration = Math.max(speed, text.length * 0.3);

  return (
    <div className={`relative overflow-hidden ${className}`}>
    <motion.div
    key={stableKey} // Stable key prevents remounting
    className="flex whitespace-nowrap"
    animate={{ x: [0, "-50%"] }}
    transition={{
      x: {
        duration: duration,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop"
      }
    }}
    >
    <span className="pr-8">{text}</span>
    <span className="pr-8">{text}</span>
    </motion.div>
    </div>
  );
};

// Memoized animated background to prevent re-renders
const AnimatedBackground = React.memo(({ children }) => {
  const hour = new Date().getHours();
  const particles = useMemo(() => {
    const particleCount = hour >= 18 || hour < 6 ? 50 : 30;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
                                                            y: Math.random() * 100,
                                                            size: Math.random() * 3 + 1,
                                                            duration: Math.random() * 20 + 10
    }));
  }, [hour]);

  const getGradientColors = () => {
    if (hour < 5) return ["#0a0a0a", "#1a1a2e", "#16213e"];
    if (hour < 7) return ["#355C7D", "#6C5B7B", "#C06C84"];
    if (hour < 12) return ["#F8B195", "#F67280", "#C06C84"];
    if (hour < 17) return ["#A8E6CF", "#7FD8BE", "#FFD3B6"];
    if (hour < 19) return ["#FF6B6B", "#C44536", "#772E25"];
    if (hour < 22) return ["#355C7D", "#2C3E50", "#1C2833"];
    return ["#0a0a0a", "#1a1a2e", "#16213e"];
  };

  const colors = getGradientColors();

  return (
    <div className="relative overflow-hidden">
    <motion.div
    className="absolute inset-0"
    animate={{
      background: [
        `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
          `linear-gradient(135deg, ${colors[2]} 0%, ${colors[0]} 50%, ${colors[1]} 100%)`,
          `linear-gradient(135deg, ${colors[1]} 0%, ${colors[2]} 50%, ${colors[0]} 100%)`
      ]
    }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />

    {particles.map(particle => (
      <motion.div
      key={particle.id}
      className="absolute rounded-full"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: particle.size,
        height: particle.size,
        backgroundColor: hour >= 18 || hour < 6 ? '#ffffff' : '#ffffff40'
      }}
      animate={{
        y: hour >= 18 || hour < 6 ? [0, 10, 0] : [0, 100],
        opacity: hour >= 18 || hour < 6 ? [0.2, 0.8, 0.2] : [0.6, 0, 0.6]
      }}
      transition={{
        duration: particle.duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      />
    ))}

    <div className="relative z-10">{children}</div>
    </div>
  );
});

// Memoized TimeIcon to prevent re-renders
const TimeIcon = React.memo(() => {
  const hour = new Date().getHours();

  const getIcon = () => {
    if (hour < 5) return Moon;
    if (hour < 12) return Coffee;
    if (hour < 17) return Sun;
    if (hour < 22) return Sunset;
    return Moon;
  };

  const Icon = getIcon();

  return (
    <motion.div
    animate={{
      rotate: hour >= 12 && hour < 17 ? 360 : 0,
      scale: hour >= 18 || hour < 6 ? [1, 1.2, 1] : 1,
    }}
    transition={{
      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
      scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    }}
    className="relative"
    >
    <Icon size={40} className="text-white drop-shadow-lg" />
    {hour >= 12 && hour < 17 && (
      <motion.div
      className="absolute inset-0 blur-xl"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
      >
      <Sun size={40} className="text-yellow-300" />
      </motion.div>
    )}
    </motion.div>
  );
});

const Home = () => {
  const navigate = useNavigate();
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredAlbum, setHoveredAlbum] = useState(null);

  // Use Zustand selectors for state, context for methods
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const { playTrack } = useAudio();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 640;

  // Memoized greeting to prevent re-calculation
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const greetings = {
      night: ['Sweet Dreams', 'Night Owl', 'Midnight Vibes'],
      morning: ['Rise & Shine', 'Good Morning', 'Fresh Start'],
      afternoon: ['Good Afternoon', 'Midday Mix', 'Afternoon Delight'],
      evening: ['Good Evening', 'Wind Down', 'Evening Chill']
    };

    if (hour < 5) return greetings.night[0];
    if (hour < 12) return greetings.morning[0];
    if (hour < 17) return greetings.afternoon[0];
    if (hour < 22) return greetings.evening[0];
    return greetings.night[0];
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, featuredRes, recommendationsRes] = await Promise.all([
          MusicAPI.getUserProfile(),
                                                                                MusicAPI.getFeaturedAlbums(),
                                                                                MusicAPI.getRecommendations()
        ]);

        setUserProfile(profileRes.data);

        const albumPromises = featuredRes.data.featured.map(album =>
        MusicAPI.getAlbum(album.id)
        );
        const albumDetails = await Promise.all(albumPromises);
        setFeaturedAlbums(albumDetails.map(res => res.data));

        const recs = recommendationsRes.data?.recommendations || [];
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayAlbum = async (albumId, event) => {
    event.stopPropagation();
    try {
      const response = await MusicAPI.getAlbum(albumId);
      const album = response.data;
      if (album.tracks?.[0]) {
        await playTrack({
          id: album.tracks[0].id,
          album_id: album.id,
          title: album.tracks[0].title,
          artist: album.tracks[0].artist,
          file_path: album.tracks[0].file_path,
          album_art: getImageUrl(album.album_art, 264)
        });
      }
    } catch (error) {
      console.error('Error playing album:', error);
    }
  };

  const handlePlayTrack = (track, event) => {
    event.stopPropagation();
    playTrack({
      id: track.id,
      album_id: track.album_id,
      title: track.title,
      artist: track.artist,
      file_path: track.file_path,
      album_art: getImageUrl(track.album_art || track.track_image, 264)
    });
  };

  const getImageUrl = (path, height = 264) => {
    if (!path) return '/default-album-art.png';
    const cleanPath = path.split('?')[0];
    if (cleanPath.startsWith('http')) {
      return cleanPath.includes('?h=') ? cleanPath : `${cleanPath}?h=${height}`;
    }
    const filename = cleanPath.split('/').pop();
    return `https://api.beatfly-music.xyz/xrpc/images/albumArt/${filename}?h=${height}`;
  };

  // Memoize trending text to prevent re-renders
  const trendingText = recommendations.length > 0
  ? `${recommendations[0].title} by ${recommendations[0].artist}`
  : '';
  const isYearInReviewSeason = useMemo(() => new Date().getMonth() === 11, []);
  const quickActions = useMemo(() => {
    const actions = [
      {
        icon: SearchIcon,
        title: 'Find something to play',
        description: 'Search the catalog for artists, tracks, and playlists.',
        onClick: () => navigate('/search')
      },
      {
        icon: ListMusic,
        title: 'Create your first playlist',
        description: 'Collect songs you love into a new playlist.',
        onClick: () => navigate('/create-playlist')
      },
      {
        icon: Heart,
        title: 'See liked songs',
        description: 'Jump back into everything you have liked.',
        onClick: () => navigate('/liked-songs')
      }
    ];

    if (isYearInReviewSeason) {
      actions.unshift({
        icon: Sparkles,
        title: 'View Year in Review',
        description: 'See your {year} recap with a seeded theme for this year.'.replace('{year}', new Date().getFullYear()),
        onClick: () => navigate('/year-in-review')
      });
    }
    return actions;
  }, [navigate, isYearInReviewSeason]);
  const isEmptyState = !loading && !error && featuredAlbums.length === 0 && recommendations.length === 0;
  const showQuickActions = loading || error || isEmptyState;

  const heroHighlight = useMemo(() => {
    if (currentTrack) return { ...currentTrack, type: 'track' };
    if (recommendations[0]) return { ...recommendations[0], type: 'track' };
    if (featuredAlbums[0]) return { ...featuredAlbums[0], type: 'album' };
    return null;
  }, [currentTrack, featuredAlbums, recommendations]);

  const vibeBadges = useMemo(() => ([
    { icon: Sun, label: 'Fresh energy' },
    { icon: Coffee, label: 'Focus mode' },
    { icon: Sunset, label: 'Evening calm' },
    { icon: Cloud, label: 'Lo-fi haze' }
  ]), []);

  const highlightImage = heroHighlight
    ? getImageUrl(heroHighlight.album_art || heroHighlight.track_image || heroHighlight.profile_pic, 480)
    : null;

  const handleHeroAction = (event) => {
    if (!heroHighlight) return;
    if (heroHighlight.type === 'album') {
      handlePlayAlbum(heroHighlight.id, event);
    } else {
      handlePlayTrack(heroHighlight, event);
    }
  };

  const handleHeroNavigate = () => {
    if (!heroHighlight) return;
    if (heroHighlight.type === 'album') {
      navigate(`/album/${heroHighlight.id}`);
    } else {
      navigate(`/track/${heroHighlight.id}`);
    }
  };

  return (
    <div className="w-full overflow-x-hidden pb-4">
      <div className="page-shell space-y-12">
        {/* Hero Header with animated background */}
        <AnimatedBackground>
          <div className="glass-hero relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10" />
            <div className="absolute -right-24 -top-28 w-80 h-80 bg-accent/35 blur-[140px]" />
            <div className="absolute -left-32 bottom-0 w-80 h-80 bg-indigo-500/25 blur-[140px]" />
            <div className="relative z-10 grid gap-8 md:grid-cols-[1.6fr,1fr] items-center p-6 md:p-10 lg:p-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <TimeIcon />
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">Sound tailored for you</p>
                    <h5 className="text-xl font-semibold text-white/80">{greeting}</h5>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {userProfile?.profile_pic && (
                    <motion.img
                      src={getImageUrl(userProfile.profile_pic, 120)}
                      alt={userProfile.username}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-white/20"
                      loading="lazy"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  )}
                  <motion.h1
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                  >
                    Welcome back, {userProfile?.username || 'Guest'}
                  </motion.h1>
                </div>

                {trendingText && !loading && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-white/60 text-lg">Currently Trending:</span>
                    <div className="flex-1 max-w-md">
                      <MarqueeText
                        text={trendingText}
                        className="text-white text-lg font-semibold"
                        speed={25}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-3">
                  {vibeBadges.map((badge) => (
                    <div
                      key={badge.label}
                      className="glass-card rounded-full px-3 py-2 flex items-center gap-2 border-white/10"
                    >
                      <badge.icon size={16} className="text-white/70" />
                      <span className="text-sm text-white/80">{badge.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.title}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={action.onClick}
                      className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border-white/10 text-left"
                    >
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <action.icon size={18} className="text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white">{action.title}</h3>
                        <p className="text-sm text-white/70 leading-snug">{action.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="glass-card relative overflow-hidden rounded-2xl min-h-[320px]">
                {highlightImage ? (
                  <motion.img
                    src={highlightImage}
                    alt={heroHighlight?.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.2 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative p-6 flex flex-col gap-4 h-full justify-end">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/70">
                    {heroHighlight ? (heroHighlight.type === 'album' ? 'Featured album' : 'Now playing') : 'Ready when you are'}
                  </span>
                  <h3 className="text-2xl font-bold leading-tight">
                    {heroHighlight?.title || 'Queue something you love'}
                  </h3>
                  <p className="text-sm text-white/70">
                    {heroHighlight?.artist || 'Search, browse, or tap a quick action to jump in.'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleHeroAction}
                      disabled={!heroHighlight}
                      className="flex items-center gap-2 bg-accent hover:bg-accent-dark rounded-full px-4 py-2 font-semibold transition disabled:opacity-50"
                    >
                      {heroHighlight && heroHighlight.type === 'track' && currentTrack?.id === heroHighlight.id && isPlaying ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} className="ml-1" />
                      )}
                      <span>{heroHighlight ? 'Play now' : 'Pick a track'}</span>
                    </button>
                    {heroHighlight && (
                      <button
                        onClick={handleHeroNavigate}
                        className="glass-card rounded-full px-4 py-2 border-white/10 text-sm font-medium hover:border-white/20 transition"
                      >
                        Open details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedBackground>

        {showQuickActions && (
          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-semibold">Let&apos;s get you listening</h2>
                <p className="text-white/70 text-lg">
                  Start by searching for music, creating a playlist, or jumping back into your liked songs.
                </p>
              </div>
              {error && (
                <div className="rounded-lg border border-white/10 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Failed to load content. Showing placeholders for now.
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.title}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={action.onClick}
                  className="glass-card rounded-xl p-4 flex items-start gap-3 transition-all duration-200"
                >
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <action.icon size={20} className="text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white">{action.title}</h3>
                    <p className="text-sm text-white/70 leading-snug">{action.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Featured Albums */}
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <motion.h2
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Featured Albums
            </motion.h2>
            <span className="text-sm text-white/60">{loading ? 'Loading selections...' : 'Curated just for you'}</span>
          </div>
          {loading || featuredAlbums.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl glass-card overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent animate-pulse" />
                  <div className="absolute bottom-3 left-3 right-3 h-3 rounded-full bg-white/5" />
                  <div className="absolute bottom-6 left-3 right-10 h-3 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {featuredAlbums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -10 }}
                  className="group relative cursor-pointer rounded-2xl glass-card overflow-hidden"
                  onClick={() => navigate(`/album/${album.id}`)}
                  onMouseEnter={() => setHoveredAlbum(album.id)}
                  onMouseLeave={() => setHoveredAlbum(null)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <motion.img
                      src={getImageUrl(album.album_art, 420)}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      animate={{ scale: hoveredAlbum === album.id ? 1.1 : 1 }}
                      transition={{ duration: 0.4 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-album-art.png';
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredAlbum === album.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Fixed Play Button - Bottom Right */}
                    <AnimatePresence>
                      {hoveredAlbum === album.id && (
                        <motion.button
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          onClick={(e) => handlePlayAlbum(album.id, e)}
                          className="absolute bottom-4 right-4 w-12 h-12 bg-accent rounded-full
                          flex items-center justify-center shadow-xl hover:bg-accent-dark
                          transition-colors"
                        >
                          {currentTrack?.album_id === album.id && isPlaying ? (
                            <Pause className="text-white" size={24} />
                          ) : (
                            <Play className="text-white ml-1" size={24} />
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div
                    className="p-4 space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <h3 className="font-bold text-lg text-white truncate">{album.title}</h3>
                    <p className="text-sm text-white/70 truncate mt-1">{album.artist}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Recommended for You */}
        <section className="space-y-5 pb-8">
          <div className="flex items-center justify-between gap-3">
            <motion.h2
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Recommended for You
            </motion.h2>
            <span className="text-sm text-white/60">{!loading && recommendations.length ? 'Based on your taste' : ''}</span>
          </div>
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 glass-card rounded-xl p-4 animate-pulse"
                >
                  <div className="w-20 aspect-square rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                    <div className="h-3 w-1/3 bg-white/5 rounded" />
                  </div>
                  <div className="w-10 h-3 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <motion.p
              className="text-white/70 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error ? 'Failed to load recommendations. Try again later.' : 'No recommendations available. Try exploring some tracks!'}
            </motion.p>
          ) : (
            <div className="grid gap-3">
              {recommendations.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                  whileHover={{ x: 10 }}
                  className="glass-card p-4 rounded-xl flex items-center gap-4 group transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/track/${track.id}`)}
                >
                  <motion.div
                    className="relative aspect-square w-20 rounded-lg overflow-hidden shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <img
                      src={getImageUrl(track.album_art || track.track_image, 120)}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-album-art.png';
                      }}
                    />
                    <motion.button
                      onClick={(e) => handlePlayTrack(track, e)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                      transition-opacity duration-300 flex items-center justify-center"
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.8)" }}
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="text-white" size={24} />
                      ) : (
                        <Play className="text-white ml-1" size={24} />
                      )}
                    </motion.button>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <motion.div
                      className="font-semibold text-lg text-white group-hover:text-accent transition-colors"
                    >
                      <span className="truncate block">{track.title}</span>
                    </motion.div>
                    <p className="text-sm text-white/70 mt-1">{track.artist}</p>
                  </div>

                  <motion.div
                    className="text-white/70 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.2 }}
                  >
                    <Play size={20} />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
