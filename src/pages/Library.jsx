import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid, List, Play, Pause, ListMusic, Music2, Disc3,
  Loader2, Plus, Heart, MoreHorizontal, Trash2, Edit3, X
} from 'lucide-react';
import { useAudio, useCurrentTrack, useIsPlaying } from '../contexts/AudioContext';
import { useResponsive } from '../components/layout/MainLayout';
import MusicAPI from '../services/api';

const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper to build proper image URL from stored path
const buildImageUrl = (imagePath, folder = 'albumArt') => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Extract just the filename if path contains 'uploads/'
  const filename = imagePath.includes('/')
    ? imagePath.substring(imagePath.lastIndexOf('/') + 1)
    : imagePath;
  return `https://api.beatfly-music.xyz/xrpc/images/${folder}/${filename}`;
};

// Get image URL helper
const getImageUrl = (item, activeTab) => {
  if (activeTab === 'tracks') {
    if (item.track_image) return buildImageUrl(item.track_image);
    if (item.album_art) return buildImageUrl(item.album_art);
  }
  if (activeTab === 'albums' && item.album_art) {
    return buildImageUrl(item.album_art);
  }
  if (activeTab === 'playlists' && item.cover_image) {
    return buildImageUrl(item.cover_image);
  }
  return null; // Return null to trigger icon fallback
};

// Get the appropriate icon component for each content type
const getItemIcon = (activeTab) => {
  switch (activeTab) {
    case 'albums': return Disc3;
    case 'tracks': return Music2;
    case 'playlists': return ListMusic;
    default: return Music2;
  }
};

// Grid Item Component
const GridItem = React.memo(({ item, index, activeTab, isMobile, onPlay }) => {
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const { playTrack, togglePlay } = useAudio();

  const isCurrentItem =
    activeTab === 'tracks'
      ? currentTrack?.id === item.id
      : item.tracks?.[0]?.id === currentTrack?.id;

  const handlePlay = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab === 'tracks') {
      currentTrack?.id === item.id ? togglePlay() : playTrack(item);
    } else if (item.tracks && item.tracks.length > 0) {
      currentTrack?.id === item.tracks[0].id ? togglePlay() : playTrack(item.tracks[0]);
    }
  }, [activeTab, currentTrack, item, playTrack, togglePlay]);

  const linkPath = activeTab === 'playlists'
    ? `/playlist/${item.id}`
    : activeTab === 'albums'
    ? `/album/${item.id}`
    : `/track/${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        to={linkPath}
        className={`block ${isMobile ? 'p-2' : 'p-3'} rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 group`}
      >
        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
          {getImageUrl(item, activeTab) ? (
            <img
              src={getImageUrl(item, activeTab)}
              alt={item.title || item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {(() => {
            const ItemIcon = getItemIcon(activeTab);
            return (
              <div className={`${getImageUrl(item, activeTab) ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-accent/30 to-purple-600/30 flex items-center justify-center`}>
                <ItemIcon size={isMobile ? 32 : 48} className="text-white/60" />
              </div>
            );
          })()}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.button
            className={`absolute right-2 bottom-2 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-accent rounded-full flex items-center justify-center shadow-xl ${
              isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
            } transition-all duration-200`}
            onClick={handlePlay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCurrentItem && isPlaying ? (
              <Pause size={isMobile ? 18 : 22} className="text-white" />
            ) : (
              <Play size={isMobile ? 18 : 22} className="text-white ml-0.5" />
            )}
          </motion.button>
        </div>
        <div className="space-y-1">
          <h3 className={`font-semibold text-white truncate ${isMobile ? 'text-sm' : ''}`}>
            {item.title || item.name}
          </h3>
          <p className={`text-white/50 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {activeTab === 'playlists'
              ? `${item.track_count || 0} tracks`
              : item.artist}
          </p>
        </div>
      </Link>
    </motion.div>
  );
});

// List Item Component
const ListItem = React.memo(({ item, index, activeTab, isMobile, onDelete }) => {
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const { playTrack, togglePlay } = useAudio();

  const isCurrentItem =
    activeTab === 'tracks'
      ? currentTrack?.id === item.id
      : item.tracks?.[0]?.id === currentTrack?.id;

  const handlePlay = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab === 'tracks') {
      currentTrack?.id === item.id ? togglePlay() : playTrack(item);
    } else if (item.tracks && item.tracks.length > 0) {
      currentTrack?.id === item.tracks[0].id ? togglePlay() : playTrack(item.tracks[0]);
    }
  }, [activeTab, currentTrack, item, playTrack, togglePlay]);

  const linkPath = activeTab === 'playlists'
    ? `/playlist/${item.id}`
    : activeTab === 'albums'
    ? `/album/${item.id}`
    : `/track/${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Link
        to={linkPath}
        className={`flex items-center gap-3 ${isMobile ? 'py-2 px-2' : 'p-3'} rounded-xl hover:bg-white/5 group transition-all ${
          isCurrentItem ? 'bg-accent/10' : ''
        }`}
      >
        <div className={`${isMobile ? 'w-6' : 'w-8'} text-center flex-shrink-0`}>
          {isCurrentItem && isPlaying ? (
            <div className="flex items-center justify-center gap-0.5">
              <span className="w-1 h-4 bg-accent rounded-full animate-pulse" />
              <span className="w-1 h-3 bg-accent rounded-full animate-pulse delay-75" />
              <span className="w-1 h-4 bg-accent rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <span className="text-white/40 text-sm group-hover:hidden">{index + 1}</span>
          )}
          <button
            onClick={handlePlay}
            className="hidden group-hover:block"
          >
            <Play size={16} className="text-white mx-auto" />
          </button>
        </div>

        <div className={`relative ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} flex-shrink-0 rounded-lg overflow-hidden`}>
          {getImageUrl(item, activeTab) ? (
            <img
              src={getImageUrl(item, activeTab)}
              alt={item.title || item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {(() => {
            const ItemIcon = getItemIcon(activeTab);
            return (
              <div className={`${getImageUrl(item, activeTab) ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-accent/30 to-purple-600/30 flex items-center justify-center`}>
                <ItemIcon size={isMobile ? 16 : 20} className="text-white/60" />
              </div>
            );
          })()}
        </div>

        <div className="flex-1 min-w-0">
          <div className={`font-medium text-white truncate ${isMobile ? 'text-sm' : ''} ${isCurrentItem ? 'text-accent' : ''}`}>
            {item.title || item.name}
          </div>
          <div className={`text-white/50 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {activeTab === 'playlists'
              ? `${item.track_count || 0} tracks`
              : item.artist}
          </div>
        </div>

        {activeTab === 'tracks' && !isMobile && (
          <div className="text-sm text-white/40 px-4">
            {formatDuration(item.duration)}
          </div>
        )}

        {activeTab === 'playlists' && onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}
      </Link>
    </motion.div>
  );
});

