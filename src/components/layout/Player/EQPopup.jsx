import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sliders, Headphones, Sparkles, Settings,
  RotateCcw, Download, Upload, Music, Check, AlertCircle,
  ChevronDown, ChevronUp, Activity, TrendingUp, TrendingDown,
  BarChart3, Zap, Gauge, Volume2, Save, FileText,
  Waves, Radio, Drum, Disc, Mic2, Piano, Guitar,
  Info, Copy, ExternalLink, Moon, Sun
} from 'lucide-react';
import {
  useAudio,
  useEqMode,
  useEqGains,
  useAdvancedEqGains,
  useTargetEqGains,
  useTargetAdvancedEqGains,
  useEqSmartEnabled,
  useEqSmartSettings,
  useDynamicEqEnabled,
  useCurrentTrack,
  useBassTone,
  useMicStatus,
  useMicLevel,
  useAmbientSnapshot,
} from '../../../contexts/AudioContext';

// Custom Hook for EQ Management
const useEQManager = () => {
  // Get methods from context (stable references)
  const {
    toggleEqMode,
    setEqGain,
    setAdvancedEqGain,
    resetEq,
    applyEqPreset,
    toggleEqSmart,
    presets,
    frequencies,
  } = useAudio();

  // Get state from Zustand selectors (optimized re-renders)
  const eqMode = useEqMode();
  const eqGains = useEqGains();
  const advancedEqGains = useAdvancedEqGains();
  const targetEqGains = useTargetEqGains();
  const targetAdvancedEqGains = useTargetAdvancedEqGains();
  const eqSmartEnabled = useEqSmartEnabled();
  const dynamicEqEnabled = useDynamicEqEnabled();
  const currentTrack = useCurrentTrack();

  const [customPresets, setCustomPresets] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareGains, setCompareGains] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const isAdvanced = eqMode === 'advanced';
  const hasLiveSmartEQ = eqSmartEnabled && dynamicEqEnabled;

  // Default frequency lists
  const defaultStandardFreqs = [60, 230, 910, 3600, 14000];
  const defaultAdvancedFreqs = [20, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];

  const freqList = isAdvanced
    ? (frequencies?.advanced || defaultAdvancedFreqs)
    : (frequencies?.standard || defaultStandardFreqs);

  // Default gains (all zeros)
  const defaultGains = useMemo(() => freqList.map(() => 0), [freqList]);

  const currentGains = useMemo(() => {
    const liveGains = isAdvanced ? targetAdvancedEqGains : targetEqGains;
    const baseGains = isAdvanced ? advancedEqGains : eqGains;

    if (hasLiveSmartEQ && Array.isArray(liveGains) && liveGains.length) {
      return liveGains;
    }

    // Return baseGains if valid, otherwise return defaults
    if (Array.isArray(baseGains) && baseGains.length > 0) {
      return baseGains;
    }

    return defaultGains;
  }, [advancedEqGains, eqGains, hasLiveSmartEQ, isAdvanced, targetAdvancedEqGains, targetEqGains, defaultGains]);
  const currentPresets = presets?.[eqMode] || [];

  // Add to history
  const addToHistory = useCallback((gains) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...gains]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      const gains = history[newIndex];
      gains.forEach((gain, i) => {
        if (isAdvanced) {
          setAdvancedEqGain(i, gain);
        } else {
          setEqGain(i, gain);
        }
      });
      setHistoryIndex(newIndex);
    }
  }, [canUndo, historyIndex, history, isAdvanced, setAdvancedEqGain, setEqGain]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      const gains = history[newIndex];
      gains.forEach((gain, i) => {
        if (isAdvanced) {
          setAdvancedEqGain(i, gain);
        } else {
          setEqGain(i, gain);
        }
      });
      setHistoryIndex(newIndex);
    }
  }, [canRedo, historyIndex, history, isAdvanced, setAdvancedEqGain, setEqGain]);

  // Save custom preset
  const saveCustomPreset = useCallback((name) => {
    const preset = {
      id: `custom-${Date.now()}`,
                                       name,
                                       gains: [...currentGains],
                                       mode: eqMode,
                                       timestamp: new Date().toISOString(),
    };
    setCustomPresets(prev => [...prev, preset]);
    localStorage.setItem('customEQPresets', JSON.stringify([...customPresets, preset]));
  }, [currentGains, eqMode, customPresets]);

  // Load custom presets on mount
  useEffect(() => {
    const saved = localStorage.getItem('customEQPresets');
    if (saved) {
      setCustomPresets(JSON.parse(saved));
    }
  }, []);

  // Initialize history
  useEffect(() => {
    if (currentGains && history.length === 0) {
      setHistory([[...currentGains]]);
      setHistoryIndex(0);
    }
  }, []);

  return {
    isAdvanced,
    freqList,
    currentGains,
    currentPresets,
    customPresets,
    compareMode,
    setCompareMode,
    compareGains,
    setCompareGains,
    canUndo,
    canRedo,
    undo,
    redo,
    addToHistory,
    saveCustomPreset,
  };
};

