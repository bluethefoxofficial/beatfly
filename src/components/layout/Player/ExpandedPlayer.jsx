import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Heart,
  ListMusic,
  Share2,
  Plus,
  Pause,
  Play,
  X,
  Sliders,
  FileText,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  Sparkles,
  Activity,
  RefreshCcw,
  BarChart2,
  Radio,
  Disc,
  Waves,
  Volume2,
  VolumeX,
  Circle,
  Grid3x3,
  Zap,
  Atom,
  Box,
  Globe,
  Cloud,
  Wind,
  Hexagon,
  Layers,
  Mountain,
  ChevronsUp
} from 'lucide-react';
import SeekBar from './SeekBar';
import AudioVisualizer from './AudioVisualizer';

// Local storage key for visualizer settings
const VISUALIZER_SETTINGS_KEY = 'music-player-visualizer-settings';

// Visualizer Settings Hook with persistence
const useVisualizerSettings = (initialType = 'bars') => {
  // Default settings for initializing state
  const defaultSettings = {
    // Universal settings
    smoothing: 0.8,
    amplification: 1.2,

    // 2D Visualizations
    // Bars settings
    barCount: 64,
    barGap: 2,
    rounded: true,
    mirror: false,
    gradient: true,
    reactive: true,
    bassBoost: true,
    glow: false,
    shadow: false,
    fadeEffect: false,
    cap: false,
    capHeight: 2,
    capDropSpeed: 0.5,

    // Wave settings
    lineWidth: 3,
    amplitude: 1,
    points: 256,
    fill: true,
    trails: 3,
    glowIntensity: 10,

    // Circular settings
    circularRadius: 0.45,
    circularSegments: 256,
    rotationSpeed: 0.001,
    layers: 3,
    pulse: true,
    phaseShift: true,
    autoRotate: true,
    reactiveRotation: false,

    // Particles settings
    particleCount: 150,
    particleSize: 3,
    speed: 1.2,
    connections: true,
    connectionDistance: 100,
    gravity: 0.05,
    turbulence: 0.1,
    repulsion: false,
    attraction: false,

    // Spectrum settings
    bands: 48,
    logarithmic: true,
    peakHold: true,
    reflection: true,

    // Pulse settings
    sensitivity: 0.6,
    beatThreshold: 1.3,
    frequencyRange: 'bass',
    minInterval: 100,
    maxRings: 8,
    ringSpeed: 2,
    coreSize: 20,
    maxCoreSize: 50,
    ringThickness: 3,
    fadeSpeed: 0.05,
    colorShift: false,
    showBeatIndicator: false,
    showEnergyMeter: false,

    // Grid settings
    gridSize: 20,
    perspective: 0.5,
    waveHeight: 50,

    // Galaxy settings
    starCount: 200,
    spiralArms: 3,

    // DNA settings
    dnaPoints: 50,
    frequency: 0.1,
    phaseSpeed: 0.02,

    // 3D Visualizations
    // Bars3D settings
    barWidth: 0.2,
    barDepth: 0.2,
    barSpacing: 0.05,
    cylindrical: true,
    barRadius: 8,
    metalness: 0.5,
    roughness: 0.2,
    showGround: false,

    // Terrain3D settings
    resolution: 128,
    wireframe: false,
    autoCamera: true,

    // Sphere3D settings
    sphereSegments: 32,
    sphereRadius: 5,
    deformFactor: 1.5,
    colorMode: 'gradient',

    // Waveform3D settings
    wavePoints: 128,
    tubularSegments: 64,
    radialSegments: 8,
    closed: true,
    waves: 1,
    waveSpacing: 2,

    // Particles3D settings
    maxDistance: 15,
    minDistance: 5,
    particleSpeed: 0.05,
    showConnections: true,
    connectionThreshold: 2.5,
    connectionOpacity: 0.15,

    // Nebula3D settings
    cloudSize: 20,
    cloudDensity: 15,
    evolution: 0.002,
    colorCycle: false,
    colorCycleSpeed: 0.01,

    // Common 3D settings
    bloom: true,
    bloomStrength: 1.5,
    bloomRadius: 0.4,
    bloomThreshold: 0.85,
    glitch: false,
    glitchWild: false,
    interactiveMode: true,
  };

  // Initialize state from localStorage or use default values
  const [vizType, setVizType] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(VISUALIZER_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.vizType || initialType;
      }
    } catch (error) {
      console.error('Error loading visualizer type from localStorage:', error);
    }
    return initialType;
  });

  const [vizSettings, setVizSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(VISUALIZER_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.settings || defaultSettings;
      }
    } catch (error) {
      console.error('Error loading visualizer settings from localStorage:', error);
    }
    return defaultSettings;
  });

  const [activePreset, setActivePreset] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(VISUALIZER_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.activePreset || 'Default';
      }
    } catch (error) {
      console.error('Error loading visualizer preset from localStorage:', error);
    }
    return 'Default';
  });

  // Track a version so we can force-refresh visualizers when settings shift quickly
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(VISUALIZER_SETTINGS_KEY, JSON.stringify({
        vizType,
        settings: vizSettings,
        activePreset
      }));
    } catch (error) {
      console.error('Error saving visualizer settings to localStorage:', error);
    }
  }, [vizType, vizSettings, activePreset]);

  // Setting updater with localStorage persistence
  const updateSetting = useCallback((key, value) => {
    setVizSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      try {
        localStorage.setItem(VISUALIZER_SETTINGS_KEY, JSON.stringify({
          vizType,
          settings: newSettings,
          activePreset
        }));
      } catch (error) {
        console.error('Error saving updated visualizer setting to localStorage:', error);
      }
      return newSettings;
    });
    setSettingsVersion(v => v + 1);
  }, [vizType, activePreset]);

  // Viz type setter with localStorage persistence
  const setVizTypeWithSave = useCallback((newType) => {
    setVizType(newType);
    try {
      localStorage.setItem(VISUALIZER_SETTINGS_KEY, JSON.stringify({
        vizType: newType,
        settings: vizSettings,
        activePreset
      }));
    } catch (error) {
      console.error('Error saving visualizer type to localStorage:', error);
    }
    setSettingsVersion(v => v + 1);
  }, [vizSettings, activePreset]);

  // Preset setter with localStorage persistence
  const setActivePresetWithSave = useCallback((newPreset) => {
    setActivePreset(newPreset);
    try {
      localStorage.setItem(VISUALIZER_SETTINGS_KEY, JSON.stringify({
        vizType,
        settings: vizSettings,
        activePreset: newPreset
      }));
    } catch (error) {
      console.error('Error saving visualizer preset to localStorage:', error);
    }
    setSettingsVersion(v => v + 1);
  }, [vizType, vizSettings]);

  const refreshVisualizer = useCallback(() => {
    setSettingsVersion(v => v + 1);
  }, []);

  // Get visualization-specific settings
  const getSettingsForType = useCallback((type) => {
    const baseSettings = {
      smoothing: vizSettings.smoothing,
      amplification: vizSettings.amplification,
    };

    // 2D Visualizations
    if (type === 'bars') {
      return {
        ...baseSettings,
        barCount: vizSettings.barCount,
        barGap: vizSettings.barGap,
        rounded: vizSettings.rounded,
        mirror: vizSettings.mirror,
        gradient: vizSettings.gradient,
        reactive: vizSettings.reactive,
        bassBoost: vizSettings.bassBoost,
        glow: vizSettings.glow,
        shadow: vizSettings.shadow,
        fadeEffect: vizSettings.fadeEffect,
        cap: vizSettings.cap,
        capHeight: vizSettings.capHeight,
        capDropSpeed: vizSettings.capDropSpeed,
      };
    }

    if (type === 'wave') {
      return {
        ...baseSettings,
        lineWidth: vizSettings.lineWidth,
        amplitude: vizSettings.amplitude,
        points: vizSettings.points,
        fill: vizSettings.fill,
        glow: vizSettings.glow,
        mirror: vizSettings.mirror,
        trails: vizSettings.trails,
        fadeEffect: vizSettings.fadeEffect,
        glowIntensity: vizSettings.glowIntensity,
      };
    }

    if (type === 'circular') {
      return {
        ...baseSettings,
        radius: vizSettings.circularRadius,
        segments: vizSettings.circularSegments,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
        layers: vizSettings.layers,
        pulse: vizSettings.pulse,
        phaseShift: vizSettings.phaseShift,
        fadeEffect: vizSettings.fadeEffect,
        autoRotate: vizSettings.autoRotate,
        reactiveRotation: vizSettings.reactiveRotation,
      };
    }

    if (type === 'particles') {
      return {
        ...baseSettings,
        particleCount: vizSettings.particleCount,
        particleSize: vizSettings.particleSize,
        speed: vizSettings.speed,
        connections: vizSettings.connections,
        connectionDistance: vizSettings.connectionDistance,
        gravity: vizSettings.gravity,
        turbulence: vizSettings.turbulence,
        reactive: vizSettings.reactive,
        fadeEffect: vizSettings.fadeEffect,
        repulsion: vizSettings.repulsion,
        attraction: vizSettings.attraction,
        glow: vizSettings.glow,
        glowIntensity: vizSettings.glowIntensity,
      };
    }

    if (type === 'spectrum') {
      return {
        ...baseSettings,
        bands: vizSettings.bands,
        logarithmic: vizSettings.logarithmic,
        peakHold: vizSettings.peakHold,
        gradient: vizSettings.gradient,
        reflection: vizSettings.reflection,
      };
    }

    if (type === 'pulse') {
      return {
        ...baseSettings,
        sensitivity: vizSettings.sensitivity,
        beatThreshold: vizSettings.beatThreshold,
        frequencyRange: vizSettings.frequencyRange,
        minInterval: vizSettings.minInterval,
        maxRings: vizSettings.maxRings,
        ringSpeed: vizSettings.ringSpeed,
        coreSize: vizSettings.coreSize,
        maxCoreSize: vizSettings.maxCoreSize,
        ringThickness: vizSettings.ringThickness,
        fadeSpeed: vizSettings.fadeSpeed,
        glowIntensity: vizSettings.glowIntensity,
        colorShift: vizSettings.colorShift,
        showBeatIndicator: vizSettings.showBeatIndicator,
        showEnergyMeter: vizSettings.showEnergyMeter,
      };
    }

    if (type === 'grid') {
      return {
        ...baseSettings,
        gridSize: vizSettings.gridSize,
        perspective: vizSettings.perspective,
        waveHeight: vizSettings.waveHeight,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
      };
    }

    if (type === 'galaxy') {
      return {
        ...baseSettings,
        starCount: vizSettings.starCount,
        spiralArms: vizSettings.spiralArms,
        rotationSpeed: vizSettings.rotationSpeed,
      };
    }

    if (type === 'dna') {
      return {
        ...baseSettings,
        points: vizSettings.dnaPoints,
        amplitude: vizSettings.amplitude,
        frequency: vizSettings.frequency,
        phaseSpeed: vizSettings.phaseSpeed,
      };
    }

    if (type === 'radial') {
      return {
        ...baseSettings,
        innerRadius: vizSettings.innerRadius,
        outerRadius: vizSettings.outerRadius,
        segments: vizSettings.bands,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
        mirror: vizSettings.mirror,
        spiral: vizSettings.spiral,
      };
    }

    // 3D Visualizations
    if (type === 'bars3d') {
      return {
        ...baseSettings,
        barCount: vizSettings.barCount,
        barWidth: vizSettings.barWidth,
        barDepth: vizSettings.barDepth,
        barSpacing: vizSettings.barSpacing,
        cylindrical: vizSettings.cylindrical,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
        radius: vizSettings.barRadius,
        metalness: vizSettings.metalness,
        roughness: vizSettings.roughness,
        showGround: vizSettings.showGround,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
      };
    }

    if (type === 'terrain3d') {
      return {
        ...baseSettings,
        resolution: vizSettings.resolution,
        wireframe: vizSettings.wireframe,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
        colorShift: vizSettings.colorShift,
        autoCamera: vizSettings.autoCamera,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
      };
    }

    if (type === 'sphere3d') {
      return {
        ...baseSettings,
        sphereSegments: vizSettings.sphereSegments,
        sphereRadius: vizSettings.sphereRadius,
        deformFactor: vizSettings.deformFactor,
        wireframe: vizSettings.wireframe,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
        colorMode: vizSettings.colorMode,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
      };
    }

    if (type === 'waveform3d') {
      return {
        ...baseSettings,
        points: vizSettings.wavePoints,
        lineWidth: vizSettings.lineWidth,
        waveHeight: vizSettings.waveHeight,
        tubularSegments: vizSettings.tubularSegments,
        radialSegments: vizSettings.radialSegments,
        closed: vizSettings.closed,
        rotation: vizSettings.rotation,
        rotationSpeed: vizSettings.rotationSpeed,
        waves: vizSettings.waves,
        waveSpacing: vizSettings.waveSpacing,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
      };
    }

    if (type === 'particles3d') {
      return {
        ...baseSettings,
        particleCount: vizSettings.particleCount,
        particleSize: vizSettings.particleSize,
        maxDistance: vizSettings.maxDistance,
        minDistance: vizSettings.minDistance,
        rotationSpeed: vizSettings.rotationSpeed,
        particleSpeed: vizSettings.particleSpeed,
        showConnections: vizSettings.showConnections,
        connectionThreshold: vizSettings.connectionThreshold,
        connectionOpacity: vizSettings.connectionOpacity,
        reactive: vizSettings.reactive,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
      };
    }

    if (type === 'nebula3d') {
      return {
        ...baseSettings,
        particleCount: vizSettings.particleCount,
        particleSize: vizSettings.particleSize,
        cloudSize: vizSettings.cloudSize,
        cloudDensity: vizSettings.cloudDensity,
        rotationSpeed: vizSettings.rotationSpeed,
        evolution: vizSettings.evolution,
        colorCycle: vizSettings.colorCycle,
        colorCycleSpeed: vizSettings.colorCycleSpeed,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
      };
    }

    // For any other 3D visualizations (spiral3d, vortex3d, cube3d, etc.)
    if (type.includes('3d')) {
      return {
        ...baseSettings,
        bloom: vizSettings.bloom,
        bloomStrength: vizSettings.bloomStrength,
        bloomRadius: vizSettings.bloomRadius,
        bloomThreshold: vizSettings.bloomThreshold,
        glitch: vizSettings.glitch,
        glitchWild: vizSettings.glitchWild,
        rotationSpeed: vizSettings.rotationSpeed,
        rotation: vizSettings.rotation,
      };
    }

    // Default fallback
    return baseSettings;
  }, [vizSettings]);

  return {
    vizType,
    setVizType: setVizTypeWithSave,
    vizSettings,
    updateSetting,
    getSettingsForType,
    activePreset,
    setActivePreset: setActivePresetWithSave,
    settingsVersion,
    refreshVisualizer,
  };
};