// Create Playlist Modal
const CreatePlaylistModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await MusicAPI.createPlaylist({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-white">Create Playlist</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              required
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist about?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Main Library Component
const Library = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const [view, setView] = useState('grid');
  const [activeTab, setActiveTab] = useState('playlists');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setView('list');
    }
  }, [isMobile]);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (activeTab) {
        case 'playlists':
          response = await MusicAPI.getPlaylists();
          setContent(response.data?.playlists || response.data || []);
          break;
        case 'albums':
          response = await MusicAPI.getFavoriteAlbums();
          setContent(response.data?.albums || response.data || []);
          break;
        case 'tracks':
          response = await MusicAPI.getFavoriteTracks();
          setContent(response.data?.tracks || response.data || []);
          break;
        default:
          setContent([]);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content');
      setContent([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await MusicAPI.deletePlaylist(playlistId);
      fetchContent();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'playlists': return ListMusic;
      case 'albums': return Disc3;
      case 'tracks': return Music2;
      default: return ListMusic;
    }
  };

  const tabs = [
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'albums', label: 'Albums', icon: Disc3 },
    { id: 'tracks', label: 'Tracks', icon: Music2 },
  ];

  const TabIcon = getTabIcon(activeTab);

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

        <div className={`relative z-10 ${isMobile ? 'px-4 pt-6 pb-4' : 'px-6 lg:px-8 pt-8 pb-6'}`}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMobile ? 'flex-col gap-4' : 'items-end gap-6'} mb-6`}
            >
              {!isMobile && (
                <div className="w-44 h-44 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                  <TabIcon size={64} className="text-white/80" />
                </div>
              )}
              <div className="flex-1">
                <p className={`text-white/50 ${isMobile ? 'text-xs' : 'text-sm'} font-medium uppercase tracking-wider mb-1`}>
                  Library
                </p>
                <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl lg:text-5xl'} font-bold text-white mb-2`}>
                  Your Collection
                </h1>
                <p className={`text-white/50 ${isMobile ? 'text-sm' : ''}`}>
                  {content.length} {activeTab}
                </p>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className={`flex ${isMobile ? 'flex-wrap' : ''} items-center justify-between gap-4`}>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 ${isMobile ? 'px-4 py-2 text-sm' : 'px-5 py-2.5'} rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-black shadow-lg'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <tab.icon size={isMobile ? 16 : 18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'playlists' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2.5'} rounded-xl bg-accent hover:bg-accent/90 text-white font-medium transition-all`}
                  >
                    <Plus size={isMobile ? 16 : 18} />
                    {!isMobile && 'Create'}
                  </button>
                )}
                <div className="flex items-center bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => setView('grid')}
                    className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg transition-all ${
                      view === 'grid' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Grid size={isMobile ? 16 : 18} />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg transition-all ${
                      view === 'list' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <List size={isMobile ? 16 : 18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${isMobile ? 'px-4' : 'px-6 lg:px-8'} mt-6`}>
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                <TabIcon size={24} className="absolute inset-0 m-auto text-accent" />
              </div>
              <p className="mt-4 text-white/50">Loading your {activeTab}...</p>
            </div>
          )}

          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <X size={32} className="text-red-400" />
              </div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchContent}
                className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {!loading && !error && content.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <TabIcon size={40} className="text-white/20" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No {activeTab} yet</h3>
              <p className="text-white/50 text-center max-w-md mb-6">
                {activeTab === 'playlists'
                  ? 'Create your first playlist to organize your music'
                  : activeTab === 'albums'
                  ? 'Save albums you love to see them here'
                  : 'Like tracks to add them to your collection'}
              </p>
              {activeTab === 'playlists' ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all"
                >
                  <Plus size={20} />
                  Create Playlist
                </button>
              ) : (
                <Link
                  to="/search"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all"
                >
                  <Heart size={20} />
                  Discover Music
                </Link>
              )}
            </motion.div>
          )}

          {!loading && !error && content.length > 0 && (
            <AnimatePresence mode="wait">
              {view === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`grid ${
                    isMobile
                      ? 'grid-cols-2 gap-3'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                  }`}
                >
                  {content.map((item, index) => (
                    <GridItem
                      key={item.id}
                      item={item}
                      index={index}
                      activeTab={activeTab}
                      isMobile={isMobile}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  {content.map((item, index) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      index={index}
                      activeTab={activeTab}
                      isMobile={isMobile}
                      onDelete={activeTab === 'playlists' ? handleDeletePlaylist : undefined}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePlaylistModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={fetchContent}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Library;
