// src/stores/audioStore.js
// High-performance Zustand store for audio state management
// Replaces React Context to prevent unnecessary re-renders

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const STANDARD_FREQUENCIES = [60, 230, 910, 3600, 14000];
const ADVANCED_FREQUENCIES = [
  20, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
  1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000,
];

// Load from localStorage with fallback
const loadFromStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    if (typeof fallback === 'boolean') return saved === 'true';
    if (typeof fallback === 'number') return parseFloat(saved) || fallback;
    if (Array.isArray(fallback)) return JSON.parse(saved);
    if (typeof fallback === 'object') return JSON.parse(saved);
    return saved;
  } catch {
    return fallback;
  }
};

// Create the audio store with subscribeWithSelector for efficient subscriptions
export const useAudioStore = create(
  subscribeWithSelector((set, get) => ({
    // ─────────────────────────────────────────────────
    // EQ STATE
    // ─────────────────────────────────────────────────
    eqMode: loadFromStorage('eq-mode', 'standard'),
    eqGains: loadFromStorage('eq-gains', STANDARD_FREQUENCIES.map(() => 0)),
    advancedEqGains: loadFromStorage('advanced-eq-gains', ADVANCED_FREQUENCIES.map(() => 0)),
    targetEqGains: loadFromStorage('eq-gains', STANDARD_FREQUENCIES.map(() => 0)),
    targetAdvancedEqGains: loadFromStorage('advanced-eq-gains', ADVANCED_FREQUENCIES.map(() => 0)),
    isDraggingEQ: false,

    // EQ Smart state
    eqSmartEnabled: loadFromStorage('eq-smart-enabled', false),
    eqSmartSettings: loadFromStorage('eq-smart-settings', {
      intensity: 1,
      bassTilt: 0,
      trebleTilt: 0,
      headroom: 6,
      micBlend: 0.7,
    }),
    eqSmartProcessing: false,
    eqSmartSuggestions: {
      standard: STANDARD_FREQUENCIES.map(() => 0),
      advanced: ADVANCED_FREQUENCIES.map(() => 0),
    },

    // Dynamic EQ
    dynamicEqEnabled: loadFromStorage('dynamic-eq-enabled', false),
    bassTone: loadFromStorage('bass-tone', 0),

    // Ultra EQ
    ultraEqEnabled: loadFromStorage('ultra-eq-enabled', false),
    hearingCompensation: loadFromStorage('hearing-compensation', false),

    // Mic state
    micStatus: 'idle',
    micLevel: 0,
    ambientSnapshot: null,

    // ─────────────────────────────────────────────────
    // PLAYBACK STATE
    // ─────────────────────────────────────────────────
    currentTrack: null,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: loadFromStorage('volume', 1),
    buffering: false,
    loading: false,
    error: null,

    // ─────────────────────────────────────────────────
    // QUEUE STATE
    // ─────────────────────────────────────────────────
    queue: [],
    queueIndex: 0,
    queueHistory: [],
    shuffle: loadFromStorage('shuffle', false),
    repeat: loadFromStorage('repeat', 'none'),

    // ─────────────────────────────────────────────────
    // NETWORK STATE
    // ─────────────────────────────────────────────────
    networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
    offlineMode: loadFromStorage('offline-mode', false),

    // ─────────────────────────────────────────────────
    // EQ ACTIONS
    // ─────────────────────────────────────────────────
    setEqMode: (mode) => {
      set({ eqMode: mode });
      localStorage.setItem('eq-mode', mode);
    },

    setEqGains: (gains) => set({ eqGains: gains }),
    setAdvancedEqGains: (gains) => set({ advancedEqGains: gains }),
    setTargetEqGains: (gains) => set({ targetEqGains: gains }),
    setTargetAdvancedEqGains: (gains) => set({ targetAdvancedEqGains: gains }),
    setIsDraggingEQ: (dragging) => set({ isDraggingEQ: dragging }),

    setEqSmartEnabled: (enabled) => {
      set({ eqSmartEnabled: enabled });
      localStorage.setItem('eq-smart-enabled', String(enabled));
    },

    setEqSmartSettings: (settings) => {
      set({ eqSmartSettings: settings });
      localStorage.setItem('eq-smart-settings', JSON.stringify(settings));
    },

    setEqSmartProcessing: (processing) => set({ eqSmartProcessing: processing }),
    setEqSmartSuggestions: (suggestions) => set({ eqSmartSuggestions: suggestions }),

    setDynamicEqEnabled: (enabled) => {
      set({ dynamicEqEnabled: enabled });
      localStorage.setItem('dynamic-eq-enabled', String(enabled));
    },

    setBassTone: (tone) => {
      set({ bassTone: tone });
      localStorage.setItem('bass-tone', String(tone));
    },

    setUltraEqEnabled: (enabled) => {
      set({ ultraEqEnabled: enabled });
      localStorage.setItem('ultra-eq-enabled', String(enabled));
    },

    setHearingCompensation: (enabled) => {
      set({ hearingCompensation: enabled });
      localStorage.setItem('hearing-compensation', String(enabled));
    },

    setMicStatus: (status) => set({ micStatus: status }),
    setMicLevel: (level) => set({ micLevel: level }),
    setAmbientSnapshot: (snapshot) => set({ ambientSnapshot: snapshot }),

    // ─────────────────────────────────────────────────
    // PLAYBACK ACTIONS
    // ─────────────────────────────────────────────────
    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setDuration: (duration) => set({ duration: duration }),
    setCurrentTime: (time) => set({ currentTime: time }),

    setVolume: (vol) => {
      set({ volume: vol });
      localStorage.setItem('volume', String(vol));
    },

    setBuffering: (buffering) => set({ buffering: buffering }),
    setLoading: (loading) => set({ loading: loading }),
    setError: (error) => set({ error: error }),

    // ─────────────────────────────────────────────────
    // QUEUE ACTIONS
    // ─────────────────────────────────────────────────
    setQueue: (queue) => set({ queue: queue }),
    setQueueIndex: (index) => set({ queueIndex: index }),
    setQueueHistory: (history) => set({ queueHistory: history }),

    setShuffle: (shuffle) => {
      set({ shuffle: shuffle });
      localStorage.setItem('shuffle', String(shuffle));
    },

    setRepeat: (repeat) => {
      set({ repeat: repeat });
      localStorage.setItem('repeat', repeat);
    },

    toggleShuffle: () => {
      const newValue = !get().shuffle;
      set({ shuffle: newValue });
      localStorage.setItem('shuffle', String(newValue));
    },

    toggleRepeat: () => {
      const current = get().repeat;
      const newValue = current === 'none' ? 'all' : current === 'all' ? 'one' : 'none';
      set({ repeat: newValue });
      localStorage.setItem('repeat', newValue);
    },

    // ─────────────────────────────────────────────────
    // NETWORK ACTIONS
    // ─────────────────────────────────────────────────
    setNetworkStatus: (status) => set({ networkStatus: status }),
    setOfflineMode: (offline) => {
      set({ offlineMode: offline });
      localStorage.setItem('offline-mode', String(offline));
    },

    // ─────────────────────────────────────────────────
    // BATCH UPDATES (for performance)
    // ─────────────────────────────────────────────────
    batchUpdate: (updates) => set(updates),
  }))
);