const ExpandedPlayer = ({
  currentTrack,
  getTrackImage,
  formatTime,
    currentTime,
    duration,
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
    setShowQueue,
    showQueue,
    showLyrics,
    setShowLyrics,
    setShowEQ,
    showEQ,
    onClose,
    setShowPlaylistModal,
    isMobile = false,
    audioContext,
    analyzerNode,
    volume,
    handleVolumeChange,
    toggleMute,
    isMuted,
}) => {
  const navigate = useNavigate();

  // Use the custom hook for visualizer settings with persistence
  const {
    vizType,
    setVizType,
    vizSettings,
    updateSetting,
    getSettingsForType,
    activePreset,
    setActivePreset,
    settingsVersion,
    refreshVisualizer,
  } = useVisualizerSettings('bars');

  // State Management
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [albumImageUrl, setAlbumImageUrl] = useState('');
  const [visualizerTab, setVisualizerTab] = useState('2D'); // '2D' or '3D'

  // Volume popup timeout
  const volumePopupTimeoutRef = useRef(null);

  // Enhanced Visualization Types
  const visualizationTypes = {
    '2D': [
      { id: 'none', icon: Circle, name: 'None' },
      { id: 'bars', icon: BarChart2, name: 'Bars' },
      { id: 'wave', icon: Waves, name: 'Wave' },
      { id: 'circular', icon: Disc, name: 'Circular' },
      { id: 'particles', icon: Sparkles, name: 'Particles' },
      { id: 'spectrum', icon: Activity, name: 'Spectrum' },
      { id: 'galaxy', icon: Atom, name: 'Galaxy' },
      { id: 'dna', icon: ChevronsUp, name: 'DNA' },
      { id: 'pulse', icon: Zap, name: 'Pulse' },
      { id: 'grid', icon: Grid3x3, name: 'Grid' },
      { id: 'radial', icon: Radio, name: 'Radial' },
    ],
    '3D': [
      { id: 'bars3d', icon: Box, name: 'Bars 3D' },
      { id: 'terrain3d', icon: Mountain, name: 'Terrain' },
      { id: 'sphere3d', icon: Globe, name: 'Sphere' },
      { id: 'waveform3d', icon: Waves, name: 'Waveform' },
      { id: 'particles3d', icon: Sparkles, name: 'Particles' },
      { id: 'nebula3d', icon: Cloud, name: 'Nebula' },
      { id: 'spiral3d', icon: Radio, name: 'Spiral' },
      { id: 'vortex3d', icon: Wind, name: 'Vortex' },
      { id: 'cube3d', icon: Box, name: 'Cubes' },
      { id: 'equalizer3d', icon: Sliders, name: 'Equalizer' },
      { id: 'tunnel3d', icon: Hexagon, name: 'Tunnel' },
      { id: 'galaxy3d', icon: Atom, name: 'Galaxy' },
      { id: 'audioscape3d', icon: Layers, name: 'Audioscape' }
    ]
  };

  // Enhanced Color Presets
  const colorPresets = {
    'Default': {
      none: ['transparent'],
      bars: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
      wave: ['#10B981', '#3B82F6', '#8B5CF6'],
      circular: ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],
      radial: ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],
      particles: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
      spectrum: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
      grid: ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899'],
      pulse: ['#EF4444', '#F59E0B', '#FBBF24'],
      galaxy: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'],
      dna: ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],

      // 3D visualizations
      bars3d: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
      terrain3d: ['#00ff87', '#60efff', '#0061ff', '#2f0a43'],
      sphere3d: ['#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B'],
      waveform3d: ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
      particles3d: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
      nebula3d: ['#ff0080', '#9500ff', '#00aaff', '#ffb900'],
      spiral3d: ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
      vortex3d: ['#FF5F6D', '#FFC371', '#00F0B5', '#4158D0'],
      cube3d: ['#ff1f00', '#ff8700', '#ffd500', '#22bb33'],
      equalizer3d: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
      tunnel3d: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'],
      audioscape3d: ['#6366F1', '#EC4899', '#10B981', '#3B82F6'],
      galaxy3d: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'],
    },
    'Neon': {
      none: ['transparent'],
      bars: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      wave: ['#FF00FF', '#00FFFF'],
      circular: ['#FF00FF', '#00FFFF', '#FFFF00'],
      radial: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      particles: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#00FF00'],
      spectrum: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF00AA'],
      grid: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      pulse: ['#FF00FF', '#FFFF00', '#00FFFF'],
      galaxy: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      dna: ['#FF00FF', '#00FFFF', '#FFFF00'],

      // 3D visualizations
      bars3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      terrain3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      sphere3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      waveform3d: ['#FF00FF', '#00FFFF', '#FFFF00'],
      particles3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#00FF00'],
      nebula3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      spiral3d: ['#FF00FF', '#00FFFF', '#FFFF00'],
      vortex3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      cube3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      equalizer3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      tunnel3d: ['#FF00FF', '#00FFFF', '#FFFF00'],
      audioscape3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
      galaxy3d: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
    },
    'Sunset': {
      none: ['transparent'],
      bars: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      wave: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
      circular: ['#FF6B6B', '#FFE66D', '#FF8E53'],
      radial: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E53'],
      particles: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#FA5252'],
      spectrum: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E53', '#FA5252'],
      grid: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3'],
      pulse: ['#FF6B6B', '#FFE66D', '#FF8E53'],
      galaxy: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3'],
      dna: ['#FF6B6B', '#FFE66D', '#4ECDC4'],

      // 3D visualizations
      bars3d: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      terrain3d: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      sphere3d: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E53'],
      waveform3d: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
      particles3d: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#FA5252'],
      nebula3d: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      spiral3d: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
      vortex3d: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      cube3d: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      equalizer3d: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FA5252'],
      tunnel3d: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E53'],
      audioscape3d: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3'],
      galaxy3d: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3'],
    },
    'Ocean': {
      none: ['transparent'],
      bars: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      wave: ['#0066CC', '#00CCCC', '#66CCFF'],
      circular: ['#0066CC', '#00CCCC', '#66CCFF'],
      radial: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      particles: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF', '#0099CC'],
      spectrum: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC', '#66CCFF'],
      grid: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF'],
      pulse: ['#0066CC', '#00CCCC', '#0099CC'],
      galaxy: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF'],
      dna: ['#0066CC', '#00CCCC', '#66CCFF'],

      // 3D visualizations
      bars3d: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      terrain3d: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      sphere3d: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      waveform3d: ['#0066CC', '#00CCCC', '#66CCFF'],
      particles3d: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF', '#0099CC'],
      nebula3d: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF'],
      spiral3d: ['#0066CC', '#00CCCC', '#66CCFF'],
      vortex3d: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      cube3d: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF'],
      equalizer3d: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      tunnel3d: ['#0066CC', '#00CCCC', '#00CC66', '#0099CC'],
      audioscape3d: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF'],
      galaxy3d: ['#0066CC', '#00CCCC', '#00CC66', '#66CCFF'],
    },
    'Monochrome': {
      none: ['transparent'],
      bars: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      wave: ['#FFFFFF', '#CCCCCC'],
      circular: ['#FFFFFF', '#CCCCCC', '#999999'],
      radial: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      particles: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'],
      spectrum: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'],
      grid: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      pulse: ['#FFFFFF', '#CCCCCC', '#999999'],
      galaxy: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      dna: ['#FFFFFF', '#CCCCCC', '#999999'],

      // 3D visualizations
      bars3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      terrain3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      sphere3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      waveform3d: ['#FFFFFF', '#CCCCCC', '#999999'],
      particles3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'],
      nebula3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      spiral3d: ['#FFFFFF', '#CCCCCC', '#999999'],
      vortex3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      cube3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      equalizer3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      tunnel3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      audioscape3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
      galaxy3d: ['#FFFFFF', '#CCCCCC', '#999999', '#666666'],
    },
    'Cyberpunk': {
      none: ['transparent'],
      bars: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      wave: ['#00F0FF', '#FF00D6'],
      circular: ['#00F0FF', '#FF00D6', '#FFFF00'],
      radial: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      particles: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F', '#FF5E00'],
      spectrum: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F', '#FF5E00'],
      grid: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      pulse: ['#00F0FF', '#FF00D6', '#FFFF00'],
      galaxy: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      dna: ['#00F0FF', '#FF00D6', '#FFFF00'],

      // 3D visualizations
      bars3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      terrain3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      sphere3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      waveform3d: ['#00F0FF', '#FF00D6', '#FFFF00'],
      particles3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F', '#FF5E00'],
      nebula3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      spiral3d: ['#00F0FF', '#FF00D6', '#FFFF00'],
      vortex3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      cube3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      equalizer3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      tunnel3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      audioscape3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
      galaxy3d: ['#00F0FF', '#FF00D6', '#FFFF00', '#00FF9F'],
    }
  };

  // Memoize current settings for the active visualization type
  const currentVizSettings = useMemo(() => {
    return getSettingsForType(vizType);
  }, [vizType, getSettingsForType]);

  // Memoize current colors
  const currentColors = useMemo(() => {
    return colorPresets[activePreset]?.[vizType] || colorPresets['Default'][vizType] || ['#FFFFFF'];
  }, [activePreset, vizType]);

  // Force re-mount for visualizer instances when type, preset, or settings change
  const visualizerKey = useMemo(
    () => `${vizType}-${activePreset}-${settingsVersion}`,
    [vizType, activePreset, settingsVersion]
  );

  // Update album image when track changes
  useEffect(() => {
    if (currentTrack && getTrackImage) {
      const imageUrl = getTrackImage();
      setAlbumImageUrl(imageUrl);
    }
  }, [currentTrack, getTrackImage]);

  // Handle volume popup display
  const showVolumeControl = useCallback(() => {
    setShowVolumePopup(true);
    if (volumePopupTimeoutRef.current) {
      clearTimeout(volumePopupTimeoutRef.current);
    }
    volumePopupTimeoutRef.current = setTimeout(() => {
      setShowVolumePopup(false);
    }, 3000);
  }, []);

  // Clear volume popup timeout on unmount
  useEffect(() => {
    return () => {
      if (volumePopupTimeoutRef.current) {
        clearTimeout(volumePopupTimeoutRef.current);
      }
    };
  }, []);

  // Navigation handler
  const handleNavigate = useCallback((path) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  // Share functionality
  const handleShare = useCallback(() => {
    if (navigator.share && currentTrack) {
      navigator.share({
        title: currentTrack.title,
        text: `Listen to ${currentTrack.title} by ${currentTrack.artist}`,
        url: window.location.href
      }).catch(() => setShowShareMenu(true));
    } else {
      setShowShareMenu(true);
    }
  }, [currentTrack]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  }, []);

  // Double tap to like functionality
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleLike();
    }
    lastTapRef.current = now;
  }, [toggleLike]);

  // Get track image with fallback
  const trackImage = useCallback(() => {
    try {
      return albumImageUrl || (getTrackImage ? getTrackImage() : '/default-album.jpg');
    } catch (error) {
      console.error('Error getting track image:', error);
      return '/default-album.jpg';
    }
  }, [albumImageUrl, getTrackImage]);

  // Check if the current visualization is 3D
  const is3DVisualization = useMemo(() => {
    return vizType.includes('3d');
  }, [vizType]);

  // Set visualizer tab based on current visualization type
  useEffect(() => {
    if (is3DVisualization) {
      setVisualizerTab('3D');
    } else {
      setVisualizerTab('2D');
    }
  }, [is3DVisualization, setVisualizerTab]);

  // Visualizer Controls Component
  const VisualizerControls = useCallback(({ compact = false } = {}) => {
    const typeGridCols = compact ? 'grid-cols-2' : 'grid-cols-3';
    const presetGridCols = compact ? 'grid-cols-2' : 'grid-cols-3';

    return (
      <div className="flex flex-col gap-6">
      {/* Visualization Type Tabs */}
      <div className={`${compact ? 'sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-white/10 pb-4' : ''} space-y-4`}>
      <div className="flex bg-white/5 rounded-lg p-1">
      <button
      onClick={() => setVisualizerTab('2D')}
      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
        visualizerTab === '2D'
        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
        : 'text-white/70 hover:text-white'
      }`}
      >
      2D Visualizations
      </button>
      <button
      onClick={() => setVisualizerTab('3D')}
      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
        visualizerTab === '3D'
        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
        : 'text-white/70 hover:text-white'
      }`}
      >
      3D Visualizations
      </button>
      </div>

      <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/60">Visualization Type</h4>
      <div className={`grid ${typeGridCols} gap-2`}>
      {visualizationTypes[visualizerTab].map(({ id, icon: Icon, name }) => (
        <button
        key={id}
        onClick={() => setVizType(id)}
        className={`relative p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 ${
          vizType === id
          ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
        }`}
        >
        <Icon size={20} />
        <span className="text-xs font-medium">{name}</span>
        </button>
      ))}
      </div>
      </div>

      <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/60">Color Presets</h4>
      <div className={`grid ${presetGridCols} gap-2`}>
      {Object.keys(colorPresets).map((presetName) => (
        <button
        key={presetName}
        onClick={() => setActivePreset(presetName)}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          activePreset === presetName
          ? 'bg-white/20 text-white ring-2 ring-white/30'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
        }`}
        >
        {presetName}
        </button>
      ))}
      </div>
      <div className="flex gap-2">
      <button
      onClick={refreshVisualizer}
      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 text-xs font-semibold transition-colors"
      >
      <RefreshCcw size={14} />
      Reset Visualizer
      </button>
      </div>
      </div>
      </div>

      {/* Settings */}
      <div className="space-y-5 touch-pan-y">
      <h4 className="text-sm font-medium text-white/60 mb-4">Settings</h4>
      <div className="space-y-5">
      {/* Universal Settings */}
      <div className="space-y-2">
      <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">Smoothing</span>
      <span className="text-xs text-white/50 font-mono">
      {Math.round(vizSettings.smoothing * 100)}%
      </span>
      </div>
      <input
      type="range"
      min="0"
      max="0.95"
      step="0.05"
      value={vizSettings.smoothing}
      onChange={(e) => updateSetting('smoothing', parseFloat(e.target.value))}
      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
      />
      </div>

      <div className="space-y-2">
      <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">Amplification</span>
      <span className="text-xs text-white/50 font-mono">
      {vizSettings.amplification.toFixed(1)}x
      </span>
      </div>
      <input
      type="range"
      min="0.5"
      max="2.0"
      step="0.1"
      value={vizSettings.amplification}
      onChange={(e) => updateSetting('amplification', parseFloat(e.target.value))}
      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
      />
      </div>

      {/* 2D Visualization Settings */}
      {vizType === 'bars' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Bar Count</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.barCount}</span>
        </div>
        <input
        type="range"
        min="16"
        max="128"
        step="8"
        value={vizSettings.barCount}
        onChange={(e) => updateSetting('barCount', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Mirror Effect</span>
        <button
        onClick={() => updateSetting('mirror', !vizSettings.mirror)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.mirror ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.mirror ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Gradient</span>
        <button
        onClick={() => updateSetting('gradient', !vizSettings.gradient)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.gradient ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.gradient ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Reactive</span>
        <button
        onClick={() => updateSetting('reactive', !vizSettings.reactive)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.reactive ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.reactive ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Glow Effect</span>
        <button
        onClick={() => updateSetting('glow', !vizSettings.glow)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.glow ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.glow ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Caps</span>
        <button
        onClick={() => updateSetting('cap', !vizSettings.cap)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.cap ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.cap ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {vizType === 'wave' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Line Width</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.lineWidth}px</span>
        </div>
        <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={vizSettings.lineWidth}
        onChange={(e) => updateSetting('lineWidth', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Points</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.points}</span>
        </div>
        <input
        type="range"
        min="64"
        max="512"
        step="32"
        value={vizSettings.points}
        onChange={(e) => updateSetting('points', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Amplitude</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.amplitude.toFixed(1)}x</span>
        </div>
        <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={vizSettings.amplitude}
        onChange={(e) => updateSetting('amplitude', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Fill</span>
        <button
        onClick={() => updateSetting('fill', !vizSettings.fill)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.fill ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.fill ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Glow</span>
        <button
        onClick={() => updateSetting('glow', !vizSettings.glow)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.glow ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.glow ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Mirror</span>
        <button
        onClick={() => updateSetting('mirror', !vizSettings.mirror)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.mirror ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.mirror ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {vizType === 'particles' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Particle Count</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.particleCount}</span>
        </div>
        <input
        type="range"
        min="50"
        max="300"
        step="10"
        value={vizSettings.particleCount}
        onChange={(e) => updateSetting('particleCount', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Speed</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.speed.toFixed(1)}x</span>
        </div>
        <input
        type="range"
        min="0.1"
        max="3.0"
        step="0.1"
        value={vizSettings.speed}
        onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Connections</span>
        <button
        onClick={() => updateSetting('connections', !vizSettings.connections)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.connections ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.connections ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Glow</span>
        <button
        onClick={() => updateSetting('glow', !vizSettings.glow)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.glow ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.glow ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Attraction</span>
        <button
        onClick={() => updateSetting('attraction', !vizSettings.attraction)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.attraction ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.attraction ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Repulsion</span>
        <button
        onClick={() => updateSetting('repulsion', !vizSettings.repulsion)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.repulsion ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.repulsion ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {(vizType === 'circular') && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Segments</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.circularSegments}</span>
        </div>
        <input
        type="range"
        min="64"
        max="512"
        step="32"
        value={vizSettings.circularSegments}
        onChange={(e) => updateSetting('circularSegments', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Layers</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.layers}</span>
        </div>
        <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={vizSettings.layers}
        onChange={(e) => updateSetting('layers', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Rotation</span>
        <button
        onClick={() => updateSetting('rotation', !vizSettings.rotation)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.rotation ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.rotation ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Pulse</span>
        <button
        onClick={() => updateSetting('pulse', !vizSettings.pulse)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.pulse ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.pulse ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Phase Shift</span>
        <button
        onClick={() => updateSetting('phaseShift', !vizSettings.phaseShift)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.phaseShift ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.phaseShift ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {vizType === 'spectrum' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Bands</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.bands}</span>
        </div>
        <input
        type="range"
        min="16"
        max="128"
        step="8"
        value={vizSettings.bands}
        onChange={(e) => updateSetting('bands', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Peak Hold</span>
        <button
        onClick={() => updateSetting('peakHold', !vizSettings.peakHold)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.peakHold ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.peakHold ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Logarithmic</span>
        <button
        onClick={() => updateSetting('logarithmic', !vizSettings.logarithmic)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.logarithmic ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.logarithmic ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Reflection</span>
        <button
        onClick={() => updateSetting('reflection', !vizSettings.reflection)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.reflection ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.reflection ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {vizType === 'pulse' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Beat Sensitivity</span>
        <span className="text-xs text-white/50 font-mono">
        {Math.round(vizSettings.sensitivity * 100)}%
        </span>
        </div>
        <input
        type="range"
        min="0.1"
        max="1.0"
        step="0.05"
        value={vizSettings.sensitivity}
        onChange={(e) => updateSetting('sensitivity', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Beat Threshold</span>
        <span className="text-xs text-white/50 font-mono">
        {vizSettings.beatThreshold.toFixed(1)}x
        </span>
        </div>
        <input
        type="range"
        min="1.0"
        max="2.0"
        step="0.1"
        value={vizSettings.beatThreshold}
        onChange={(e) => updateSetting('beatThreshold', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <span className="text-sm text-white/70">Frequency Range</span>
        <div className="grid grid-cols-2 gap-2">
        {['bass', 'mid', 'treble', 'all'].map((range) => (
          <button
          key={range}
          onClick={() => updateSetting('frequencyRange', range)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            vizSettings.frequencyRange === range
            ? 'bg-white/20 text-white'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
          >
          {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
        </div>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Color Shift</span>
        <button
        onClick={() => updateSetting('colorShift', !vizSettings.colorShift)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.colorShift ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.colorShift ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {/* 3D Visualization Settings */}
      {vizType === 'bars3d' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Bar Count</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.barCount}</span>
        </div>
        <input
        type="range"
        min="16"
        max="128"
        step="8"
        value={vizSettings.barCount}
        onChange={(e) => updateSetting('barCount', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Cylindrical</span>
        <button
        onClick={() => updateSetting('cylindrical', !vizSettings.cylindrical)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.cylindrical ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.cylindrical ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Rotation</span>
        <button
        onClick={() => updateSetting('rotation', !vizSettings.rotation)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.rotation ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.rotation ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Show Ground</span>
        <button
        onClick={() => updateSetting('showGround', !vizSettings.showGround)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.showGround ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.showGround ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Metalness</span>
        <span className="text-xs text-white/50 font-mono">
        {(vizSettings.metalness || 0).toFixed(1)}
        </span>
        </div>
        <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={vizSettings.metalness || 0}
        onChange={(e) => updateSetting('metalness', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>
        </>
      )}

      {vizType === 'terrain3d' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Resolution</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.resolution}</span>
        </div>
        <input
        type="range"
        min="32"
        max="256"
        step="16"
        value={vizSettings.resolution}
        onChange={(e) => updateSetting('resolution', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Wireframe</span>
        <button
        onClick={() => updateSetting('wireframe', !vizSettings.wireframe)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.wireframe ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.wireframe ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Rotation</span>
        <button
        onClick={() => updateSetting('rotation', !vizSettings.rotation)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.rotation ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.rotation ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Color Shift</span>
        <button
        onClick={() => updateSetting('colorShift', !vizSettings.colorShift)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.colorShift ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.colorShift ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Auto Camera</span>
        <button
        onClick={() => updateSetting('autoCamera', !vizSettings.autoCamera)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.autoCamera ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.autoCamera ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {vizType === 'sphere3d' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Sphere Segments</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.sphereSegments}</span>
        </div>
        <input
        type="range"
        min="8"
        max="64"
        step="4"
        value={vizSettings.sphereSegments}
        onChange={(e) => updateSetting('sphereSegments', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Deform Factor</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.deformFactor.toFixed(1)}</span>
        </div>
        <input
        type="range"
        min="0.5"
        max="3.0"
        step="0.1"
        value={vizSettings.deformFactor}
        onChange={(e) => updateSetting('deformFactor', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Wireframe</span>
        <button
        onClick={() => updateSetting('wireframe', !vizSettings.wireframe)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.wireframe ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.wireframe ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Rotation</span>
        <button
        onClick={() => updateSetting('rotation', !vizSettings.rotation)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.rotation ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.rotation ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="space-y-2">
        <span className="text-sm text-white/70">Color Mode</span>
        <div className="grid grid-cols-3 gap-2">
        {['gradient', 'spectrum', 'solid'].map((mode) => (
          <button
          key={mode}
          onClick={() => updateSetting('colorMode', mode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            vizSettings.colorMode === mode
            ? 'bg-white/20 text-white'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
          >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
        </div>
        </div>
        </>
      )}

      {vizType === 'waveform3d' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Wave Points</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.wavePoints}</span>
        </div>
        <input
        type="range"
        min="32"
        max="256"
        step="16"
        value={vizSettings.wavePoints}
        onChange={(e) => updateSetting('wavePoints', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Line Width</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.lineWidth}</span>
        </div>
        <input
        type="range"
        min="2"
        max="16"
        step="1"
        value={vizSettings.lineWidth}
        onChange={(e) => updateSetting('lineWidth', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Wave Layers</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.waves}</span>
        </div>
        <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={vizSettings.waves}
        onChange={(e) => updateSetting('waves', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Closed Loop</span>
        <button
        onClick={() => updateSetting('closed', !vizSettings.closed)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.closed ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.closed ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Rotation</span>
        <button
        onClick={() => updateSetting('rotation', !vizSettings.rotation)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.rotation ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.rotation ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </>
      )}

      {vizType === 'particles3d' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Particle Count</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.particleCount}</span>
        </div>
        <input
        type="range"
        min="500"
        max="5000"
        step="500"
        value={vizSettings.particleCount}
        onChange={(e) => updateSetting('particleCount', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Particle Size</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.particleSize.toFixed(1)}</span>
        </div>
        <input
        type="range"
        min="0.1"
        max="1.0"
        step="0.1"
        value={vizSettings.particleSize}
        onChange={(e) => updateSetting('particleSize', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Show Connections</span>
        <button
        onClick={() => updateSetting('showConnections', !vizSettings.showConnections)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.showConnections ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.showConnections ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Reactive</span>
        <button
        onClick={() => updateSetting('reactive', !vizSettings.reactive)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.reactive ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.reactive ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Rotation Speed</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.rotationSpeed.toFixed(3)}</span>
        </div>
        <input
        type="range"
        min="0"
        max="0.01"
        step="0.001"
        value={vizSettings.rotationSpeed}
        onChange={(e) => updateSetting('rotationSpeed', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>
        </>
      )}

      {vizType === 'nebula3d' && (
        <>
        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Particle Count</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.particleCount}</span>
        </div>
        <input
        type="range"
        min="1000"
        max="10000"
        step="1000"
        value={vizSettings.particleCount}
        onChange={(e) => updateSetting('particleCount', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Cloud Size</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.cloudSize}</span>
        </div>
        <input
        type="range"
        min="10"
        max="50"
        step="5"
        value={vizSettings.cloudSize}
        onChange={(e) => updateSetting('cloudSize', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Cloud Density</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.cloudDensity.toFixed(1)}</span>
        </div>
        <input
        type="range"
        min="1"
        max="30"
        step="1"
        value={vizSettings.cloudDensity}
        onChange={(e) => updateSetting('cloudDensity', parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Color Cycle</span>
        <button
        onClick={() => updateSetting('colorCycle', !vizSettings.colorCycle)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.colorCycle ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.colorCycle ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        <div className="space-y-2">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Evolution Speed</span>
        <span className="text-xs text-white/50 font-mono">{vizSettings.evolution.toFixed(3)}</span>
        </div>
        <input
        type="range"
        min="0.001"
        max="0.01"
        step="0.001"
        value={vizSettings.evolution}
        onChange={(e) => updateSetting('evolution', parseFloat(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
        />
        </div>
        </>
      )}

      {/* Post-processing effects for all 3D visualizations */}
      {is3DVisualization && (
        <>
        <div className="mt-6 pt-4 border-t border-white/10">
        <h4 className="text-sm font-medium text-white/60 mb-3">Post-processing Effects</h4>

        <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/70">Bloom Effect</span>
        <button
        onClick={() => updateSetting('bloom', !vizSettings.bloom)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.bloom ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.bloom ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        {vizSettings.bloom && (
          <>
          <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Bloom Strength</span>
          <span className="text-xs text-white/50 font-mono">{vizSettings.bloomStrength.toFixed(1)}</span>
          </div>
          <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={vizSettings.bloomStrength}
          onChange={(e) => updateSetting('bloomStrength', parseFloat(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
          />
          </div>

          <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Bloom Radius</span>
          <span className="text-xs text-white/50 font-mono">{vizSettings.bloomRadius.toFixed(1)}</span>
          </div>
          <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={vizSettings.bloomRadius}
          onChange={(e) => updateSetting('bloomRadius', parseFloat(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
          />
          </div>
          </>
        )}

        <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/70">Glitch Effect</span>
        <button
        onClick={() => updateSetting('glitch', !vizSettings.glitch)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.glitch ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.glitch ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>

        {vizSettings.glitch && (
          <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70">Wild Glitch Mode</span>
          <button
          onClick={() => updateSetting('glitchWild', !vizSettings.glitchWild)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            vizSettings.glitchWild ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
          }`}
          >
          <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            vizSettings.glitchWild ? 'translate-x-5' : 'translate-x-0'
          }`}
          />
          </button>
          </div>
        )}

        <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">Interactive Mode</span>
        <button
        onClick={() => updateSetting('interactiveMode', !vizSettings.interactiveMode)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          vizSettings.interactiveMode ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-white/20'
        }`}
        >
        <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          vizSettings.interactiveMode ? 'translate-x-5' : 'translate-x-0'
        }`}
        />
        </button>
        </div>
        </div>
        </>
      )}
      </div>
      </div>
      </div>
    );
  }, [
    vizType,
    vizSettings,
    activePreset,
    updateSetting,
    setVizType,
    setActivePreset,
    visualizerTab,
    setVisualizerTab,
    visualizationTypes,
    is3DVisualization,
    refreshVisualizer
  ]);

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <>
      <motion.div
      className="fixed inset-0 z-40 bg-black flex flex-col"
      style={{ height: '100dvh' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
      {/* Layered glass background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
        className="absolute inset-0"
        style={{
          backgroundImage: imageLoaded ? `url(${trackImage()})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) saturate(180%)',
          transform: 'scale(1.3)',
          opacity: 0.6
        }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
      </div>

      {/* Header - Glass bar */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-white/5 backdrop-blur-xl border-b border-white/10">
      <button
      onClick={onClose}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border border-white/10 active:bg-white/20"
      >
      <ChevronDown size={20} className="text-white/80" />
      </button>

      <div className="text-center flex-1 mx-3">
      <p className="text-[9px] text-white/50 uppercase tracking-widest font-medium">Now Playing</p>
      </div>

      <button
      onClick={() => setShowQueue(!showQueue)}
      className={`w-9 h-9 flex items-center justify-center rounded-full border active:bg-white/20 ${
        showQueue ? 'bg-accent/20 text-accent border-accent/30' : 'bg-white/10 text-white/80 border-white/10'
      }`}
      >
      <ListMusic size={18} />
      </button>
      </div>

      {/* Scrollable content area */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
      <div className="flex flex-col min-h-full px-4 py-3">

      {/* Album Art - Adaptive size */}
      <div className="flex-shrink-0 flex items-center justify-center mb-4">
      <div
      className="relative w-[min(70vw,280px)] aspect-square"
      onDoubleClick={handleDoubleTap}
      >
      <div className="absolute inset-2 bg-black/40 rounded-2xl blur-xl transform translate-y-2" />
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/20 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none z-10" />
      <img
      src={trackImage()}
      alt={currentTrack?.title}
      className="w-full h-full object-cover"
      onLoad={() => setImageLoaded(true)}
      onError={(e) => { e.target.src = '/default-album.jpg'; }}
      />
      {analyzerNode && audioContext && isPlaying && !loading && vizType !== 'none' && (
        <div className="absolute inset-0 pointer-events-none z-20">
        <AudioVisualizer
        key={`cover-${visualizerKey}`}
        audioContext={audioContext}
        analyzerNode={analyzerNode}
        type={vizType}
        colors={currentColors}
        settings={currentVizSettings}
        style={{ height: '100%', width: '100%', opacity: 0.7 }}
        interactiveMode={vizSettings.interactiveMode && is3DVisualization}
        />
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      </div>
      </div>
      </div>

      {/* Track Info */}
      <div className="flex-shrink-0 text-center px-2 mb-3">
      <h1 className="text-base font-bold text-white line-clamp-1">
      {currentTrack?.title || 'Unknown Track'}
      </h1>
      <p className="text-sm text-white/60 line-clamp-1">
      {currentTrack?.artist || 'Unknown Artist'}
      </p>
      </div>

      {/* Progress Bar */}
      <div className="flex-shrink-0 px-2 mb-2">
      <SeekBar
      currentTime={currentTime}
      duration={duration}
      onSeek={seek}
      formatTime={formatTime}
      containerClass="w-full"
      barClass="relative h-1 bg-white/10 rounded-full"
      progressClass="absolute inset-y-0 bg-white rounded-full"
      thumbClass="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg -ml-1.5"
      />
      </div>

      {/* Volume Control */}
      <div className="flex-shrink-0 px-2 mb-3">
      <div className="flex items-center gap-2">
      <button onClick={toggleMute} className="p-1 text-white/60 active:text-white">
      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <div className="flex-1 h-1 bg-white/10 rounded-full relative">
      <div className="absolute inset-y-0 left-0 bg-white/60 rounded-full" style={{ width: `${volume * 100}%` }} />
      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange}
      className="absolute inset-0 w-full opacity-0 cursor-pointer" />
      </div>
      <span className="text-[10px] text-white/40 w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>
      </div>

      {/* Main Playback Controls */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 mb-3">
      <button onClick={toggleLike} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-90">
      <Heart size={16} className={isLiked ? 'text-pink-500 fill-current' : 'text-white/60'} />
      </button>

      <button onClick={toggleShuffle} className={`w-8 h-8 flex items-center justify-center rounded-full border active:scale-90 ${shuffle ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white/60'}`}>
      <Shuffle size={14} />
      </button>

      <button onClick={playPrevious} disabled={!currentTrack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/10 disabled:opacity-40 active:scale-90">
      <SkipBack size={18} className="text-white" />
      </button>

      <button onClick={togglePlay} disabled={!currentTrack || loading}
      className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg shadow-white/20 active:scale-95 disabled:opacity-50">
      {loading ? (
        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      ) : isPlaying ? (
        <Pause size={20} className="text-black" />
      ) : (
        <Play size={20} className="text-black ml-0.5" />
      )}
      </button>

      <button onClick={playNext} disabled={!currentTrack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/10 disabled:opacity-40 active:scale-90">
      <SkipForward size={18} className="text-white" />
      </button>

      <button onClick={toggleRepeat} className={`w-8 h-8 flex items-center justify-center rounded-full border active:scale-90 ${repeat !== 'none' ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white/60'}`}>
      {repeat === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
      </button>

      <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-90">
      <Share2 size={16} className="text-white/60" />
      </button>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button onClick={() => setShowPlaylistModal(true)}
      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 border border-white/10 active:bg-white/10">
      <Plus size={16} className="text-white/70" />
      <span className="text-[8px] text-white/50 font-medium">Playlist</span>
      </button>

      <button onClick={() => setShowLyrics(!showLyrics)}
      className={`flex flex-col items-center gap-1 py-2 rounded-xl border active:scale-95 ${showLyrics ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white/70'}`}>
      <FileText size={16} />
      <span className="text-[8px] font-medium">Lyrics</span>
      </button>

      <button onClick={() => setShowEQ(!showEQ)}
      className={`flex flex-col items-center gap-1 py-2 rounded-xl border active:scale-95 ${showEQ ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white/70'}`}>
      <Sliders size={16} />
      <span className="text-[8px] font-medium">EQ</span>
      </button>

      <button onClick={() => setShowVisualizer(true)}
      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 border border-white/10 active:bg-white/10">
      <Activity size={16} className="text-white/70" />
      <span className="text-[8px] text-white/50 font-medium">Visual</span>
      </button>
      </div>

      </div>
      </div>
      </motion.div>

      {/* Mobile Visualizer Modal */}
      <AnimatePresence>
      {showVisualizer && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        style={{ height: '100dvh' }}
        >
        <div className="flex flex-col h-full overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white">Visualizer</h2>
        <button
        onClick={() => setShowVisualizer(false)}
        className="p-2 -m-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
        <X size={22} className="text-white" />
        </button>
        </div>

        {/* Visualizer - Flexible height */}
        <div className="flex-1 p-3 min-h-0">
        {analyzerNode && audioContext ? (
          <AudioVisualizer
            key={`mobile-modal-${visualizerKey}`}
            audioContext={audioContext}
            analyzerNode={analyzerNode}
            type={vizType}
            colors={currentColors}
            settings={currentVizSettings}
            style={{ height: '100%', width: '100%' }}
            interactiveMode={vizSettings.interactiveMode && is3DVisualization}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
          <p className="text-white/50">No audio data available</p>
          </div>
        )}
        </div>

        {/* Controls - Scrollable with safe area */}
        <div className="flex-shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10 max-h-[45vh] overflow-y-auto bg-black/80 backdrop-blur-md touch-pan-y overscroll-contain">
        <VisualizerControls compact />
        </div>
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Share Menu */}
      <AnimatePresence>
      {showShareMenu && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
        style={{ height: '100dvh' }}
        onClick={() => setShowShareMenu(false)}
        >
        <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white/10 backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] w-full sm:max-w-xs sm:mx-6 border-t border-white/20 sm:border"
        onClick={(e) => e.stopPropagation()}
        >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
        <h3 className="text-lg font-bold text-white mb-4">Share Track</h3>
        <button
        onClick={copyLink}
        className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl text-white transition-all flex items-center justify-center gap-2 border border-white/10"
        >
        <Share2 size={18} />
        Copy Link
        </button>
        <button
        onClick={() => setShowShareMenu(false)}
        className="w-full py-3 mt-3 text-white/60 hover:text-white active:text-white/80 rounded-xl"
        >
        Cancel
        </button>
        </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      </>
    );
  }

  // DESKTOP LAYOUT
  return (
    <>
    <motion.div
    className="fixed inset-0 z-40 bg-black/80 backdrop-blur-3xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    >
    {/* Super blurred background with enhanced glass effect */}
    <div className="absolute inset-0">
    <div
    className="absolute inset-0 opacity-50"
    style={{
      backgroundImage: imageLoaded ? `url(${trackImage()})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(120px) saturate(200%)',
          transform: 'scale(1.5)'
    }}
    />
    {/* Glass overlay layers */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/80" />
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/80" />
    </div>

    {/* Animated glass particles */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    {/* Close button with glass styling */}
    <button
    onClick={onClose}
    className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all shadow-lg"
    >
    <X size={24} className="text-white" />
    </button>

    {/* Main content */}
    <div className="relative z-10 h-full flex items-center justify-center p-8">
    <div className="w-full max-w-7xl flex gap-12 items-center">
    {/* Left side - Album art with liquid glass styling */}
    <div className="flex-shrink-0">
    <div className="relative w-[450px] h-[450px] group">
    {/* Glass glow effect behind album */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl transform translate-y-8 scale-95 animate-pulse" />
    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-3xl blur-2xl transform -translate-y-4 scale-90" />

    {/* Glass container for album art */}
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 shadow-[0_35px_120px_rgba(0,0,0,0.5)]">
    {/* Inner glass highlight */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10" />

    <img
    src={trackImage()}
    alt={currentTrack?.title}
    className="w-full h-full object-cover"
    onLoad={() => setImageLoaded(true)}
    onError={(e) => {
      e.target.src = '/default-album.jpg';
    }}
    />

    {/* Visualizer overlay with glass blend */}
    {analyzerNode && audioContext && isPlaying && !loading && vizType !== 'none' && (
      <div className="absolute inset-0 pointer-events-none z-20">
      <AudioVisualizer
      key={`desktop-cover-${visualizerKey}`}
      audioContext={audioContext}
      analyzerNode={analyzerNode}
      type={vizType}
      colors={currentColors}
      settings={currentVizSettings}
      style={{ height: '100%', width: '100%', opacity: 0.75 }}
      interactiveMode={vizSettings.interactiveMode && is3DVisualization}
      />
      </div>
    )}

    {/* Hover overlay with glass effect */}
    <div
    className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-all z-30"
    onClick={toggleLike}
    >
    <div className="p-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
    <Heart
    size={48}
    className={isLiked ? 'text-pink-500 fill-current drop-shadow-lg' : 'text-white/80'}
    />
    </div>
    </div>

    {/* Loading overlay with glass effect */}
    {loading && (
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-40">
      <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-white/20 border-t-accent rounded-full animate-spin" />
      <span className="text-white/60 text-sm">Loading...</span>
      </div>
      </div>
    )}
    </div>

    {/* Bottom reflection effect */}
    <div className="absolute -bottom-4 left-4 right-4 h-20 bg-gradient-to-b from-white/5 to-transparent rounded-3xl blur-xl transform scale-y-50" />
    </div>
    </div>

    {/* Right side - Controls */}
    <div className="flex-1 max-w-xl">
    {/* Track info */}
    <div className="mb-8">
    <h1
    onClick={() => handleNavigate(`/track/${currentTrack?.id}`)}
    className="text-5xl font-bold text-white mb-3 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 transition-all cursor-pointer line-clamp-2"
    >
    {currentTrack?.title || 'Unknown Track'}
    </h1>
    <p
    onClick={() => handleNavigate(`/artist/${currentTrack?.artistId}`)}
    className="text-2xl text-white/60 hover:text-white/80 transition-colors cursor-pointer"
    >
    {currentTrack?.artist || 'Unknown Artist'}
    </p>
    {currentTrack?.album && (
      <p className="text-lg text-white/40 mt-2">
      {currentTrack.album}
      </p>
    )}
    </div>

    {/* Progress bar */}
    <SeekBar
    currentTime={currentTime}
    duration={duration}
    onSeek={seek}
    formatTime={formatTime}
    containerClass="w-full mb-8"
    barClass="relative h-2 bg-white/10 rounded-full group cursor-pointer my-2"
    progressClass="absolute inset-y-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
    thumbClass="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg -ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
    />

    {/* Main controls with liquid glass styling */}
    <div className="flex items-center justify-center gap-6 mb-10">
    <button
    onClick={toggleShuffle}
    className={`p-3.5 rounded-full transition-all backdrop-blur-sm border ${
      shuffle
      ? 'text-white bg-gradient-to-r from-pink-500/30 to-purple-600/30 border-pink-500/30 shadow-lg shadow-pink-500/20'
      : 'text-white/60 hover:text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
    }`}
    >
    <Shuffle size={22} />
    </button>

    <button
    onClick={playPrevious}
    className="p-3.5 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-full transition-all"
    disabled={!currentTrack}
    >
    <SkipBack size={32} />
    </button>

    <button
    onClick={togglePlay}
    className="relative w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-pink-500/40 transition-all border border-white/20"
    disabled={!currentTrack || loading}
    >
    {/* Animated glow ring */}
    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-60 animate-pulse" />
    {/* Glass highlight */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full" />
    {loading ? (
      <div className="relative w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
    ) : isPlaying ? (
      <Pause size={36} className="relative drop-shadow-lg" />
    ) : (
      <Play size={36} className="relative ml-1 drop-shadow-lg" />
    )}
    </button>

    <button
    onClick={playNext}
    className="p-3.5 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-full transition-all"
    disabled={!currentTrack}
    >
    <SkipForward size={32} />
    </button>

    <button
    onClick={toggleRepeat}
    className={`p-3.5 rounded-full transition-all backdrop-blur-sm border ${
      repeat !== 'none'
      ? 'text-white bg-gradient-to-r from-pink-500/30 to-purple-600/30 border-pink-500/30 shadow-lg shadow-pink-500/20'
      : 'text-white/60 hover:text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
    }`}
    >
    {repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
    </button>
    </div>

    {/* Secondary controls with glass styling */}
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
    <button
    onClick={toggleLike}
    className={`p-3 rounded-full transition-all backdrop-blur-sm border ${
      isLiked
      ? 'text-pink-500 bg-pink-500/20 border-pink-500/30 shadow-lg shadow-pink-500/20'
      : 'text-white/60 hover:text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
    }`}
    >
    <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
    </button>

    <button
    onClick={() => setShowPlaylistModal(true)}
    className="p-3 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
    >
    <Plus size={24} />
    </button>

    <button
    onClick={handleShare}
    className="p-3 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
    >
    <Share2 size={24} />
    </button>

    {/* Volume control for desktop with glass styling */}
    <div className="relative">
    <button
    onClick={() => {
      showVolumeControl();
      toggleMute();
    }}
    onMouseEnter={showVolumeControl}
    className="p-3 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
    >
    {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </button>

    {/* Volume Popup with glass styling */}
    <AnimatePresence>
    {showVolumePopup && (
      <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-3 bg-white/10 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_20px_70px_rgba(0,0,0,0.4)] border border-white/20 w-44"
      onMouseEnter={() => {
        if (volumePopupTimeoutRef.current) {
          clearTimeout(volumePopupTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        volumePopupTimeoutRef.current = setTimeout(() => {
          setShowVolumePopup(false);
        }, 1000);
      }}
      >
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl pointer-events-none" />
      <div className="relative flex flex-col items-center gap-3">
      <div className="w-full h-2.5 bg-white/10 rounded-full relative overflow-hidden">
      <div
      className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
      style={{ width: `${volume * 100}%` }}
      />
      <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={handleVolumeChange}
      className="absolute inset-0 w-full opacity-0 cursor-pointer"
      />
      </div>
      <div className="text-sm font-semibold text-white">
      {Math.round(volume * 100)}%
      </div>
      </div>
      </motion.div>
    )}
    </AnimatePresence>
    </div>
    </div>

    <div className="flex items-center gap-2">
    <button
    onClick={() => setShowQueue(!showQueue)}
    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-sm border ${
      showQueue
      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 border-white/20'
      : 'bg-white/10 text-white hover:bg-white/15 border-white/10 hover:border-white/20'
    }`}
    >
    <ListMusic size={18} className="inline mr-2" />
    Queue
    </button>

    <button
    onClick={() => setShowLyrics(!showLyrics)}
    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-sm border ${
      showLyrics
      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 border-white/20'
      : 'bg-white/10 text-white hover:bg-white/15 border-white/10 hover:border-white/20'
    }`}
    >
    <FileText size={18} className="inline mr-2" />
    Lyrics
    </button>

    <button
    onClick={() => setShowEQ(!showEQ)}
    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-sm border ${
      showEQ
      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 border-white/20'
      : 'bg-white/10 text-white hover:bg-white/15 border-white/10 hover:border-white/20'
    }`}
    >
    <Sliders size={18} className="inline mr-2" />
    Equalizer
    </button>

    <button
    onClick={() => setShowVisualizer(true)}
    className="px-5 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/15 text-sm font-medium transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
    >
    <Activity size={18} className="inline mr-2" />
    Visualizer
    </button>
    </div>
    </div>
    </div>
    </div>
    </div>
    </motion.div>

    {/* Desktop Visualizer Modal with liquid glass styling */}
    <AnimatePresence>
    {showVisualizer && (
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-3xl"
      >
      {/* Animated background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative h-full flex">
      {/* Main visualizer area */}
      <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-white/10">
      <Activity size={24} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white">Audio Visualizer</h2>
      </div>
      <button
      onClick={() => setShowVisualizer(false)}
      className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
      >
      <X size={24} className="text-white" />
      </button>
      </div>

      <div className="flex-1 p-8 min-h-[320px]">
      {analyzerNode && audioContext ? (
        <AudioVisualizer
        key={`desktop-modal-${visualizerKey}`}
        audioContext={audioContext}
        analyzerNode={analyzerNode}
        type={vizType}
        colors={currentColors}
        settings={currentVizSettings}
        style={{ height: '100%', width: '100%', minHeight: '320px' }}
        interactiveMode={vizSettings.interactiveMode && is3DVisualization}
        />
      ) : (
        <div className="h-full flex items-center justify-center glass-card rounded-3xl">
        <div className="text-center p-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mx-auto w-fit mb-6">
        <Music size={64} className="text-white/30" />
        </div>
        <p className="text-white/60 text-xl font-medium">No audio data available</p>
        <p className="text-white/40 text-sm mt-2">Play a track to see the visualizer</p>
        </div>
        </div>
      )}
      </div>
      </div>

      {/* Controls sidebar with glass styling */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border-l border-white/10 p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-white/10 border border-white/10">
      <Sliders size={20} className="text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white">Visualizer Settings</h3>
      </div>
      <VisualizerControls />
      </div>
      </div>
      </motion.div>
    )}
    </AnimatePresence>

    {/* Share Modal with glass styling */}
    <AnimatePresence>
    {showShareMenu && (
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-8"
      onClick={() => setShowShareMenu(false)}
      >
      {/* Animated background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${dominantColor}40, transparent)` }}
        />
      </div>

      <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      >
      {/* Glass gradient overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

      {/* Share icon header */}
      <div className="relative flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
          <Share2 size={24} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">Share Track</h3>
      </div>

      {/* Track info preview */}
      {currentTrack && (
        <div className="relative mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
            {currentTrack.coverArt ? (
              <img src={currentTrack.coverArt} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={24} className="text-white/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{currentTrack.title}</p>
            <p className="text-white/60 text-sm truncate">{currentTrack.artist}</p>
          </div>
        </div>
      )}

      <div className="relative space-y-3">
      <button
      onClick={copyLink}
      className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-2xl text-white transition-all flex items-center justify-center gap-3 backdrop-blur-sm group"
      >
      <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
        <Share2 size={18} />
      </div>
      <span className="font-medium">Copy Link</span>
      </button>
      <button
      onClick={() => setShowShareMenu(false)}
      className="w-full p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
      >
      Cancel
      </button>
      </div>
      </motion.div>
      </motion.div>
    )}
    </AnimatePresence>
    </>
  );
};

export default React.memo(ExpandedPlayer);
