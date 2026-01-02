import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
// Use Zustand selectors for state (prevents unnecessary re-renders)
import {
  useAudio,
  useCurrentTrack,
  useIsPlaying,
  useDuration,
  useCurrentTime,
  useVolume,
  useRepeat,
  useShuffle,
  useLoading,
  usePlaybackError,
  useQueue as useQueueState,
} from '../../../contexts/AudioContext';

// Services
import MusicAPI from '../../../services/api';
import LocalRecentsAPI from '../../../services/localRecentsAPI';

// Layout / Utility
import { useResponsive } from '../MainLayout';

// Sub-components
import MiniPlayer from './MiniPlayer';
import ExpandedPlayer from './ExpandedPlayer';
import QueuePanel from './QueuePanel';
import MobileQueuePanel from './MobileQueuePanel';
import LyricsPanel from './LyricsPanel';
import EQPopup from './EQPopup';
import PlaylistSelectorModal from './PlaylistSelectorModal';
import ErrorToast from './ErrorToast';
import AudioVisualizer from './AudioVisualizer';

/**
 * Renders the main Player component for the app. It orchestrates:
 *   - Basic playback controls
 *   - Expanded vs. Mini player
 *   - Queue management (desktop vs. mobile)
 *   - EQ popup
 *   - Lyrics panel, etc.
 *
 * Uses Zustand selectors for optimal performance - only re-renders when
 * the specific state it subscribes to changes.
 */