// ─────────────────────────────────────────────────
// SELECTORS (for optimized subscriptions)
// ─────────────────────────────────────────────────

// Playback selectors - only re-render when specific value changes
export const useCurrentTrack = () => useAudioStore((s) => s.currentTrack);
export const useIsPlaying = () => useAudioStore((s) => s.isPlaying);
export const useDuration = () => useAudioStore((s) => s.duration);
export const useCurrentTime = () => useAudioStore((s) => s.currentTime);
export const useVolume = () => useAudioStore((s) => s.volume);
export const useBuffering = () => useAudioStore((s) => s.buffering);
export const useLoading = () => useAudioStore((s) => s.loading);
export const usePlaybackError = () => useAudioStore((s) => s.error);

// Queue selectors
export const useQueue = () => useAudioStore((s) => s.queue);
export const useQueueIndex = () => useAudioStore((s) => s.queueIndex);
export const useQueueHistory = () => useAudioStore((s) => s.queueHistory);
export const useShuffle = () => useAudioStore((s) => s.shuffle);
export const useRepeat = () => useAudioStore((s) => s.repeat);

// EQ selectors
export const useEqMode = () => useAudioStore((s) => s.eqMode);
export const useEqGains = () => useAudioStore((s) => s.eqGains);
export const useAdvancedEqGains = () => useAudioStore((s) => s.advancedEqGains);
export const useTargetEqGains = () => useAudioStore((s) => s.targetEqGains);
export const useTargetAdvancedEqGains = () => useAudioStore((s) => s.targetAdvancedEqGains);
export const useIsDraggingEQ = () => useAudioStore((s) => s.isDraggingEQ);
export const useEqSmartEnabled = () => useAudioStore((s) => s.eqSmartEnabled);
export const useEqSmartSettings = () => useAudioStore((s) => s.eqSmartSettings);
export const useEqSmartProcessing = () => useAudioStore((s) => s.eqSmartProcessing);
export const useEqSmartSuggestions = () => useAudioStore((s) => s.eqSmartSuggestions);
export const useDynamicEqEnabled = () => useAudioStore((s) => s.dynamicEqEnabled);
export const useBassTone = () => useAudioStore((s) => s.bassTone);
export const useUltraEqEnabled = () => useAudioStore((s) => s.ultraEqEnabled);
export const useHearingCompensation = () => useAudioStore((s) => s.hearingCompensation);

