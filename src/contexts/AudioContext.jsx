// src/contexts/AudioContext.jsx
// Refactored to use Zustand for efficient state management
// Components subscribe only to the state they need, preventing unnecessary re-renders

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import MusicAPI from '../services/api';
import { useAudioStore } from '../stores/audioStore';

/* ───────────────────────────────────────────────
 F REQUENCIES & CONSTANTS  *
 ─────────────────────────────────────────────── */
const STANDARD_FREQUENCIES = [60, 230, 910, 3600, 14000];
const ADVANCED_FREQUENCIES = [
  20, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000,
];

// ISO 226:2003 Equal-Loudness Contour at 80 phon (dB SPL)
const ISO_226_2003_80_PHON = {
  20: 113.1,
  25: 103.2,
  31.5: 95.7,
  40: 89.1,
  50: 83.3,
  63: 77.8,
  80: 72.7,
  100: 68.0,
  125: 63.8,
  160: 59.8,
  200: 56.4,
  250: 53.3,
  315: 50.5,
  400: 47.9,
  500: 45.8,
  630: 44.0,
  800: 42.4,
  1000: 41.0,
  1250: 40.0,
  1600: 39.6,
  2000: 39.6,
  2500: 40.3,
  3150: 41.5,
  4000: 43.1,
  5000: 45.3,
  6300: 48.2,
  8000: 51.8,
  10000: 55.8,
  12500: 60.2,
  16000: 66.2,
  20000: 73.2
};

// Calculate relative compensation needed (normalized to 1kHz)
const EQUAL_LOUDNESS_COMPENSATION = {};
const ref1kHz = ISO_226_2003_80_PHON[1000];
Object.keys(ISO_226_2003_80_PHON).forEach(freq => {
  // Positive values mean we need to boost, negative means cut
  EQUAL_LOUDNESS_COMPENSATION[freq] = (ISO_226_2003_80_PHON[freq] - ref1kHz) * 0.3; // Scale factor for musical application
});

const FREQUENCY_BANDS = [
  { name: 'sub-bass', min: 20, max: 60, color: '#8B5CF6' },
{ name: 'bass', min: 60, max: 250, color: '#6366F1' },
{ name: 'low-mids', min: 250, max: 500, color: '#3B82F6' },
{ name: 'mids', min: 500, max: 2000, color: '#10B981' },
{ name: 'high-mids', min: 2000, max: 4000, color: '#F59E0B' },
{ name: 'presence', min: 4000, max: 8000, color: '#EF4444' },
{ name: 'brilliance', min: 8000, max: 20000, color: '#EC4899' },
];