// Frequency Band Component
const FrequencyBand = ({
  frequency,
  gain,
  index,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  isActive,
  compareGain,
  suggestion,
  isMobile,
  darkMode
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const formatFrequency = (freq) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}k`;
    }
    return freq.toString();
  };

  const formatGainValue = (value) => {
    const numeric = typeof value === 'number' && isFinite(value) ? value : 0;
    const rounded = Math.round(numeric * 100) / 100;
    return `${rounded > 0 ? '+' : ''}${rounded.toFixed(2)}`;
  };

  const getFrequencyInfo = (freq) => {
    if (freq < 100) return { name: 'Sub-bass', color: '#EF4444', icon: Drum };
    if (freq < 250) return { name: 'Bass', color: '#F59E0B', icon: Drum };
    if (freq < 500) return { name: 'Low-mid', color: '#FDE047', icon: Radio };
    if (freq < 2000) return { name: 'Mid', color: '#10B981', icon: Mic2 };
    if (freq < 6000) return { name: 'High-mid', color: '#3B82F6', icon: Piano };
    if (freq < 10000) return { name: 'High', color: '#8B5CF6', icon: Guitar };
    return { name: 'Air', color: '#EC4899', icon: Sparkles };
  };

  const info = getFrequencyInfo(frequency);
  const Icon = info.icon;

  const handleInteraction = useCallback((clientY, rect) => {
    const percentage = 1 - ((clientY - rect.top) / rect.height);
    const newGain = Math.max(-12, Math.min(12, (percentage - 0.5) * 24));
    const roundedGain = Math.round(newGain * 10) / 10;
    onChange(index, roundedGain);
  }, [index, onChange]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent dragging the parent
    setIsDragging(true);
    onInteractionStart();
    const rect = sliderRef.current.getBoundingClientRect();
    handleInteraction(e.clientY, rect);

    const handleMouseMove = (e) => {
      handleInteraction(e.clientY, rect);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onInteractionEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent dragging the parent
    setIsDragging(true);
    onInteractionStart();
    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    handleInteraction(touch.clientY, rect);

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        handleInteraction(e.touches[0].clientY, rect);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      onInteractionEnd();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col items-center gap-2">
      {/* Gain value */}
      <div className={`text-xs font-medium transition-all ${
        isDragging ? 'text-accent scale-110' : 'text-gray-400'
      }`}>
      {formatGainValue(gain)} dB
      </div>

      {/* Slider */}
      <div
      ref={sliderRef}
      className={`relative w-14 h-40 rounded-xl bg-white/5 border border-white/10 shadow-inner overflow-hidden transition-all backdrop-blur-sm ${
        isDragging ? 'ring-2 ring-accent/70 scale-105 shadow-[0_15px_35px_rgba(0,0,0,0.45)]' : ''
      }`}
      onTouchStart={handleTouchStart}
      >
      {/* Zero line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/15" />

      {/* Compare indicator */}
      {compareGain !== undefined && compareGain !== gain && (
        <div
        className="absolute left-1 right-1 bg-white/15 rounded"
        style={{
          height: `${Math.abs(compareGain) / 24 * 100}%`,
                                                             bottom: compareGain >= 0 ? '50%' : 'auto',
                                                             top: compareGain < 0 ? '50%' : 'auto',
        }}
        />
      )}

      {/* Suggestion indicator */}
      {suggestion && Math.abs(suggestion) > 0.1 && (
        <div
        className="absolute left-1 right-1 bg-accent/25 rounded"
        style={{
          height: `${Math.abs(suggestion) / 24 * 100}%`,
                                                    bottom: suggestion >= 0 ? '50%' : 'auto',
                                                    top: suggestion < 0 ? '50%' : 'auto',
        }}
        />
      )}

      {/* Current gain */}
      <div
      className="absolute left-1 right-1 rounded transition-all shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
      style={{
        backgroundColor: info.color,
        height: `${Math.abs(gain) / 24 * 100}%`,
            bottom: gain >= 0 ? '50%' : 'auto',
            top: gain < 0 ? '50%' : 'auto',
      }}
      />

      {/* Handle */}
      {isDragging && (
        <div
        className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white shadow-lg"
        style={{
          backgroundColor: info.color,
          bottom: gain >= 0
          ? `calc(50% + ${(gain / 24) * 100}% - 16px)`
          : `calc(50% - ${Math.abs(gain / 24) * 100}% - 16px)`,
        }}
        />
      )}
      </div>

      {/* Frequency label */}
      <div className="text-xs text-gray-400 font-medium tracking-wide">
      {formatFrequency(frequency)}
      </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="group flex flex-col items-center gap-3">
    {/* Icon and info */}
    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Icon size={16} style={{ color: info.color }} />
    <span className="text-xs text-gray-500">{info.name}</span>
    </div>

    {/* Gain value */}
    <motion.div
    className={`text-sm font-medium transition-all ${
      isDragging ? 'text-accent scale-110' : darkMode ? 'text-gray-300' : 'text-gray-600'
    }`}
    animate={{ scale: isDragging ? 1.1 : 1 }}
    >
    {formatGainValue(gain)} dB
    </motion.div>

    {/* Slider */}
    <div
    ref={sliderRef}
    className={`relative w-16 h-64 ${
      darkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'
    } rounded-2xl overflow-hidden transition-all cursor-pointer backdrop-blur-sm shadow-[0_18px_45px_rgba(0,0,0,0.45)] ${
      isDragging
      ? `ring-2 ${darkMode ? 'ring-accent/70' : 'ring-accent/60'} shadow-[0_20px_50px_rgba(0,0,0,0.55)] scale-105`
      : darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
    }`}
    onMouseDown={handleMouseDown}
    >
    {/* Grid lines */}
    <div className="absolute inset-0 pointer-events-none">
    <div className="absolute left-0 right-0 top-1/4 h-px bg-white/5" />
    <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
    <div className="absolute left-0 right-0 top-3/4 h-px bg-white/5" />
    </div>

    {/* Compare indicator */}
    {compareGain !== undefined && compareGain !== gain && (
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      className="absolute left-2 right-2 bg-white/20 rounded-lg"
      style={{
        height: `${Math.abs(compareGain) / 24 * 100}%`,
                                                           bottom: compareGain >= 0 ? '50%' : 'auto',
                                                           top: compareGain < 0 ? '50%' : 'auto',
      }}
      />
    )}

    {/* Suggestion indicator */}
    {suggestion && Math.abs(suggestion) > 0.1 && (
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      className="absolute left-2 right-2 bg-green-500/30 rounded-lg"
      style={{
        height: `${Math.abs(suggestion) / 24 * 100}%`,
                                                  bottom: suggestion >= 0 ? '50%' : 'auto',
                                                  top: suggestion < 0 ? '50%' : 'auto',
      }}
      />
    )}

    {/* Current gain */}
    <motion.div
    className="absolute left-2 right-2 rounded-lg shadow-lg transition-all"
    style={{
      background: `linear-gradient(to ${gain >= 0 ? 'top' : 'bottom'}, ${info.color}CC, ${info.color}FF)`,
    }}
    animate={{
      height: `${Math.abs(gain) / 24 * 100}%`,
          bottom: gain >= 0 ? '50%' : 'auto',
          top: gain < 0 ? '50%' : 'auto',
    }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />

    {/* Handle */}
    <AnimatePresence>
    {(isDragging || isActive) && (
      <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-white shadow-2xl flex items-center justify-center"
      style={{
        backgroundColor: info.color,
        bottom: gain >= 0
        ? `calc(50% + ${(gain / 24) * 100}% - 20px)`
        : `calc(50% - ${Math.abs(gain / 24) * 100}% - 20px)`,
      }}
      >
      <div className="w-3 h-3 bg-white rounded-full" />
      </motion.div>
    )}
    </AnimatePresence>
    </div>

    {/* Frequency label */}
    <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
    {formatFrequency(frequency)}
    </div>
    </div>
  );
};

// Main EQPopup Component
const EQPopup = ({ showEQ, setShowEQ, isMobile = false }) => {
  const {
    toggleEqMode,
    setEqGain,
    setAdvancedEqGain,
    resetEq,
    applyEqPreset,
    toggleEqSmart,
    setEqSmartSettings,
    setBassTone,
    requestMicrophoneAccess,
    frequencyBands,
  } = useAudio();
  const eqMode = useEqMode();
  const eqSmartEnabled = useEqSmartEnabled();
  const eqSmartSettings = useEqSmartSettings();
  const bassTone = useBassTone();
  const micStatus = useMicStatus();
  const micLevel = useMicLevel();
  const ambientSnapshot = useAmbientSnapshot();
  const currentTrack = useCurrentTrack();

  // Use custom hook
  const {
    isAdvanced,
    freqList,
    currentGains,
    currentPresets,
    customPresets,
    compareMode,
    setCompareMode,
    compareGains,
    setCompareGains,
    canUndo,
    canRedo,
    undo,
    redo,
    addToHistory,
    saveCustomPreset,
  } = useEQManager();

  // State
  const [notification, setNotification] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [activeTab, setActiveTab] = useState('equalizer');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeBand, setActiveBand] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Refs
  const modalRef = useRef(null);
  const eqContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Update container width for responsive layout
  useEffect(() => {
    if (eqContainerRef.current && showEQ) {
      const updateWidth = () => {
        setContainerWidth(eqContainerRef.current.offsetWidth);
      };

      updateWidth();
      window.addEventListener('resize', updateWidth);

      return () => {
        window.removeEventListener('resize', updateWidth);
      };
    }
  }, [showEQ, isAdvanced]);

  // Calculate band width based on container and number of bands
  const bandWidth = useMemo(() => {
    if (containerWidth === 0) return isMobile ? 60 : 80;

    const padding = isMobile ? 32 : 48; // Account for container padding
    const gap = isMobile ? 12 : 16; // Gap between bands
    const minWidth = isMobile ? 60 : 80; // Minimum width for bands

    // For advanced mode, adjust band width based on number of bands
    if (isAdvanced) {
      const availableWidth = containerWidth - padding;
      const calculatedWidth = (availableWidth - (gap * (freqList.length - 1))) / freqList.length;
      return Math.max(calculatedWidth, minWidth);
    }

    return minWidth; // Standard mode always uses fixed width
  }, [containerWidth, freqList.length, isAdvanced, isMobile]);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle gain change
  const handleGainChange = useCallback((index, value) => {
    if (isAdvanced) {
      setAdvancedEqGain(index, value);
    } else {
      setEqGain(index, value);
    }
  }, [isAdvanced, setAdvancedEqGain, setEqGain]);

  const handleSmartSettingChange = useCallback((key, value) => {
    setEqSmartSettings(prev => ({ ...prev, [key]: value }));
  }, [setEqSmartSettings]);

  const handleBassToneChange = useCallback((value) => {
    setBassTone(value);
  }, [setBassTone]);

  const ambientBands = useMemo(() => {
    if (!ambientSnapshot?.bands || !frequencyBands) return null;

    return ambientSnapshot.bands.map((level, idx) => ({
      label: frequencyBands[idx]?.name || `Band ${idx + 1}`,
      value: level,
    }));
  }, [ambientSnapshot, frequencyBands]);

  const ambientStatus = useMemo(() => {
    if (!ambientSnapshot) return null;
    if (ambientSnapshot.overall > 0.7) return { label: 'Loud room', tone: 'text-red-300' };
    if (ambientSnapshot.overall > 0.4) return { label: 'Moderate room noise', tone: 'text-yellow-200' };
    return { label: 'Quiet room', tone: 'text-green-200' };
  }, [ambientSnapshot]);

  const handleToggleEqSmart = useCallback(() => {
    const willEnable = !eqSmartEnabled;
    toggleEqSmart();
    if (willEnable) {
      requestMicrophoneAccess();
    }
  }, [eqSmartEnabled, toggleEqSmart, requestMicrophoneAccess]);

  const micStatusLabel = useMemo(() => {
    if (!eqSmartEnabled) return 'Microphone is idle until EQSmart is on.';
    switch (micStatus) {
      case 'active':
        return 'Listening via microphone to tune around your room.';
      case 'prompt':
        return 'Allow microphone access so EQSmart can listen.';
      case 'denied':
        return 'Microphone blocked in browser settings.';
      case 'unavailable':
        return 'Microphone unavailable on this device.';
      case 'error':
        return 'Microphone error - try again.';
      default:
        return 'Microphone not started yet.';
    }
  }, [micStatus, eqSmartEnabled]);

  // Handle preset apply
  const handleApplyPreset = useCallback((preset) => {
    if (compareMode) {
      setCompareGains([...currentGains]);
    }
    applyEqPreset(preset);
    setSelectedPreset(preset.id);
    showNotification(`Applied "${preset.name}" preset`);
  }, [applyEqPreset, compareMode, currentGains, setCompareGains, showNotification]);

  // Handle reset
  const handleReset = useCallback(() => {
    resetEq(eqMode);
    setSelectedPreset(null);
    showNotification('EQ reset to flat');
    addToHistory(Array(freqList.length).fill(0));
  }, [eqMode, resetEq, showNotification, addToHistory, freqList.length]);

  // Export settings
  const handleExport = useCallback(() => {
    const settings = {
      version: '2.0',
      mode: eqMode,
      gains: currentGains,
      preset: selectedPreset,
      customPresets,
      timestamp: new Date().toISOString(),
                                   track: currentTrack ? {
                                     title: currentTrack.title,
                                     artist: currentTrack.artist,
                                   } : null,
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `beatfly-eq-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('Settings exported successfully');
  }, [eqMode, currentGains, selectedPreset, customPresets, currentTrack, showNotification]);

  // Import settings
  const handleImport = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);

        if (settings.gains && Array.isArray(settings.gains)) {
          settings.gains.forEach((gain, i) => {
            if (i < freqList.length) {
              handleGainChange(i, gain);
            }
          });

          if (settings.customPresets) {
            settings.customPresets.forEach(preset => saveCustomPreset(preset.name));
          }

          showNotification('Settings imported successfully');
          addToHistory(settings.gains);
        }
      } catch (error) {
        showNotification('Failed to import settings', 'error');
      }
    };
    reader.readAsText(file);
  }, [freqList.length, handleGainChange, saveCustomPreset, showNotification, addToHistory]);

  // Toggle compare mode
  const handleToggleCompare = useCallback(() => {
    if (compareMode) {
      setCompareMode(false);
      setCompareGains(null);
    } else {
      setCompareMode(true);
      setCompareGains([...currentGains]);
    }
  }, [compareMode, currentGains, setCompareMode, setCompareGains]);

  // Save custom preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      showNotification('Please enter a preset name', 'error');
      return;
    }

    saveCustomPreset(presetName);
    setShowPresetModal(false);
    setPresetName('');
    showNotification(`Saved preset "${presetName}"`);
  }, [presetName, saveCustomPreset, showNotification]);

  // Calculate frequency analysis
  const frequencyAnalysis = useMemo(() => {
    if (!currentGains || currentGains.length === 0) {
      return { bass: 0, mid: 0, treble: 0, overall: 0 };
    }

    const third = Math.floor(currentGains.length / 3);
    const bass = currentGains.slice(0, third).reduce((a, b) => a + b, 0) / third;
    const mid = currentGains.slice(third, third * 2).reduce((a, b) => a + b, 0) / third;
    const treble = currentGains.slice(third * 2).reduce((a, b) => a + b, 0) / (currentGains.length - third * 2);
    const overall = currentGains.reduce((a, b) => a + b, 0) / currentGains.length;

    return { bass, mid, treble, overall };
  }, [currentGains]);

  // Mobile tabs
  const mobileTabs = [
    { id: 'equalizer', label: 'EQ', icon: Sliders },
    { id: 'presets', label: 'Presets', icon: Headphones },
    { id: 'smart', label: 'Smart', icon: Sparkles },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  ];

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <AnimatePresence>
      {showEQ && (
        <motion.div
        className="fixed inset-0 z-50 bg-gradient-to-b from-[#0c0b10] via-[#0a0a0f] to-black text-white overflow-hidden"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(233,30,99,0.25), transparent 25%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 22%)'
        }} />

        <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-[0_12px_30px_rgba(233,30,99,0.32)]">
        <Sliders size={20} className="text-white" />
        </div>
        <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Beatfly EQ</h2>
        {currentTrack && (
          <p className="text-xs text-gray-300/90 flex items-center gap-1">
          <Music size={10} className="text-accent" />
          {currentTrack.title}
          </p>
        )}
        </div>
        </div>
        <button
        onClick={() => setShowEQ(false)}
        className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-accent/50 transition-all"
        >
        <X size={20} className="text-gray-200" />
        </button>
        </div>

        {/* Notification */}
        <AnimatePresence>
        {notification && (
          <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`px-4 py-2 flex items-center gap-2 mx-4 mt-3 rounded-xl border ${
            notification.type === 'error'
            ? 'bg-red-500/10 text-red-300 border-red-500/30'
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          } shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}
          >
          {notification.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          <span className="text-xs">{notification.message}</span>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="px-4 pt-3">
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-semibold rounded-full transition-all ${
              activeTab === tab.id
              ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-[0_12px_32px_rgba(233,30,99,0.35)]'
              : 'text-gray-300 hover:text-white'
            }`}
            >
            <Icon size={20} />
            <span className="text-xs uppercase tracking-wide">{tab.label}</span>
            </button>
          );
        })}
        </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-4">
        <AnimatePresence mode="wait">
        {/* Equalizer Tab */}
        {activeTab === 'equalizer' && (
          <motion.div
          key="equalizer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
          >
          {/* Controls */}
          <div className="mb-6 space-y-3">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.4)]">
          <div>
          <span className="text-sm font-semibold text-white tracking-wide">
          {isAdvanced ? 'Advanced Mode' : 'Standard Mode'}
          </span>
          <p className="text-xs text-gray-300/90">
          {isAdvanced ? `${freqList.length} bands for surgical moves` : '5 bands for fast shaping'}
          </p>
          </div>
          <button
          onClick={toggleEqMode}
          className="relative w-14 h-7 bg-white/10 border border-white/15 rounded-full transition-all"
          >
          <motion.div
          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-r from-accent to-accent-dark shadow-md"
          animate={{ x: isAdvanced ? 26 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
          </button>
          </div>

          {/* EQSmart */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
          <Sparkles size={18} className="text-accent" />
          </div>
          <div>
          <span className="text-sm font-semibold text-white">EQSmart</span>
          <p className="text-xs text-gray-300/90">AI assisted shaping</p>
          </div>
          </div>
          <button
          onClick={handleToggleEqSmart}
          className={`relative w-14 h-7 rounded-full transition-all border ${
            eqSmartEnabled ? 'bg-accent/80 border-accent/60 shadow-lg shadow-[0_12px_32px_rgba(233,30,99,0.35)]' : 'bg-white/10 border-white/15'
          }`}
          >
          <motion.div
          className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm"
          animate={{ x: eqSmartEnabled ? 26 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
          </button>
          </div>

          {eqSmartEnabled && micStatus !== 'active' && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <Mic2 size={16} className="text-amber-200" />
            <div className="flex-1">
            <p className="text-sm font-semibold text-amber-100">Enable microphone for EQSmart</p>
            <p className="text-xs text-amber-50/80">{micStatusLabel}</p>
            </div>
            <button
            onClick={requestMicrophoneAccess}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-300 text-gray-900 rounded-lg hover:bg-amber-200"
            >
            Enable
            </button>
            </div>
          )}
          </div>

          {/* EQ Sliders */}
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
          <div>
          <span className="text-sm font-semibold text-white">Frequency Bands</span>
          <p className="text-[11px] text-gray-400">Tap and drag to sculpt your curve</p>
          </div>
          <div className="flex gap-2">
          <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-300 disabled:opacity-40"
          >
          <RotateCcw size={16} className="rotate-180" />
          </button>
          <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-300 disabled:opacity-40"
          >
          <RotateCcw size={16} />
          </button>
          </div>
          </div>

          <div className="relative" ref={eqContainerRef}>
          <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar"
          style={{
            width: '100%',
            overflowX: isAdvanced ? 'auto' : 'visible',
            justifyContent: isAdvanced ? 'flex-start' : 'space-between'
          }}
          >
          {freqList.map((freq, index) => (
            <FrequencyBand
            key={`${freq}-${index}`}
            frequency={freq}
            gain={currentGains[index] || 0}
            index={index}
            onChange={handleGainChange}
            onInteractionStart={() => setActiveBand(index)}
            onInteractionEnd={() => {
              setActiveBand(null);
              addToHistory(currentGains);
            }}
            isActive={activeBand === index}
            compareGain={compareGains?.[index]}
            isMobile={true}
            darkMode={true}
            />
          ))}
          </div>
          </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
          <button
          onClick={handleReset}
          className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-accent/50 transition-all"
          >
          <RotateCcw size={16} />
          Reset
          </button>
          <button
          onClick={handleToggleCompare}
          className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border ${
            compareMode ? 'bg-accent text-white border-accent/70 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]' : 'bg-white/5 border-white/10'
          }`}
          >
          <Activity size={16} />
          Compare
          </button>
          </div>

          {/* Bass macro */}
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between text-sm text-white mb-1">
          <span className="font-semibold">Bass adjust</span>
          <span className="text-gray-300">{bassTone >= 0 ? '+' : ''}{bassTone.toFixed(1)} dB</span>
          </div>
          <input
          type="range"
          min="-6"
          max="6"
          step="0.1"
          value={bassTone}
          onChange={(e) => handleBassToneChange(parseFloat(e.target.value))}
          className="w-full accent-accent"
          />
          <p className="text-[11px] text-gray-400 mt-1">Push or tame low end without moving each band.</p>
          </div>
          </motion.div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <motion.div
          key="presets"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
          >
          {/* Save preset button */}
          <button
          onClick={() => setShowPresetModal(true)}
          className="w-full py-3 mb-2 bg-gradient-to-r from-accent to-accent-dark text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[0_12px_32px_rgba(233,30,99,0.35)]"
          >
          <Save size={16} />
          Save Current Settings
          </button>

          {/* Built-in presets */}
          <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Built-in Presets</h3>
          <div className="grid grid-cols-2 gap-2">
          {currentPresets.map((preset) => (
            <button
            key={preset.id}
            onClick={() => handleApplyPreset(preset)}
            className={`p-3 rounded-xl text-sm font-semibold transition-all border ${
              selectedPreset === preset.id
              ? 'bg-accent text-white border-accent/80 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
              : 'bg-white/5 border-white/10 text-gray-200 hover:border-accent/50'
            }`}
            >
            {preset.name}
            </button>
          ))}
          </div>
          </div>

          {/* Custom presets */}
          {customPresets.length > 0 && (
            <div>
            <h3 className="text-sm font-semibold text-white mb-3">Custom Presets</h3>
            <div className="grid grid-cols-2 gap-2">
            {customPresets.map((preset) => (
              <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`p-3 rounded-xl text-sm font-semibold transition-all border ${
                selectedPreset === preset.id
                ? 'bg-accent text-white border-accent/80 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
                : 'bg-white/5 border-white/10 text-gray-200 hover:border-accent/50'
              }`}
              >
              {preset.name}
              </button>
            ))}
            </div>
            </div>
          )}
          </motion.div>
        )}

        {/* Smart Tab */}
        {activeTab === 'smart' && (
          <motion.div
          key="smart"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
          >
          <div className="space-y-4">
          {/* EQSmart status */}
          <div className="rounded-2xl p-4 border border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-transparent backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 mb-3">
          <div className={`w-2 h-2 rounded-full ${
            eqSmartEnabled ? 'bg-accent animate-pulse' : 'bg-gray-500'
          }`} />
          <h3 className="font-semibold text-white">
          {eqSmartEnabled ? 'EQSmart is Active' : 'EQSmart is Inactive'}
          </h3>
          </div>
          <p className="text-sm text-gray-300/90">
        {eqSmartEnabled
          ? 'Analyzing your music and optimizing EQ settings in real-time for the best listening experience.'
        : 'Enable EQSmart to automatically optimize your EQ settings based on the music you\'re playing.'}
        </p>
        </div>

        {/* Fine tune EQSmart */}
        <div className="rounded-2xl p-4 border border-white/10 bg-white/5 backdrop-blur-xl space-y-3 shadow-[0_16px_45px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
        <span className="text-sm text-white font-semibold">AI Intensity</span>
        <span className="text-xs text-gray-300">{Math.round((eqSmartSettings.intensity || 1) * 100)}%</span>
        </div>
        <input
        type="range"
        min="0.6"
        max="1.5"
        step="0.05"
        value={eqSmartSettings.intensity || 1}
        onChange={(e) => handleSmartSettingChange('intensity', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between">
        <span className="text-sm text-white font-semibold">Bass Tilt</span>
        <span className="text-xs text-gray-300">
        {eqSmartSettings.bassTilt >= 0 ? '+' : ''}
        { (eqSmartSettings.bassTilt || 0).toFixed(1)} dB
        </span>
        </div>
        <input
        type="range"
        min="-6"
        max="6"
        step="0.1"
        value={eqSmartSettings.bassTilt || 0}
        onChange={(e) => handleSmartSettingChange('bassTilt', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between">
        <span className="text-sm text-white font-semibold">Treble Tilt</span>
        <span className="text-xs text-gray-300">
        {eqSmartSettings.trebleTilt >= 0 ? '+' : ''}
        { (eqSmartSettings.trebleTilt || 0).toFixed(1)} dB
        </span>
        </div>
        <input
        type="range"
        min="-6"
        max="6"
        step="0.1"
        value={eqSmartSettings.trebleTilt || 0}
        onChange={(e) => handleSmartSettingChange('trebleTilt', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between">
        <span className="text-sm text-white font-semibold">Safety Headroom</span>
        <span className="text-xs text-gray-300">{(eqSmartSettings.headroom || 0).toFixed(1)} dB</span>
        </div>
        <input
        type="range"
        min="0"
        max="12"
        step="0.5"
        value={eqSmartSettings.headroom || 0}
        onChange={(e) => handleSmartSettingChange('headroom', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between">
        <span className="text-sm text-white font-semibold">Mic influence</span>
        <span className="text-xs text-gray-300">
        {Math.round((eqSmartSettings.micBlend ?? 0.7) * 100)}%
        </span>
        </div>
        <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={eqSmartSettings.micBlend ?? 0.7}
        onChange={(e) => handleSmartSettingChange('micBlend', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <p className="text-[11px] text-gray-400">
        Raise headroom if you still hear clipping after boosts; lower it for louder playback.
        </p>
        </div>

        {/* RoomSense */}
        {ambientSnapshot && (
          <div className="bg-white/5 border border-blue-500/20 rounded-2xl p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
          <Waves size={14} className="text-blue-300" />
          <h4 className="text-sm font-semibold text-white">RoomSense</h4>
          </div>
          {ambientStatus && (
            <span className={`text-xs ${ambientStatus.tone}`}>{ambientStatus.label}</span>
          )}
          </div>
          <div className="relative h-36 flex items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <div
            key={ring}
            className="absolute rounded-full border border-blue-400/15"
            style={{
              width: `${80 + ring * 30}%`,
              height: `${80 + ring * 30}%`,
              opacity: 0.6 - ring * 0.15,
            }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center gap-2">
          {ambientSnapshot.bands.slice(0, 6).map((level, idx) => (
            <motion.div
            key={idx}
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 0.9 + level * 0.4, opacity: 0.4 + level * 0.6 }}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300"
            />
          ))}
          </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-300">
          <div>
          <p className="font-semibold text-white">Overall</p>
          <p>{(ambientSnapshot.overall || 0).toFixed(2)}</p>
          </div>
          <div>
          <p className="font-semibold text-white">Peak</p>
          <p>{(ambientSnapshot.peak || 0).toFixed(2)}</p>
          </div>
          <div>
          <p className="font-semibold text-white">Floor</p>
          <p>{(ambientSnapshot.floor || 0).toFixed(2)}</p>
          </div>
          </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xl">
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Zap size={14} className="text-accent" />
        Genre Detection
        </h4>
        <p className="text-xs text-gray-400">
        Automatically detects music genre and applies optimal EQ settings
        </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xl">
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Activity size={14} className="text-blue-400" />
        Real-time Analysis
        </h4>
        <p className="text-xs text-gray-400">
        Continuously analyzes audio and adjusts EQ for best quality
        </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xl">
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Gauge size={14} className="text-accent" />
        Hearing Protection
        </h4>
        <p className="text-xs text-gray-400">
        Prevents harsh frequencies and protects your hearing
        </p>
        </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
        <Mic2 size={16} className={micStatus === 'active' ? 'text-accent' : 'text-amber-300'} />
        <div>
        <h4 className="text-sm font-medium text-white">Microphone listening</h4>
        <p className="text-xs text-gray-400">{micStatusLabel}</p>
        </div>
        </div>
        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
        <div
        className={`h-full ${micStatus === 'active' ? 'bg-accent' : 'bg-gray-500'} transition-all`}
        style={{ width: `${Math.min(100, Math.max(8, micLevel * 100))}%` }}
        />
        </div>
        </div>
        {eqSmartEnabled && micStatus !== 'active' && (
          <button
          onClick={requestMicrophoneAccess}
          className="w-full mt-2 py-2 text-sm font-semibold rounded-lg bg-accent/20 text-white hover:bg-accent/30 border border-accent/30"
          >
          Allow microphone for EQSmart
          </button>
        )}
        </div>

        {/* Toggle button */}
        <button
        onClick={handleToggleEqSmart}
        className={`w-full py-3 rounded-2xl font-semibold transition-all border ${
          eqSmartEnabled
          ? 'bg-accent text-white border-accent/80 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
          : 'bg-white/5 text-gray-200 border-white/10'
        }`}
        >
        {eqSmartEnabled ? 'Disable EQSmart' : 'Enable EQSmart'}
        </button>
        </div>
        </motion.div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <motion.div
          key="analysis"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
          >
          <div className="space-y-4">
          {/* Overall analysis */}
          <div className="rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-semibold text-white mb-4">Frequency Analysis</h3>

          <div className="space-y-3">
          {/* Bass */}
          <div>
          <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Bass</span>
          <span className="text-xs font-semibold text-white">
          {frequencyAnalysis.bass > 0 ? '+' : ''}{frequencyAnalysis.bass.toFixed(1)} dB
          </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
          className="h-full bg-gradient-to-r from-accent to-orange-400 transition-all"
          style={{
            width: `${Math.max(0, Math.min(100, (frequencyAnalysis.bass + 12) / 24 * 100))}%`
          }}
          />
          </div>
          </div>

          {/* Mid */}
          <div>
          <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Mid</span>
          <span className="text-xs font-semibold text-white">
          {frequencyAnalysis.mid > 0 ? '+' : ''}{frequencyAnalysis.mid.toFixed(1)} dB
          </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
          style={{
            width: `${Math.max(0, Math.min(100, (frequencyAnalysis.mid + 12) / 24 * 100))}%`
          }}
          />
          </div>
          </div>

          {/* Treble */}
          <div>
          <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Treble</span>
          <span className="text-xs font-semibold text-white">
          {frequencyAnalysis.treble > 0 ? '+' : ''}{frequencyAnalysis.treble.toFixed(1)} dB
          </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
          style={{
            width: `${Math.max(0, Math.min(100, (frequencyAnalysis.treble + 12) / 24 * 100))}%`
          }}
          />
          </div>
          </div>

          {/* Overall */}
          <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-300">Overall</span>
          <span className="text-xs font-bold text-white">
          {frequencyAnalysis.overall > 0 ? '+' : ''}{frequencyAnalysis.overall.toFixed(1)} dB
          </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
          className="h-full bg-gradient-to-r from-accent to-accent-dark transition-all"
          style={{
            width: `${Math.max(0, Math.min(100, (frequencyAnalysis.overall + 12) / 24 * 100))}%`
          }}
          />
          </div>
          </div>
          </div>
          </div>

          {/* Export/Import */}
          <div className="grid grid-cols-2 gap-3">
          <button
          onClick={handleExport}
          className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-accent/50"
          >
          <Download size={16} />
          Export
          </button>
          <label className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer bg-white/5 border border-white/10 hover:border-accent/50">
          <Upload size={16} />
          Import
          <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          />
          </label>
          </div>
          </div>
          </motion.div>
        )}
        </AnimatePresence>
        </div>

        {/* Preset Modal */}
        <AnimatePresence>
        {showPresetModal && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowPresetModal(false)}
          >
          <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-[#131218] via-[#0f0e14] to-[#0b0b11] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-[0_22px_60px_rgba(0,0,0,0.6)]"
          onClick={(e) => e.stopPropagation()}
          >
          <h3 className="text-lg font-bold text-white mb-4">Save Preset</h3>
          <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Enter preset name"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 mb-4"
          autoFocus
          />
          <div className="flex gap-3">
          <button
          onClick={() => setShowPresetModal(false)}
          className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-gray-200 hover:border-accent/60 transition-all"
          >
          Cancel
          </button>
          <button
          onClick={handleSavePreset}
          className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-semibold shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]"
          >
          Save
          </button>
          </div>
          </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    );
  }

  // DESKTOP LAYOUT
  return (
    <AnimatePresence>
    {showEQ && (
      <>
      {/* Backdrop */}
      <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowEQ(false)}
      />

      {/* Modal */}
      <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      >
      <motion.div
      ref={modalRef}
      className={`relative rounded-3xl border ${darkMode ? 'border-white/10 bg-gradient-to-br from-[#0d0c12] via-[#0b0b10] to-[#08070c]' : 'border-gray-200 bg-white'} shadow-[0_30px_120px_rgba(0,0,0,0.55)] w-full max-w-6xl max-h-[90vh] overflow-hidden`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      >
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{
        background: 'radial-gradient(circle at 18% 20%, rgba(233,30,99,0.22), transparent 25%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.07), transparent 22%)'
      }} />

      {/* Header */}
      <div
      className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100'} px-8 py-6 flex items-center justify-between relative z-10 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}
      >
      <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]">
      <Sliders size={24} className="text-white" />
      </div>
      <div>
      <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      Beatfly Equalizer
      </h2>
      {currentTrack && (
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-2`}>
        <Music size={12} className="text-accent" />
        {currentTrack.title} • {currentTrack.artist}
        </p>
      )}
      </div>
      </div>
      <div className="flex items-center gap-2">
      <button
      onClick={() => setDarkMode(!darkMode)}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode ? 'border-white/10 bg-white/5 hover:border-accent/50' : 'border-gray-200 bg-white hover:border-accent/50'
      }`}
      >
      {darkMode ? <Sun size={20} className="text-gray-200" /> : <Moon size={20} className="text-gray-600" />}
      </button>
      <button
      onClick={() => setShowInfo(!showInfo)}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode ? 'border-white/10 bg-white/5 hover:border-accent/50' : 'border-gray-200 bg-white hover:border-accent/50'
      }`}
      >
      <Info size={20} className={darkMode ? 'text-gray-200' : 'text-gray-600'} />
      </button>
      <button
      onClick={() => setShowEQ(false)}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode ? 'border-white/10 bg-white/5 hover:border-accent/50' : 'border-gray-200 bg-white hover:border-accent/50'
      }`}
      >
      <X size={20} className={darkMode ? 'text-gray-200' : 'text-gray-600'} />
      </button>
      </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
      {notification && (
        <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
        >
        <div className={`px-6 py-3 flex items-center gap-2 border ${
          notification.type === 'error'
          ? 'bg-red-500/10 text-red-300 border-red-500/30'
          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        }`}>
        {notification.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
        <span className="text-sm">{notification.message}</span>
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Info Panel */}
      <AnimatePresence>
      {showInfo && (
        <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`px-8 py-5 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50'} border-b ${
          darkMode ? 'border-white/10' : 'border-gray-200'
        }`}
        >
        <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-start gap-3">
        <Sliders size={16} className="text-accent mt-0.5" />
        <div>
        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Drag sliders to adjust
        </p>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        Click and drag each frequency band up or down
        </p>
        </div>
        </div>
        <div className="flex items-start gap-3">
        <Headphones size={16} className="text-accent mt-0.5" />
        <div>
        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Use presets for quick setup
        </p>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        Select from genre-optimized presets
        </p>
        </div>
        </div>
        <div className="flex items-start gap-3">
        <Sparkles size={16} className="text-accent mt-0.5" />
        <div>
        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Enable EQSmart
        </p>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        Let AI optimize your EQ automatically
        </p>
        </div>
        </div>
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Controls Bar */}
      <div className={`px-8 py-4 ${darkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-between border-b ${
        darkMode ? 'border-white/10' : 'border-gray-200'
      }`}>
      <div className="flex items-center gap-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-3">
      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mode:</span>
      <button
      onClick={toggleEqMode}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
        darkMode ? 'bg-white/5 border-white/10 hover:border-accent/50' : 'bg-white border-gray-200 hover:border-accent/50'
      }`}
      >
      <Gauge size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
      <span className="text-sm font-medium">
      {isAdvanced ? 'Advanced' : 'Standard'}
      </span>
      </button>
      </div>

      {/* EQSmart Toggle */}
      <div className="flex items-center gap-3">
      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>EQSmart:</span>
      <button
      onClick={handleToggleEqSmart}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${
        eqSmartEnabled
        ? 'bg-accent/15 text-white border-accent/60 shadow-md shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
        : darkMode
        ? 'bg-white/5 text-gray-300 border-white/10 hover:border-accent/50'
        : 'bg-white text-gray-700 border-gray-200 hover:border-accent/50'
      }`}
      >
      <Sparkles size={16} />
      <span className="text-sm font-medium">
      {eqSmartEnabled ? 'Active' : 'Inactive'}
      </span>
      </button>
      </div>

      {/* Compare Mode */}
      <button
      onClick={handleToggleCompare}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${
        compareMode
        ? 'bg-accent/20 text-white border-accent/70 shadow-md shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
        : darkMode
        ? 'bg-white/5 text-gray-300 border-white/10 hover:border-accent/50'
        : 'bg-white text-gray-700 border-gray-200 hover:border-accent/50'
      }`}
      >
      <Activity size={16} />
      <span className="text-sm font-medium">Compare</span>
      </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
      <button
      onClick={undo}
      disabled={!canUndo}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode
        ? 'text-gray-300 border-white/10 hover:text-white hover:border-accent/50 disabled:opacity-30'
        : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:border-accent/50 disabled:opacity-30'
      }`}
      title="Undo"
      >
      <RotateCcw size={18} className="rotate-180" />
      </button>
      <button
      onClick={redo}
      disabled={!canRedo}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode
        ? 'text-gray-300 border-white/10 hover:text-white hover:border-accent/50 disabled:opacity-30'
        : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:border-accent/50 disabled:opacity-30'
      }`}
      title="Redo"
      >
      <RotateCcw size={18} />
      </button>
      <button
      onClick={handleExport}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode
        ? 'text-gray-300 border-white/10 hover:text-white hover:border-accent/50'
        : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:border-accent/50'
      }`}
      title="Export"
      >
      <Download size={18} />
      </button>
      <label className={`p-2 rounded-xl border transition-colors cursor-pointer ${
        darkMode
        ? 'text-gray-300 border-white/10 hover:text-white hover:border-accent/50'
        : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:border-accent/50'
      }`}>
      <Upload size={18} />
      <input
      type="file"
      accept=".json"
      onChange={handleImport}
      className="hidden"
      />
      </label>
      <button
      onClick={handleReset}
      className={`p-2 rounded-xl border transition-colors ${
        darkMode
        ? 'text-gray-300 border-white/10 hover:text-white hover:border-accent/50'
        : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:border-accent/50'
      }`}
      title="Reset"
      >
      <RotateCcw size={18} />
      </button>
      </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[62vh]">
      {/* Left Panel - EQ Sliders */}
      <div className="flex-1 p-8 overflow-x-auto space-y-6">
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-5 border shadow-[0_18px_55px_rgba(0,0,0,0.4)]`}>
      <div className="flex items-center justify-between mb-4">
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      Frequency Bands
      </h3>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/40">
      {isAdvanced ? `${freqList.length}-Band Advanced` : '5-Band Classic'}
      </div>
      </div>

      {/* dB scale */}
      <div className="mb-4">
      <div className="relative h-8 flex items-center justify-between px-4 text-[11px] uppercase tracking-wide">
      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>+12 dB</span>
      <div className={`flex-1 mx-4 h-px ${darkMode ? 'bg-white/10' : 'bg-gray-300'}`} />
      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Flat</span>
      <div className={`flex-1 mx-4 h-px ${darkMode ? 'bg-white/10' : 'bg-gray-300'}`} />
      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>-12 dB</span>
      </div>
      </div>

      {/* EQ Bands */}
      <div
      ref={eqContainerRef}
      className="flex justify-center"
      style={{
        overflowX: isAdvanced ? 'auto' : 'hidden',
        paddingBottom: '8px'
      }}
      >
      <div
      className="flex gap-4"
      style={{
        minWidth: isAdvanced ? 'max-content' : '100%',
        justifyContent: isAdvanced ? 'flex-start' : 'space-between'
      }}
      >
      {freqList.map((freq, index) => (
        <FrequencyBand
        key={`${freq}-${index}`}
        frequency={freq}
        gain={currentGains[index] || 0}
        index={index}
        onChange={handleGainChange}
        onInteractionStart={() => setActiveBand(index)}
        onInteractionEnd={() => {
          setActiveBand(null);
          addToHistory(currentGains);
        }}
        isActive={activeBand === index}
        compareGain={compareGains?.[index]}
        darkMode={darkMode}
        />
      ))}
      </div>
      </div>
      </div>

      {/* Frequency Analysis */}
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} rounded-2xl p-5 border`}>
      <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
      Frequency Analysis
      </h4>
      <div className="grid grid-cols-4 gap-4">
      <div>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Bass</p>
      <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
      <div
      className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
      style={{
        width: `${Math.max(0, Math.min(100, (frequencyAnalysis.bass + 12) / 24 * 100))}%`
      }}
      />
      </div>
      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {frequencyAnalysis.bass > 0 ? '+' : ''}{frequencyAnalysis.bass.toFixed(1)}
      </span>
      </div>
      </div>
      <div>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Mid</p>
      <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
      <div
      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
      style={{
        width: `${Math.max(0, Math.min(100, (frequencyAnalysis.mid + 12) / 24 * 100))}%`
      }}
      />
      </div>
      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {frequencyAnalysis.mid > 0 ? '+' : ''}{frequencyAnalysis.mid.toFixed(1)}
      </span>
      </div>
      </div>
      <div>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Treble</p>
      <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
      <div
      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
      style={{
        width: `${Math.max(0, Math.min(100, (frequencyAnalysis.treble + 12) / 24 * 100))}%`
      }}
      />
      </div>
      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {frequencyAnalysis.treble > 0 ? '+' : ''}{frequencyAnalysis.treble.toFixed(1)}
      </span>
      </div>
      </div>
      <div>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Overall</p>
      <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
      <div
      className="h-full bg-gradient-to-r from-accent to-accent-dark transition-all"
      style={{
        width: `${Math.max(0, Math.min(100, (frequencyAnalysis.overall + 12) / 24 * 100))}%`
      }}
      />
      </div>
      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {frequencyAnalysis.overall > 0 ? '+' : ''}{frequencyAnalysis.overall.toFixed(1)}
      </span>
      </div>
      </div>
      </div>
      </div>
      </div>

      {/* Right Panel - Presets & Settings */}
      <div className={`w-80 ${darkMode ? 'bg-white/5' : 'bg-gray-50'} border-l ${
        darkMode ? 'border-white/10' : 'border-gray-200'
      } p-6 overflow-y-auto`}>
      {/* Save Preset */}
      <div className="mb-6">
      <button
      onClick={() => setShowPresetModal(true)}
      className="w-full py-3 bg-gradient-to-r from-accent to-accent-dark text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg shadow-[0_12px_32px_rgba(233,30,99,0.35)] transition-shadow"
      >
      <Save size={18} />
      Save Current Settings
      </button>
      </div>

      {/* Built-in Presets */}
      <div className="mb-6">
      <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
      Built-in Presets
      </h4>
      <div className="grid grid-cols-2 gap-2">
      {currentPresets.map((preset) => (
        <button
        key={preset.id}
        onClick={() => handleApplyPreset(preset)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
          selectedPreset === preset.id
          ? 'bg-accent text-white border-accent/80 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
          : darkMode
          ? 'bg-white/5 hover:border-accent/50 border-white/10 text-gray-200'
          : 'bg-white hover:border-accent/50 border-gray-200 text-gray-700'
        }`}
        >
        {preset.name}
        </button>
      ))}
      </div>
      </div>

      {/* Custom Presets */}
      {customPresets.length > 0 && (
        <div className="mb-6">
        <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
        Custom Presets
        </h4>
        <div className="grid grid-cols-2 gap-2">
        {customPresets.map((preset) => (
          <button
          key={preset.id}
          onClick={() => handleApplyPreset(preset)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            selectedPreset === preset.id
            ? 'bg-accent text-white border-accent/80 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
            : darkMode
            ? 'bg-white/5 hover:border-accent/50 border-white/10 text-gray-200'
            : 'bg-white hover:border-accent/50 border-gray-200 text-gray-700'
          }`}
          >
          {preset.name}
          </button>
        ))}
        </div>
        </div>
      )}

      {/* EQSmart Settings */}
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 mb-6 space-y-3 border shadow-[0_18px_50px_rgba(0,0,0,0.35)]`}>
      <div className="flex items-center justify-between">
      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      EQSmart
      </h4>
      <div className={`w-2 h-2 rounded-full ${
        eqSmartEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
      }`} />
      </div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      {eqSmartEnabled
        ? 'AI is analyzing your music and optimizing EQ settings in real-time.'
        : 'Enable AI-powered automatic EQ optimization.'}
      </p>
      <div className="flex items-center justify-between">
      <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      <Mic2 size={14} className={micStatus === 'active' ? 'text-accent' : 'text-amber-400'} />
      <span>{micStatusLabel}</span>
      </div>
      {eqSmartEnabled && micStatus !== 'active' && (
        <button
        onClick={requestMicrophoneAccess}
        className="text-[11px] font-semibold px-2 py-1 rounded-md bg-accent/20 text-white border border-accent/40 hover:bg-accent/30"
        >
        Enable mic
        </button>
      )}
      </div>
      <button
      onClick={handleToggleEqSmart}
      className={`w-full py-2 rounded-xl text-sm font-semibold transition-all border ${
        eqSmartEnabled
        ? 'bg-accent text-white border-accent/80 shadow-lg shadow-[0_10px_28px_rgba(233,30,99,0.25)]'
        : darkMode
          ? 'bg-white/5 text-gray-200 border-white/10 hover:border-accent/50'
          : 'bg-white text-gray-700 border-gray-200 hover:border-accent/50'
        }`}
        >
        {eqSmartEnabled ? 'Disable EQSmart' : 'Enable EQSmart'}
        </button>

        <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>AI Intensity</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        {Math.round((eqSmartSettings.intensity || 1) * 100)}%
        </span>
        </div>
        <input
        type="range"
        min="0.6"
        max="1.5"
        step="0.05"
        value={eqSmartSettings.intensity || 1}
        onChange={(e) => handleSmartSettingChange('intensity', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Bass Tilt</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        {eqSmartSettings.bassTilt >= 0 ? '+' : ''}{(eqSmartSettings.bassTilt || 0).toFixed(1)} dB
        </span>
        </div>
        <input
        type="range"
        min="-6"
        max="6"
        step="0.1"
        value={eqSmartSettings.bassTilt || 0}
        onChange={(e) => handleSmartSettingChange('bassTilt', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Treble Tilt</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        {eqSmartSettings.trebleTilt >= 0 ? '+' : ''}{(eqSmartSettings.trebleTilt || 0).toFixed(1)} dB
        </span>
        </div>
        <input
        type="range"
        min="-6"
        max="6"
        step="0.1"
        value={eqSmartSettings.trebleTilt || 0}
        onChange={(e) => handleSmartSettingChange('trebleTilt', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Safety Headroom</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        {(eqSmartSettings.headroom || 0).toFixed(1)} dB
        </span>
        </div>
        <input
        type="range"
        min="0"
        max="12"
        step="0.5"
        value={eqSmartSettings.headroom || 0}
        onChange={(e) => handleSmartSettingChange('headroom', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mic influence</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        {Math.round((eqSmartSettings.micBlend ?? 0.7) * 100)}%
        </span>
        </div>
        <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={eqSmartSettings.micBlend ?? 0.7}
        onChange={(e) => handleSmartSettingChange('micBlend', parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <p className="text-[11px] leading-snug text-gray-500">
        Increase headroom if you push multiple bands or hear distortion; lower for a hotter signal.
        </p>
        </div>

        {ambientSnapshot && (
          <div className="mt-4 p-3 rounded-lg border border-blue-500/20 bg-white/5">
          <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
          <Waves size={14} className="text-blue-300" />
          <span className="text-sm font-semibold text-white">RoomSense</span>
          </div>
          {ambientStatus && (
            <span className={`text-xs ${ambientStatus.tone}`}>{ambientStatus.label}</span>
          )}
          </div>
          <div className="relative h-32 flex items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <div
            key={ring}
            className="absolute rounded-full border border-blue-400/15"
            style={{
              width: `${75 + ring * 28}%`,
              height: `${75 + ring * 28}%`,
              opacity: 0.6 - ring * 0.15,
            }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center gap-2">
          {ambientSnapshot.bands.slice(0, 6).map((level, idx) => (
            <motion.div
            key={idx}
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 0.9 + level * 0.4, opacity: 0.4 + level * 0.6 }}
            className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300"
            />
          ))}
          </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-300">
          <div>
          <p className="font-semibold text-white">Overall</p>
          <p>{(ambientSnapshot.overall || 0).toFixed(2)}</p>
          </div>
          <div>
          <p className="font-semibold text-white">Peak</p>
          <p>{(ambientSnapshot.peak || 0).toFixed(2)}</p>
          </div>
          <div>
          <p className="font-semibold text-white">Floor</p>
          <p>{(ambientSnapshot.floor || 0).toFixed(2)}</p>
          </div>
          </div>
          </div>
        )}

        <div className="p-3 rounded-lg border border-dashed border-accent/40 bg-accent/5">
        <div className="flex items-center justify-between text-sm">
        <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Bass adjust</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        {bassTone >= 0 ? '+' : ''}{bassTone.toFixed(1)} dB
        </span>
        </div>
        <input
        type="range"
        min="-6"
        max="6"
        step="0.1"
        value={bassTone}
        onChange={(e) => handleBassToneChange(parseFloat(e.target.value))}
        className="w-full accent-accent"
        />
        <p className="text-[11px] text-gray-500 mt-1">One-knob bass lift or cut across low bands.</p>
        </div>
      </div>

    {/* Quick Tips */}
    <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 border shadow-[0_12px_35px_rgba(0,0,0,0.25)]`}>
    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
    Quick Tips
    </h4>
    <ul className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
    <li className="flex items-start gap-2">
    <span className="text-purple-500">•</span>
    <span>Boost 60-250 Hz for more bass impact</span>
    </li>
    <li className="flex items-start gap-2">
    <span className="text-green-500">•</span>
    <span>Adjust 1-4 kHz for vocal clarity</span>
    </li>
    <li className="flex items-start gap-2">
    <span className="text-blue-500">•</span>
    <span>Enhance 8-16 kHz for air and sparkle</span>
    </li>
    <li className="flex items-start gap-2">
    <span className="text-pink-500">•</span>
    <span>Use compare mode to A/B test changes</span>
    </li>
    </ul>
    </div>
    </div>
    </div>
    </motion.div>
    </motion.div>

    {/* Preset Save Modal */}
    <AnimatePresence>
    {showPresetModal && (
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={() => setShowPresetModal(false)}
      >
      <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`${darkMode ? 'bg-gradient-to-br from-[#131218] via-[#0f0e14] to-[#0b0b11] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 w-full max-w-md shadow-[0_25px_80px_rgba(0,0,0,0.6)]`}
      onClick={(e) => e.stopPropagation()}
      >
      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
      Save Custom Preset
      </h3>
      <input
      type="text"
      value={presetName}
      onChange={(e) => setPresetName(e.target.value)}
      placeholder="Enter preset name"
      className={`w-full px-4 py-3 rounded-xl mb-4 border ${
        darkMode
        ? 'bg-white/5 text-white placeholder-gray-400 border-white/10'
        : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200'
      }`}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSavePreset();
        }
      }}
      />
      <div className="flex gap-3">
      <button
      onClick={() => {
        setShowPresetModal(false);
        setPresetName('');
      }}
      className={`flex-1 py-3 rounded-xl font-semibold transition-colors border ${
        darkMode
        ? 'bg-white/5 text-gray-200 border-white/10 hover:border-accent/50'
        : 'bg-white text-gray-700 border-gray-200 hover:border-accent/50'
      }`}
      >
      Cancel
      </button>
      <button
      onClick={handleSavePreset}
      className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-semibold hover:shadow-lg shadow-[0_12px_32px_rgba(233,30,99,0.35)] transition-shadow"
      >
      Save Preset
      </button>
      </div>
      </motion.div>
      </motion.div>
    )}
    </AnimatePresence>
    </>
    )}
    </AnimatePresence>
  );
};

export default EQPopup;