// Mic selectors
export const useMicStatus = () => useAudioStore((s) => s.micStatus);
export const useMicLevel = () => useAudioStore((s) => s.micLevel);
export const useAmbientSnapshot = () => useAudioStore((s) => s.ambientSnapshot);

// Network selectors
export const useNetworkStatus = () => useAudioStore((s) => s.networkStatus);
export const useOfflineMode = () => useAudioStore((s) => s.offlineMode);

// Action selectors (stable references)
export const usePlaybackActions = () => useAudioStore((s) => ({
  setCurrentTrack: s.setCurrentTrack,
  setIsPlaying: s.setIsPlaying,
  setDuration: s.setDuration,
  setCurrentTime: s.setCurrentTime,
  setVolume: s.setVolume,
  setBuffering: s.setBuffering,
  setLoading: s.setLoading,
  setError: s.setError,
}));

export const useQueueActions = () => useAudioStore((s) => ({
  setQueue: s.setQueue,
  setQueueIndex: s.setQueueIndex,
  setQueueHistory: s.setQueueHistory,
  setShuffle: s.setShuffle,
  setRepeat: s.setRepeat,
  toggleShuffle: s.toggleShuffle,
  toggleRepeat: s.toggleRepeat,
}));

export const useEqActions = () => useAudioStore((s) => ({
  setEqMode: s.setEqMode,
  setEqGains: s.setEqGains,
  setAdvancedEqGains: s.setAdvancedEqGains,
  setTargetEqGains: s.setTargetEqGains,
  setTargetAdvancedEqGains: s.setTargetAdvancedEqGains,
  setIsDraggingEQ: s.setIsDraggingEQ,
  setEqSmartEnabled: s.setEqSmartEnabled,
  setEqSmartSettings: s.setEqSmartSettings,
  setEqSmartProcessing: s.setEqSmartProcessing,
  setEqSmartSuggestions: s.setEqSmartSuggestions,
  setDynamicEqEnabled: s.setDynamicEqEnabled,
  setBassTone: s.setBassTone,
  setUltraEqEnabled: s.setUltraEqEnabled,
  setHearingCompensation: s.setHearingCompensation,
}));

// Shallow comparison for object selectors
export const usePlaybackState = () => useAudioStore(
  (s) => ({
    currentTrack: s.currentTrack,
    isPlaying: s.isPlaying,
    duration: s.duration,
    volume: s.volume,
    buffering: s.buffering,
    loading: s.loading,
    error: s.error,
  }),
  Object.is
);

// For components that need the full store (should be rare)
export const getAudioStore = () => useAudioStore.getState();
export const subscribeToAudioStore = useAudioStore.subscribe;