const Player = () => {
  const { isMobile } = useResponsive();
  const location = useLocation();

  // Get methods from context (stable references)
  const {
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    removeFromQueue,
    clearQueue,
    getAudioContext,
    getAnalyzerNode,
  } = useAudio();

  // Get state from Zustand selectors (only re-renders when specific value changes)
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const duration = useDuration();
  const currentTime = useCurrentTime();
  const volume = useVolume();
  const repeat = useRepeat();
  const shuffle = useShuffle();
  const loading = useLoading();
  const error = usePlaybackError();
  const queue = useQueueState();

  // Get audio nodes via getters (refs, not state)
  const audioContext = getAudioContext();
  const analyzerNode = getAnalyzerNode();

  // Local UI states
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEQ, setShowEQ] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Keep track of previous volume (for toggling mute)
  const [prevVolume, setPrevVolume] = useState(() => {
    // Ensure we start with a valid volume value
    const initialVolume = typeof volume === 'number' && !isNaN(volume) ? volume : 1;
    return initialVolume;
  });

  // Track route changes (close open panels)
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Tutorial (mobile) for gestures, saved in localStorage
  const [tutorialShown, setTutorialShown] = useState(() => {
    return localStorage.getItem('player-tutorial-shown') === 'true';
  });

  // Safely sanitize volume value
  const safeVolume = useMemo(() => {
    return typeof volume === 'number' && !isNaN(volume) ? volume : 0;
  }, [volume]);

  /**
   * Close any open panels (Expanded/Queue/Lyrics/EQ)
   * when navigating to a different route
   */
  useEffect(() => {
    if (location.pathname !== prevPath) {
      setShowExpanded(false);
      setShowQueue(false);
      setShowLyrics(false);
      setShowEQ(false);
      setShowPlaylistModal(false);
      setPrevPath(location.pathname);
    }
  }, [location.pathname, prevPath]);

  /**
   * Mobile-specific gesture handling - optimized for performance
   */
  useEffect(() => {
    if (!isMobile) return;

    document.body.classList.add('select-none');
    if (!tutorialShown) {
      localStorage.setItem('player-tutorial-shown', 'true');
      setTutorialShown(true);
    }

    // Prevent default scrolling if user is interacting with player
    const preventDefaultScroll = (e) => {
      const target = e.target;
      if (
        target.closest('.player-controls') ||
        target.closest('.art-container') ||
        showExpanded ||
        showQueue ||
        showLyrics ||
        showEQ
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefaultScroll, { passive: false });

    return () => {
      document.body.classList.remove('select-none');
      document.removeEventListener('touchmove', preventDefaultScroll);
    };
  }, [isMobile, showExpanded, showQueue, showLyrics, showEQ, tutorialShown]);

  /**
   * Format time into mm:ss
   */
  const formatTime = useCallback((time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, []);

  /**
   * Store the current track into local "recents"
   * whenever we begin playing
   */
  useEffect(() => {
    if (currentTrack && isPlaying) {
      LocalRecentsAPI.addRecent(currentTrack).catch((err) => {
        console.error('Error adding to recents:', err);
      });
    }
  }, [currentTrack, isPlaying]);

  /**
   * Check if the current track is liked/favorited
   */
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!currentTrack) return;
      try {
        const response = await MusicAPI.getFavoriteTracks();
        const { tracks = [] } = response.data;
        setIsLiked(tracks.some((t) => t.id === currentTrack.id));
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };
    checkIfLiked();
  }, [currentTrack]);

  /**
   * Toggle like/favorite status for the current track
   */
  const toggleLike = useCallback(async () => {
    if (!currentTrack) return;
    try {
      setIsLiked((prev) => !prev); // optimistic UI
      if (isLiked) {
        await MusicAPI.unfavoriteTrack(currentTrack.id);
      } else {
        await MusicAPI.favoriteTrack(currentTrack.id);
      }
    } catch (err) {
      // revert if error
      setIsLiked((prev) => !prev);
      console.error('Error toggling like:', err);
    }
  }, [currentTrack, isLiked]);

  /**
   * Handler for volume slider - fixed to handle NaN
   */
  const handleVolumeChange = useCallback(
    (e) => {
      const newVolume = parseFloat(e.target.value);

      // Ensure we have a valid volume value
      if (isNaN(newVolume)) return;

      // Clamp volume between 0 and 1
      const clampedVolume = Math.max(0, Math.min(1, newVolume));

      setVolume(clampedVolume);
      setIsMuted(clampedVolume === 0);

      if (clampedVolume > 0) {
        setPrevVolume(clampedVolume);
      }
    },
    [setVolume]
  );

  /**
   * Toggle mute/unmute - improved to handle edge cases
   */
  const toggleMute = useCallback(() => {
    if (isMuted || safeVolume === 0) {
      // Unmute: Use prev volume or default to 0.5 if prev was invalid
      const newVolume = (prevVolume > 0 && prevVolume <= 1) ? prevVolume : 0.5;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      // Store current volume only if it's valid
      if (safeVolume > 0) {
        setPrevVolume(safeVolume);
      }
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, safeVolume, prevVolume, setVolume]);

  /**
   * Safely get album art or a default placeholder
   */
  const getTrackImage = useCallback(() => {
    if (!currentTrack) return '/default-album-art.png';
    const imagePath = currentTrack.track_image || currentTrack.album_art;
    if (!imagePath) return '/default-album-art.png';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return MusicAPI.getImage('albumArt', imagePath);
  }, [currentTrack]);

  // Stable props that don't change frequently - memoized for performance
  // NOTE: currentTime and duration are passed separately to avoid re-rendering everything
  const stablePlayerProps = useMemo(() => ({
    currentTrack,
    getTrackImage,
    formatTime,
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
    showQueue,
    setShowQueue,
    showLyrics,
    setShowLyrics,
    showEQ,
    setShowEQ,
    isMobile,
    audioContext,
    analyzerNode,
    tutorialShown,
    volume: safeVolume,
    handleVolumeChange,
    toggleMute,
    isMuted
  }), [
    currentTrack, getTrackImage, formatTime,
    seek, togglePlay, playNext, playPrevious, toggleShuffle, toggleRepeat,
    shuffle, repeat, loading, isPlaying, isLiked, toggleLike,
    showQueue, showLyrics, showEQ,
    isMobile, audioContext, analyzerNode, tutorialShown,
    safeVolume, handleVolumeChange, toggleMute, isMuted
  ]);

  // For mobile devices, we conditionally render EQPopup to improve performance
  const shouldRenderEQ = useMemo(() => {
    // Only render EQ when it's actually shown to save resources on mobile
    if (!showEQ && isMobile) return false;
    return true;
  }, [showEQ, isMobile]);

  // Toggle queue visibility function
  const toggleQueue = useCallback(() => {
    setShowQueue(prev => !prev);
  }, []);

  return (
    <>
    {/** EXPANDED PLAYER **/}
    <AnimatePresence>
    {showExpanded && (
      <ExpandedPlayer
        {...stablePlayerProps}
        currentTime={currentTime}
        duration={duration}
        onClose={() => setShowExpanded(false)}
        setShowPlaylistModal={setShowPlaylistModal}
      />
    )}
    </AnimatePresence>

    {/** MINI PLAYER **/}
    <AnimatePresence>
    {!showExpanded && (
      <MiniPlayer
        {...stablePlayerProps}
        currentTime={currentTime}
        duration={duration}
        setShowExpanded={setShowExpanded}
      />
    )}
    </AnimatePresence>

    {/** QUEUE PANEL (desktop) **/}
    {!isMobile && (
      <AnimatePresence>
      {showQueue && (
        <QueuePanel
        queue={queue}
        showExpanded={showExpanded}
        setShowQueue={setShowQueue}
        removeFromQueue={removeFromQueue}
        clearQueue={clearQueue}
        showQueue={showQueue}
        />
      )}
      </AnimatePresence>
    )}

    {/** QUEUE PANEL (mobile) **/}
    {isMobile && (
      <MobileQueuePanel
      queue={queue}
      showQueue={showQueue}
      setShowQueue={setShowQueue}
      removeFromQueue={removeFromQueue}
      clearQueue={clearQueue}
      />
    )}

    {/** PLAYLIST SELECTOR **/}
    <AnimatePresence>
    {showPlaylistModal && currentTrack && (
      <PlaylistSelectorModal
      currentTrack={currentTrack}
      onClose={() => setShowPlaylistModal(false)}
      isMobile={isMobile}
      />
    )}
    </AnimatePresence>

    {/** LYRICS PANEL **/}
    <LyricsPanel
      showLyrics={showLyrics}
      setShowLyrics={setShowLyrics}
      showExpanded={showExpanded}
      lyrics={currentTrack?.lyrics}
      currentTime={currentTime}
      seek={seek}
      isMobile={isMobile}
    />

    {/** EQ POPUP - Conditionally rendered for performance **/}
    {shouldRenderEQ && (
      <EQPopup
      showEQ={showEQ}
      setShowEQ={setShowEQ}
      isMobile={isMobile}
      />
    )}

    {/** ERROR TOAST **/}
    <AnimatePresence>
    {error && (
      <ErrorToast
      error={error}
      showExpanded={showExpanded}
      isMobile={isMobile}
      />
    )}
    </AnimatePresence>

    </>
  );
};

export default React.memo(Player);
