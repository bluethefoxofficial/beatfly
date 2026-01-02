import React, { useEffect, useRef, useState } from 'react';
import { useAudio, useCurrentTime, useCurrentTrack, useIsPlaying, getAudioStore } from '../../contexts/AudioContext';
import { useAuth } from '../../contexts/AuthContext';
import createPlaybackSocket from '../../services/playbackSocket';

/**
 * Lightweight bridge for syncing playback position with the backend via WebSocket events.
 * - Requests last known playback state on connect.
 * - Sends periodic playback:sync updates while the user listens.
 * - Applies a resume state once per connection if the server has one.
 */
const PlaybackSync = () => {
  const { user } = useAuth();
  const { playTrack, seek, togglePlay } = useAudio();
  const currentTrack = useCurrentTrack();
  const currentTime = useCurrentTime();
  const isPlaying = useIsPlaying();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const hasAppliedResume = useRef(false);
  const lastSentAt = useRef(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Connect on mount if a token is available
  useEffect(() => {
    if (!token || !user) return undefined;

    const s = createPlaybackSocket(token);
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      s.emit('playback:request');
    });

    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => console.warn('Playback socket error', err?.message || err));

    s.on('playback:state', async (state) => {
      if (!state || hasAppliedResume.current) return;
      hasAppliedResume.current = true;

      try {
        await playTrack({ id: state.trackId }, false);
        if (typeof state.positionSeconds === 'number') {
          seek(state.positionSeconds);
        }
        const store = getAudioStore();
        if (state.isPaused && store.isPlaying) {
          togglePlay();
        }
      } catch (err) {
        console.warn('Failed to resume playback state', err);
      }
    });

    s.on('playback:error', (err) => {
      console.warn('Playback sync error', err?.message || err);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [playTrack, seek, togglePlay, token, user]);

  // Emit periodic sync events while listening
  useEffect(() => {
    if (!socket || !connected || !currentTrack) return undefined;

    const sendUpdate = () => {
      const now = Date.now();
      if (now - lastSentAt.current < 4000) return;
      lastSentAt.current = now;

      socket.emit('playback:sync', {
        trackId: currentTrack.id,
        positionSeconds: Math.floor(currentTime || 0),
        isPaused: !isPlaying,
      });
    };

    const interval = setInterval(sendUpdate, 5000);
    sendUpdate();

    return () => clearInterval(interval);
  }, [socket, connected, currentTrack, currentTime, isPlaying]);

  // Reset resume flag when a new track starts
  useEffect(() => {
    hasAppliedResume.current = false;
  }, [currentTrack?.id]);

  // Expose no UI
  return null;
};

export default PlaybackSync;