const EQ_PRESETS = {
  standard: [
    { id: 'flat', name: 'Flat', values: [0, 0, 0, 0, 0] },
    { id: 'balanced', name: 'Balanced', values: [1, 1, 0, 1, 1] },
    { id: 'bass-reduction', name: 'Bass Reduction', values: [-3, -2, 0, 0, 0] },
    { id: 'vocal', name: 'Vocal Clarity', values: [-1, -1, 1, 2, 1] },
    { id: 'warmth', name: 'Warmth', values: [2, 1, 0, -1, -1] },
    { id: 'presence', name: 'Presence', values: [0, 0, 1, 2, 1] },
    { id: 'sparkle', name: 'Sparkle', values: [0, 0, 0, 1, 2] },
    { id: 'podcast', name: 'Podcast/Speech', values: [-2, 0, 2, 2, 0] },
    { id: 'night', name: 'Night Mode', values: [-1, -1, 0, -1, -2] },
    { id: 'clarity', name: 'Crystal Clear', values: [-1, 0, 1, 2, 2] },
    { id: 'ultra-hearing', name: 'Ultra Hearing', values: [2, 1, 0, 1, 3] }, // Enhanced for hard-to-hear frequencies
  ],
  advanced: [
    { id: 'studio', name: 'Studio Reference', values: Array(30).fill(0) },
    { id: 'natural', name: 'Natural Enhancement',
      values: [0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    { id: 'detailed', name: 'Detailed & Clean',
      values: [-1, -1, -1, -0.5, 0, 0, 0, 0.5, 1, 1, 1.5, 1.5, 2, 2, 2, 2, 1.5, 1, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    { id: 'iso-compensation', name: 'ISO 226 Compensation',
      values: ADVANCED_FREQUENCIES.map(freq => {
        const compensation = EQUAL_LOUDNESS_COMPENSATION[freq] || 0;
        return Math.round(compensation * 10) / 10;
      })
    },
  ],
};

const CACHE_CONFIG = {
  shortTerm: 24 * 60 * 60 * 1000,
  mediumTerm: 7 * 24 * 60 * 60 * 1000,
  longTerm: 30 * 24 * 60 * 60 * 1000,
};

const REALTIME_CONFIG = {
  analysisInterval: 120,
  sampleSize: 2048,
  smoothingFactor: 0.85,
  targetLoudness: -16,
  maxBoost: 6,
  maxCut: -10,
  adaptiveSpeed: 0.1,
  frequencyResolution: 4096,
};

const isMediaSourceSupported = () => (
  typeof window !== 'undefined' &&
  window.MediaSource &&
  typeof window.MediaSource.isTypeSupported === 'function'
);

const pickSupportedMimeType = (contentType, url = '') => {
  if (!isMediaSourceSupported()) return null;

  const normalizeAudioMime = (mime) => {
    if (!mime) return '';
    const base = mime.split(';')[0].trim().toLowerCase();
    if (!base.startsWith('audio/')) return '';
    if (base === 'audio/mp4' || base === 'audio/aac') return 'audio/mp4; codecs="mp4a.40.2"';
    if (base === 'audio/ogg') return 'audio/ogg; codecs="opus"';
    if (base === 'audio/webm') return 'audio/webm; codecs="vorbis"';
    if (base === 'audio/mpeg' || base === 'audio/mp3') return 'audio/mpeg';
    return base;
  };

  const guessFromUrl = (targetUrl) => {
    const loweredUrl = targetUrl.toLowerCase();
    if (loweredUrl.endsWith('.mp3') || loweredUrl.includes('format=mp3')) {
      return 'audio/mpeg';
    }
    if (loweredUrl.endsWith('.m4a') || loweredUrl.endsWith('.mp4')) {
      return 'audio/mp4; codecs="mp4a.40.2"';
    }
    if (loweredUrl.endsWith('.ogg')) {
      return 'audio/ogg; codecs="opus"';
    }
    if (loweredUrl.endsWith('.webm')) {
      return 'audio/webm; codecs="vorbis"';
    }
    return '';
  };

  const normalized = normalizeAudioMime(contentType);
  const extGuess = guessFromUrl(url);

  // Only stream when we can confidently map to the real mime type; guessing the wrong
  // container (e.g., webm for an mp3 stream) can trigger decoder init failures.
  const candidates = Array.from(new Set([normalized, extGuess].filter(Boolean)));

  return candidates.find(type => window.MediaSource.isTypeSupported(type)) || null;
};

const toArrayBuffer = (chunk) => {
  if (!chunk) return null;
  if (chunk instanceof ArrayBuffer) return chunk;
  if (chunk.buffer) {
    return chunk.buffer.slice(chunk.byteOffset || 0, (chunk.byteOffset || 0) + chunk.byteLength);
  }
  return null;
};

/* ───────────────────────────────────────────────
 C ACHE MANAGER            *
 ─────────────────────────────────────────────── */
class CacheManager {
  constructor() {
    this.db = null;
    this.ready = this.init();
    this.memoryCache = new Map();
  }

  async init() {
    if (this.db) return true;

    try {
      const request = indexedDB.open('beatfly-audio-cache', 6);

      this.db = await new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const stores = [
            { name: 'tracks', keyPath: 'id' },
            { name: 'audio-files', keyPath: 'id' },
            { name: 'album-art', keyPath: 'url' },
            { name: 'eq-presets', keyPath: 'id' },
            { name: 'audio-analysis', keyPath: 'trackId' },
            { name: 'waveforms', keyPath: 'trackId' },
          ];

          stores.forEach((store) => {
            if (!db.objectStoreNames.contains(store.name)) {
              db.createObjectStore(store.name, { keyPath: store.keyPath });
            }
          });
        };
      });

      return true;
    } catch (err) {
      console.error('Cache initialization failed:', err);
      return false;
    }
  }

  async get(storeName, key) {
    const cacheKey = `${storeName}:${key}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    await this.ready;
    if (!this.db) return null;

    try {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            this.memoryCache.set(cacheKey, result);
          }
          resolve(result);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async put(storeName, item) {
    await this.ready;
    if (!this.db) return false;

    try {
      const itemWithTimestamp = { ...item, cachedAt: Date.now() };
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(itemWithTimestamp);

      const cacheKey = `${storeName}:${item.id || item.url || item.trackId}`;
      this.memoryCache.set(cacheKey, itemWithTimestamp);

      return true;
    } catch {
      return false;
    }
  }

  async clear(storeName) {
    await this.ready;
    if (!this.db) return false;

    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();

      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(`${storeName}:`)) {
          this.memoryCache.delete(key);
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  isStale(cachedAt, maxAge = CACHE_CONFIG.shortTerm) {
    return !cachedAt || Date.now() - cachedAt > maxAge;
  }
}

const cacheInstance = new CacheManager();

/* ───────────────────────────────────────────────
 U LTRA AUDIO ANALYZER WITH* ISO 226:2003
 ─────────────────────────────────────────────── */
class UltraAudioAnalyzer {
  constructor(audioContext, analyzerNode) {
    this.audioContext = audioContext;
    this.analyzer = analyzerNode;
    this.frequencyData = new Float32Array(analyzerNode.frequencyBinCount);
    this.timeData = new Float32Array(analyzerNode.fftSize);

    this.contentType = 'unknown';
    this.dynamicRange = 0;
    this.spectralBalance = { bass: 0, mid: 0, treble: 0 };
    this.clarity = 0;

    this.history = {
      gains: null,
      loudness: [],
      spectrum: [],
      dynamics: [],
    };

    this.adaptiveParams = {
      bassControl: 1.0,
      midControl: 1.0,
      trebleControl: 1.0,
      clarityEnhancement: 0,
      dynamicCompression: 0,
    };
  }

  analyzeContentType() {
    this.analyzer.getFloatFrequencyData(this.frequencyData);
    this.analyzer.getFloatTimeDomainData(this.timeData);

    let zeroCrossings = 0;
    for (let i = 1; i < this.timeData.length; i++) {
      if ((this.timeData[i] >= 0) !== (this.timeData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / this.timeData.length;

    const nyquist = this.audioContext.sampleRate / 2;
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < this.frequencyData.length; i++) {
      const freq = (i / this.frequencyData.length) * nyquist;
      const magnitude = Math.pow(10, this.frequencyData[i] / 20);
      weightedSum += freq * magnitude;
      magnitudeSum += magnitude;
    }

    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 1000;

    if (zcr > 0.1 && spectralCentroid < 2000) {
      this.contentType = 'speech';
    } else if (zcr < 0.05 && spectralCentroid > 1000) {
      this.contentType = 'music';
    } else {
      this.contentType = 'mixed';
    }

    return this.contentType;
  }

  calculateLoudness() {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < this.frequencyData.length; i++) {
      const freq = (i / this.frequencyData.length) * (this.audioContext.sampleRate / 2);

      // A-weighting approximation
      let weight = 1;
      if (freq < 100) weight = 0.5;
      else if (freq < 1000) weight = 0.8 + (freq / 1000) * 0.2;
      else if (freq > 6000) weight = 0.8 - ((freq - 6000) / 14000) * 0.3;

      const amplitude = Math.pow(10, this.frequencyData[i] / 20);
      sum += amplitude * amplitude * weight;
      count += weight;
    }

    const rms = Math.sqrt(count > 0 ? sum / count : 0);
    return -0.691 + 10 * Math.log10(Math.max(1e-10, rms));
  }

  analyzeSpectralBalance() {
    const nyquist = this.audioContext.sampleRate / 2;
    const bands = { bass: 0, mid: 0, treble: 0 };
    const counts = { bass: 0, mid: 0, treble: 0 };

    for (let i = 0; i < this.frequencyData.length; i++) {
      const freq = (i / this.frequencyData.length) * nyquist;
      const amplitude = Math.pow(10, this.frequencyData[i] / 20);

      if (freq < 250) {
        bands.bass += amplitude;
        counts.bass++;
      } else if (freq < 4000) {
        bands.mid += amplitude;
        counts.mid++;
      } else if (freq < 12000) {
        bands.treble += amplitude;
        counts.treble++;
      }
    }

    this.spectralBalance = {
      bass: counts.bass > 0 ? bands.bass / counts.bass : 0,
      mid: counts.mid > 0 ? bands.mid / counts.mid : 0,
      treble: counts.treble > 0 ? bands.treble / counts.treble : 0,
    };

    return this.spectralBalance;
  }

  applyISO226Compensation(frequency) {
    // Get the compensation value for the nearest frequency
    const freqs = Object.keys(EQUAL_LOUDNESS_COMPENSATION).map(Number).sort((a, b) => a - b);
    let compensation = 0;

    for (let i = 0; i < freqs.length - 1; i++) {
      if (frequency >= freqs[i] && frequency <= freqs[i + 1]) {
        // Linear interpolation between two points
        const f1 = freqs[i];
        const f2 = freqs[i + 1];
        const c1 = EQUAL_LOUDNESS_COMPENSATION[f1];
        const c2 = EQUAL_LOUDNESS_COMPENSATION[f2];

        const ratio = (frequency - f1) / (f2 - f1);
        compensation = c1 + (c2 - c1) * ratio;
        break;
      }
    }

    return compensation;
  }

  generateAdaptiveEQ(frequencies, isAdvanced = false) {
    this.analyzer.getFloatFrequencyData(this.frequencyData);
    this.analyzer.getFloatTimeDomainData(this.timeData);

    this.analyzeContentType();
    this.analyzeSpectralBalance();
    const loudness = this.calculateLoudness();

    this.history.loudness.push(loudness);
    if (this.history.loudness.length > 10) {
      this.history.loudness.shift();
    }

    const avgLoudness = this.history.loudness.reduce((a, b) => a + b, 0) / this.history.loudness.length;

    const adjustments = frequencies.map((freq) => {
      let gain = 0;

      // Apply ISO 226:2003 compensation
      const isoCompensation = this.applyISO226Compensation(freq);
      gain += isoCompensation * 0.5; // Scale down for musical use

      // Content-specific adjustments
      if (this.contentType === 'speech') {
        if (freq < 80) gain -= 2;
        if (freq >= 200 && freq <= 500) gain -= 1;
        if (freq >= 2000 && freq <= 4000) gain += 1.5;
      } else if (this.contentType === 'music') {
        // Enhance typically hard-to-hear frequencies
        if (freq <= 40) gain += 2; // Sub-bass enhancement
        if (freq >= 10000) gain += 2.5; // High frequency enhancement
      }

      // Loudness-based adjustment
      const loudnessError = REALTIME_CONFIG.targetLoudness - avgLoudness;
      if (Math.abs(loudnessError) > 2) {
        if (freq >= 100 && freq <= 4000) {
          gain += loudnessError * 0.2;
        }
      }

      // Spectral balance correction
      const balance = this.spectralBalance;
      const avgLevel = (balance.bass + balance.mid + balance.treble) / 3;

      if (freq < 250 && balance.bass > avgLevel * 1.5) {
        gain -= 1;
      } else if (freq >= 250 && freq < 4000 && balance.mid < avgLevel * 0.8) {
        gain += 1;
      } else if (freq >= 4000 && balance.treble < avgLevel * 0.7) {
        gain += 1.5;
      }

      // Apply limits
      gain = Math.max(REALTIME_CONFIG.maxCut, Math.min(REALTIME_CONFIG.maxBoost, gain));

      // Smooth with history
      if (this.history.gains) {
        const index = frequencies.indexOf(freq);
        const previousGain = this.history.gains[index] || 0;
        gain = previousGain * REALTIME_CONFIG.smoothingFactor + gain * (1 - REALTIME_CONFIG.smoothingFactor);
      }

      return Math.round(gain * 10) / 10;
    });

    this.history.gains = adjustments;
    return adjustments;
  }
}

/* ───────────────────────────────────────────────
 A UDIO NODE MANAGER       *
 ─────────────────────────────────────────────── */
class AudioNodeManager {
  constructor() {
    this.audioContext = null;
    this.nodes = {
      source: null,
      gain: null,
      analyzer: null,
      compressor: null,
      headroom: null,
      standardFilters: null,
      advancedFilters: null,
    };
    this.currentMode = 'standard';
    this.isConnected = false;
  }

  async initialize(volume = 1, eqGains = null, advancedEqGains = null) {
    let contextChanged = false;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      contextChanged = true;
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // If context changed, or if nodes don't exist, create them
    if (contextChanged || !this.nodes.gain) {
      this.nodes.gain = this.audioContext.createGain();
      this.nodes.analyzer = this.audioContext.createAnalyser();
      this.nodes.compressor = this.audioContext.createDynamicsCompressor();
      this.nodes.headroom = this.audioContext.createGain();
      
      // Reset source as it will be recreated for the specific audio element
      this.nodes.source = null; 

      this.nodes.compressor.threshold.value = -12;
      this.nodes.compressor.knee.value = 20;
      this.nodes.compressor.ratio.value = 3;
      this.nodes.compressor.attack.value = 0.005;
      this.nodes.compressor.release.value = 0.1;
    }

    // Always update volume and headroom value
    this.nodes.gain.gain.value = volume;
    this.nodes.headroom.gain.value = 1;

    // (Re)create filters, always from the current audioContext
    this.nodes.standardFilters = STANDARD_FREQUENCIES.map((freq, index) => {
      const filter = this.audioContext.createBiquadFilter();
      if (freq === 60) {
        filter.type = 'highshelf';
        filter.frequency.value = 80;
      } else if (freq === 14000) {
        filter.type = 'highshelf';
        filter.frequency.value = 10000;
      } else {
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.5;
      }
      filter.gain.value = eqGains?.[index] || 0;
      return filter;
    });

    this.nodes.advancedFilters = ADVANCED_FREQUENCIES.map((freq, index) => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = freq < 100 ? 0.7 : freq < 1000 ? 1.2 : 2.0;
      filter.gain.value = advancedEqGains?.[index] || 0;
      return filter;
    });

    return this.audioContext;
  }

  createSourceForElement(audioElement) {
    if (!this.nodes.source || this.nodes.source.mediaElement !== audioElement) {
      if (this.nodes.source) {
        this.disconnect();
      }
      this.nodes.source = this.audioContext.createMediaElementSource(audioElement);
    }
    return this.nodes.source;
  }

  connect(mode = 'standard') {
    if (!this.nodes.source || this.isConnected) return;

    this.disconnect();

    const filters = mode === 'advanced' ? this.nodes.advancedFilters : this.nodes.standardFilters;
    this.currentMode = mode;

    let lastNode = this.nodes.source;
    const headroomNode = this.nodes.headroom;

    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
    }

    if (headroomNode) {
      lastNode.connect(headroomNode);
      headroomNode.connect(this.nodes.compressor);
    } else {
      lastNode.connect(this.nodes.compressor);
    }

    this.nodes.compressor.connect(this.nodes.gain);
    this.nodes.gain.connect(this.nodes.analyzer);
    this.nodes.analyzer.connect(this.audioContext.destination);

    this.isConnected = true;
  }

  disconnect() {
    if (!this.isConnected) return;

    try {
      const disconnectNode = (node) => {
        if (node && node.numberOfOutputs > 0) {
          try {
            node.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
        }
      };

      disconnectNode(this.nodes.source);
      this.nodes.standardFilters?.forEach(disconnectNode);
      this.nodes.advancedFilters?.forEach(disconnectNode);
      disconnectNode(this.nodes.headroom);
      disconnectNode(this.nodes.compressor);
      disconnectNode(this.nodes.gain);
      disconnectNode(this.nodes.analyzer);

      this.isConnected = false;
    } catch (e) {
      console.error('Error disconnecting nodes:', e);
    }
  }

  updateFilterGain(mode, index, value) {
    const filters = mode === 'advanced' ? this.nodes.advancedFilters : this.nodes.standardFilters;
    if (filters && filters[index]) {
      filters[index].gain.setValueAtTime(value, this.audioContext.currentTime);
    }
  }

  updateVolume(value) {
    if (this.nodes.gain) {
      this.nodes.gain.gain.setValueAtTime(value, this.audioContext.currentTime);
    }
  }

  updateHeadroom(reductionDb = 0) {
    if (!this.nodes.headroom || !this.audioContext) return;

    const clampedReduction = Math.max(0, reductionDb);
    const linearGain = Math.pow(10, -clampedReduction / 20);
    this.nodes.headroom.gain.setTargetAtTime(linearGain, this.audioContext.currentTime, 0.05);
  }

  getContext() {
    return this.audioContext;
  }

  getAnalyzer() {
    return this.nodes.analyzer;
  }
}

/* ───────────────────────────────────────────────
 M AIN AUDIO CONTEXT       *
 ─────────────────────────────────────────────── */
const AudioContextData = createContext(null);
const NowPlayingContext = createContext(null);
const PlaybackContext = createContext(null);
const QueueContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const nodeManagerRef = useRef(null);
  const audioRef = useRef(null);
  const ultraAnalyzerRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const currentBlobUrlRef = useRef(null);
  const currentStreamControllerRef = useRef(null);
  const currentStreamFinalizeRef = useRef(null);
  const micStreamRef = useRef(null);
  const micSourceRef = useRef(null);
  const micAnalyzerRef = useRef(null);
  const ambientHistoryRef = useRef(null);
  const micFrameCountRef = useRef(0);
  const micFreqBufferRef = useRef(null);
  const micLevelRef = useRef(0);
  const committedMicLevelRef = useRef(0);
  const lastMicLevelCommitRef = useRef(0);
  const lastRealtimeAdjustmentsRef = useRef({
    standard: null,
    advanced: null,
  });
  const lastTargetUpdateRef = useRef({
    standard: 0,
    advanced: 0,
  });

  useEffect(() => {
    if (!nodeManagerRef.current) {
      nodeManagerRef.current = new AudioNodeManager();
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // ─────────────────────────────────────────────────
  // ZUSTAND STORE ACCESS (replaces useState for performance)
  // Components use selectors to subscribe only to needed state
  // ─────────────────────────────────────────────────

  // Get store actions (stable references)
  const store = useAudioStore;
  const getState = store.getState;

  // Refs for non-reactive values and performance optimization
  const persistTimeoutRef = useRef({ standard: null, advanced: null });
  const prevBassToneRef = useRef(getState().bassTone);
  const currentTimeRef = useRef(0);
  const lastCurrentTimeCommitRef = useRef(0);
  const queueRef = useRef([]);
  const queueHistoryRef = useRef([]);
  const queueIndexRef = useRef(0);

  // Debounced localStorage persistence
  const schedulePersist = useCallback((storageKey, value, modeKey) => {
    if (persistTimeoutRef.current[modeKey]) {
      clearTimeout(persistTimeoutRef.current[modeKey]);
    }
    persistTimeoutRef.current[modeKey] = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } finally {
        persistTimeoutRef.current[modeKey] = null;
      }
    }, 450);
  }, []);

  // Sync refs with store (using subscribe for efficiency)
  useEffect(() => {
    const unsubQueue = store.subscribe(
      (state) => state.queue,
      (queue) => { queueRef.current = queue; }
    );
    const unsubHistory = store.subscribe(
      (state) => state.queueHistory,
      (history) => { queueHistoryRef.current = history; }
    );
    const unsubIndex = store.subscribe(
      (state) => state.queueIndex,
      (index) => { queueIndexRef.current = index; }
    );

    // Initialize refs
    queueRef.current = getState().queue;
    queueHistoryRef.current = getState().queueHistory;
    queueIndexRef.current = getState().queueIndex;

    return () => {
      unsubQueue();
      unsubHistory();
      unsubIndex();
    };
  }, []);

  // Sync dynamic EQ with smart EQ
  useEffect(() => {
    const unsub = store.subscribe(
      (state) => ({ smart: state.eqSmartEnabled, dynamic: state.dynamicEqEnabled }),
      ({ smart, dynamic }) => {
        if (smart && !dynamic) {
          getState().setDynamicEqEnabled(true);
        }
      }
    );
    return unsub;
  }, []);

  // Toggle functions using store
  const toggleShuffle = useCallback(() => getState().toggleShuffle(), []);
  const toggleRepeat = useCallback(() => getState().toggleRepeat(), []);

  // Visualizer state
  /* ───────────────────────────────────────────────
   C ore Audio Functions   *
   ─────────────────────────────────────────────── */

  const initializeAudio = useCallback(async () => {
    if (!nodeManagerRef.current) return null;

    const { volume, eqGains, advancedEqGains } = getState();
    const ctx = await nodeManagerRef.current.initialize(volume, eqGains, advancedEqGains);

    if (!ultraAnalyzerRef.current && nodeManagerRef.current.getAnalyzer()) {
      ultraAnalyzerRef.current = new UltraAudioAnalyzer(
        ctx,
        nodeManagerRef.current.getAnalyzer()
      );
    }

    return ctx;
  }, []);

  const connectAudioNodes = useCallback(() => {
    if (!nodeManagerRef.current || !audioRef.current.src) return;
    nodeManagerRef.current.connect(getState().eqMode);
  }, []);

  const ensureAudioReady = useCallback(async () => {
    const ctx = nodeManagerRef.current?.getContext();

    if (nodeManagerRef.current && audioRef.current) {
      nodeManagerRef.current.createSourceForElement(audioRef.current);
      if (!nodeManagerRef.current.isConnected && audioRef.current.src) {
        nodeManagerRef.current.connect(getState().eqMode);
      }
    }

    if (ctx && ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }, []);

  const stopActiveStream = useCallback(() => {
    if (currentStreamControllerRef.current) {
      try {
        currentStreamControllerRef.current.abort();
      } catch (err) {
        console.error('Error aborting active stream:', err);
      }
      currentStreamControllerRef.current = null;
    }
    currentStreamFinalizeRef.current = null;
  }, []);

  /* ───────────────────────────────────────────────
   E Q Control Functions   *
   ─────────────────────────────────────────────── */

  const applyHeadroomCompensation = useCallback((gains) => {
    if (!nodeManagerRef.current) return;

    if (!Array.isArray(gains) || gains.length === 0) {
      nodeManagerRef.current.updateHeadroom(0);
      return;
    }

    const numericGains = gains.map((value) => (
      typeof value === 'number' && isFinite(value) ? value : 0
    ));

    const maxBoost = Math.max(0, ...numericGains);
    const positiveSum = numericGains.reduce((sum, gain) => sum + Math.max(gain, 0), 0);
    const avgPositive = positiveSum / numericGains.length;
    const rmsPositive = Math.sqrt(
      numericGains.reduce((sum, gain) => sum + Math.max(gain, 0) * Math.max(gain, 0), 0) /
      Math.max(1, numericGains.length)
    );

    const { eqSmartEnabled, eqSmartSettings } = getState();
    const baseHeadroom = eqSmartEnabled ? Math.max(0, eqSmartSettings.headroom ?? 6) : 0;

    // Aim for enough reduction to cover summed boosts and overlap between bands.
    const computedReduction = Math.max(
      maxBoost,
      avgPositive * 1.5,
      rmsPositive * 1.25,
      positiveSum / Math.max(1, numericGains.length / 2)
    );

    const targetReduction = Math.min(18, baseHeadroom + computedReduction);
    nodeManagerRef.current.updateHeadroom(targetReduction);
  }, []);

  const applyRealtimeEQ = useCallback((adjustments, options = {}) => {
    const { eqMode, isDraggingEQ } = getState();
    if (!nodeManagerRef.current || isDraggingEQ) return;

    const { updateState = false } = options;
    const validAdjustments = adjustments.map((adj) => {
      if (typeof adj !== 'number' || !isFinite(adj)) return 0;
      return Math.max(-12, Math.min(12, adj));
    });

    const lastAdjustments = lastRealtimeAdjustmentsRef.current[eqMode];
    const hasMeaningfulChange = !lastAdjustments ||
      lastAdjustments.length !== validAdjustments.length ||
      lastAdjustments.some((prev, index) => Math.abs(prev - validAdjustments[index]) > 0.01);

    if (!hasMeaningfulChange) return;
    lastRealtimeAdjustmentsRef.current[eqMode] = [...validAdjustments];

    validAdjustments.forEach((adjustment, index) => {
      nodeManagerRef.current.updateFilterGain(eqMode, index, adjustment);
    });

    const modeKey = eqMode === 'advanced' ? 'advanced' : 'standard';
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const shouldUpdateTargets = updateState || now - (lastTargetUpdateRef.current[modeKey] || 0) > 180;

    if (eqMode === 'advanced') {
      if (shouldUpdateTargets) {
        getState().setTargetAdvancedEqGains(validAdjustments);
        lastTargetUpdateRef.current.advanced = now;
      }
      if (updateState) {
        getState().setAdvancedEqGains(validAdjustments);
      }
    } else {
      if (shouldUpdateTargets) {
        getState().setTargetEqGains(validAdjustments);
        lastTargetUpdateRef.current.standard = now;
      }
      if (updateState) {
        getState().setEqGains(validAdjustments);
      }
    }
    applyHeadroomCompensation(validAdjustments);
  }, [applyHeadroomCompensation]);

  const tuneEqSmartAdjustments = useCallback((adjustments, freqs) => {
    if (!Array.isArray(adjustments) || !Array.isArray(freqs)) return [];

    const { eqSmartSettings } = getState();
    return adjustments.map((gain, index) => {
      const freq = freqs[index] || 0;
      let tuned = gain * (eqSmartSettings.intensity ?? 1);

      if (eqSmartSettings.bassTilt) {
        const weight = freq <= 120 ? 1 : freq <= 250 ? 0.6 : freq <= 400 ? 0.35 : 0;
        tuned += (eqSmartSettings.bassTilt || 0) * weight;
      }

      if (eqSmartSettings.trebleTilt) {
        const weight = freq >= 8000 ? 1 : freq >= 4000 ? 0.6 : freq >= 2500 ? 0.35 : 0;
        tuned += (eqSmartSettings.trebleTilt || 0) * weight;
      }

      return Math.max(REALTIME_CONFIG.maxCut, Math.min(REALTIME_CONFIG.maxBoost, tuned));
    });
  }, []);

  const normalizeAdjustments = useCallback((adjustments) => {
    if (!Array.isArray(adjustments) || adjustments.length === 0) return [];

    const numeric = adjustments.map(a => (typeof a === 'number' && isFinite(a) ? a : 0));
    const mean = numeric.reduce((sum, g) => sum + g, 0) / numeric.length;
    let centered = numeric.map(g => g - mean);

    const positive = centered.reduce((sum, g) => sum + Math.max(0, g), 0);
    const negative = centered.reduce((sum, g) => sum + Math.abs(Math.min(0, g)), 0);

    if (positive > negative * 1.2 && positive > 0) {
      const scale = (negative * 1.05) / positive;
      centered = centered.map(g => (g > 0 ? g * scale : g));
    } else if (negative > positive * 1.2 && negative > 0) {
      const scale = (positive * 1.05) / negative;
      centered = centered.map(g => (g < 0 ? g * scale : g));
    }

    return centered.map(g => Math.max(REALTIME_CONFIG.maxCut, Math.min(REALTIME_CONFIG.maxBoost, g)));
  }, []);

  const stopMicrophoneCapture = useCallback(() => {
    try {
      micSourceRef.current?.disconnect();
    } catch {
      // Ignore disconnect issues
    }

    micSourceRef.current = null;
    micAnalyzerRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore failures
        }
      });
      micStreamRef.current = null;
    }

    ambientHistoryRef.current = null;
    getState().setMicLevel(0);
    const currentStatus = getState().micStatus;
    if (currentStatus === 'active' || currentStatus === 'prompt') {
      getState().setMicStatus('idle');
    }
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      getState().setMicStatus('unavailable');
      return null;
    }

    const { micStatus } = getState();
    if (micStatus === 'active' && micStreamRef.current && micAnalyzerRef.current) {
      return micAnalyzerRef.current;
    }

    try {
      if (getState().micStatus !== 'active') {
        getState().setMicStatus('prompt');
      }
      await initializeAudio();
      const ctx = nodeManagerRef.current?.getContext();
      if (!ctx) {
        throw new Error('Audio context not ready');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      stopMicrophoneCapture();

      micStreamRef.current = stream;
      micSourceRef.current = ctx.createMediaStreamSource(stream);
      micAnalyzerRef.current = ctx.createAnalyser();
      micAnalyzerRef.current.fftSize = 2048;
      micAnalyzerRef.current.smoothingTimeConstant = 0.7;

      micSourceRef.current.connect(micAnalyzerRef.current);

      getState().setMicStatus('active');
      return true;
    } catch (error) {
      console.error('Microphone access failed:', error);
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      const unavailable = error?.name === 'NotFoundError';
      getState().setMicStatus(denied ? 'denied' : unavailable ? 'unavailable' : 'error');
      return false;
    }
  }, [initializeAudio, stopMicrophoneCapture]);

  const calculateAmbientCompensation = useCallback((frequencies) => {
    if (!micAnalyzerRef.current || getState().micStatus !== 'active') return null;

    const analyzer = micAnalyzerRef.current;
    const freqData = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatFrequencyData(freqData);
    const nyquist = (analyzer.context?.sampleRate || 48000) / 2;

    const adjustments = frequencies.map((freq) => {
      const targetIndex = Math.floor((freq / nyquist) * freqData.length);
      const window = Math.max(1, Math.floor(freqData.length / 96));
      let sum = 0;
      let count = 0;

      for (let i = targetIndex - window; i <= targetIndex + window; i++) {
        if (i >= 0 && i < freqData.length) {
          sum += freqData[i];
          count++;
        }
      }

      const avgDb = count > 0 ? sum / count : -110;
      const clamped = Math.min(-15, Math.max(-110, avgDb));
      const normalized = (clamped + 110) / 95; // 0 when quiet, 1 when loud
      const bias = (normalized - 0.5) * 2; // -1..1
      const gain = bias * 1.8; // Gentle +/- compensation
      return gain;
    });

    const smoothed = adjustments.map((gain, index) => {
      const previous = ambientHistoryRef.current?.[index] ?? gain;
      const mixed = previous * 0.65 + gain * 0.35;
      return Math.round(mixed * 10) / 10;
    });

    ambientHistoryRef.current = smoothed;
    return smoothed;
  }, []);

  const startIntelligentAnalysis = useCallback(() => {
    const { eqSmartEnabled, dynamicEqEnabled, eqSmartProcessing } = getState();
    if (!ultraAnalyzerRef.current || !eqSmartEnabled || !dynamicEqEnabled) return;

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    // Only set if not already true to avoid triggering subscriptions
    if (!eqSmartProcessing) {
      getState().setEqSmartProcessing(true);
    }

    analysisIntervalRef.current = setInterval(() => {
      const { isDraggingEQ, isPlaying, eqMode, eqSmartSettings } = getState();
      if (!isDraggingEQ && isPlaying) {
        const frequencies = eqMode === 'advanced' ? ADVANCED_FREQUENCIES : STANDARD_FREQUENCIES;
        const adjustments = ultraAnalyzerRef.current.generateAdaptiveEQ(
          frequencies,
          eqMode === 'advanced'
        );

        const tunedAdjustments = tuneEqSmartAdjustments(adjustments, frequencies);

        const ambientAdjustments = calculateAmbientCompensation(frequencies);
        const combinedAdjustments = ambientAdjustments
          ? tunedAdjustments.map((gain, index) => {
              const micBlend = Math.max(0, Math.min(1, eqSmartSettings.micBlend ?? 0.7));
              const ambient = ambientAdjustments[index] * micBlend * (0.6 + micLevelRef.current * 0.8);
              const combined = gain + ambient;
              return Math.max(REALTIME_CONFIG.maxCut, Math.min(REALTIME_CONFIG.maxBoost, combined));
            })
          : tunedAdjustments;

        const normalizedAdjustments = normalizeAdjustments(combinedAdjustments);
        applyRealtimeEQ(normalizedAdjustments, { updateState: false });
      }
    }, REALTIME_CONFIG.analysisInterval);
  }, [applyRealtimeEQ, calculateAmbientCompensation, tuneEqSmartAdjustments, normalizeAdjustments]);

  const stopIntelligentAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    lastRealtimeAdjustmentsRef.current.standard = null;
    lastRealtimeAdjustmentsRef.current.advanced = null;
    // Only set if currently true to avoid triggering subscriptions
    if (getState().eqSmartProcessing) {
      getState().setEqSmartProcessing(false);
    }
  }, []);

  const setEqGain = useCallback((index, value) => {
    const clampedValue = Math.max(-12, Math.min(12, value));

    if (getState().eqMode === 'standard') {
      const currentGains = [...getState().eqGains];
      currentGains[index] = clampedValue;
      getState().setEqGains(currentGains);
      applyHeadroomCompensation(currentGains);
      nodeManagerRef.current?.updateFilterGain('standard', index, clampedValue);
    }
  }, [applyHeadroomCompensation]);

  const setAdvancedEqGain = useCallback((index, value) => {
    const clampedValue = Math.max(-12, Math.min(12, value));

    if (getState().eqMode === 'advanced') {
      const currentGains = [...getState().advancedEqGains];
      currentGains[index] = clampedValue;
      getState().setAdvancedEqGains(currentGains);
      applyHeadroomCompensation(currentGains);
      nodeManagerRef.current?.updateFilterGain('advanced', index, clampedValue);
    }
  }, [applyHeadroomCompensation]);

  const resetEq = useCallback((mode = null) => {
    const targetMode = mode || getState().eqMode;

    stopIntelligentAnalysis();

    if (targetMode === 'advanced') {
      const zeros = ADVANCED_FREQUENCIES.map(() => 0);
      getState().setAdvancedEqGains(zeros);
      getState().setTargetAdvancedEqGains(zeros);

      zeros.forEach((_, index) => {
        nodeManagerRef.current?.updateFilterGain('advanced', index, 0);
      });
    } else {
      const zeros = STANDARD_FREQUENCIES.map(() => 0);
      getState().setEqGains(zeros);
      getState().setTargetEqGains(zeros);

      zeros.forEach((_, index) => {
        nodeManagerRef.current?.updateFilterGain('standard', index, 0);
      });
    }

    const { eqSmartEnabled, dynamicEqEnabled, isPlaying } = getState();
    if (eqSmartEnabled && dynamicEqEnabled && isPlaying) {
      setTimeout(startIntelligentAnalysis, 100);
    }
  }, [stopIntelligentAnalysis, startIntelligentAnalysis]);

  const applyEqPreset = useCallback((preset) => {
    if (!preset?.values) return;

    stopIntelligentAnalysis();

    const { eqMode } = getState();
    if (eqMode === 'advanced' && preset.values.length === ADVANCED_FREQUENCIES.length) {
      preset.values.forEach((value, index) => {
        setAdvancedEqGain(index, value);
      });
    } else if (eqMode === 'standard' && preset.values.length === STANDARD_FREQUENCIES.length) {
      preset.values.forEach((value, index) => {
        setEqGain(index, value);
      });
    }

    const { eqSmartEnabled, dynamicEqEnabled, isPlaying } = getState();
    if (eqSmartEnabled && dynamicEqEnabled && isPlaying) {
      setTimeout(startIntelligentAnalysis, 100);
    }
  }, [setEqGain, setAdvancedEqGain, stopIntelligentAnalysis, startIntelligentAnalysis]);

  /* ───────────────────────────────────────────────
   P layback Functions     *
   ─────────────────────────────────────────────── */

  const playTrack = useCallback(async (track, addToQueueFlag = true) => {
    if (!track?.id) {
      getState().setError('Invalid track data');
      return;
    }

    try {
      getState().setError(null);
      getState().setLoading(true);

      stopIntelligentAnalysis();
      stopActiveStream();

      const { offlineMode, networkStatus } = getState();
      const token = localStorage.getItem('token');
      if (!token && !offlineMode && networkStatus) {
        getState().setError('Authentication required. Please log in.');
        getState().setLoading(false);
        return;
      }

      await initializeAudio();

      const { currentTrack, isPlaying, eqSmartEnabled, dynamicEqEnabled } = getState();
      if (currentTrack?.id === track.id && audioRef.current.src && nodeManagerRef.current?.isConnected) {
        if (isPlaying) {
          audioRef.current.pause();
          getState().setIsPlaying(false);
          stopIntelligentAnalysis();
        } else {
          await audioRef.current.play();
          getState().setIsPlaying(true);
          if (eqSmartEnabled && dynamicEqEnabled) {
            startIntelligentAnalysis();
          }
        }
        getState().setLoading(false);
        return;
      }

      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      if (audioRef.current.src) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      let trackInfo = track;
      const cachedTrack = await cacheInstance.get('tracks', track.id);

      if (cachedTrack && !cacheInstance.isStale(cachedTrack.cachedAt)) {
        trackInfo = cachedTrack;
      } else if (networkStatus && !offlineMode) {
        try {
          const response = await MusicAPI.getTrack(track.id);
          trackInfo = response.data;
          await cacheInstance.put('tracks', trackInfo);
        } catch (err) {
          if (cachedTrack) {
            trackInfo = cachedTrack;
          } else {
            throw err;
          }
        }
      } else if (!cachedTrack) {
        throw new Error('Track not available offline');
      }

      const audio = audioRef.current;
      let audioUrl;
      let cachePromise = null;

      const cachedAudio = await cacheInstance.get('audio-files', trackInfo.id);

      if (cachedAudio?.blob) {
        audioUrl = URL.createObjectURL(cachedAudio.blob);
        currentBlobUrlRef.current = audioUrl;
      } else if (networkStatus && !offlineMode) {
        try {
          const streamInfo = MusicAPI.streamTrack(trackInfo.id);

          if (!streamInfo.url) {
            throw new Error('No stream URL provided');
          }

          const supportsMediaSource = isMediaSourceSupported();
          const controller = supportsMediaSource ? new AbortController() : null;

          const response = await fetch(streamInfo.url, {
            headers: streamInfo.headers,
            signal: controller?.signal,
          });

          if (!response.ok) {
            throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
          }

          const contentTypeHeader = response.headers.get('content-type');
          const mimeType = contentTypeHeader?.split(';')?.[0]?.trim() || '';
          const fallbackMimeType = mimeType || 'audio/mpeg';
          const supportedMime = pickSupportedMimeType(contentTypeHeader || mimeType, streamInfo.url);
          const canStream = supportsMediaSource &&
            response.body &&
            supportedMime;

          if (canStream) {
            const mediaSource = new MediaSource();
            const reader = response.body.getReader();
            const chunks = [];
            audioUrl = URL.createObjectURL(mediaSource);
            currentBlobUrlRef.current = audioUrl;
            currentStreamControllerRef.current = controller;
            let streamErrored = false;
            let switchedToFallback = false;

            const switchToBufferedBlob = async () => {
              if (switchedToFallback) return;
              switchedToFallback = true;
              try {
                const blob = chunks.length ? new Blob(chunks, { type: fallbackMimeType }) : null;
                if (blob && blob.size) {
                  const blobUrl = URL.createObjectURL(blob);
                  if (currentBlobUrlRef.current) {
                    URL.revokeObjectURL(currentBlobUrlRef.current);
                  }
                  currentBlobUrlRef.current = blobUrl;
                  audio.src = blobUrl;
                  audio.load();
                }
              } catch (err) {
                console.error('Fallback blob switch failed:', err);
              }
            };

            const appendChunk = async (chunk, sourceBuffer) => {
              if (!chunk || !sourceBuffer) return;

              if (sourceBuffer.updating) {
                await new Promise(resolve => {
                  sourceBuffer.addEventListener('updateend', resolve, { once: true });
                });
              }

              await new Promise((resolve, reject) => {
                const onUpdate = () => {
                  sourceBuffer.removeEventListener('updateend', onUpdate);
                  sourceBuffer.removeEventListener('error', onError);
                  resolve();
                };

                const onError = (e) => {
                  sourceBuffer.removeEventListener('updateend', onUpdate);
                  sourceBuffer.removeEventListener('error', onError);
                  streamErrored = true;
                  reject(e);
                };

                sourceBuffer.addEventListener('updateend', onUpdate);
                sourceBuffer.addEventListener('error', onError);

                try {
                  sourceBuffer.appendBuffer(chunk);
                } catch (err) {
                  sourceBuffer.removeEventListener('updateend', onUpdate);
                  sourceBuffer.removeEventListener('error', onError);
                  reject(err);
                }
              });
            };

            const finalizeStream = new Promise((resolve, reject) => {
              let sourceBuffer = null;
              const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));

              controller?.signal?.addEventListener('abort', onAbort, { once: true });

              const pumpStream = async () => {
                let pumpError = null;
                let appendFailed = false;
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (controller?.signal.aborted) {
                      throw new DOMException('Aborted', 'AbortError');
                    }

                    const bufferChunk = toArrayBuffer(value);
                    if (bufferChunk) {
                      chunks.push(bufferChunk);
                      if (!appendFailed) {
                        try {
                          await appendChunk(bufferChunk, sourceBuffer);
                        } catch (err) {
                          appendFailed = true;
                          streamErrored = true;
                        }
                      }
                    }
                  }

                  if (mediaSource.readyState === 'open') {
                    try {
                      mediaSource.endOfStream();
                    } catch (err) {
                      console.warn('MediaSource endOfStream warning:', err);
                    }
                  }
                } catch (err) {
                  pumpError = err;
                  streamErrored = true;
                } finally {
                  if (controller?.signal.aborted) {
                    reader.cancel().catch(() => {});
                  }
                  const blob = chunks.length ? new Blob(chunks, { type: fallbackMimeType }) : null;
                  if (streamErrored || pumpError) {
                    await switchToBufferedBlob();
                  }
                  return blob;
                }
              };

              mediaSource.addEventListener('sourceopen', () => {
                try {
                  sourceBuffer = mediaSource.addSourceBuffer(supportedMime);
                  sourceBuffer.mode = 'sequence';
                  sourceBuffer.addEventListener('error', () => {
                    streamErrored = true;
                  });
                  pumpStream().then(resolve).catch(reject);
                } catch (err) {
                  reject(err);
                }
              }, { once: true });

              mediaSource.addEventListener('error', (err) => reject(err));
            });

            cachePromise = finalizeStream
            .then((blob) => {
              if (blob && blob.size) {
                return cacheInstance.put('audio-files', { id: trackInfo.id, blob });
              }
              return null;
            })
            .catch((err) => {
              if (err?.name !== 'AbortError') {
                console.error('Cache error:', err);
              }
            })
            .finally(() => {
              if (currentStreamControllerRef.current === controller) {
                currentStreamControllerRef.current = null;
              }
              currentStreamFinalizeRef.current = null;
            });

            currentStreamFinalizeRef.current = cachePromise;
          } else {
            // Fallback: download to blob (may require full download before play on non-MSE browsers)
            const blob = await response.blob();
            audioUrl = URL.createObjectURL(blob);
            currentBlobUrlRef.current = audioUrl;

            cachePromise = cacheInstance.put('audio-files', { id: trackInfo.id, blob })
            .catch(err => console.error('Cache error:', err));
          }

        } catch (err) {
          console.error('Error loading audio:', err);
          throw new Error(err.message || 'Failed to get audio stream');
        }
      } else {
        throw new Error('Audio not available offline');
      }

      if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.length === 0) {
        throw new Error('Invalid audio source URL generated or missing');
      }
      audio.src = audioUrl;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';

      nodeManagerRef.current.createSourceForElement(audio);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 30000);

        const cleanup = () => {
          clearTimeout(timeout);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadeddata', onCanPlay);
          audio.removeEventListener('error', onError);
        };

        const onCanPlay = () => {
          cleanup();
          resolve();
        };

        const onError = (e) => {
          // If streaming is in progress, let fallback attempts complete before failing.
          const streamingInProgress = currentStreamFinalizeRef.current && !!currentStreamControllerRef.current;
          if (streamingInProgress) {
            console.warn('Streaming error observed, waiting for fallback...');
            return;
          }

          cleanup();
          console.error('Audio load error event:', e);
          const errorMessage = audio.error?.message || 'Failed to load audio';
          reject(new Error(errorMessage));
        };

        audio.addEventListener('canplay', onCanPlay, { once: true });
        audio.addEventListener('loadeddata', onCanPlay, { once: true });
        audio.addEventListener('error', onError, { once: true });

        audio.load();
      });

      connectAudioNodes();

      await ensureAudioReady();

      getState().setDuration(audio.duration || 0);
      getState().setCurrentTrack(trackInfo);

      if (addToQueueFlag) {
        const prevTrack = getState().currentTrack;
        if (prevTrack) {
          const newHistory = [...getState().queueHistory, prevTrack];
          getState().setQueueHistory(newHistory);
          queueHistoryRef.current = newHistory;
        }

        const currentQueue = getState().queue;
        const existingIndex = currentQueue.findIndex(t => t.id === trackInfo.id);
        let nextIndex = 0;

        if (existingIndex !== -1) {
          nextIndex = existingIndex;
        } else {
          nextIndex = currentQueue.length;
          const nextQueue = [...currentQueue, trackInfo];
          getState().setQueue(nextQueue);
          queueRef.current = nextQueue;
        }

        getState().setQueueIndex(nextIndex);
        queueIndexRef.current = nextIndex;
      }

      await audio.play();
      getState().setIsPlaying(true);
      getState().setLoading(false);

      const { eqSmartEnabled: smartEnabled, hearingCompensation: hearingComp, networkStatus: netStatus } = getState();
      if (smartEnabled) {
        // Apply EQSmart settings
        if (hearingComp) {
          // Apply ISO 226:2003 compensation preset
          const isoPreset = EQ_PRESETS.advanced.find(p => p.id === 'iso-compensation');
          if (isoPreset) {
            applyEqPreset(isoPreset);
          }
        }
      }

      if (netStatus && MusicAPI.updatePlayCount) {
        MusicAPI.updatePlayCount(trackInfo.id).catch(console.error);
      }

      startVisualizer();

    } catch (error) {
      console.error('Playback error:', error);
      getState().setError(error.message || 'Failed to play track');
      getState().setLoading(false);
      getState().setIsPlaying(false);

      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    }
  }, [
    initializeAudio,
    connectAudioNodes,
    ensureAudioReady,
    stopIntelligentAnalysis,
    startIntelligentAnalysis,
    applyEqPreset,
    stopActiveStream,
  ]);

  const togglePlay = useCallback(async () => {
    const { currentTrack, isPlaying, eqSmartEnabled, dynamicEqEnabled } = getState();
    if (!currentTrack || !audioRef.current.src) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        getState().setIsPlaying(false);
        stopVisualizer();
        stopIntelligentAnalysis();
      } else {
        await ensureAudioReady();
        await audioRef.current.play();
        getState().setIsPlaying(true);
        startVisualizer();
        if (eqSmartEnabled && dynamicEqEnabled) {
          startIntelligentAnalysis();
        }
      }
    } catch (error) {
      console.error('Toggle play error:', error);
      getState().setError('Playback error');
    }
  }, [ensureAudioReady, startIntelligentAnalysis, stopIntelligentAnalysis]);

  const seek = useCallback((time) => {
    if (!audioRef.current) return;
    const clampedTime = Math.max(0, Math.min(time, getState().duration));
    audioRef.current.currentTime = clampedTime;
    currentTimeRef.current = clampedTime;
    getState().setCurrentTime(clampedTime);
  }, []);

  const setAudioVolume = useCallback((value) => {
    const clampedVolume = Math.max(0, Math.min(1, value));
    getState().setVolume(clampedVolume);

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }

    nodeManagerRef.current?.updateVolume(clampedVolume);
  }, []);

  /* ───────────────────────────────────────────────
   Q ueue Management       *
   ─────────────────────────────────────────────── */

  const addToQueue = useCallback((tracks, playImmediately = false) => {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];

    const currentQueue = getState().queue;
    const newQueue = [...currentQueue];
    tracksArray.forEach((track) => {
      if (!newQueue.find(t => t.id === track.id)) {
        newQueue.push(track);
      }
    });
    getState().setQueue(newQueue);
    queueRef.current = newQueue;

    if (playImmediately && tracksArray.length > 0) {
      playTrack(tracksArray[0], false);
    }
  }, [playTrack]);

  const removeFromQueue = useCallback((index) => {
    const queueSnapshot = queueRef.current;
    if (index < 0 || index >= queueSnapshot.length) return;

    const currentIndex = queueIndexRef.current;
    const removedCurrent = index === currentIndex;

    const nextQueue = queueSnapshot.filter((_, i) => i !== index);
    getState().setQueue(nextQueue);
    queueRef.current = nextQueue;

    let nextIndex = currentIndex;
    if (index < currentIndex) {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (removedCurrent && nextQueue.length > 0) {
      nextIndex = Math.min(index, nextQueue.length - 1);
    } else if (nextQueue.length === 0) {
      nextIndex = 0;
    }

    getState().setQueueIndex(nextIndex);
    queueIndexRef.current = nextIndex;

    if (removedCurrent && nextQueue[nextIndex]) {
      playTrack(nextQueue[nextIndex], false);
    }
  }, [playTrack]);

  const playNext = useCallback(() => {
    const queueSnapshot = queueRef.current;
    if (!queueSnapshot.length) return;

    let nextIndex;
    const { shuffle } = getState();

    if (shuffle) {
      const availableIndices = queueSnapshot
      .map((_, index) => index)
      .filter(index => index !== queueIndexRef.current);

      if (availableIndices.length === 0) {
        nextIndex = 0;
      } else {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else {
      nextIndex = (queueIndexRef.current + 1) % queueSnapshot.length;
    }

    getState().setQueueIndex(nextIndex);
    queueIndexRef.current = nextIndex;
    playTrack(queueSnapshot[nextIndex], false);
  }, [playTrack]);

  const playPrevious = useCallback(() => {
    const queueSnapshot = queueRef.current;
    if (!queueSnapshot.length) return;

    const { currentTime, shuffle } = getState();
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const historySnapshot = queueHistoryRef.current;
    if (historySnapshot.length > 0) {
      const previousTrack = historySnapshot[historySnapshot.length - 1];
      const nextHistory = historySnapshot.slice(0, -1);
      getState().setQueueHistory(nextHistory);
      queueHistoryRef.current = nextHistory;
      playTrack(previousTrack, false);
      return;
    }

    let prevIndex;

    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queueSnapshot.length);
    } else {
      prevIndex = queueIndexRef.current === 0 ? queueSnapshot.length - 1 : queueIndexRef.current - 1;
    }

    getState().setQueueIndex(prevIndex);
    queueIndexRef.current = prevIndex;
    playTrack(queueSnapshot[prevIndex], false);
  }, [playTrack, seek]);

  const clearQueue = useCallback(() => {
    getState().setQueue([]);
    queueRef.current = [];
    getState().setQueueIndex(0);
    queueIndexRef.current = 0;
    getState().setQueueHistory([]);
    queueHistoryRef.current = [];
  }, []);

  /* ───────────────────────────────────────────────
   V isualizer             *
   ─────────────────────────────────────────────── */

  const startVisualizer = useCallback(() => {
    // Visualizers consume the analyzer node directly; avoid per-frame React state.
    if (!nodeManagerRef.current?.getAnalyzer()) return;
  }, []);

  const stopVisualizer = useCallback(() => {
  }, []);

  /* ───────────────────────────────────────────────
   E ffects & Event Handler*s
   ─────────────────────────────────────────────── */

  useEffect(() => {
    const resumeContext = async () => {
      const ctx = nodeManagerRef.current?.getContext();
      if (ctx && ctx.state === 'suspended') {
        try {
          await ctx.resume();
          console.log('Audio context resumed');
        } catch (e) {
          console.error('Failed to resume audio context:', e);
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, resumeContext, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resumeContext);
      });
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlers = {
      loadstart: () => {
        console.log('Audio load started');
        getState().setBuffering(true);
      },
      loadeddata: () => {
        console.log('Audio data loaded');
        getState().setBuffering(false);
      },
      canplay: () => {
        console.log('Audio can play');
        getState().setBuffering(false);
      },
      timeupdate: () => {
        const time = audio.currentTime;
        currentTimeRef.current = time;
        const now = performance.now();
        const delta = Math.abs(time - getState().currentTime);
        if (delta > 0.25 || now - lastCurrentTimeCommitRef.current > 250) {
          lastCurrentTimeCommitRef.current = now;
          getState().setCurrentTime(time);
        }
      },
      durationchange: () => {
        if (isFinite(audio.duration)) {
          getState().setDuration(audio.duration);
        }
      },
      ended: () => {
        getState().setIsPlaying(false);
        stopVisualizer();
        stopIntelligentAnalysis();

        const { repeat, queueIndex, queue } = getState();
        if (repeat === 'one') {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else if (repeat === 'all' || queueIndex < queue.length - 1) {
          playNext();
        }
      },
      error: (e) => {
        const errorMessage = audio.error?.message || 'Unknown playback error';
        console.error('Audio error details:', {
          code: audio.error?.code,
          message: errorMessage,
          networkState: audio.networkState,
          readyState: audio.readyState,
          src: audio.src
        });

        getState().setIsPlaying(false);
        getState().setBuffering(false);
        stopVisualizer();
        stopIntelligentAnalysis();
      },
      waiting: () => getState().setBuffering(true),
      playing: () => {
        getState().setBuffering(false);
        getState().setIsPlaying(true);
        ensureAudioReady();
      },
      pause: () => {
        getState().setIsPlaying(false);
      },
      stalled: () => {
        console.log('Audio stalled');
        getState().setBuffering(true);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, [ensureAudioReady, playNext, stopVisualizer, stopIntelligentAnalysis]);

  useEffect(() => {
    const handleOnline = () => getState().setNetworkStatus(true);
    const handleOffline = () => getState().setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(persistTimeoutRef.current).forEach((timeoutId) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, []);

  // Subscribe to EQ gains changes for persistence (debounced)
  useEffect(() => {
    const unsubStandard = store.subscribe(
      (state) => state.eqGains,
      (gains) => {
        if (!getState().eqSmartProcessing) {
          schedulePersist('eq-gains', gains, 'standard');
        }
      }
    );
    const unsubAdvanced = store.subscribe(
      (state) => state.advancedEqGains,
      (gains) => {
        if (!getState().eqSmartProcessing) {
          schedulePersist('advanced-eq-gains', gains, 'advanced');
        }
      }
    );
    return () => {
      unsubStandard();
      unsubAdvanced();
    };
  }, [schedulePersist]);

  // Subscribe to headroom compensation (debounced to prevent excessive calls)
  useEffect(() => {
    let debounceTimer = null;
    let prevGainsHash = '';

    const unsub = store.subscribe(
      (state) => ({
        eqMode: state.eqMode,
        eqGains: state.eqGains,
        advancedEqGains: state.advancedEqGains,
        headroom: state.eqSmartSettings.headroom,
      }),
      ({ eqMode, eqGains, advancedEqGains }) => {
        const gains = eqMode === 'advanced' ? advancedEqGains : eqGains;
        const gainsHash = gains.join(',');

        // Only apply if gains actually changed
        if (gainsHash !== prevGainsHash) {
          prevGainsHash = gainsHash;
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            applyHeadroomCompensation(gains);
          }, 16); // ~60fps
        }
      }
    );

    return () => {
      unsub();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [applyHeadroomCompensation]);

  // Subscribe to bass tone changes
  useEffect(() => {
    const unsub = store.subscribe(
      (state) => state.bassTone,
      (bassTone) => {
        const delta = bassTone - prevBassToneRef.current;
        if (delta === 0) return;

        const { eqMode, eqGains, advancedEqGains } = getState();
        const freqs = eqMode === 'advanced' ? ADVANCED_FREQUENCIES : STANDARD_FREQUENCIES;
        const current = eqMode === 'advanced' ? advancedEqGains : eqGains;

        const adjusted = current.map((gain, index) => {
          const freq = freqs[index] || 0;
          const weight = freq <= 80 ? 1 : freq <= 200 ? 0.6 : freq <= 320 ? 0.35 : 0;
          const nextGain = gain + delta * weight;
          return Math.max(-12, Math.min(12, nextGain));
        });

        prevBassToneRef.current = bassTone;
        applyRealtimeEQ(adjusted, { updateState: true });
      }
    );
    return unsub;
  }, [applyRealtimeEQ]);

  // Subscribe to filter updates (manual mode)
  useEffect(() => {
    const unsubStandard = store.subscribe(
      (state) => ({ gains: state.eqGains, mode: state.eqMode, smart: state.eqSmartEnabled, dynamic: state.dynamicEqEnabled }),
      ({ gains, mode, smart, dynamic }) => {
        if (!nodeManagerRef.current || (smart && dynamic)) return;
        if (mode === 'standard') {
          gains.forEach((gain, index) => {
            nodeManagerRef.current.updateFilterGain('standard', index, gain);
          });
        }
      }
    );
    const unsubAdvanced = store.subscribe(
      (state) => ({ gains: state.advancedEqGains, mode: state.eqMode, smart: state.eqSmartEnabled, dynamic: state.dynamicEqEnabled }),
      ({ gains, mode, smart, dynamic }) => {
        if (!nodeManagerRef.current || (smart && dynamic)) return;
        if (mode === 'advanced') {
          gains.forEach((gain, index) => {
            nodeManagerRef.current.updateFilterGain('advanced', index, gain);
          });
        }
      }
    );
    return () => {
      unsubStandard();
      unsubAdvanced();
    };
  }, []);

  // Reconnect nodes when EQ mode changes
  useEffect(() => {
    const unsub = store.subscribe(
      (state) => state.eqMode,
      (eqMode) => {
        if (nodeManagerRef.current && audioRef.current.src && nodeManagerRef.current.isConnected) {
          nodeManagerRef.current.disconnect();
          nodeManagerRef.current.connect(eqMode);
        }
      }
    );
    return unsub;
  }, []);

  // Track if analysis/mic is running to prevent recursion
  const isAnalysisRunningRef = useRef(false);
  const isMicRequestingRef = useRef(false);

  // Start/stop intelligent analysis based on store state (with guard against recursion)
  useEffect(() => {
    let prevShouldRun = false;

    const unsub = store.subscribe(
      (state) => ({
        smart: state.eqSmartEnabled,
        dynamic: state.dynamicEqEnabled,
        playing: state.isPlaying,
        dragging: state.isDraggingEQ
      }),
      ({ smart, dynamic, playing, dragging }) => {
        const shouldRun = smart && dynamic && playing && !dragging;

        // Only act on actual changes to prevent recursion
        if (shouldRun !== prevShouldRun) {
          prevShouldRun = shouldRun;
          if (shouldRun && !isAnalysisRunningRef.current) {
            isAnalysisRunningRef.current = true;
            startIntelligentAnalysis();
          } else if (!shouldRun && isAnalysisRunningRef.current) {
            isAnalysisRunningRef.current = false;
            stopIntelligentAnalysis();
          }
        }
      }
    );

    return () => {
      unsub();
      isAnalysisRunningRef.current = false;
      stopIntelligentAnalysis();
    };
  }, [startIntelligentAnalysis, stopIntelligentAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualizer();
      isAnalysisRunningRef.current = false;
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      stopActiveStream();
      stopMicrophoneCapture();

      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }

      const ctx = nodeManagerRef.current?.getContext();
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(console.error);
      }
    };
  }, [stopVisualizer, stopActiveStream, stopMicrophoneCapture]);

  // Subscribe to smart EQ state for microphone access (with guard against recursion)
  useEffect(() => {
    let prevShouldCapture = false;

    const unsub = store.subscribe(
      (state) => ({ smart: state.eqSmartEnabled, dynamic: state.dynamicEqEnabled }),
      ({ smart, dynamic }) => {
        const shouldCapture = smart && dynamic;

        // Only act on actual changes to prevent recursion
        if (shouldCapture !== prevShouldCapture) {
          prevShouldCapture = shouldCapture;
          if (shouldCapture && !isMicRequestingRef.current) {
            isMicRequestingRef.current = true;
            requestMicrophoneAccess().finally(() => {
              isMicRequestingRef.current = false;
            });
          } else if (!shouldCapture) {
            stopMicrophoneCapture();
          }
        }
      }
    );

    return unsub;
  }, [requestMicrophoneAccess, stopMicrophoneCapture]);

  // Mic level monitoring with subscription
  useEffect(() => {
    let rafId = null;

    const normalizeDb = (db) => {
      const clamped = Math.min(-15, Math.max(-110, db));
      return Math.max(0, Math.min(1, (clamped + 110) / 95));
    };

    const updateMicLevel = () => {
      if (micAnalyzerRef.current && getState().micStatus === 'active') {
        const analyzer = micAnalyzerRef.current;
        if (!micFreqBufferRef.current || micFreqBufferRef.current.length !== analyzer.frequencyBinCount) {
          micFreqBufferRef.current = new Float32Array(analyzer.frequencyBinCount);
        }
        const freqData = micFreqBufferRef.current;
        const dataArray = new Uint8Array(analyzer.fftSize);
        analyzer.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const sample = dataArray[i] - 128;
          sumSquares += sample * sample;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length) / 128;
        const level = Math.max(0, Math.min(1, rms));
        micLevelRef.current = level;

        const now = performance.now();
        const levelDelta = Math.abs(level - committedMicLevelRef.current);
        if (levelDelta > 0.02 || now - lastMicLevelCommitRef.current > 120) {
          committedMicLevelRef.current = level;
          lastMicLevelCommitRef.current = now;
          getState().setMicLevel(level);
        }

        // Periodic ambient snapshot
        if (freqData && micFrameCountRef.current++ % 6 === 0) {
          analyzer.getFloatFrequencyData(freqData);
          const nyquist = (analyzer.context?.sampleRate || 48000) / 2;
          const bands = FREQUENCY_BANDS.map((band) => {
            const startBin = Math.max(0, Math.floor((band.min / nyquist) * freqData.length));
            const endBin = Math.min(freqData.length - 1, Math.floor((band.max / nyquist) * freqData.length));
            let sum = 0;
            let count = 0;
            for (let i = startBin; i <= endBin; i++) {
              sum += freqData[i];
              count++;
            }
            const avg = count ? sum / count : -110;
            return normalizeDb(avg);
          });

          const overall = bands.reduce((s, v) => s + v, 0) / Math.max(1, bands.length);
          const peak = Math.max(...bands);
          const floor = Math.min(...bands);

          getState().setAmbientSnapshot({
            bands,
            overall,
            peak,
            floor,
            micLevel: level,
            timestamp: Date.now(),
          });
        }
      }
      rafId = requestAnimationFrame(updateMicLevel);
    };

    // Subscribe to micStatus changes
    const unsub = store.subscribe(
      (state) => state.micStatus,
      (micStatus) => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        if (micStatus === 'active') {
          updateMicLevel();
        }
      }
    );

    // Initialize if already active
    if (getState().micStatus === 'active') {
      updateMicLevel();
    }

    return () => {
      unsub();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  /* ───────────────────────────────────────────────
   C ontext Value (Methods only - state via Zustand)
   ─────────────────────────────────────────────── */

  // These getters allow components to access refs without subscribing to context changes
  const getAudioContext = useCallback(() => nodeManagerRef.current?.getContext(), []);
  const getAnalyzerNode = useCallback(() => nodeManagerRef.current?.getAnalyzer(), []);

  // Helper methods for EQ mode switching
  const setEqModeWithReconnect = useCallback((mode) => {
    getState().setEqMode(mode);
    if (nodeManagerRef.current && audioRef.current.src && nodeManagerRef.current.isConnected) {
      nodeManagerRef.current.disconnect();
      nodeManagerRef.current.connect(mode);
    }
  }, []);

  const toggleEqMode = useCallback(() => {
    const newMode = getState().eqMode === 'standard' ? 'advanced' : 'standard';
    setEqModeWithReconnect(newMode);
  }, [setEqModeWithReconnect]);

  // EQ Smart settings setter with validation
  const setEqSmartSettingsValidated = useCallback((updater) => {
    const prev = getState().eqSmartSettings;
    const nextValue = typeof updater === 'function' ? updater(prev) : updater;
    getState().setEqSmartSettings({
      intensity: Math.max(0.4, Math.min(1.6, nextValue.intensity ?? prev.intensity)),
      bassTilt: Math.max(-6, Math.min(6, nextValue.bassTilt ?? prev.bassTilt)),
      trebleTilt: Math.max(-6, Math.min(6, nextValue.trebleTilt ?? prev.trebleTilt)),
      headroom: Math.max(0, Math.min(12, nextValue.headroom ?? prev.headroom)),
      micBlend: Math.max(0, Math.min(1, nextValue.micBlend ?? prev.micBlend)),
    });
  }, []);

  // Toggle helpers
  const toggleEqSmart = useCallback(() => {
    const next = !getState().eqSmartEnabled;
    getState().setEqSmartEnabled(next);
    getState().setDynamicEqEnabled(next);
  }, []);

  const toggleDynamicEq = useCallback(() => {
    getState().setDynamicEqEnabled(!getState().dynamicEqEnabled);
  }, []);

  const toggleUltraEq = useCallback(() => {
    getState().setUltraEqEnabled(!getState().ultraEqEnabled);
  }, []);

  const toggleHearingCompensation = useCallback(() => {
    getState().setHearingCompensation(!getState().hearingCompensation);
  }, []);

  const toggleOfflineMode = useCallback(() => {
    getState().setOfflineMode(!getState().offlineMode);
  }, []);

  // Minimal context value - only methods and refs, NO state
  // State should be accessed via Zustand selectors in components
  const contextValue = useMemo(() => ({
    // Audio node accessors (refs)
    getAudioContext,
    getAnalyzerNode,

    // EQ methods
    setEqMode: setEqModeWithReconnect,
    toggleEqMode,
    setEqGain,
    setAdvancedEqGain,
    resetEq,
    applyEqPreset,
    setBassTone: (tone) => getState().setBassTone(tone),

    // EQ drag state
    startEqDrag: () => getState().setIsDraggingEQ(true),
    endEqDrag: () => getState().setIsDraggingEQ(false),

    // EQSmart methods
    toggleEqSmart,
    setEqSmartSettings: setEqSmartSettingsValidated,
    requestMicrophoneAccess,
    toggleDynamicEq,

    // Ultra EQ methods
    toggleUltraEq,
    toggleHearingCompensation,

    // Playback controls
    playTrack,
    togglePlay,
    seek,
    setVolume: setAudioVolume,

    // Queue methods
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,

    // Settings
    toggleShuffle,
    toggleRepeat,

    // Network
    toggleOfflineMode,

                                      // Cache management
                                      clearCache: async () => {
                                        try {
                                          await cacheInstance.clear('tracks');
                                          await cacheInstance.clear('audio-files');
                                          await cacheInstance.clear('album-art');
                                          await cacheInstance.clear('audio-analysis');
                                          await cacheInstance.clear('waveforms');
                                          return true;
                                        } catch (error) {
                                          console.error('Clear cache error:', error);
                                          return false;
                                        }
                                      },

                                      getCacheSize: async () => {
                                        try {
                                          await cacheInstance.ready;
                                          if (!cacheInstance.db) return { totalMB: '0', tracks: 0, audioFiles: 0 };

                                          const stores = ['tracks', 'audio-files', 'album-art', 'audio-analysis', 'waveforms'];
                                          let totalSize = 0;
                                          const counts = {};

                                          for (const storeName of stores) {
                                            try {
                                              const tx = cacheInstance.db.transaction(storeName, 'readonly');
                                              const store = tx.objectStore(storeName);
                                              const items = await new Promise((resolve) => {
                                                const request = store.getAll();
                                                request.onsuccess = () => resolve(request.result || []);
                                                request.onerror = () => resolve([]);
                                              });

                                              counts[storeName] = items.length;

                                              items.forEach(item => {
                                                if (item?.blob?.size) {
                                                  totalSize += item.blob.size;
                                                } else if (item) {
                                                  totalSize += JSON.stringify(item).length;
                                                }
                                              });
                                            } catch {
                                              counts[storeName] = 0;
                                            }
                                          }

                                          return {
                                            totalMB: (totalSize / (1024 * 1024)).toFixed(2),
                                      tracks: counts['tracks'] || 0,
                                      audioFiles: counts['audio-files'] || 0,
                                      albumArt: counts['album-art'] || 0,
                                      analysis: counts['audio-analysis'] || 0,
                                      waveforms: counts['waveforms'] || 0,
                                          };
                                        } catch (error) {
                                          console.error('Error getting cache size:', error);
                                          return { totalMB: '0', tracks: 0, audioFiles: 0 };
                                        }
                                      },

                                      // Utility functions
                                      checkAuthentication: async () => {
                                        const token = localStorage.getItem('token');
                                        if (!token) return false;

                                        try {
                                          const response = await fetch('https://api.beatfly-music.xyz/xrpc/auth/verify', {
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            }
                                          });

                                          return response.ok;
                                        } catch {
                                          return false;
                                        }
                                      },

                                      prefetchTrack: async (track) => {
                                        if (!track?.id || !getState().networkStatus) return;

                                        try {
                                          const cachedAudio = await cacheInstance.get('audio-files', track.id);
                                          if (cachedAudio?.blob) return;

                                          const token = localStorage.getItem('token');
                                          const streamInfo = MusicAPI.streamTrack(track.id);

                                          const response = await fetch(streamInfo.url, {
                                            headers: streamInfo.headers
                                          });

                                          if (response.ok) {
                                            const blob = await response.blob();
                                            await cacheInstance.put('audio-files', { id: track.id, blob });
                                          }
                                        } catch (error) {
                                          console.error('Error prefetching track:', error);
                                        }
                                      },

                                      getWaveform: async (trackId) => {
                                        try {
                                          const cached = await cacheInstance.get('waveforms', trackId);
                                          if (cached?.waveform) {
                                            return cached.waveform;
                                          }

                                          const audioFile = await cacheInstance.get('audio-files', trackId);
                                          if (audioFile?.blob) {
                                            await initializeAudio();
                                            const ctx = nodeManagerRef.current?.getContext();
                                            if (!ctx) return null;

                                            const arrayBuffer = await audioFile.blob.arrayBuffer();
                                            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

                                            // Generate waveform
                                            const channelData = audioBuffer.getChannelData(0);
                                            const samples = 1000;
                                            const blockSize = Math.floor(channelData.length / samples);
                                            const waveform = new Float32Array(samples);

                                            for (let i = 0; i < samples; i++) {
                                              const start = i * blockSize;
                                              const end = Math.min(start + blockSize, channelData.length);

                                              let sum = 0;
                                              for (let j = start; j < end; j++) {
                                                sum += Math.abs(channelData[j]);
                                              }

                                              waveform[i] = sum / (end - start);
                                            }

                                            await cacheInstance.put('waveforms', {
                                              trackId,
                                              waveform,
                                              duration: audioBuffer.duration
                                            });

                                            return waveform;
                                          }

                                          return null;
                                        } catch (error) {
                                          console.error('Error getting waveform:', error);
                                          return null;
                                        }
                                      },

                                      // Analysis info for UI
                                      getAnalysisInfo: () => {
                                        if (!ultraAnalyzerRef.current) return null;

                                        return {
                                          contentType: ultraAnalyzerRef.current.contentType,
                                          spectralBalance: ultraAnalyzerRef.current.spectralBalance,
                                          adaptiveParams: ultraAnalyzerRef.current.adaptiveParams,
                                          dynamicRange: ultraAnalyzerRef.current.dynamicRange,
                                        };
                                      },

    // Export audio state for debugging
    getAudioState: () => ({
      audioContextState: nodeManagerRef.current?.getContext()?.state,
      audioInitialized: !!nodeManagerRef.current,
      currentTime: audioRef.current?.currentTime,
      duration: audioRef.current?.duration,
      src: audioRef.current?.src,
      volume: audioRef.current?.volume,
      paused: audioRef.current?.paused,
      readyState: audioRef.current?.readyState,
      networkState: audioRef.current?.networkState,
      error: audioRef.current?.error,
      sourceNodeConnected: nodeManagerRef.current?.isConnected,
      currentMode: nodeManagerRef.current?.currentMode,
    }),

    // EQ curve export/import
    exportEQCurve: () => {
      const { eqMode, eqGains, advancedEqGains, ultraEqEnabled, hearingCompensation, dynamicEqEnabled, eqSmartEnabled } = getState();
      const curve = eqMode === 'advanced' ? advancedEqGains : eqGains;
      return {
        version: '3.0',
        mode: eqMode,
        frequencies: eqMode === 'advanced' ? ADVANCED_FREQUENCIES : STANDARD_FREQUENCIES,
        gains: curve,
        timestamp: new Date().toISOString(),
        ultraSettings: {
          ultraEqEnabled,
          hearingCompensation,
          dynamicEqEnabled,
          eqSmartEnabled,
        }
      };
    },

    importEQCurve: (data) => {
      try {
        if (!data || !data.gains || !Array.isArray(data.gains)) {
          throw new Error('Invalid EQ curve data');
        }

        const targetFreqs = data.mode === 'advanced' ? ADVANCED_FREQUENCIES : STANDARD_FREQUENCIES;

        if (data.gains.length !== targetFreqs.length) {
          throw new Error('Incompatible frequency count');
        }

        const { eqMode } = getState();
        if (data.mode === 'advanced' && eqMode === 'advanced') {
          data.gains.forEach((gain, index) => {
            setAdvancedEqGain(index, gain);
          });
        } else if (data.mode === 'standard' && eqMode === 'standard') {
          data.gains.forEach((gain, index) => {
            setEqGain(index, gain);
          });
        } else {
          throw new Error('EQ mode mismatch');
        }

        // Import ultra settings if available
        if (data.ultraSettings) {
          if (typeof data.ultraSettings.ultraEqEnabled === 'boolean') {
            getState().setUltraEqEnabled(data.ultraSettings.ultraEqEnabled);
          }
          if (typeof data.ultraSettings.hearingCompensation === 'boolean') {
            getState().setHearingCompensation(data.ultraSettings.hearingCompensation);
          }
          if (typeof data.ultraSettings.eqSmartEnabled === 'boolean') {
            getState().setEqSmartEnabled(data.ultraSettings.eqSmartEnabled);
          }
          if (typeof data.ultraSettings.dynamicEqEnabled === 'boolean') {
            const shouldEnableDynamic = data.ultraSettings.dynamicEqEnabled ||
              data.ultraSettings.eqSmartEnabled === true;
            getState().setDynamicEqEnabled(shouldEnableDynamic);
          } else if (data.ultraSettings.eqSmartEnabled === true) {
            getState().setDynamicEqEnabled(true);
          }
        }

        return true;
      } catch (error) {
        console.error('Import error:', error);
        return false;
      }
    },

    // Force audio context initialization (useful for debugging)
    forceInitAudio: async () => {
      try {
        await initializeAudio();
        console.log('Audio context force initialized');
        return true;
      } catch (error) {
        console.error('Force init failed:', error);
        return false;
      }
    },

    // Manual connection refresh (useful for fixing connection issues)
    refreshConnections: () => {
      if (nodeManagerRef.current && audioRef.current.src) {
        console.log('Refreshing audio connections...');
        nodeManagerRef.current.disconnect();
        nodeManagerRef.current.connect(getState().eqMode);
        return true;
      }
      return false;
    },

                                      // Get ISO 226:2003 compensation for a specific frequency
                                      getISO226Compensation: (frequency) => {
                                        if (!ultraAnalyzerRef.current) {
                                          // Fallback calculation
                                          const freqs = Object.keys(EQUAL_LOUDNESS_COMPENSATION).map(Number).sort((a, b) => a - b);
                                          for (let i = 0; i < freqs.length - 1; i++) {
                                            if (frequency >= freqs[i] && frequency <= freqs[i + 1]) {
                                              const f1 = freqs[i];
                                              const f2 = freqs[i + 1];
                                              const c1 = EQUAL_LOUDNESS_COMPENSATION[f1];
                                              const c2 = EQUAL_LOUDNESS_COMPENSATION[f2];

                                              const ratio = (frequency - f1) / (f2 - f1);
                                              return c1 + (c2 - c1) * ratio;
                                            }
                                          }
                                          return 0;
                                        }

                                        return ultraAnalyzerRef.current.applyISO226Compensation(frequency);
                                      },

                                      // Analyze audio file for hearing enhancement recommendations
                                      analyzeForHearing: async (audioFile) => {
                                        try {
                                          await initializeAudio();
                                          const ctx = nodeManagerRef.current?.getContext();
                                          if (!ctx) return null;

                                          const arrayBuffer = await audioFile.arrayBuffer();
                                          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

                                          const channelData = audioBuffer.getChannelData(0);
                                          const sampleRate = audioBuffer.sampleRate;

                                          // Analyze frequency content
                                          const analyzer = ctx.createAnalyser();
                                          analyzer.fftSize = 8192;
                                          const freqData = new Float32Array(analyzer.frequencyBinCount);

                                          // Process in chunks
                                          const chunkSize = analyzer.fftSize;
                                          const chunks = Math.floor(channelData.length / chunkSize);
                                          const frequencyProfile = new Float32Array(analyzer.frequencyBinCount);

                                          for (let i = 0; i < chunks; i++) {
                                            const chunk = channelData.slice(i * chunkSize, (i + 1) * chunkSize);

                                            // Simple FFT approximation (in production, use proper FFT)
                                            for (let j = 0; j < freqData.length; j++) {
                                              const freq = (j / freqData.length) * (sampleRate / 2);
                                              let magnitude = 0;

                                              // Calculate magnitude for this frequency bin
                                              for (let k = 0; k < chunk.length; k++) {
                                                magnitude += Math.abs(chunk[k]);
                                              }

                                              frequencyProfile[j] += magnitude / chunks;
                                            }
                                          }

                                          // Analyze which frequencies need enhancement
                                          const recommendations = [];
                                          const nyquist = sampleRate / 2;

                                          FREQUENCY_BANDS.forEach(band => {
                                            const startBin = Math.floor((band.min / nyquist) * frequencyProfile.length);
                                            const endBin = Math.floor((band.max / nyquist) * frequencyProfile.length);

                                            let avgMagnitude = 0;
                                            for (let i = startBin; i <= endBin && i < frequencyProfile.length; i++) {
                                              avgMagnitude += frequencyProfile[i];
                                            }
                                            avgMagnitude /= (endBin - startBin + 1);

                                            // Check if this band needs enhancement based on ISO 226:2003
                                            const centerFreq = (band.min + band.max) / 2;
                                            const isoCompensation = EQUAL_LOUDNESS_COMPENSATION[centerFreq] || 0;

                                            if (isoCompensation > 2 || avgMagnitude < 0.1) {
                                              recommendations.push({
                                                band: band.name,
                                                frequencyRange: `${band.min}-${band.max} Hz`,
                                                enhancementNeeded: true,
                                                suggestedBoost: Math.min(6, Math.abs(isoCompensation)),
                                                                   reason: isoCompensation > 2 ? 'Hard to hear frequency range' : 'Low content in this range'
                                              });
                                            }
                                          });

                                          return {
                                            sampleRate,
                                            duration: audioBuffer.duration,
                                            recommendations,
                                            overallScore: recommendations.length === 0 ? 100 : Math.max(0, 100 - (recommendations.length * 15)),
                                      message: recommendations.length === 0
                                      ? 'Audio has good frequency balance'
  : `${recommendations.length} frequency ranges could benefit from enhancement`
                                          };
                                        } catch (error) {
                                          console.error('Error analyzing audio for hearing:', error);
                                          return null;
                                        }
                                      },

                                      // Test tone generator for hearing tests
                                      generateTestTone: async (frequency, duration = 1000, volume = 0.1) => {
                                        try {
                                          await initializeAudio();
                                          const ctx = nodeManagerRef.current?.getContext();
                                          if (!ctx) return;

                                          const oscillator = ctx.createOscillator();
                                          const gainNode = ctx.createGain();

                                          oscillator.frequency.value = frequency;
                                          oscillator.type = 'sine';

                                          // Apply fade in/out to avoid clicks
                                          gainNode.gain.setValueAtTime(0, ctx.currentTime);
                                          gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
                                          gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration / 1000 - 0.01);
                                          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

                                          oscillator.connect(gainNode);
                                          gainNode.connect(ctx.destination);

                                          oscillator.start();
                                          oscillator.stop(ctx.currentTime + duration / 1000);

                                          return true;
                                        } catch (error) {
                                          console.error('Error generating test tone:', error);
                                          return false;
                                        }
                                      },

    // Get hearing profile based on current EQ settings
    getHearingProfile: () => {
      const { eqMode, eqGains, advancedEqGains, ultraEqEnabled, hearingCompensation } = getState();
      const currentGains = eqMode === 'advanced' ? advancedEqGains : eqGains;
      const frequencies = eqMode === 'advanced' ? ADVANCED_FREQUENCIES : STANDARD_FREQUENCIES;

      const profile = {
        enhancedFrequencies: [],
        reducedFrequencies: [],
        hearingAge: 'normal',
        recommendations: []
      };

      frequencies.forEach((freq, index) => {
        const gain = currentGains[index] || 0;
        const isoCompensation = EQUAL_LOUDNESS_COMPENSATION[freq] || 0;

        if (gain > 2) {
          profile.enhancedFrequencies.push({
            frequency: freq,
            gain: gain,
            reason: isoCompensation > 2 ? 'Compensating for hearing sensitivity' : 'User preference'
          });
        } else if (gain < -2) {
          profile.reducedFrequencies.push({
            frequency: freq,
            gain: gain
          });
        }
      });

      // Estimate hearing age based on high frequency enhancement
      const highFreqBoost = frequencies
        .filter(f => f > 8000)
        .map((f) => currentGains[frequencies.indexOf(f)] || 0)
        .reduce((sum, g) => sum + g, 0) / frequencies.filter(f => f > 8000).length;

      if (highFreqBoost > 3) {
        profile.hearingAge = 'mature (50+)';
        profile.recommendations.push('Consider professional hearing evaluation');
      } else if (highFreqBoost > 1.5) {
        profile.hearingAge = 'middle-aged (35-50)';
      } else {
        profile.hearingAge = 'young adult (under 35)';
      }

      if (ultraEqEnabled && hearingCompensation) {
        profile.recommendations.push('ISO 226:2003 compensation is active');
      } else if (profile.enhancedFrequencies.some(f => f.frequency > 8000)) {
        profile.recommendations.push('Consider enabling Ultra EQ for automatic hearing compensation');
      }

      return profile;
    },

    // Constants
    frequencies: {
      standard: STANDARD_FREQUENCIES,
      advanced: ADVANCED_FREQUENCIES,
    },
    frequencyBands: FREQUENCY_BANDS,
    presets: EQ_PRESETS,
    equalLoudnessCompensation: EQUAL_LOUDNESS_COMPENSATION,
    iso226Curve: ISO_226_2003_80_PHON,
    realtimeConfig: REALTIME_CONFIG,

    // Zustand store reference for direct access
    store: useAudioStore,
  }), [
    // Only stable function references - NO state
    getAudioContext,
    getAnalyzerNode,
    setEqModeWithReconnect,
    toggleEqMode,
    setEqGain,
    setAdvancedEqGain,
    resetEq,
    applyEqPreset,
    toggleEqSmart,
    setEqSmartSettingsValidated,
    requestMicrophoneAccess,
    toggleDynamicEq,
    toggleUltraEq,
    toggleHearingCompensation,
    playTrack,
    togglePlay,
    seek,
    setAudioVolume,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleOfflineMode,
    initializeAudio,
  ]);

  // Simplified provider - only methods context (state via Zustand)
  return (
    <AudioContextData.Provider value={contextValue}>
      {children}
    </AudioContextData.Provider>
  );
};

// ─────────────────────────────────────────────────
// EXPORTS - Methods from Context, State from Zustand
// ─────────────────────────────────────────────────

// Context hook for methods (playTrack, togglePlay, etc.)
export const useAudio = () => {
  const context = useContext(AudioContextData);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// Re-export Zustand store and selectors for state access
export {
  useAudioStore,
  useCurrentTrack,
  useIsPlaying,
  useDuration,
  useCurrentTime,
  useVolume,
  useBuffering,
  useLoading,
  usePlaybackError,
  useQueue,
  useQueueIndex,
  useQueueHistory,
  useShuffle,
  useRepeat,
  useEqMode,
  useEqGains,
  useAdvancedEqGains,
  useTargetEqGains,
  useTargetAdvancedEqGains,
  useIsDraggingEQ,
  useEqSmartEnabled,
  useEqSmartSettings,
  useEqSmartProcessing,
  useEqSmartSuggestions,
  useDynamicEqEnabled,
  useBassTone,
  useUltraEqEnabled,
  useHearingCompensation,
  useMicStatus,
  useMicLevel,
  useAmbientSnapshot,
  useNetworkStatus,
  useOfflineMode,
  usePlaybackState,
  getAudioStore,
} from '../stores/audioStore';

// Legacy compatibility hooks (for backward compatibility with existing code)
export const useNowPlaying = () => {
  const context = useContext(AudioContextData);
  if (!context) {
    throw new Error('useNowPlaying must be used within an AudioProvider');
  }
  const { currentTrack, isPlaying, buffering, loading } = useAudioStore.getState();
  return {
    currentTrack,
    isPlaying,
    buffering,
    loading,
    playTrack: context.playTrack,
    togglePlay: context.togglePlay,
    addToQueue: context.addToQueue,
  };
};

export const usePlayback = () => {
  return useAudio();
};

export const useQueueContext = () => {
  const context = useContext(AudioContextData);
  if (!context) {
    throw new Error('useQueueContext must be used within an AudioProvider');
  }
  const { queue, queueIndex, queueHistory } = useAudioStore.getState();
  return {
    queue,
    queueIndex,
    queueHistory,
    addToQueue: context.addToQueue,
    removeFromQueue: context.removeFromQueue,
    clearQueue: context.clearQueue,
    playNext: context.playNext,
    playPrevious: context.playPrevious,
  };
};

export default AudioProvider;
