import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Enhanced Audio Visualizer with 2D and pseudo-3D visualization modes
 */
const AudioVisualizer = ({
  audioContext,
  analyzerNode,
  type = 'bars',
  colors = {},
  style = {},
  settings = {},
  onVisualizationFrame = null,
  interactiveMode = false,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const visualizerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState(null);

  // Check if we're using a 3D visualization
  const is3D = useMemo(() => type.includes('3d'), [type]);

  // Default color schemes for visualizations
  const defaultColorSchemes = {
    // 2D Visualizations
    'none': ['transparent'],
    'bars': ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
    'wave': ['#10B981', '#3B82F6', '#8B5CF6'],
    'circular': ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],
    'particles': ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
    'spectrum': ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
    'galaxy': ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'],
    'dna': ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
    'pulse': ['#EF4444', '#F59E0B', '#FBBF24'],
    'grid': ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899'],
    'radial': ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],

    // 3D Visualizations
    'bars3d': ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
    'terrain3d': ['#00ff87', '#60efff', '#0061ff', '#2f0a43'],
    'sphere3d': ['#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B'],
    'waveform3d': ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
    'particles3d': ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
    'nebula3d': ['#ff0080', '#9500ff', '#00aaff', '#ffb900'],
    'spiral3d': ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
    'vortex3d': ['#FF5F6D', '#FFC371', '#00F0B5', '#4158D0'],
    'cube3d': ['#ff1f00', '#ff8700', '#ffd500', '#22bb33'],
    'equalizer3d': ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
    'tunnel3d': ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'],
    'audioscape3d': ['#6366F1', '#EC4899', '#10B981', '#3B82F6'],
    'galaxy3d': ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'],
  };

  // Get colors for the current visualization type
  const colorScheme = useMemo(() => {
    if (Array.isArray(colors)) {
      return colors;
    }
    return colors[type] || defaultColorSchemes[type] || defaultColorSchemes.bars;
  }, [colors, type]);

  // Update dimensions on resize
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current || canvasRef.current.parentElement;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      // Provide a sane minimum to avoid zero-sized canvases that render black
      const safeWidth = Math.max(width, 120);
      const safeHeight = Math.max(height, 120);
      setDimensions({ width: safeWidth, height: safeHeight });

      // Update visualization if it exists
      if (visualizerRef.current) {
        visualizerRef.current.updateDimensions(safeWidth, safeHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Initialize or update the visualizer when parameters change
  useEffect(() => {
    try {
      if (!canvasRef.current || !analyzerNode) return;

      // Clear any previous error
      setError(null);

      // Cleanup previous visualizer
      const cleanup = () => {
        if (visualizerRef.current) {
          visualizerRef.current.destroy();
          visualizerRef.current = null;
        }

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };

      cleanup();

      // Create a new visualizer
      const createVisualizer = () => {
        let Visualizer;

        // Select the appropriate visualizer class
        if (is3D) {
          switch (type) {
            case 'bars3d':
              Visualizer = new Bars3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'sphere3d':
              Visualizer = new Sphere3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'particles3d':
              Visualizer = new Particles3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'waveform3d':
              Visualizer = new Waveform3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'terrain3d':
              Visualizer = new Terrain3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'nebula3d':
              Visualizer = new Nebula3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'spiral3d':
              Visualizer = new Spiral3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'vortex3d':
              Visualizer = new Vortex3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'cube3d':
              Visualizer = new Cube3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'equalizer3d':
              Visualizer = new Equalizer3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'tunnel3d':
              Visualizer = new Tunnel3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'audioscape3d':
              Visualizer = new AudioScape3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'galaxy3d':
              Visualizer = new Galaxy3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            default:
              // Fallback to bars3d if the specified 3D type is not found
              Visualizer = new Bars3DVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
          }
        } else {
          // 2D visualizers
          switch (type) {
            case 'bars':
              Visualizer = new BarsVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'wave':
              Visualizer = new WaveVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'circular':
              Visualizer = new CircularVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'particles':
              Visualizer = new ParticlesVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'spectrum':
              Visualizer = new SpectrumVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'galaxy':
              Visualizer = new GalaxyVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'dna':
              Visualizer = new DNAVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'pulse':
              Visualizer = new PulseVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'grid':
              Visualizer = new GridVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'radial':
              Visualizer = new RadialVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            case 'none':
              Visualizer = new NoneVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
              break;
            default:
              // Fallback to bars if the specified type is not found
              Visualizer = new BarsVisualizer(canvasRef.current, analyzerNode, colorScheme, settings);
          }
        }

        return Visualizer;
      };

      // Create and store the visualizer
      visualizerRef.current = createVisualizer();
      setIsInitialized(true);
      setIsReady(true);

    } catch (err) {
      console.error('Error initializing visualizer:', err);
      setError(err.message || 'Failed to initialize visualizer');
      setIsInitialized(true); // Set as initialized even on error to remove loading indicator
    }

    // Cleanup function
    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.destroy();
        visualizerRef.current = null;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [type, analyzerNode, colorScheme, is3D, settings]);

  // Animation loop
  useEffect(() => {
    if (!visualizerRef.current || !isReady) return;

    const animate = () => {
      if (visualizerRef.current) {
        // Update visualizer
        visualizerRef.current.draw();

        // Call callback with analysis data
        if (onVisualizationFrame) {
          onVisualizationFrame(visualizerRef.current.getAnalysisData());
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isReady, onVisualizationFrame]);

  // If type is 'none', just return empty div with glass styling
  if (type === 'none') {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <span className="text-white/40 text-sm font-medium">Visualization Disabled</span>
      </div>
    );
  }

  // If there's an error, show error message with glass styling
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="text-center p-6 glass-card rounded-xl">
          <div className="text-red-400 text-lg font-medium mb-2">Visualization Error</div>
          <div className="text-white/50 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none rounded-2xl" />

      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Interactive mode instruction label with glass styling */}
      {interactiveMode && is3D && isInitialized && (
        <div className="absolute bottom-4 left-4 text-xs text-white/70 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-lg z-20">
          Drag to rotate • Scroll to zoom
        </div>
      )}

      {/* Loading indicator with glass styling */}
      <AnimatePresence>
        {!isInitialized && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-white/20 border-t-accent rounded-full animate-spin" />
              <span className="text-white/50 text-sm">Loading visualizer...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner accents for glass effect */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-tl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent rounded-br-2xl pointer-events-none" />
    </motion.div>
  );
};

/**
 * Base Visualizer Class
 * All 2D and 3D visualizers inherit from this
 */
class BaseVisualizer {
  constructor(canvas, analyzerNode, colors, settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyzerNode = analyzerNode;
    this.colors = colors || ['#ffffff'];
    this.settings = settings || {};

    // For tracking performance
    this.lastUpdate = Date.now();
    this.frameCount = 0;
    this.fps = 0;

    this.setupCanvas();
    this.initialize();
  }

  setupCanvas() {
    const resize = () => {
      if (!this.canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';

      if (this.ctx) {
        this.ctx.scale(dpr, dpr);
      }

      this.width = rect.width;
      this.height = rect.height;
    };

    resize();
    this.resizeHandler = resize;
    window.addEventListener('resize', this.resizeHandler);
  }

  initialize() {
    // To be implemented by subclasses
  }

  updateDimensions(width, height) {
    // Update dimensions if needed
    if (width && height) {
      this.width = width;
      this.height = height;
    }
  }

  getFrequencyData() {
    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyzerNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getTimeData() {
    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyzerNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  getFloatFrequencyData() {
    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyzerNode.getFloatFrequencyData(dataArray);
    return dataArray;
  }

  getAnalysisData() {
    const freqData = this.getFrequencyData();
    const average = freqData.reduce((a, b) => a + b, 0) / freqData.length;

    // Calculate energy in different frequency bands
    const bassData = freqData.slice(0, Math.floor(freqData.length * 0.1));
    const midData = freqData.slice(Math.floor(freqData.length * 0.1), Math.floor(freqData.length * 0.5));
    const trebleData = freqData.slice(Math.floor(freqData.length * 0.5));

    const bass = bassData.reduce((a, b) => a + b, 0) / bassData.length / 255;
    const mid = midData.reduce((a, b) => a + b, 0) / midData.length / 255;
    const treble = trebleData.reduce((a, b) => a + b, 0) / trebleData.length / 255;

    // Calculate FPS
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastUpdate;

    if (elapsed >= 1000) {
      this.fps = this.frameCount / (elapsed / 1000);
      this.frameCount = 0;
      this.lastUpdate = now;
    }

    return {
      average: average / 255,
      bass,
      mid,
      treble,
      fps: this.fps,
      peak: Math.max(...freqData) / 255,
      data: Array.from(freqData.slice(0, 32)).map(v => v / 255) // Sampled raw data
    };
  }

  // Color utility methods
  getColor(index, alpha = 1) {
    const color = this.colors[index % this.colors.length];
    if (alpha === 1) return color;

    // Parse hex color and add alpha
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return color;
  }

  hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }

  draw() {
    // To be implemented by subclasses
  }

  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);
  }
}

/**
 * 2D Visualizers
 */

// None visualization (empty)
class NoneVisualizer extends BaseVisualizer {
  draw() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }
}

// Bars visualization
class BarsVisualizer extends BaseVisualizer {
  initialize() {
    // Get settings with defaults
    this.barCount = this.settings.barCount || this.settings.count || 64;
    this.barGap = this.settings.barGap || this.settings.gap || 2;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.2;
    this.heightMultiplier = this.settings.heightMultiplier || 1;
    this.smoothedHeights = new Array(this.barCount).fill(0);
    this.mirror = this.settings.mirror || false;
    this.gradient = this.settings.gradient !== false;
    this.reactive = this.settings.reactive !== false;
    this.bassBoost = this.settings.bassBoost || false;
    this.rounded = this.settings.rounded !== false;
    this.glow = this.settings.glow || false;
    this.shadow = this.settings.shadow || false;
    this.fadeEffect = this.settings.fadeEffect || false;
    this.cap = this.settings.cap || false;
    this.capHeight = this.settings.capHeight || 2;
    this.capDropSpeed = this.settings.capDropSpeed || 0.5;
    this.capValues = new Array(this.barCount).fill(0);
  }

  draw() {
    const freqData = this.getFrequencyData();

    // Clear canvas with fade effect
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const barWidth = (this.width - (this.barCount - 1) * this.barGap) / this.barCount;
    const maxBarHeight = this.mirror ? this.height / 2 * 0.8 : this.height * 0.8;

    for (let i = 0; i < this.barCount; i++) {
      const dataIndex = Math.floor(i * freqData.length / this.barCount);
      let dataValue = freqData[dataIndex] / 255;

      // Apply bass boost to lower frequencies
      if (this.bassBoost && i < this.barCount * 0.2) {
        dataValue = Math.min(1, dataValue * 1.5);
      }

      // Apply amplification
      dataValue *= this.amplification;

      // Smooth the height
      const targetHeight = dataValue * maxBarHeight * this.heightMultiplier;
      this.smoothedHeights[i] += (targetHeight - this.smoothedHeights[i]) * (1 - this.smoothing);

      const barHeight = Math.max(0, this.smoothedHeights[i]);
      const x = i * (barWidth + this.barGap);

      // Update caps
      if (this.cap) {
        if (barHeight > this.capValues[i]) {
          this.capValues[i] = barHeight;
        } else {
          this.capValues[i] -= this.capDropSpeed;
          this.capValues[i] = Math.max(0, this.capValues[i]);
        }
      }

      if (this.mirror) {
        // Draw mirrored bars
        const centerY = this.height / 2;

        // Top bar
        this.drawBar(x, centerY - barHeight, barWidth, barHeight, i, dataValue, true);
        if (this.cap) {
          this.drawCap(x, centerY - this.capValues[i] - this.capHeight, barWidth, i);
        }

        // Bottom bar
        this.drawBar(x, centerY, barWidth, barHeight, i, dataValue, false);
        if (this.cap) {
          this.drawCap(x, centerY + this.capValues[i], barWidth, i);
        }
      } else {
        const y = this.height - barHeight;
        this.drawBar(x, y, barWidth, barHeight, i, dataValue);

        // Draw cap
        if (this.cap) {
          this.drawCap(x, y - this.capHeight, barWidth, i);
        }
      }
    }
  }

  drawBar(x, y, width, height, index, energy, isTop = true) {
    if (height <= 0) return;

    // Shadow effect
    if (this.shadow && energy > 0.5) {
      this.ctx.shadowBlur = 20 * energy;
      this.ctx.shadowColor = this.getColor(index);
    }

    // Create gradient
    if (this.gradient) {
      const gradient = isTop
      ? this.ctx.createLinearGradient(0, y + height, 0, y)
      : this.ctx.createLinearGradient(0, y, 0, y + height);

      const colorIndex = Math.floor(index / this.barCount * this.colors.length);
      gradient.addColorStop(0, this.getColor(colorIndex, 1));
      gradient.addColorStop(1, this.getColor((colorIndex + 1) % this.colors.length, 0.25));

      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = this.getColor(index);
    }

    // Draw bar with rounded corners if enabled
    if (this.rounded) {
      const radius = Math.min(width * 0.3, 4);
      this.ctx.beginPath();

      if (this.ctx.roundRect) {
        // Use native roundRect if available
        if (isTop) {
          this.ctx.roundRect(x, y, width, height, [radius, radius, 0, 0]);
        } else {
          this.ctx.roundRect(x, y, width, height, [0, 0, radius, radius]);
        }
      } else {
        // Fallback for browsers without roundRect
        this.drawRoundedRect(x, y, width, height, radius, isTop);
      }

      this.ctx.fill();
    } else {
      this.ctx.fillRect(x, y, width, height);
    }

    // Glow effect
    if (this.glow && energy > 0.7) {
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillStyle = this.getColor(index);
      const glowSize = this.reactive ? width * (1 + energy * 0.5) : width * 1.2;
      const glowX = x - (glowSize - width) / 2;
      this.ctx.fillRect(glowX, y, glowSize, height);
      this.ctx.globalAlpha = 1;
    }

    this.ctx.shadowBlur = 0;
  }

  drawRoundedRect(x, y, width, height, radius, isTop) {
    this.ctx.beginPath();

    if (isTop) {
      this.ctx.moveTo(x, y + height);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height);
    } else {
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + height - radius);
      this.ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
      this.ctx.lineTo(x + width - radius, y + height);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
      this.ctx.lineTo(x + width, y);
    }

    this.ctx.closePath();
  }

  drawCap(x, y, width, index) {
    this.ctx.fillStyle = this.getColor(index, 0.9);

    if (this.rounded) {
      const radius = Math.min(width * 0.3, 4);
      this.ctx.beginPath();

      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, width, this.capHeight, radius);
      } else {
        // Fallback for browsers without roundRect
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + this.capHeight - radius);
        this.ctx.quadraticCurveTo(x + width, y + this.capHeight, x + width - radius, y + this.capHeight);
        this.ctx.lineTo(x + radius, y + this.capHeight);
        this.ctx.quadraticCurveTo(x, y + this.capHeight, x, y + this.capHeight - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
      }

      this.ctx.fill();
    } else {
      this.ctx.fillRect(x, y, width, this.capHeight);
    }
  }
}

// Wave visualization
class WaveVisualizer extends BaseVisualizer {
  initialize() {
    this.lineWidth = this.settings.lineWidth || 3;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.5;
    this.amplification = this.settings.amplification || 1;
    this.amplitude = this.settings.amplitude || 1;
    this.history = [];
    this.maxHistory = this.settings.trails || 3;
    this.fill = this.settings.fill !== false;
    this.glow = this.settings.glow || false;
    this.mirror = this.settings.mirror || false;
    this.points = this.settings.points || 256;
    this.fadeEffect = this.settings.fadeEffect !== false;
    this.glowIntensity = this.settings.glowIntensity || 10;
  }

  draw() {
    const timeData = this.getTimeData();

    // Fade effect
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add to history
    this.history.push([...timeData]);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Draw waves
    this.history.forEach((data, historyIndex) => {
      const alpha = (historyIndex + 1) / this.history.length;

      this.ctx.beginPath();
      this.ctx.lineWidth = this.lineWidth * alpha;

      const sliceWidth = this.width / this.points;
      let x = 0;

      // Create gradient stroke
      const gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
      this.colors.forEach((color, index) => {
        gradient.addColorStop(index / (this.colors.length - 1), this.getColor(index, alpha));
      });

      if (this.glow) {
        this.ctx.shadowBlur = this.glowIntensity * alpha;
        this.ctx.shadowColor = this.getColor(0);
      }

      for (let i = 0; i < this.points; i++) {
        const dataIndex = Math.floor(i * data.length / this.points);
        const v = (data[dataIndex] - 128) / 128.0;
        const y = this.height / 2 + v * this.height * 0.4 * this.amplitude * this.amplification;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      if (this.fill) {
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.lineTo(0, this.height / 2);
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = alpha * 0.3;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
      }

      this.ctx.strokeStyle = gradient;
      this.ctx.stroke();

      // Mirror wave
      if (this.mirror) {
        this.ctx.beginPath();
        x = 0;

        for (let i = 0; i < this.points; i++) {
          const dataIndex = Math.floor(i * data.length / this.points);
          const v = (data[dataIndex] - 128) / 128.0;
          const y = this.height / 2 - v * this.height * 0.4 * this.amplitude * this.amplification;

          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        this.ctx.strokeStyle = gradient;
        this.ctx.globalAlpha = alpha * 0.5;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
      }

      this.ctx.shadowBlur = 0;
    });
  }
}

// Circular visualization
class CircularVisualizer extends BaseVisualizer {
  initialize() {
    this.radius = this.settings.radius || 0.45;
    this.segments = this.settings.segments || this.settings.circularSegments || 256;
    this.rotation = this.settings.rotation !== false;
    this.rotationSpeed = this.settings.rotationSpeed || 0.001;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1;
    this.layers = this.settings.layers || 3;
    this.pulse = this.settings.pulse || false;
    this.phaseShift = this.settings.phaseShift || false;
    this.angle = 0;
    this.smoothedValues = new Array(this.segments).fill(0);
    this.fadeEffect = this.settings.fadeEffect || false;
    this.autoRotate = this.settings.autoRotate !== false;
    this.reactiveRotation = this.settings.reactiveRotation || false;
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Clear canvas
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) / 2;
    let baseRadius = maxRadius * this.radius;

    // Pulse effect
    if (this.pulse) {
      baseRadius *= (1 + avgEnergy * 0.2);
    }

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    if (this.rotation && this.autoRotate) {
      this.ctx.rotate(this.angle);
      // Update rotation based on settings
      if (this.reactiveRotation) {
        this.angle += this.rotationSpeed * (1 + avgEnergy * 2);
      } else {
        this.angle += this.rotationSpeed;
      }
    }

    // Draw multiple layers
    for (let layer = 0; layer < this.layers; layer++) {
      const layerRadius = baseRadius * (1 + layer * 0.2);
      const layerAlpha = 1 - (layer / this.layers) * 0.5;
      const phaseOffset = this.phaseShift ? (layer * Math.PI * 2 / this.layers) : 0;

      this.ctx.beginPath();

      for (let i = 0; i <= this.segments; i++) {
        const angle = (i / this.segments) * Math.PI * 2 + phaseOffset;
        const dataIndex = Math.floor(i * freqData.length / this.segments) % freqData.length;
        const dataValue = (freqData[dataIndex] / 255) * this.amplification;

        // Smooth values
        if (i < this.smoothedValues.length) {
          this.smoothedValues[i] += (dataValue - this.smoothedValues[i]) * (1 - this.smoothing);
        }

        const smoothedValue = this.smoothedValues[i % this.smoothedValues.length] || 0;
        const radius = layerRadius + smoothedValue * maxRadius * 0.3;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      this.ctx.closePath();

      // Create gradient
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius * 1.5);
      this.colors.forEach((color, index) => {
        gradient.addColorStop(
          index / (this.colors.length - 1),
                              this.getColor(index, layerAlpha)
        );
      });

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 2 * layerAlpha;
      this.ctx.stroke();

      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = layerAlpha * 0.1;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }

    // Draw center circle
    const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.8);
    centerGradient.addColorStop(0, this.getColor(0, 0.5));
    centerGradient.addColorStop(1, this.getColor(0, 0));
    this.ctx.fillStyle = centerGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, baseRadius * 0.8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }
}

// Particles visualization
class ParticlesVisualizer extends BaseVisualizer {
  initialize() {
    this.particleCount = this.settings.particleCount || this.settings.count || 100;
    this.particleSize = this.settings.particleSize || this.settings.size || 3;
    this.speed = this.settings.speed || 1;
    this.connections = this.settings.connections !== false;
    this.connectionDistance = this.settings.connectionDistance || this.settings.connectionThreshold || 100;
    this.gravity = this.settings.gravity || 0;
    this.turbulence = this.settings.turbulence || 0;
    this.amplification = this.settings.amplification || 1;
    this.reactive = this.settings.reactive !== false;
    this.fadeEffect = this.settings.fadeEffect !== false;
    this.repulsion = this.settings.repulsion || false;
    this.attraction = this.settings.attraction || false;
    this.glow = this.settings.glow || false;
    this.glowIntensity = this.settings.glowIntensity || 10;

    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
                          y: Math.random() * this.height,
                          vx: (Math.random() - 0.5) * this.speed,
                          vy: (Math.random() - 0.5) * this.speed,
                          size: this.particleSize * (0.7 + Math.random() * 0.6),
                          energy: 0,
                          color: this.getColor(Math.floor(Math.random() * this.colors.length)),
      });
    }
  }

  updateDimensions(width, height) {
    super.updateDimensions(width, height);

    // Update particle positions if dimensions changed significantly
    if (width && height && this.particles) {
      // Only adjust if dimensions are significantly different
      const widthRatio = width / this.width;
      const heightRatio = height / this.height;

      if (Math.abs(widthRatio - 1) > 0.1 || Math.abs(heightRatio - 1) > 0.1) {
        this.particles.forEach(particle => {
          particle.x *= widthRatio;
          particle.y *= heightRatio;
        });
      }
    }
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = (freqData.reduce((a, b) => a + b, 0) / freqData.length / 255) * this.amplification;

    // Fade effect
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Update and draw particles
    this.particles.forEach((particle, i) => {
      // Apply turbulence
      if (this.turbulence > 0) {
        particle.vx += (Math.random() - 0.5) * this.turbulence;
        particle.vy += (Math.random() - 0.5) * this.turbulence;
      }

      // Apply gravity
      particle.vy += this.gravity;

      // Apply attraction/repulsion from center
      if (this.attraction || this.repulsion) {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = avgEnergy * 0.1;

        if (this.attraction) {
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
        if (this.repulsion) {
          particle.vx -= (dx / distance) * force;
          particle.vy -= (dy / distance) * force;
        }
      }

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off walls
      if (particle.x < 0 || particle.x > this.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.height) particle.vy *= -1;

      // Keep in bounds
      particle.x = Math.max(0, Math.min(this.width, particle.x));
      particle.y = Math.max(0, Math.min(this.height, particle.y));

      // Update energy based on frequency
      const freqIndex = Math.floor(i * freqData.length / this.particles.length);
      particle.energy = (freqData[freqIndex] / 255) * this.amplification;

      // Draw particle
      const size = this.reactive ? particle.size * (1 + particle.energy) : particle.size;

      // Apply glow effect
      if (this.glow && particle.energy > 0.3) {
        this.ctx.shadowBlur = this.glowIntensity * particle.energy;
        this.ctx.shadowColor = particle.color;
      }

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);

      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, size
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, particle.color + '00');

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Draw connections
    if (this.connections) {
      this.ctx.lineWidth = 1;

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.connectionDistance) {
            const alpha = (1 - distance / this.connectionDistance) * avgEnergy;
            const opacity = Math.floor(alpha * 255).toString(16).padStart(2, '0');

            this.ctx.strokeStyle = this.particles[i].color.slice(0, 7) + opacity;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.stroke();
          }
        }
      }
    }
  }
}

// Spectrum visualization
class SpectrumVisualizer extends BaseVisualizer {
  initialize() {
    this.bands = this.settings.bands || 48;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.2;
    this.logarithmic = this.settings.logarithmic !== false;
    this.peakHold = this.settings.peakHold !== false;
    this.reflection = this.settings.reflection !== false;
    this.gradient = this.settings.gradient !== false;
    this.fadeEffect = this.settings.fadeEffect || false;

    // Peak values for peak hold effect
    this.peakValues = new Array(this.bands).fill(0);
    this.peakHoldTime = 20; // frames to hold the peak
    this.peakTimers = new Array(this.bands).fill(0);

    // Smoothed values for transitions
    this.smoothedValues = new Array(this.bands).fill(0);
  }

  draw() {
    const freqData = this.getFrequencyData();

    // Clear canvas with fade effect
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Calculate bar dimensions
    const barWidth = this.width / this.bands;
    const maxBarHeight = this.reflection ? this.height / 2 * 0.9 : this.height * 0.9;
    const centerY = this.reflection ? this.height / 2 : this.height;

    // Draw each frequency band
    for (let i = 0; i < this.bands; i++) {
      // Get frequency data with logarithmic scaling if enabled
      let dataIndex;
      if (this.logarithmic) {
        // Logarithmic scale emphasizes lower frequencies
        dataIndex = Math.floor(Math.pow(i / this.bands, 2) * freqData.length);
      } else {
        // Linear scale
        dataIndex = Math.floor(i * freqData.length / this.bands);
      }

      // Get and normalize data value
      let value = freqData[dataIndex] / 255;

      // Apply amplification
      value = Math.min(1, value * this.amplification);

      // Apply smoothing
      this.smoothedValues[i] += (value - this.smoothedValues[i]) * (1 - this.smoothing);
      value = this.smoothedValues[i];

      // Update peak values for peak hold effect
      if (this.peakHold) {
        if (value >= this.peakValues[i]) {
          this.peakValues[i] = value;
          this.peakTimers[i] = this.peakHoldTime;
        } else if (this.peakTimers[i] > 0) {
          this.peakTimers[i]--;
        } else {
          this.peakValues[i] -= 0.01; // Gradually reduce peak value
          this.peakValues[i] = Math.max(0, this.peakValues[i]);
        }
      }

      // Calculate bar position and dimensions
      const barHeight = value * maxBarHeight;
      const x = i * barWidth;
      const y = centerY - barHeight;

      // Draw bar with gradient if enabled
      if (this.gradient) {
        const gradient = this.ctx.createLinearGradient(0, centerY, 0, y);
        const colorIndex = Math.floor(i / this.bands * this.colors.length);

        gradient.addColorStop(0, this.getColor(colorIndex, 0.3));
        gradient.addColorStop(1, this.getColor(colorIndex, 1));

        this.ctx.fillStyle = gradient;
      } else {
        // Use color from the palette based on position
        const colorIndex = Math.floor(i / this.bands * this.colors.length);
        this.ctx.fillStyle = this.getColor(colorIndex);
      }

      // Draw main bar
      this.ctx.fillRect(x, y, barWidth - 1, barHeight);

      // Draw peak bar if peak hold is enabled
      if (this.peakHold && this.peakValues[i] > 0) {
        const peakY = centerY - this.peakValues[i] * maxBarHeight;
        this.ctx.fillRect(x, peakY, barWidth - 1, 2);
      }

      // Draw reflection if enabled
      if (this.reflection && barHeight > 0) {
        const gradient = this.ctx.createLinearGradient(0, centerY, 0, centerY + barHeight * 0.7);
        const colorIndex = Math.floor(i / this.bands * this.colors.length);

        gradient.addColorStop(0, this.getColor(colorIndex, 0.5));
        gradient.addColorStop(1, this.getColor(colorIndex, 0));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, centerY, barWidth - 1, barHeight * 0.7);
      }
    }

    // Draw center line for reflection mode
    if (this.reflection) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height / 2);
      this.ctx.lineTo(this.width, this.height / 2);
      this.ctx.stroke();
    }
  }
}

// Galaxy visualization
class GalaxyVisualizer extends BaseVisualizer {
  initialize() {
    this.starCount = this.settings.starCount || 200;
    this.spiralArms = this.settings.spiralArms || 3;
    this.rotationSpeed = this.settings.rotationSpeed || 0.005;
    this.amplification = this.settings.amplification || 1.2;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.fadeEffect = this.settings.fadeEffect || false;
    this.glow = this.settings.glow || true;
    this.glowIntensity = this.settings.glowIntensity || 10;

    // Generate stars
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      // Random angle and distance from center
      const arm = Math.floor(Math.random() * this.spiralArms);
      const angle = (Math.random() * Math.PI * 2) + (arm * Math.PI * 2 / this.spiralArms);
      const distance = Math.random() * 0.9 + 0.1; // Between 0.1 and 1.0

      // Spiral arm effect - add angle based on distance
      const spiralAngle = angle + distance * 5;

      // Convert polar to Cartesian coordinates
      const x = Math.cos(spiralAngle) * distance;
      const y = Math.sin(spiralAngle) * distance;

      // Random star size
      const size = Math.random() * 2 + 1;

      // Random color from palette
      const colorIndex = Math.floor(Math.random() * this.colors.length);

      this.stars.push({
        x, y, size, colorIndex,
        arm,
        angle: spiralAngle,
        distance,
        brightness: 0,
        targetBrightness: 0
      });
    }

    // Rotation angle
    this.rotation = 0;
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Clear canvas with fade effect
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update rotation based on energy
    this.rotation += this.rotationSpeed * (1 + avgEnergy);

    // Calculate center position
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) * 0.9;

    // Draw stars
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];

      // Get frequency data for this star based on arm and distance
      const freqIndex = Math.floor((star.arm * 0.5 + star.distance * 0.5) * freqData.length);
      const energyValue = (freqData[freqIndex] / 255) * this.amplification;

      // Update star brightness with smoothing
      star.targetBrightness = energyValue;
      star.brightness += (star.targetBrightness - star.brightness) * (1 - this.smoothing);

      // Apply rotation
      const rotatedAngle = star.angle + this.rotation;

      // Calculate screen position
      const drawX = centerX + Math.cos(rotatedAngle) * star.distance * radius;
      const drawY = centerY + Math.sin(rotatedAngle) * star.distance * radius;

      // Scale size based on energy
      const size = star.size * (1 + star.brightness * 2);

      // Apply glow effect
      if (this.glow) {
        this.ctx.shadowBlur = this.glowIntensity * star.brightness;
        this.ctx.shadowColor = this.getColor(star.colorIndex);
      }

      // Draw star
      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, size, 0, Math.PI * 2);

      // Create radial gradient for star
      const safeSize = isFinite(size) ? Math.max(0.1, size) : 0.1;
      const gradient = this.ctx.createRadialGradient(
        drawX, drawY, 0,
        drawX, drawY, safeSize
      );
      gradient.addColorStop(0, this.getColor(star.colorIndex));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Draw galaxy center glow
    const centerGlow = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, isFinite(radius * 0.2) ? radius * 0.2 : 1
    );
    centerGlow.addColorStop(0, this.getColor(0, 0.8 * avgEnergy));
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = centerGlow;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

// DNA visualization
class DNAVisualizer extends BaseVisualizer {
  initialize() {
    this.points = this.settings.points || 50;
    this.amplitude = this.settings.amplitude || 50;
    this.frequency = this.settings.frequency || 0.1;
    this.phaseSpeed = this.settings.phaseSpeed || 0.02;
    this.dotSize = this.settings.dotSize || 4;
    this.barWidth = this.settings.barWidth || 6;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.2;
    this.phase = 0;
    this.fadeEffect = this.settings.fadeEffect || false;
    this.smoothedAmplitudes = new Array(this.points).fill(this.amplitude);
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Clear canvas
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update phase
    this.phase += this.phaseSpeed * (1 + avgEnergy * 0.5);

    // Calculate center and spacing
    const centerY = this.height / 2;
    const centerX = this.width / 2;
    const spacing = this.width / (this.points - 1);

    // Draw connecting bars first (behind the dots)
    for (let i = 0; i < this.points; i++) {
      // Get frequency data for this point
      const freqIndex = Math.floor(i * freqData.length / this.points);
      const energy = (freqData[freqIndex] / 255) * this.amplification;

      // Update smoothed amplitude
      const targetAmplitude = this.amplitude * (0.5 + energy * 0.5);
      this.smoothedAmplitudes[i] += (targetAmplitude - this.smoothedAmplitudes[i]) * (1 - this.smoothing);

      // Calculate x position
      const x = i * spacing;

      // Calculate y positions for the helix strands
      const angle = this.frequency * i + this.phase;
      const strand1Y = centerY + Math.sin(angle) * this.smoothedAmplitudes[i];
      const strand2Y = centerY - Math.sin(angle) * this.smoothedAmplitudes[i];

      // Only draw bars between dots
      if (i > 0 && i % 4 === 0) {
        // Draw connecting bar
        this.ctx.lineWidth = this.barWidth;
        this.ctx.strokeStyle = this.getColor(1, 0.3 + energy * 0.7);

        // Connect the strands
        this.ctx.beginPath();
        this.ctx.moveTo(x, strand1Y);
        this.ctx.lineTo(x, strand2Y);
        this.ctx.stroke();
      }
    }

    // Draw both helix strands with dots
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 0; i < this.points; i++) {
        // Skip some points for the bar connections
        if (i % 4 === 0) continue;

        // Get frequency data for this point
        const freqIndex = Math.floor(i * freqData.length / this.points);
        const energy = (freqData[freqIndex] / 255) * this.amplification;

        // Calculate x position
        const x = i * spacing;

        // Calculate y position based on sine wave and strand
        const angle = this.frequency * i + this.phase;
        const y = strand === 0
        ? centerY + Math.sin(angle) * this.smoothedAmplitudes[i]
        : centerY - Math.sin(angle) * this.smoothedAmplitudes[i];

        // Draw dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.dotSize * (1 + energy * 0.5), 0, Math.PI * 2);

        // Use different colors for each strand
        const colorIndex = strand;
        this.ctx.fillStyle = this.getColor(colorIndex, 0.5 + energy * 0.5);
        this.ctx.fill();
      }
    }
  }
}

// Pulse visualization
class PulseVisualizer extends BaseVisualizer {
  initialize() {
    this.sensitivity = this.settings.sensitivity || 0.6;
    this.beatThreshold = this.settings.beatThreshold || 1.3;
    this.frequencyRange = this.settings.frequencyRange || 'bass';
    this.minInterval = this.settings.minInterval || 100; // Min time between beats (ms)
    this.maxRings = this.settings.maxRings || 8;
    this.ringSpeed = this.settings.ringSpeed || 2;
    this.coreSize = this.settings.coreSize || 20;
    this.maxCoreSize = this.settings.maxCoreSize || 50;
    this.ringThickness = this.settings.ringThickness || 3;
    this.fadeSpeed = this.settings.fadeSpeed || 0.05;
    this.glowIntensity = this.settings.glowIntensity || 20;
    this.colorShift = this.settings.colorShift || false;
    this.showBeatIndicator = this.settings.showBeatIndicator || false;
    this.showEnergyMeter = this.settings.showEnergyMeter || false;

    // State variables
    this.rings = [];
    this.energyHistory = new Array(30).fill(0);
    this.lastBeatTime = 0;
    this.colorIndex = 0;
    this.beatDetected = false;
    this.beatIndicatorOpacity = 0;
    this.currentCoreSize = this.coreSize;
  }

  detectBeat(freqData) {
    // Get energy for the selected frequency range
    let energy = 0;

    if (this.frequencyRange === 'bass') {
      // Bass frequencies (first 10%)
      const bassData = freqData.slice(0, Math.floor(freqData.length * 0.1));
      energy = bassData.reduce((sum, value) => sum + value, 0) / bassData.length / 255;
    } else if (this.frequencyRange === 'mid') {
      // Mid frequencies (10% to 50%)
      const midData = freqData.slice(
        Math.floor(freqData.length * 0.1),
                                     Math.floor(freqData.length * 0.5)
      );
      energy = midData.reduce((sum, value) => sum + value, 0) / midData.length / 255;
    } else if (this.frequencyRange === 'treble') {
      // Treble frequencies (50% to end)
      const trebleData = freqData.slice(Math.floor(freqData.length * 0.5));
      energy = trebleData.reduce((sum, value) => sum + value, 0) / trebleData.length / 255;
    } else {
      // All frequencies
      energy = freqData.reduce((sum, value) => sum + value, 0) / freqData.length / 255;
    }

    // Update energy history
    this.energyHistory.push(energy);
    this.energyHistory.shift();

    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((sum, value) => sum + value, 0) / this.energyHistory.length;

    // Beat detection logic
    const now = Date.now();
    if (energy > avgEnergy * this.beatThreshold &&
      energy > this.sensitivity &&
      now - this.lastBeatTime > this.minInterval) {

      this.lastBeatTime = now;
    this.beatDetected = true;
    this.beatIndicatorOpacity = 1;

    // Create a new ring
    if (this.colorShift) {
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
    }

    this.rings.push({
      radius: this.currentCoreSize,
      opacity: 1,
      colorIndex: this.colorIndex
    });

    // Limit number of rings
    if (this.rings.length > this.maxRings) {
      this.rings.shift();
    }

    return true;
      }

      this.beatDetected = false;
      return false;
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Detect beat
    this.detectBeat(freqData);

    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Calculate center position
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Update and draw rings
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];

      // Update ring
      ring.radius += this.ringSpeed * (1 + avgEnergy);
      ring.opacity -= this.fadeSpeed;

      // Remove ring if it's fully transparent or too large
      if (ring.opacity <= 0 || ring.radius > Math.max(this.width, this.height)) {
        this.rings.splice(i, 1);
        i--;
        continue;
      }

      // Draw ring
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
      this.ctx.lineWidth = this.ringThickness;

      // Apply glow effect
      this.ctx.shadowBlur = this.glowIntensity * ring.opacity;
      this.ctx.shadowColor = this.getColor(ring.colorIndex);

      this.ctx.strokeStyle = this.getColor(ring.colorIndex, ring.opacity);
      this.ctx.stroke();
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Update and draw core
    this.currentCoreSize = this.coreSize + (this.maxCoreSize - this.coreSize) * avgEnergy;

    // Draw core gradient
    const coreGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.currentCoreSize
    );

    coreGradient.addColorStop(0, this.getColor(this.colorIndex, 1));
    coreGradient.addColorStop(0.6, this.getColor(this.colorIndex, 0.5));
    coreGradient.addColorStop(1, this.getColor(this.colorIndex, 0));

    this.ctx.fillStyle = coreGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.currentCoreSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw beat indicator if enabled
    if (this.showBeatIndicator && this.beatIndicatorOpacity > 0) {
      this.ctx.fillStyle = this.getColor(this.colorIndex, this.beatIndicatorOpacity);
      this.ctx.fillRect(10, 10, 20, 20);
      this.beatIndicatorOpacity -= 0.05;
    }

    // Draw energy meter if enabled
    if (this.showEnergyMeter) {
      const meterWidth = 200;
      const meterHeight = 10;
      const meterX = (this.width - meterWidth) / 2;
      const meterY = this.height - 30;

      // Draw background
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

      // Draw energy level
      this.ctx.fillStyle = this.getColor(this.colorIndex, 0.8);
      this.ctx.fillRect(meterX, meterY, meterWidth * avgEnergy, meterHeight);

      // Draw threshold line
      const thresholdX = meterX + meterWidth * this.sensitivity;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(thresholdX, meterY - 5);
      this.ctx.lineTo(thresholdX, meterY + meterHeight + 5);
      this.ctx.stroke();
    }
  }
}

// Grid visualization
class GridVisualizer extends BaseVisualizer {
  initialize() {
    this.gridSize = this.settings.gridSize || 20;
    this.perspective = this.settings.perspective || 0.5;
    this.waveHeight = this.settings.waveHeight || 50;
    this.rotation = this.settings.rotation !== undefined ? this.settings.rotation : true;
    this.rotationSpeed = this.settings.rotationSpeed || 0.005;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.2;
    this.fadeEffect = this.settings.fadeEffect || false;

    // State variables
    this.angle = 0;
    this.gridPoints = [];
    this.smoothedHeights = new Array(this.gridSize * this.gridSize).fill(0);

    // Initialize grid points
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        this.gridPoints.push({ x, z, height: 0 });
      }
    }
  }

  // Convert 3D coordinate to 2D screen coordinate with perspective
  project(x, y, z) {
    // Normalize coordinates to -1 to 1
    const normalizedX = (x / (this.gridSize - 1)) * 2 - 1;
    const normalizedZ = (z / (this.gridSize - 1)) * 2 - 1;

    // Apply rotation
    const rotatedX = normalizedX * Math.cos(this.angle) - normalizedZ * Math.sin(this.angle);
    const rotatedZ = normalizedX * Math.sin(this.angle) + normalizedZ * Math.cos(this.angle);

    // Apply perspective
    const scale = 1 / (1 + rotatedZ * this.perspective);

    // Convert to screen coordinates
    const screenX = this.width / 2 * (1 + rotatedX * scale);
    const screenY = this.height / 2 * (1 - y * 0.01 * scale + 0.5 * scale);

    return { x: screenX, y: screenY, scale };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Clear canvas
    this.ctx.fillStyle = this.fadeEffect ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update rotation angle
    if (this.rotation) {
      this.angle += this.rotationSpeed * (1 + avgEnergy);
    }

    // Update grid heights
    for (let i = 0; i < this.gridPoints.length; i++) {
      const point = this.gridPoints[i];

      // Use position to determine frequency index
      const distanceFromCenter = Math.sqrt(
        Math.pow((point.x / this.gridSize) - 0.5, 2) +
        Math.pow((point.z / this.gridSize) - 0.5, 2)
      ) * 2;

      const freqIndex = Math.floor(distanceFromCenter * freqData.length);
      const value = (freqData[Math.min(freqIndex, freqData.length - 1)] / 255) * this.amplification;

      // Apply smoothing
      this.smoothedHeights[i] += (value - this.smoothedHeights[i]) * (1 - this.smoothing);
      point.height = this.smoothedHeights[i] * this.waveHeight;
    }

    // Sort points by distance (Z) for correct drawing order
    const sortedPoints = [...this.gridPoints].map(point => {
      const { x, z } = point;
      // Normalize coordinates to -1 to 1
      const normalizedX = (x / (this.gridSize - 1)) * 2 - 1;
      const normalizedZ = (z / (this.gridSize - 1)) * 2 - 1;

      // Apply rotation to calculate Z depth
      const rotatedZ = normalizedX * Math.sin(this.angle) + normalizedZ * Math.cos(this.angle);

      return { ...point, depth: rotatedZ };
    }).sort((a, b) => b.depth - a.depth);

    // Draw grid lines
    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const { x, z, height } = point;

      // Calculate current position
      const pos = this.project(x, height, z);

      // Draw horizontal line
      if (x < this.gridSize - 1) {
        const nextX = sortedPoints.find(p => p.x === x + 1 && p.z === z);
        if (nextX) {
          const nextPos = this.project(nextX.x, nextX.height, nextX.z);
          this.drawLine(pos.x, pos.y, nextPos.x, nextPos.y, pos.scale, x, z);
        }
      }

      // Draw vertical line
      if (z < this.gridSize - 1) {
        const nextZ = sortedPoints.find(p => p.x === x && p.z === z + 1);
        if (nextZ) {
          const nextPos = this.project(nextZ.x, nextZ.height, nextZ.z);
          this.drawLine(pos.x, pos.y, nextPos.x, nextPos.y, pos.scale, x, z);
        }
      }
    }
  }

  drawLine(x1, y1, x2, y2, scale, gridX, gridZ) {
    // Calculate color based on position in grid
    const colorIndex = Math.floor(
      ((gridX + gridZ) / (this.gridSize * 2)) * this.colors.length
    );

    // Adjust line width based on depth
    const lineWidth = 2 * Math.min(2, scale);

    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = this.getColor(colorIndex, scale);

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
}

// Radial visualization
class RadialVisualizer extends BaseVisualizer {
  initialize() {
    this.innerRadius = this.settings.innerRadius || 0.25;
    this.outerRadius = this.settings.outerRadius || 0.85;
    this.segments = this.settings.segments || 128;
    this.rotation = this.settings.rotation !== undefined ? this.settings.rotation : true;
    this.rotationSpeed = this.settings.rotationSpeed || 0.02;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.2;
    this.mirror = this.settings.mirror || false;
    this.spiral = this.settings.spiral || false;

    // State variables
    this.angle = 0;
    this.smoothedValues = new Array(this.segments).fill(0);
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Calculate center and maximum radius
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(centerX, centerY);

    // Update rotation angle
    if (this.rotation) {
      this.angle += this.rotationSpeed * (1 + avgEnergy * 0.5);
    }

    // Draw segments
    for (let i = 0; i < this.segments; i++) {
      // Get frequency data
      const freqIndex = Math.floor(i * freqData.length / this.segments);
      const value = (freqData[freqIndex] / 255) * this.amplification;

      // Apply smoothing
      this.smoothedValues[i] += (value - this.smoothedValues[i]) * (1 - this.smoothing);

      // Calculate angles
      const segmentAngle = (Math.PI * 2) / this.segments;
      const startAngle = this.angle + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Calculate inner and outer radius
      const innerRadius = maxRadius * this.innerRadius;
      let outerRadius;

      if (this.spiral) {
        // Spiral effect: gradually increase base radius
        const baseRadius = maxRadius * (this.innerRadius + (this.outerRadius - this.innerRadius) * (i / this.segments));
        outerRadius = baseRadius + (maxRadius * (this.outerRadius - this.innerRadius) * this.smoothedValues[i]);
      } else {
        // Regular radial: fixed inner radius, variable outer radius
        outerRadius = innerRadius + (maxRadius * (this.outerRadius - this.innerRadius) * this.smoothedValues[i]);
      }

      // Get color based on position
      const colorIndex = Math.floor(i / this.segments * this.colors.length);

      // Draw segment
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
      this.ctx.arc(centerX, centerY, outerRadius, endAngle, startAngle, true);
      this.ctx.closePath();

      // Create gradient
      const gradient = this.ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, outerRadius
      );
      gradient.addColorStop(0, this.getColor(colorIndex, 0.4));
      gradient.addColorStop(1, this.getColor(colorIndex, 0.8));

      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw mirrored segment if enabled
      if (this.mirror) {
        // Calculate mirrored angles
        const mirrorStartAngle = this.angle - i * segmentAngle;
        const mirrorEndAngle = mirrorStartAngle - segmentAngle;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, innerRadius, mirrorStartAngle, mirrorEndAngle, true);
        this.ctx.arc(centerX, centerY, outerRadius, mirrorEndAngle, mirrorStartAngle);
        this.ctx.closePath();

        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
    }

    // Draw center circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, maxRadius * this.innerRadius, 0, Math.PI * 2);

    const centerGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius * this.innerRadius
    );
    centerGradient.addColorStop(0, this.getColor(0, 0.8));
    centerGradient.addColorStop(1, this.getColor(0, 0.1));

    this.ctx.fillStyle = centerGradient;
    this.ctx.fill();
  }
}

/**
 * 3D Visualizers (Using 2D canvas with fake 3D perspective)
 */

// Base 3D Visualizer class with improved reactivity and interaction
class Base3DVisualizer extends BaseVisualizer {
  initialize() {
    // Enhanced perspective and camera settings
    this.fov = this.settings.fov || 120;
    this.cameraDistance = this.settings.cameraDistance || 20;
    this.cameraPosition = { x: 0, y: 0, z: this.cameraDistance };
    this.cameraRotation = { x: 0, y: 0, z: 0 };
    this.interactiveMode = this.settings.interactiveMode || false;

    // Global scaling for better visibility of 3D elements
    this.globalScale = this.settings.globalScale || 2.5;

    // Scene and rendering settings
    this.screenCenter = { x: 0, y: 0 };
    this.nearClippingPlane = 0.1;
    this.farClippingPlane = 100;

    // Animation settings
    this.time = 0;
    this.autoRotate = this.settings.autoRotate !== false;
    this.rotationSpeed = this.settings.rotationSpeed || 0.01;

    // Visual enhancement settings
    this.glowStrength = this.settings.glowStrength || 1.5;
    this.minPointSize = this.settings.minPointSize || 1.5;

    // Live settings updates support
    this.lastSettingsUpdate = Date.now();

    // Set up mouse interaction if in interactive mode
    if (this.interactiveMode) {
      this.setupInteraction();
    }
  }

  setupInteraction() {
    this.isDragging = false;
    this.isInteracting = false;
    this.lastMousePosition = { x: 0, y: 0 };
    this.interactionStartTime = 0;

    const mouseDownHandler = (e) => {
      this.isDragging = true;
      this.isInteracting = true;
      this.interactionStartTime = Date.now();
      this.lastMousePosition = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    };

    const mouseMoveHandler = (e) => {
      if (!this.isDragging) {
        // Show interactive cursor even when not dragging
        this.canvas.style.cursor = 'grab';
        return;
      }

      const deltaX = e.clientX - this.lastMousePosition.x;
      const deltaY = e.clientY - this.lastMousePosition.y;

      // Enhanced sensitivity for more responsive rotation
      this.cameraRotation.y += deltaX * 0.015;
      this.cameraRotation.x += deltaY * 0.015;

      // Limit vertical rotation to avoid flipping
      this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));

      this.lastMousePosition = { x: e.clientX, y: e.clientY };
    };

    const mouseUpHandler = () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';

      // Keep track of interaction for a brief period to prevent auto-rotate from immediately resuming
      setTimeout(() => {
        this.isInteracting = false;
      }, 500);
    };

    const mouseLeaveHandler = () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    };

    const mouseEnterHandler = () => {
      if (this.interactiveMode) {
        this.canvas.style.cursor = 'grab';
      }
    };

    const wheelHandler = (e) => {
      e.preventDefault();
      this.isInteracting = true;

      // More responsive zooming with limits
      const zoomAmount = e.deltaY * 0.03;
      this.cameraDistance = Math.max(3, Math.min(30, this.cameraDistance + zoomAmount));

      // Update camera Z position immediately
      this.cameraPosition.z = this.cameraDistance;

      // Reset interaction flag after a delay
      setTimeout(() => {
        this.isInteracting = false;
      }, 500);
    };

    // Add event listeners with passive: false for wheel to allow preventDefault
    this.canvas.addEventListener('mousedown', mouseDownHandler);
    this.canvas.addEventListener('mousemove', mouseMoveHandler);
    this.canvas.addEventListener('mouseup', mouseUpHandler);
    this.canvas.addEventListener('mouseleave', mouseLeaveHandler);
    this.canvas.addEventListener('mouseenter', mouseEnterHandler);
    this.canvas.addEventListener('wheel', wheelHandler, { passive: false });

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        this.isDragging = true;
        this.isInteracting = true;
        this.interactionStartTime = Date.now();
        this.lastMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        // Handle pinch zoom
        this.initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - this.lastMousePosition.x;
        const deltaY = e.touches[0].clientY - this.lastMousePosition.y;

        this.cameraRotation.y += deltaX * 0.015;
        this.cameraRotation.x += deltaY * 0.015;

        this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));

        this.lastMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        // Handle pinch zoom
        e.preventDefault();
        const currentPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        if (this.initialPinchDistance) {
          const pinchDelta = currentPinchDistance - this.initialPinchDistance;
          this.cameraDistance = Math.max(3, Math.min(30, this.cameraDistance - pinchDelta * 0.05));
          this.cameraPosition.z = this.cameraDistance;
          this.initialPinchDistance = currentPinchDistance;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
      this.initialPinchDistance = null;

      setTimeout(() => {
        this.isInteracting = false;
      }, 500);
    });

    // Store handlers for cleanup
    this.mouseDownHandler = mouseDownHandler;
    this.mouseMoveHandler = mouseMoveHandler;
    this.mouseUpHandler = mouseUpHandler;
    this.mouseLeaveHandler = mouseLeaveHandler;
    this.mouseEnterHandler = mouseEnterHandler;
    this.wheelHandler = wheelHandler;
  }

  // Check if settings have changed and apply updates
  checkSettingsUpdate() {
    // This is called every frame to apply any setting changes immediately
    if (this.settings) {
      // Update common settings that can change during playback
      if (this.settings.autoRotate !== undefined) {
        this.autoRotate = this.settings.autoRotate;
      }

      if (this.settings.rotationSpeed !== undefined) {
        this.rotationSpeed = this.settings.rotationSpeed;
      }

      if (this.settings.globalScale !== undefined) {
        this.globalScale = this.settings.globalScale;
      }

      if (this.settings.interactiveMode !== undefined && this.interactiveMode !== this.settings.interactiveMode) {
        this.interactiveMode = this.settings.interactiveMode;

        // If switching to interactive mode, setup interactions
        if (this.interactiveMode && !this.mouseDownHandler) {
          this.setupInteraction();
        }
      }

      // Update visual enhancement settings
      if (this.settings.glowStrength !== undefined) {
        this.glowStrength = this.settings.glowStrength;
      }

      if (this.settings.minPointSize !== undefined) {
        this.minPointSize = this.settings.minPointSize;
      }

      this.lastSettingsUpdate = Date.now();
    }
  }

  // Convert 3D coordinates to 2D screen coordinates with enhanced perspective
  project(point) {
    // Update screen center
    this.screenCenter = {
      x: this.width / 2,
      y: this.height / 2
    };

    // Apply global scaling to make everything larger
    let x = point.x * this.globalScale;
    let y = point.y * this.globalScale;
    let z = point.z * this.globalScale;

    // Apply camera rotation using full rotation matrices for better accuracy
    // Rotate around Y axis
    const cosY = Math.cos(this.cameraRotation.y);
    const sinY = Math.sin(this.cameraRotation.y);
    const tempX = x * cosY - z * sinY;
    z = z * cosY + x * sinY;
    x = tempX;

    // Rotate around X axis
    const cosX = Math.cos(this.cameraRotation.x);
    const sinX = Math.sin(this.cameraRotation.x);
    const tempY = y * cosX - z * sinX;
    z = z * cosX + y * sinX;
    y = tempY;

    // Apply translation relative to camera
    z += this.cameraDistance;

    // Early culling for points behind camera
    if (z <= this.nearClippingPlane) {
      return { x: 0, y: 0, visible: false, scale: 0, depth: 0 };
    }

    // Enforce far clipping plane
    if (z > this.farClippingPlane) {
      return { x: 0, y: 0, visible: false, scale: 0, depth: z };
    }

    // Apply perspective projection with improved scaling
    // The lower the value, the stronger the perspective effect
    const fovFactor = this.fov / 60;
    const scale = (fovFactor * this.height / 2) / z;

    // Convert to screen coordinates
    const screenX = this.screenCenter.x + x * scale;
    const screenY = this.screenCenter.y - y * scale;

    // Check if point is within screen bounds (with some margin)
    const margin = 100; // Allow points slightly off-screen
    const visible = (
      screenX > -margin &&
      screenX < this.width + margin &&
      screenY > -margin &&
      screenY < this.height + margin
    );

    return {
      x: screenX,
      y: screenY,
      visible: visible,
      scale: scale,
      depth: z
    };
  }

  // Draw a 3D point with enhanced visibility
  drawPoint(point, size, color, options = {}) {
    const projected = this.project(point);

    if (!projected.visible) return null;

    // Scale point size by projection scale but ensure minimum size
    const baseRadius = Math.max(this.minPointSize, size * projected.scale);
    const radius = options.energyFactor ? baseRadius * options.energyFactor : baseRadius;

    // Apply glow if requested
    if (options.glow) {
      const glowRadius = radius * 3 * this.glowStrength;
      this.ctx.beginPath();
      this.ctx.arc(projected.x, projected.y, glowRadius, 0, Math.PI * 2);

      const gradient = this.ctx.createRadialGradient(
        projected.x, projected.y, 0,
        projected.x, projected.y, glowRadius
      );

      const glowOpacity = options.glowOpacity || 0.4;
      gradient.addColorStop(0, this.getColor(options.colorIndex || 0, glowOpacity));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    // Draw the point itself
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    return projected;
  }

  // Draw a 3D line with enhanced visibility
  drawLine(point1, point2, color, width = 1, options = {}) {
    const proj1 = this.project(point1);
    const proj2 = this.project(point2);

    if (!proj1.visible || !proj2.visible) return null;

    // Calculate appropriate line width based on depth
    const scaleFactor = Math.min(proj1.scale, proj2.scale);
    const lineWidth = width * scaleFactor * (options.widthFactor || 1);

    // Apply glow if requested
    if (options.glow) {
      this.ctx.shadowBlur = lineWidth * 2 * this.glowStrength;
      this.ctx.shadowColor = color;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(proj1.x, proj1.y);
    this.ctx.lineTo(proj2.x, proj2.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = Math.max(0.5, lineWidth);
    this.ctx.stroke();

    // Reset shadow
    if (options.glow) {
      this.ctx.shadowBlur = 0;
    }

    return [proj1, proj2];
  }

  // Draw a 3D polygon (face) with enhanced visibility
  drawPolygon(points, color, outline = false, options = {}) {
    const projectedPoints = points.map(point => this.project(point));

    // Skip if any point is not visible
    if (projectedPoints.some(p => !p.visible)) return null;

    this.ctx.beginPath();
    this.ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);

    for (let i = 1; i < projectedPoints.length; i++) {
      this.ctx.lineTo(projectedPoints[i].x, projectedPoints[i].y);
    }

    this.ctx.closePath();

    // Apply glow if requested
    if (options.glow) {
      this.ctx.shadowBlur = 15 * this.glowStrength;
      this.ctx.shadowColor = color;
    }

    this.ctx.fillStyle = color;
    this.ctx.fill();

    if (outline) {
      this.ctx.strokeStyle = options.outlineColor || 'rgba(0, 0, 0, 0.5)';
      this.ctx.lineWidth = options.outlineWidth || 1;
      this.ctx.stroke();
    }

    // Reset shadow
    if (options.glow) {
      this.ctx.shadowBlur = 0;
    }

    return projectedPoints;
  }

  // Clear the canvas with optional fade effect
  clear(fadeAlpha = 1) {
    if (fadeAlpha < 1) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = 'rgb(0, 0, 0)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  // Update animation time and camera position
  update(freqData) {
    // Check for settings updates every frame
    this.checkSettingsUpdate();

    const avgEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;

    // Update time with energy-based acceleration
    this.time += 0.01 * (1 + avgEnergy * 0.5);

    // Update rotation if auto-rotate is enabled and not in interactive drag mode
    if (this.autoRotate && !this.isInteracting) {
      this.cameraRotation.y += this.rotationSpeed * (1 + avgEnergy * 0.5);
    }

    return avgEnergy;
  }

  // Add a background glow effect for the scene
  addBackgroundGlow(colorIndex = 0, intensity = 0.5) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.max(this.width, this.height) * 0.7;

    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    gradient.addColorStop(0, this.getColor(colorIndex, 0.15 * intensity));
    gradient.addColorStop(0.5, this.getColor(colorIndex, 0.05 * intensity));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  destroy() {
    super.destroy();

    // Remove event listeners for interactive mode
    if (this.interactiveMode) {
      this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
      this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
      this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
      this.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
      this.canvas.removeEventListener('mouseenter', this.mouseEnterHandler);
      this.canvas.removeEventListener('wheel', this.wheelHandler);

      // Touch events
      this.canvas.removeEventListener('touchstart');
      this.canvas.removeEventListener('touchmove');
      this.canvas.removeEventListener('touchend');
    }
  }
}
// Cube 3D Visualization
class Cube3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.gridSize = this.settings.gridSize || 10;
    this.cubeSize = this.settings.cubeSize || 0.4;
    this.gridSpacing = this.settings.gridSpacing || 1.0;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;

    // Create cubes
    this.cubes = [];

    // Calculate grid offset to center
    const offset = (this.gridSize - 1) * this.gridSpacing / 2;

    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        // Get color based on position
        const colorIndex = Math.floor((x + z) / (this.gridSize * 2) * this.colors.length);

        this.cubes.push({
          position: {
            x: x * this.gridSpacing - offset,
            y: 0,
            z: z * this.gridSpacing - offset
          },
          size: this.cubeSize,
          height: 1,
          targetHeight: 1,
          colorIndex,
          x,
          z
        });
      }
    }

    // Set initial camera position
    this.cameraPosition = { x: 10, y: 10, z: 15 };
    this.cameraRotation = { x: -0.5, y: -0.7, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update cubes based on audio data
    this.cubes.forEach(cube => {
      // Calculate radial distance from center
      const centerX = this.gridSize / 2;
      const centerZ = this.gridSize / 2;
      const deltaX = cube.x - centerX;
      const deltaZ = cube.z - centerZ;
      const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      const normalizedDistance = distance / (this.gridSize / 2);

      // Get frequency data based on distance from center
      const freqIndex = Math.floor(normalizedDistance * freqData.length);
      const value = (freqData[Math.min(freqIndex, freqData.length - 1)] / 255) * this.amplification;

      // Calculate target height
      cube.targetHeight = value * 4;

      // Apply smoothing
      cube.height += (cube.targetHeight - cube.height) * (1 - this.smoothing);

      // Update cube position
      cube.position.y = cube.height / 2;
    });

    // Sort cubes by depth for proper rendering
    const sortedCubes = [...this.cubes].sort((a, b) => {
      // Transform positions based on camera rotation for proper depth sorting
      const posA = {
        x: a.position.x,
        y: a.position.y,
        z: a.position.z
      };

      const posB = {
        x: b.position.x,
        y: b.position.y,
        z: b.position.z
      };

      // Apply rotation
      const cosY = Math.cos(this.cameraRotation.y);
      const sinY = Math.sin(this.cameraRotation.y);

      const rotatedAZ = posA.z * cosY + posA.x * sinY;
      const rotatedBZ = posB.z * cosY + posB.x * sinY;

      return rotatedBZ - rotatedAZ;
    });

    // Draw each cube
    sortedCubes.forEach(cube => {
      const halfSize = cube.size / 2;
      const scaledHeight = Math.max(cube.size, cube.height);
      const halfHeight = scaledHeight / 2;

      // Calculate brightness based on height
      const brightness = 0.5 + cube.height / 8;

      // Define the 8 corners of the cube
      const corners = [
        // Bottom face
        { x: cube.position.x - halfSize, y: cube.position.y - halfHeight, z: cube.position.z - halfSize },
        { x: cube.position.x + halfSize, y: cube.position.y - halfHeight, z: cube.position.z - halfSize },
        { x: cube.position.x + halfSize, y: cube.position.y - halfHeight, z: cube.position.z + halfSize },
        { x: cube.position.x - halfSize, y: cube.position.y - halfHeight, z: cube.position.z + halfSize },
        // Top face
        { x: cube.position.x - halfSize, y: cube.position.y + halfHeight, z: cube.position.z - halfSize },
        { x: cube.position.x + halfSize, y: cube.position.y + halfHeight, z: cube.position.z - halfSize },
        { x: cube.position.x + halfSize, y: cube.position.y + halfHeight, z: cube.position.z + halfSize },
        { x: cube.position.x - halfSize, y: cube.position.y + halfHeight, z: cube.position.z + halfSize }
      ];

      // Define the 6 faces of the cube
      const faces = [
        [0, 1, 2, 3], // Bottom
        [4, 5, 6, 7], // Top
        [0, 1, 5, 4], // Front
        [1, 2, 6, 5], // Right
        [2, 3, 7, 6], // Back
        [3, 0, 4, 7]  // Left
      ];

      // Draw each face with proper color
      faces.forEach((face, i) => {
        // Use color based on height and face
        const baseColor = this.getColor(cube.colorIndex);
        const color = i === 1 ? this.getColor(cube.colorIndex, brightness) : baseColor;

        // Create polygon from face vertices
        const polygon = face.map(index => corners[index]);

        // Draw the face
        this.drawPolygon(polygon, color, true);
      });
    });
  }
}

// Equalizer 3D Visualization
class Equalizer3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.barCount = this.settings.barCount || 32;
    this.barWidth = this.settings.barWidth || 0.4;
    this.barDepth = this.settings.barDepth || 0.4;
    this.barSpacing = this.settings.barSpacing || 0.2;
    this.layout = this.settings.layout || 'circular'; // 'circular', 'grid', or 'linear'
    this.radius = this.settings.radius || 8;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;

    // Create bars
    this.bars = [];

    // Create different layouts
    if (this.layout === 'circular') {
      this.createCircularLayout();
    } else if (this.layout === 'grid') {
      this.createGridLayout();
    } else {
      this.createLinearLayout();
    }

    // Set initial camera position
    this.cameraPosition = { x: 0, y: 15, z: 20 };
    this.cameraRotation = { x: -0.5, y: 0, z: 0 };
  }

  createCircularLayout() {
    const angleIncrement = (Math.PI * 2) / this.barCount;

    for (let i = 0; i < this.barCount; i++) {
      const angle = i * angleIncrement;

      // Position in circle
      const position = {
        x: Math.cos(angle) * this.radius,
        y: 0,
        z: Math.sin(angle) * this.radius
      };

      // Get color
      const colorIndex = Math.floor(i / this.barCount * this.colors.length);

      // Store bar data
      this.bars.push({
        position,
        angle,
        width: this.barWidth,
        depth: this.barDepth,
        height: 1,
        targetHeight: 1,
        colorIndex,
        index: i
      });
    }
  }

  createGridLayout() {
    // Calculate grid size
    const gridSide = Math.ceil(Math.sqrt(this.barCount));
    const spacing = this.barWidth + this.barSpacing;
    const offset = (gridSide * spacing) / 2 - spacing / 2;

    let barIndex = 0;

    for (let x = 0; x < gridSide && barIndex < this.barCount; x++) {
      for (let z = 0; z < gridSide && barIndex < this.barCount; z++) {
        // Position in grid
        const position = {
          x: x * spacing - offset,
          y: 0,
          z: z * spacing - offset
        };

        // Get color
        const colorIndex = Math.floor(barIndex / this.barCount * this.colors.length);

        // Store bar data
        this.bars.push({
          position,
          angle: 0,
          width: this.barWidth,
          depth: this.barDepth,
          height: 1,
          targetHeight: 1,
          colorIndex,
          index: barIndex
        });

        barIndex++;
      }
    }
  }

  createLinearLayout() {
    const spacing = this.barWidth + this.barSpacing;
    const offset = (this.barCount * spacing) / 2 - spacing / 2;

    for (let i = 0; i < this.barCount; i++) {
      // Position in line
      const position = {
        x: i * spacing - offset,
        y: 0,
        z: 0
      };

      // Get color
      const colorIndex = Math.floor(i / this.barCount * this.colors.length);

      // Store bar data
      this.bars.push({
        position,
        angle: 0,
        width: this.barWidth,
        depth: this.barDepth,
        height: 1,
        targetHeight: 1,
        colorIndex,
        index: i
      });
    }
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update bars based on frequency data
    this.bars.forEach(bar => {
      // Get frequency data for this bar
      const freqIndex = Math.floor(bar.index * freqData.length / this.bars.length);
      const value = (freqData[freqIndex] / 255) * this.amplification;

      // Calculate target height (minimum 0.1)
      bar.targetHeight = Math.max(0.1, value * 10);

      // Apply smoothing
      bar.height += (bar.targetHeight - bar.height) * (1 - this.smoothing);

      // Update bar position
      bar.position.y = bar.height / 2;
    });

    // Sort bars by depth for proper rendering
    const sortedBars = [...this.bars].sort((a, b) => {
      // Apply rotation to calculate depth
      const cosY = Math.cos(this.cameraRotation.y);
      const sinY = Math.sin(this.cameraRotation.y);

      const aZ = a.position.z * cosY + a.position.x * sinY;
      const bZ = b.position.z * cosY + b.position.x * sinY;

      return bZ - aZ;
    });

    // Draw each bar
    sortedBars.forEach(bar => {
      const halfWidth = bar.width / 2;
      const halfDepth = bar.depth / 2;
      const halfHeight = bar.height / 2;

      // For circular layout, rotate the bar to face center
      let corners;

      if (this.layout === 'circular') {
        // Calculate corners with rotation
        const sin = Math.sin(bar.angle);
        const cos = Math.cos(bar.angle);

        corners = [
          // Bottom face
          {
            x: bar.position.x - halfDepth * sin - halfWidth * cos,
            y: bar.position.y - halfHeight,
            z: bar.position.z - halfDepth * cos + halfWidth * sin
          },
          {
            x: bar.position.x + halfDepth * sin - halfWidth * cos,
            y: bar.position.y - halfHeight,
            z: bar.position.z + halfDepth * cos + halfWidth * sin
          },
          {
            x: bar.position.x + halfDepth * sin + halfWidth * cos,
            y: bar.position.y - halfHeight,
            z: bar.position.z + halfDepth * cos - halfWidth * sin
          },
          {
            x: bar.position.x - halfDepth * sin + halfWidth * cos,
            y: bar.position.y - halfHeight,
            z: bar.position.z - halfDepth * cos - halfWidth * sin
          },
          // Top face
          {
            x: bar.position.x - halfDepth * sin - halfWidth * cos,
            y: bar.position.y + halfHeight,
            z: bar.position.z - halfDepth * cos + halfWidth * sin
          },
          {
            x: bar.position.x + halfDepth * sin - halfWidth * cos,
            y: bar.position.y + halfHeight,
            z: bar.position.z + halfDepth * cos + halfWidth * sin
          },
          {
            x: bar.position.x + halfDepth * sin + halfWidth * cos,
            y: bar.position.y + halfHeight,
            z: bar.position.z + halfDepth * cos - halfWidth * sin
          },
          {
            x: bar.position.x - halfDepth * sin + halfWidth * cos,
            y: bar.position.y + halfHeight,
            z: bar.position.z - halfDepth * cos - halfWidth * sin
          }
        ];
      } else {
        // Standard orientation for grid and linear layouts
        corners = [
          // Bottom face
          { x: bar.position.x - halfWidth, y: bar.position.y - halfHeight, z: bar.position.z - halfDepth },
          { x: bar.position.x + halfWidth, y: bar.position.y - halfHeight, z: bar.position.z - halfDepth },
          { x: bar.position.x + halfWidth, y: bar.position.y - halfHeight, z: bar.position.z + halfDepth },
          { x: bar.position.x - halfWidth, y: bar.position.y - halfHeight, z: bar.position.z + halfDepth },
          // Top face
          { x: bar.position.x - halfWidth, y: bar.position.y + halfHeight, z: bar.position.z - halfDepth },
          { x: bar.position.x + halfWidth, y: bar.position.y + halfHeight, z: bar.position.z - halfDepth },
          { x: bar.position.x + halfWidth, y: bar.position.y + halfHeight, z: bar.position.z + halfDepth },
          { x: bar.position.x - halfWidth, y: bar.position.y + halfHeight, z: bar.position.z + halfDepth }
        ];
      }

      // Define the 6 faces of the bar
      const faces = [
        [0, 1, 2, 3], // Bottom
        [4, 5, 6, 7], // Top
        [0, 1, 5, 4], // Front
        [1, 2, 6, 5], // Right
        [2, 3, 7, 6], // Back
        [3, 0, 4, 7]  // Left
      ];

      // Calculate brightness based on height
      const brightness = 0.5 + bar.height / 10;

      // Draw each face
      faces.forEach((face, i) => {
        // Use brighter color for top face
        const color = i === 1
        ? this.getColor(bar.colorIndex, brightness)
        : this.getColor(bar.colorIndex);

        // Create polygon from face vertices
        const polygon = face.map(index => corners[index]);

        // Draw the face
        this.drawPolygon(polygon, color, true);
      });
    });
  }
}

// Tunnel 3D Visualization
class Tunnel3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.tunnelRadius = this.settings.tunnelRadius || 5;
    this.tunnelLength = this.settings.tunnelLength || 30;
    this.segments = this.settings.segments || 16;
    this.rings = this.settings.rings || 20;
    this.speed = this.settings.speed || 0.1;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.deformation = this.settings.deformation || 0.3;

    // Create tunnel rings
    this.tunnelRings = [];

    for (let i = 0; i < this.rings; i++) {
      const ringPoints = [];
      const z = -i * (this.tunnelLength / this.rings);

      // Create ring points
      for (let j = 0; j <= this.segments; j++) {
        const angle = (j / this.segments) * Math.PI * 2;
        const x = Math.cos(angle) * this.tunnelRadius;
        const y = Math.sin(angle) * this.tunnelRadius;

        ringPoints.push({
          originalPosition: { x, y, z },
          position: { x, y, z },
          angle
        });
      }

      this.tunnelRings.push({
        points: ringPoints,
        z: z,
        originalZ: z,
        index: i,
        colorIndex: i % this.colors.length
      });
    }

    // Smoothed values for transitions
    this.smoothedDeformations = new Array(this.segments).fill(0);

    // Set camera position inside the tunnel
    this.cameraPosition = { x: 0, y: 0, z: -5 };
    this.cameraRotation = { x: 0, y: 0, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update ring positions based on speed
    this.tunnelRings.forEach(ring => {
      ring.z = ring.originalZ + (this.time * this.speed * 10) % (this.tunnelLength / this.rings);

      // If ring went past camera, move it back to the end of tunnel
      if (ring.z > 5) {
        ring.z -= this.tunnelLength;
      }

      // Update points
      ring.points.forEach((point, j) => {
        const angle = point.angle;

        // Get frequency data based on angle
        const freqIndex = Math.floor((angle / (Math.PI * 2)) * freqData.length);
        const value = (freqData[freqIndex] / 255) * this.amplification;

        // Apply smoothing to deformation
        if (j < this.segments) { // Skip last point (which is a duplicate of first)
          this.smoothedDeformations[j] += (value - this.smoothedDeformations[j]) * (1 - this.smoothing);
        }

        // Calculate deformation based on audio and angle
        const angleOffset = (this.time * 2 + angle * 3) % (Math.PI * 2);
        const deformation = this.deformation * this.smoothedDeformations[j % this.smoothedDeformations.length] * Math.sin(angleOffset);

        // Apply deformation
        const radius = this.tunnelRadius * (1 + deformation);

        // Update position
        point.position = {
          x: Math.cos(angle) * radius,
                          y: Math.sin(angle) * radius,
                          z: ring.z
        };
      });
    });

    // Sort rings by depth for proper rendering (from back to front)
    const sortedRings = [...this.tunnelRings].sort((a, b) => a.z - b.z);

    // Draw rings
    sortedRings.forEach(ring => {
      const points = ring.points;
      const colorIndex = ring.index % this.colors.length;

      // Calculate opacity based on distance from camera
      const distFromCamera = Math.abs(ring.z + 5);
      const opacity = 0.2 + 0.8 * (1 - distFromCamera / this.tunnelLength);

      // Draw ring segments
      for (let i = 0; i < points.length - 1; i++) {
        const color = this.getColor(colorIndex, opacity);
        this.drawLine(points[i].position, points[i + 1].position, color, 2);
      }

      // Draw connections to next ring if not the last ring
      if (ring.index < this.rings - 1) {
        const nextRingIndex = (ring.index + 1) % this.rings;
        const nextRing = sortedRings.find(r => r.index === nextRingIndex);

        if (nextRing && nextRing.z < ring.z) {
          // Draw every few connections to reduce visual clutter
          for (let i = 0; i < points.length - 1; i += 2) {
            const color = this.getColor(colorIndex, opacity * 0.5);
            this.drawLine(points[i].position, nextRing.points[i].position, color, 1);
          }
        }
      }
    });
  }
}

// AudioScape 3D Visualization
class AudioScape3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.gridWidth = this.settings.gridWidth || 32;
    this.gridDepth = this.settings.gridDepth || 32;
    this.gridSpacing = this.settings.gridSpacing || 0.5;
    this.maxHeight = this.settings.maxHeight || 5;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.speed = this.settings.speed || 0.05;
    this.wireframe = this.settings.wireframe || false;

    // Create landscape grid
    this.grid = [];

    // Calculate grid dimensions
    const halfWidth = (this.gridWidth - 1) * this.gridSpacing / 2;
    const halfDepth = (this.gridDepth - 1) * this.gridSpacing / 2;

    // Create grid points
    for (let z = 0; z < this.gridDepth; z++) {
      const row = [];

      for (let x = 0; x < this.gridWidth; x++) {
        row.push({
          position: {
            x: x * this.gridSpacing - halfWidth,
            y: 0,
            z: z * this.gridSpacing - halfDepth
          },
          height: 0
        });
      }

      this.grid.push(row);
    }

    // Smoothed heights for transitions
    this.smoothedHeights = new Array(this.gridWidth * this.gridDepth).fill(0);

    // Set camera position
    this.cameraPosition = { x: 0, y: 10, z: 15 };
    this.cameraRotation = { x: -0.5, y: 0, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update landscape heights based on audio data
    for (let z = 0; z < this.gridDepth; z++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const point = this.grid[z][x];
        const index = z * this.gridWidth + x;

        // Use position to get frequency data - radial pattern
        const centerX = this.gridWidth / 2;
        const centerZ = this.gridDepth / 2;
        const distFromCenter = Math.sqrt(
          Math.pow((x - centerX) / this.gridWidth, 2) +
          Math.pow((z - centerZ) / this.gridDepth, 2)
        ) * 2;

        // Add time component for animation
        const timeOffset = Math.sin(this.time + distFromCenter * 5) * 0.2;

        // Get frequency index
        const freqIndex = Math.min(
          Math.floor((distFromCenter + timeOffset) * freqData.length),
                                   freqData.length - 1
        );

        // Get value and normalize
        const value = (freqData[freqIndex] / 255) * this.amplification;

        // Smooth values
        this.smoothedHeights[index] += (value - this.smoothedHeights[index]) * (1 - this.smoothing);

        // Update height
        point.height = this.smoothedHeights[index] * this.maxHeight;
        point.position.y = point.height;
      }
    }

    // Draw landscape
    if (this.wireframe) {
      // Draw wireframe
      for (let z = 0; z < this.gridDepth; z++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const point = this.grid[z][x].position;

          // Draw horizontal line (x direction)
          if (x < this.gridWidth - 1) {
            const nextPoint = this.grid[z][x + 1].position;

            // Calculate color based on height
            const avgHeight = (point.y + nextPoint.y) / (2 * this.maxHeight);
            const colorIndex = Math.floor(avgHeight * this.colors.length);
            const color = this.getColor(colorIndex);

            this.drawLine(point, nextPoint, color, 1);
          }

          // Draw vertical line (z direction)
          if (z < this.gridDepth - 1) {
            const nextPoint = this.grid[z + 1][x].position;

            // Calculate color based on height
            const avgHeight = (point.y + nextPoint.y) / (2 * this.maxHeight);
            const colorIndex = Math.floor(avgHeight * this.colors.length);
            const color = this.getColor(colorIndex);

            this.drawLine(point, nextPoint, color, 1);
          }
        }
      }
    } else {
      // Draw filled landscape with triangles
      // Sort triangles by depth for proper rendering
      const triangles = [];

      for (let z = 0; z < this.gridDepth - 1; z++) {
        for (let x = 0; x < this.gridWidth - 1; x++) {
          const p1 = this.grid[z][x].position;
          const p2 = this.grid[z][x + 1].position;
          const p3 = this.grid[z + 1][x + 1].position;
          const p4 = this.grid[z + 1][x].position;

          // Calculate average z-depth for sorting
          const avgZ1 = (p1.z + p2.z + p4.z) / 3;
          const avgZ2 = (p2.z + p3.z + p4.z) / 3;

          // Calculate average height for color
          const avgHeight1 = (p1.y + p2.y + p4.y) / (3 * this.maxHeight);
          const avgHeight2 = (p2.y + p3.y + p4.y) / (3 * this.maxHeight);

          // Add triangles with depth info
          triangles.push({
            points: [p1, p2, p4],
            depth: avgZ1,
            colorIndex: Math.floor(avgHeight1 * this.colors.length)
          });

          triangles.push({
            points: [p2, p3, p4],
            depth: avgZ2,
            colorIndex: Math.floor(avgHeight2 * this.colors.length)
          });
        }
      }

      // Sort triangles from back to front
      triangles.sort((a, b) => a.depth - b.depth);

      // Draw triangles
      triangles.forEach(triangle => {
        const color = this.getColor(triangle.colorIndex);
        this.drawPolygon(triangle.points, color);
      });
    }

    // Add a wave effect with lines connecting peaks
    if (avgEnergy > 0.4) {
      const waveOffset = Math.floor(this.time * 10) % this.gridDepth;
      const waveZ = this.grid[waveOffset];

      if (waveZ) {
        for (let x = 0; x < this.gridWidth - 1; x++) {
          const p1 = waveZ[x].position;
          const p2 = waveZ[x + 1].position;

          // Use a bright color for the wave
          const color = this.getColor(3, 0.7);
          this.drawLine(p1, p2, color, 2);
        }
      }
    }
  }
}

// Galaxy 3D Visualization
class Galaxy3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.starCount = this.settings.starCount || 1000;
    this.galaxyRadius = this.settings.galaxyRadius || 15;
    this.galaxyThickness = this.settings.galaxyThickness || 3;
    this.spiralArms = this.settings.spiralArms || 5;
    this.spiralTightness = this.settings.spiralTightness || 3;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.starSize = this.settings.starSize || 0.1;

    // Generate stars
    this.stars = [];

    for (let i = 0; i < this.starCount; i++) {
      // Assign to a spiral arm
      const arm = Math.floor(Math.random() * this.spiralArms);

      // Distance from center (more stars toward center)
      const distance = Math.pow(Math.random(), 2) * this.galaxyRadius;

      // Angle based on distance and arm
      const branchAngle = (arm / this.spiralArms) * Math.PI * 2;
      const spinAngle = distance * this.spiralTightness;
      const angle = branchAngle + spinAngle;

      // Create spiral positions
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Random height within galaxy thickness (thinner toward edges)
      const heightFactor = 1 - distance / this.galaxyRadius;
      const y = (Math.random() * 2 - 1) * this.galaxyThickness * heightFactor;

      // Assign color based on arm and distance
      const colorIndex = Math.floor((arm / this.spiralArms + distance / this.galaxyRadius) * this.colors.length / 2);

      this.stars.push({
        position: { x, y, z },
        originalPosition: { x, y, z },
        size: this.starSize * (1 - 0.5 * (distance / this.galaxyRadius)),
                      distance,
                      angle,
                      arm,
                      colorIndex: colorIndex % this.colors.length
      });
    }

    // Set camera position
    this.cameraPosition = { x: 0, y: 20, z: 30 };
    this.cameraRotation = { x: -0.5, y: 0, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update star positions based on audio
    this.stars.forEach(star => {
      // Get frequency data based on distance from center
      const freqIndex = Math.floor(star.distance / this.galaxyRadius * freqData.length);
      const value = (freqData[Math.min(freqIndex, freqData.length - 1)] / 255) * this.amplification;

      // Calculate rotation angle based on time and distance
      const rotationSpeed = 1 - (star.distance / this.galaxyRadius) * 0.5;
      const timeAngle = this.time * 0.2 * rotationSpeed;

      // Calculate new angle
      const angle = star.angle + timeAngle;

      // Apply audio reactivity
      const energyFactor = 1 + value * 0.2;
      const reactiveDistance = star.distance * energyFactor;

      // Calculate new position
      star.position = {
        x: Math.cos(angle) * reactiveDistance,
                       y: star.originalPosition.y + (value - 0.5) * this.galaxyThickness * 0.2,
                       z: Math.sin(angle) * reactiveDistance
      };
    });

    // Sort stars by depth for proper rendering
    const sortedStars = [...this.stars].sort((a, b) => {
      // Apply rotation to calculate depth
      const cosY = Math.cos(this.cameraRotation.y);
      const sinY = Math.sin(this.cameraRotation.y);

      const aZ = a.position.z * cosY + a.position.x * sinY;
      const bZ = b.position.z * cosY + b.position.x * sinY;

      return aZ - bZ;
    });

    // Draw stars from back to front
    sortedStars.forEach(star => {
      // Get color with brightness based on energy
      const freqIndex = Math.floor(star.distance / this.galaxyRadius * freqData.length);
      const value = (freqData[Math.min(freqIndex, freqData.length - 1)] / 255);
      const brightness = 0.5 + value * 0.5;

      const color = this.getColor(star.colorIndex, brightness);

      // Draw star with appropriate size
      const size = star.size * (1 + value);
      this.drawPoint(star.position, size, color);

      // Add glow for brighter stars
      if (value > 0.7) {
        const projected = this.project(star.position);

        if (projected.visible) {
          this.ctx.beginPath();
          this.ctx.arc(projected.x, projected.y, size * projected.scale * 3, 0, Math.PI * 2);

          const gradient = this.ctx.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, size * projected.scale * 3
          );

          gradient.addColorStop(0, this.getColor(star.colorIndex, 0.3));
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = gradient;
          this.ctx.fill();
        }
      }
    });

    // Draw central glow
    const centerPosition = { x: 0, y: 0, z: 0 };
    const projected = this.project(centerPosition);

    if (projected.visible) {
      const glowRadius = (3 + avgEnergy * 2) * projected.scale;

      this.ctx.beginPath();
      this.ctx.arc(projected.x, projected.y, glowRadius, 0, Math.PI * 2);

      const gradient = this.ctx.createRadialGradient(
        projected.x, projected.y, 0,
        projected.x, projected.y, glowRadius
      );

      const glowColor = this.getColor(0, 0.5 + avgEnergy * 0.5);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }
}

// Nebula 3D Visualization
class Nebula3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.particleCount = this.settings.particleCount || 1000;
    this.cloudSize = this.settings.cloudSize || 20;
    this.cloudDensity = this.settings.cloudDensity || 15;
    this.smoothing = this.settings.smoothing || 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.evolution = this.settings.evolution || 0.002;
    this.colorCycle = this.settings.colorCycle || false;
    this.colorCycleSpeed = this.settings.colorCycleSpeed || 0.01;

    // Generate particles
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      // Nebula-like distribution (denser in center)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Use power distribution to concentrate particles near center
      const r = Math.pow(Math.random(), this.cloudDensity) * this.cloudSize;

      // Convert spherical to Cartesian coordinates
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      // Assign color from palette
      const colorIndex = Math.floor(Math.random() * this.colors.length);

      this.particles.push({
        position: { x, y, z },
        originalPosition: { x, y, z },
        size: 0.1 + Math.random() * 0.2,
                          opacity: 0.1 + Math.random() * 0.9,
                          colorIndex
      });
    }

    // Set camera position
    this.cameraPosition = { x: 0, y: 0, z: 30 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update particles based on time and audio
    this.particles.forEach((particle, i) => {
      // Get frequency data
      const freqIndex = Math.floor(i * freqData.length / this.particles.length);
      const value = (freqData[freqIndex] / 255) * this.amplification;

      // Use simplex noise effect (approximated with sine waves)
      const noiseX = Math.sin(this.time * 0.1 + particle.originalPosition.x * 0.1) * 2;
      const noiseY = Math.sin(this.time * 0.1 + particle.originalPosition.y * 0.1) * 2;
      const noiseZ = Math.sin(this.time * 0.1 + particle.originalPosition.z * 0.1) * 2;

      // Move particles based on noise
      particle.position = {
        x: particle.originalPosition.x + noiseX * value,
        y: particle.originalPosition.y + noiseY * value,
        z: particle.originalPosition.z + noiseZ * value
      };

      // Update opacity based on time and position
      particle.currentOpacity = particle.opacity * (0.5 + 0.5 * Math.sin(this.time + particle.originalPosition.x * 5));

      // Update color if color cycling is enabled
      if (this.colorCycle) {
        const colorShift = Math.floor(this.time * this.colorCycleSpeed);
        particle.currentColorIndex = (particle.colorIndex + colorShift) % this.colors.length;
      } else {
        particle.currentColorIndex = particle.colorIndex;
      }
    });

    // Sort particles by depth for proper rendering
    const sortedParticles = [...this.particles].sort((a, b) => {
      return a.position.z - b.position.z;
    });

    // Draw particles from back to front
    sortedParticles.forEach(particle => {
      const projected = this.project(particle.position);

      if (projected.visible) {
        // Draw particle with glow effect
        const size = particle.size * projected.scale * 3;

        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);

        const gradient = this.ctx.createRadialGradient(
          projected.x, projected.y, 0,
          projected.x, projected.y, size
        );

        const color = this.getColor(particle.currentColorIndex, particle.currentOpacity);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
    });

    // Draw central nebula core
    const centerPosition = { x: 0, y: 0, z: 0 };
    const projected = this.project(centerPosition);

    if (projected.visible) {
      const coreSize = (5 + avgEnergy * 3) * projected.scale;

      this.ctx.beginPath();
      this.ctx.arc(projected.x, projected.y, coreSize, 0, Math.PI * 2);

      const gradient = this.ctx.createRadialGradient(
        projected.x, projected.y, 0,
        projected.x, projected.y, coreSize
      );

      gradient.addColorStop(0, this.getColor(0, 0.7));
      gradient.addColorStop(0.5, this.getColor(1, 0.3));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }
}

// Spiral 3D Visualization
class Spiral3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.pointCount = this.settings.pointCount || 500;
    this.spiralTurns = this.settings.spiralTurns || 5;
    this.radius = this.settings.radius || 10;
    this.height = this.settings.height || 15;
    this.pointSize = this.settings.pointSize || 0.15;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.responsive = this.settings.responsive !== false;

    // Create spiral points
    this.points = [];

    for (let i = 0; i < this.pointCount; i++) {
      const t = i / this.pointCount;

      // Spiral formula
      const angle = t * Math.PI * 2 * this.spiralTurns;
      const radius = this.radius * (1 - t * 0.3); // Radius decreases slightly toward the top
      const x = Math.cos(angle) * radius;
      const y = t * this.height - this.height / 2; // Center vertically
      const z = Math.sin(angle) * radius;

      // Assign color based on position
      const colorIndex = Math.floor(t * this.colors.length);

      this.points.push({
        position: { x, y, z },
        originalPosition: { x, y, z },
        size: this.pointSize * (1 - t * 0.5),
                       colorIndex: colorIndex % this.colors.length,
                       t
      });
    }

    // Set camera position
    this.cameraPosition = { x: 0, y: 5, z: 20 };
    this.cameraRotation = { x: -0.2, y: 0, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update point positions based on audio
    this.points.forEach((point, i) => {
      // Get frequency for this point
      const freqIndex = Math.floor(point.t * freqData.length);
      const value = (freqData[freqIndex] / 255) * this.amplification;

      if (this.responsive) {
        // Calculate direction from center
        const dir = {
          x: point.originalPosition.x / Math.sqrt(point.originalPosition.x ** 2 + point.originalPosition.z ** 2),
                        z: point.originalPosition.z / Math.sqrt(point.originalPosition.x ** 2 + point.originalPosition.z ** 2)
        };

        // Apply displacement based on audio
        const displacement = value * 2.0;
        point.position = {
          x: point.originalPosition.x + dir.x * displacement,
          y: point.originalPosition.y + (value - 0.5) * 1.0,
                        z: point.originalPosition.z + dir.z * displacement
        };
      }
    });

    // Sort points by depth for proper rendering
    const sortedPoints = [...this.points].sort((a, b) => a.position.z - b.position.z);

    // Draw spiral points
    sortedPoints.forEach(point => {
      const freqIndex = Math.floor(point.t * freqData.length);
      const value = (freqData[freqIndex] / 255) * this.amplification;

      // Calculate size based on energy
      const size = point.size * (1 + value);

      // Draw point
      const color = this.getColor(point.colorIndex);
      this.drawPoint(point.position, size, color);

      // Add glow effect for higher energy
      if (value > 0.7) {
        const projected = this.project(point.position);

        if (projected.visible) {
          this.ctx.beginPath();
          this.ctx.arc(projected.x, projected.y, size * projected.scale * 3, 0, Math.PI * 2);

          const gradient = this.ctx.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, size * projected.scale * 3
          );

          gradient.addColorStop(0, this.getColor(point.colorIndex, 0.3));
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = gradient;
          this.ctx.fill();
        }
      }
    });

    // Draw connections between nearby points for a more cohesive spiral
    if (avgEnergy > 0.3) {
      for (let i = 0; i < sortedPoints.length - 1; i += 2) {
        const point = sortedPoints[i];
        const nextPoint = sortedPoints[i + 1];

        // Draw connection line
        this.drawLine(
          point.position,
          nextPoint.position,
          this.getColor(point.colorIndex, 0.2 + avgEnergy * 0.2),
                      1
        );
      }
    }
  }
}

// Vortex 3D Visualization
class Vortex3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.particleCount = this.settings.particleCount || 1000;
    this.height = this.settings.height || 20;
    this.radius = this.settings.radius || 8;
    this.particleSize = this.settings.particleSize || 0.15;
    this.vortexSpeed = this.settings.vortexSpeed || 0.03;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 1.5;

    // Create vortex particles
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      // Random height position
      const heightPos = Math.random() * this.height - this.height / 2;

      // Radius decreases toward top and bottom
      const heightFactor = 1 - Math.abs(heightPos / (this.height / 2));
      const radius = this.radius * heightFactor;

      // Random angle
      const angle = Math.random() * Math.PI * 2;

      // Random distance from center
      const distance = (0.2 + Math.random() * 0.8) * radius;

      // Calculate position
      const x = Math.cos(angle) * distance;
      const y = heightPos;
      const z = Math.sin(angle) * distance;

      // Assign color based on height
      const colorPos = (heightPos + this.height / 2) / this.height;
      const colorIndex = Math.floor(colorPos * this.colors.length);

      this.particles.push({
        position: { x, y, z },
        originalPosition: { x, y, z },
        size: this.particleSize * (0.5 + Math.random() * 0.5),
                          colorIndex: colorIndex % this.colors.length,
                          angle,
                          distance,
                          speed: 0.5 + Math.random() * 0.5
      });
    }

    // Set camera position
    this.cameraPosition = { x: 0, y: 0, z: 20 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update particle positions
    this.particles.forEach(particle => {
      // Get frequency data
      const freqIndex = Math.floor(
        ((particle.originalPosition.y + this.height / 2) / this.height) * freqData.length
      );
      const value = (freqData[freqIndex] / 255) * this.amplification;

      // Update angle based on time and speed
      const angle = particle.angle + this.time * particle.speed * (1 - particle.distance / this.radius);

      // Add energy-based modulation
      const energyFactor = 1 + value * 0.5;

      // Calculate new position
      particle.position = {
        x: Math.cos(angle) * particle.distance * energyFactor,
                           y: particle.originalPosition.y + (value - 0.5) * 2,
                           z: Math.sin(angle) * particle.distance * energyFactor
      };
    });

    // Sort particles by depth for proper rendering
    const sortedParticles = [...this.particles].sort((a, b) => a.position.z - b.position.z);

    // Draw particles
    sortedParticles.forEach(particle => {
      // Draw particle
      const color = this.getColor(particle.colorIndex);
      this.drawPoint(particle.position, particle.size, color);
    });

    // Draw connections between nearby particles if energy is high
    if (avgEnergy > 0.5) {
      for (let i = 0; i < sortedParticles.length; i += 10) {
        const particle = sortedParticles[i];

        // Find nearby particles
        for (let j = i + 1; j < i + 20 && j < sortedParticles.length; j++) {
          const other = sortedParticles[j];

          // Calculate distance
          const dx = particle.position.x - other.position.x;
          const dy = particle.position.y - other.position.y;
          const dz = particle.position.z - other.position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Connect nearby particles
          if (distance < 2) {
            const opacity = 0.3 * (1 - distance / 2);
            this.drawLine(
              particle.position,
              other.position,
              this.getColor(particle.colorIndex, opacity),
                          1
            );
          }
        }
      }
    }
  }
}
// Bars 3D Visualization
class Bars3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.barCount = this.settings.barCount || 64;
    this.barWidth = this.settings.barWidth || 0.2;
    this.barDepth = this.settings.barDepth || 0.2;
    this.barSpacing = this.settings.barSpacing || 0.05;
    this.cylindrical = this.settings.cylindrical !== undefined ? this.settings.cylindrical : true;
    this.smoothing = this.settings.smoothing !== undefined ? this.settings.smoothing : 0.8;
    this.amplification = this.settings.amplification || 2;
    this.radius = this.settings.radius || 8;

    // Create bars
    this.bars = [];
    const totalWidth = this.barCount * (this.barWidth + this.barSpacing) - this.barSpacing;

    for (let i = 0; i < this.barCount; i++) {
      // Calculate position based on layout
      let position = { x: 0, y: 0, z: 0 };
      let rotation = 0;

      if (this.cylindrical) {
        // Position in a circle
        const angle = (i / this.barCount) * Math.PI * 2;
        position.x = Math.sin(angle) * this.radius;
        position.z = Math.cos(angle) * this.radius;
        rotation = angle;
      } else {
        // Position in a line
        const offset = totalWidth / 2;
        position.x = i * (this.barWidth + this.barSpacing) - offset;
      }

      // Assign color based on position
      const colorIndex = Math.floor(i / this.barCount * this.colors.length);

      this.bars.push({
        position,
        rotation,
        height: 1,
        targetHeight: 1,
        colorIndex
      });
    }

    // Set initial camera position
    this.cameraPosition = { x: 0, y: 10, z: 15 };
    this.cameraRotation = { x: -0.5, y: 0, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update bars based on frequency data
    this.bars.forEach((bar, i) => {
      const freqIndex = Math.floor(i * freqData.length / this.bars.length);
      const value = (freqData[freqIndex] / 255) * this.amplification;

      // Calculate target height (minimum 0.1)
      bar.targetHeight = Math.max(0.1, value * 10);

      // Apply smoothing
      bar.height += (bar.targetHeight - bar.height) * (1 - this.smoothing);
    });

    // Sort bars by depth for proper rendering
    const sortedBars = [...this.bars].map(bar => {
      // Calculate actual position with rotation
      let x, z;

      if (this.cylindrical) {
        const angle = bar.rotation + this.cameraRotation.y;
        x = Math.sin(angle) * this.radius;
        z = Math.cos(angle) * this.radius;
      } else {
        x = bar.position.x;
        z = bar.position.z;
      }

      return {
        ...bar,
        actualPosition: { x, y: 0, z },
        depth: z
      };
    }).sort((a, b) => b.depth - a.depth);

    // Draw each bar
    sortedBars.forEach(bar => {
      const { actualPosition, height, colorIndex } = bar;
      const halfWidth = this.barWidth / 2;
      const halfDepth = this.barDepth / 2;

      // Define the 8 corners of the bar
      const corners = [
        // Bottom face
        { x: actualPosition.x - halfWidth, y: 0, z: actualPosition.z - halfDepth },
        { x: actualPosition.x + halfWidth, y: 0, z: actualPosition.z - halfDepth },
        { x: actualPosition.x + halfWidth, y: 0, z: actualPosition.z + halfDepth },
        { x: actualPosition.x - halfWidth, y: 0, z: actualPosition.z + halfDepth },
        // Top face
        { x: actualPosition.x - halfWidth, y: height, z: actualPosition.z - halfDepth },
        { x: actualPosition.x + halfWidth, y: height, z: actualPosition.z - halfDepth },
        { x: actualPosition.x + halfWidth, y: height, z: actualPosition.z + halfDepth },
        { x: actualPosition.x - halfWidth, y: height, z: actualPosition.z + halfDepth }
      ];

      // Define the 6 faces of the bar
      const faces = [
        [0, 1, 2, 3], // Bottom
        [4, 5, 6, 7], // Top
        [0, 1, 5, 4], // Front
        [1, 2, 6, 5], // Right
        [2, 3, 7, 6], // Back
        [3, 0, 4, 7]  // Left
      ];

      // Get color with brightness based on height
      const baseColor = this.getColor(colorIndex);
      const brightColor = this.getColor(colorIndex, Math.min(1, 0.5 + height / 10));

      // Draw each face
      faces.forEach((face, i) => {
        // Use brighter color for top face
        const color = i === 1 ? brightColor : baseColor;

        // Create polygon from face vertices
        const polygon = face.map(index => corners[index]);

        // Draw the face
        this.drawPolygon(polygon, color, true);
      });
    });
  }
}

// Sphere 3D Visualization
class Sphere3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.sphereSegments = this.settings.sphereSegments || 16;
    this.sphereRings = this.settings.sphereRings || 16;
    this.sphereRadius = this.settings.sphereRadius || 5;
    this.deformFactor = this.settings.deformFactor || 1.5;
    this.wireframe = this.settings.wireframe !== undefined ? this.settings.wireframe : false;
    this.smoothing = this.settings.smoothing || 0.8;
    this.amplification = this.settings.amplification || 1.5;

    // Generate sphere vertices
    this.generateSphere();

    // Store original vertices for deformation
    this.originalVertices = JSON.parse(JSON.stringify(this.vertices));
    this.smoothedHeights = new Array(this.vertices.length).fill(0);

    // Set initial camera position
    this.cameraPosition = { x: 0, y: 0, z: 15 };
  }

  generateSphere() {
    this.vertices = [];
    this.triangles = [];

    // Generate vertices
    for (let ring = 0; ring <= this.sphereRings; ring++) {
      const phi = (ring / this.sphereRings) * Math.PI;

      for (let segment = 0; segment <= this.sphereSegments; segment++) {
        const theta = (segment / this.sphereSegments) * Math.PI * 2;

        // Convert spherical to Cartesian coordinates
        const x = Math.sin(phi) * Math.cos(theta) * this.sphereRadius;
        const y = Math.cos(phi) * this.sphereRadius;
        const z = Math.sin(phi) * Math.sin(theta) * this.sphereRadius;

        this.vertices.push({ x, y, z });
      }
    }

    // Generate triangles
    for (let ring = 0; ring < this.sphereRings; ring++) {
      const ringStart = ring * (this.sphereSegments + 1);
      const nextRingStart = (ring + 1) * (this.sphereSegments + 1);

      for (let segment = 0; segment < this.sphereSegments; segment++) {
        // Define the four vertices of a quad
        const v1 = ringStart + segment;
        const v2 = ringStart + segment + 1;
        const v3 = nextRingStart + segment + 1;
        const v4 = nextRingStart + segment;

        // Create two triangles per quad
        this.triangles.push([v1, v2, v4]);
        this.triangles.push([v2, v3, v4]);
      }
    }
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update sphere deformation
    const deformedVertices = this.vertices.map((vertex, i) => {
      // Get original vertex
      const original = this.originalVertices[i];

      // Calculate normalized direction from center
      const length = Math.sqrt(
        original.x * original.x +
        original.y * original.y +
        original.z * original.z
      );

      // Get frequency data for this vertex
      const freqIndex = Math.floor(i * freqData.length / this.vertices.length);
      let deformation = (freqData[freqIndex] / 255) * this.amplification;

      // Apply smoothing
      this.smoothedHeights[i] += (deformation - this.smoothedHeights[i]) * (1 - this.smoothing);
      deformation = this.smoothedHeights[i];

      // Apply deformation along vertex normal
      const deformAmount = 1 + deformation * this.deformFactor;

      return {
        x: original.x * deformAmount,
        y: original.y * deformAmount,
        z: original.z * deformAmount
      };
    });

    // Draw the sphere
    if (this.wireframe) {
      // Draw wireframe
      for (let i = 0; i < this.triangles.length; i++) {
        const triangle = this.triangles[i];

        // Draw triangle edges
        for (let j = 0; j < 3; j++) {
          const v1 = deformedVertices[triangle[j]];
          const v2 = deformedVertices[triangle[(j + 1) % 3]];

          // Calculate color based on deformation
          const colorIndex = Math.floor(i / this.triangles.length * this.colors.length);
          const color = this.getColor(colorIndex, 0.5 + avgEnergy * 0.5);

          this.drawLine(v1, v2, color, 1);
        }
      }
    } else {
      // Draw solid triangles with depth sorting
      const trianglesWithDepth = this.triangles.map((triangle, i) => {
        const vertices = triangle.map(index => deformedVertices[index]);

        // Calculate average z-depth for sorting
        const avgZ = vertices.reduce((sum, v) => sum + v.z, 0) / 3;

        return {
          vertices,
          depth: avgZ,
          index: i
        };
      }).sort((a, b) => b.depth - a.depth);

      // Draw triangles from back to front
      trianglesWithDepth.forEach(({ vertices, index }) => {
        const colorIndex = Math.floor(index / this.triangles.length * this.colors.length);
        const color = this.getColor(colorIndex, 0.5 + avgEnergy * 0.5);

        this.drawPolygon(vertices, color, true);
      });
    }
  }
}

// Particles 3D Visualization
class Particles3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.particleCount = this.settings.particleCount || 500;
    this.particleSize = this.settings.particleSize || 0.1;
    this.maxDistance = this.settings.maxDistance || 15;
    this.minDistance = this.settings.minDistance || 5;
    this.particleSpeed = this.settings.particleSpeed || 0.05;
    this.smoothing = this.settings.smoothing || 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.showConnections = this.settings.showConnections !== undefined ? this.settings.showConnections : true;
    this.connectionThreshold = this.settings.connectionThreshold || 2.5;
    this.reactive = this.settings.reactive !== false;

    // Generate particles
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      // Generate random position within a sphere
      const radius = this.minDistance + Math.random() * (this.maxDistance - this.minDistance);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Convert spherical to Cartesian coordinates
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.sin(phi) * Math.sin(theta) * radius;
      const z = Math.cos(phi) * radius;

      // Random color from palette
      const colorIndex = Math.floor(Math.random() * this.colors.length);

      this.particles.push({
        position: { x, y, z },
        originalPosition: { x, y, z },
        size: this.particleSize * (0.5 + Math.random()),
                          color: this.getColor(colorIndex),
                          colorIndex
      });
    }

    // Set camera position
    this.cameraPosition = { x: 0, y: 0, z: 20 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update particle positions based on audio
    this.particles.forEach((particle, i) => {
      // Get frequency data for this particle
      const freqIndex = Math.floor(i * freqData.length / this.particles.length);
      const energy = (freqData[freqIndex] / 255) * this.amplification;

      // Get normalized direction from center
      const original = particle.originalPosition;
      const distance = Math.sqrt(
        original.x * original.x +
        original.y * original.y +
        original.z * original.z
      );

      const nx = original.x / distance;
      const ny = original.y / distance;
      const nz = original.z / distance;

      // Apply pulsing effect based on energy
      const pulseFactor = 1 + (energy - 0.5) * this.particleSpeed * 10;

      // Update position
      particle.position = {
        x: original.x * pulseFactor,
        y: original.y * pulseFactor,
        z: original.z * pulseFactor
      };

      // Update size if reactive
      if (this.reactive) {
        particle.currentSize = particle.size * (1 + energy);
      } else {
        particle.currentSize = particle.size;
      }
    });

    // Sort particles by depth
    const sortedParticles = [...this.particles].sort(
      (a, b) => b.position.z - a.position.z
    );

    // Draw connections first (if enabled)
    if (this.showConnections) {
      for (let i = 0; i < sortedParticles.length; i++) {
        const p1 = sortedParticles[i];

        for (let j = i + 1; j < sortedParticles.length; j++) {
          const p2 = sortedParticles[j];

          // Calculate distance between particles
          const dx = p1.position.x - p2.position.x;
          const dy = p1.position.y - p2.position.y;
          const dz = p1.position.z - p2.position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Draw connection if particles are close enough
          if (distance < this.connectionThreshold) {
            // Calculate opacity based on distance
            const opacity = 1 - (distance / this.connectionThreshold);

            // Draw connection line
            this.drawLine(
              p1.position,
              p2.position,
              this.getColor(p1.colorIndex, opacity * 0.3),
                          1
            );
          }
        }
      }
    }

    // Draw particles
    sortedParticles.forEach(particle => {
      // Draw particle
      const projected = this.drawPoint(
        particle.position,
        particle.currentSize,
        particle.color
      );

      // Add glow effect
      if (projected && projected.visible) {
        const freqIndex = Math.floor(Math.random() * freqData.length);
        const energy = (freqData[freqIndex] / 255) * this.amplification;

        if (energy > 0.5) {
          this.ctx.beginPath();
          this.ctx.arc(
            projected.x,
            projected.y,
            particle.currentSize * projected.scale * 2,
            0,
            Math.PI * 2
          );

          const gradient = this.ctx.createRadialGradient(
            projected.x,
            projected.y,
            0,
            projected.x,
            projected.y,
            particle.currentSize * projected.scale * 2
          );

          gradient.addColorStop(0, this.getColor(particle.colorIndex, 0.2));
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = gradient;
          this.ctx.fill();
        }
      }
    });
  }
}

// Waveform 3D Visualization
class Waveform3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.points = this.settings.points || 64;
    this.radius = this.settings.radius || 8;
    this.waveHeight = this.settings.waveHeight || 5;
    this.smoothing = this.settings.smoothing || 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.waves = this.settings.waves || 3;
    this.waveSpacing = this.settings.waveSpacing || 2;
    this.lineWidth = this.settings.lineWidth || 2;

    // Create wave rings
    this.waveRings = [];

    for (let w = 0; w < this.waves; w++) {
      const ringRadius = this.radius + w * this.waveSpacing;
      const points = [];

      // Create ring points
      for (let i = 0; i <= this.points; i++) {
        const angle = (i / this.points) * Math.PI * 2;

        points.push({
          angle,
          originalPosition: {
            x: Math.cos(angle) * ringRadius,
                    y: 0,
                    z: Math.sin(angle) * ringRadius
          },
          position: {
            x: Math.cos(angle) * ringRadius,
                    y: 0,
                    z: Math.sin(angle) * ringRadius
          },
          height: 0
        });
      }

      this.waveRings.push({
        points,
        radius: ringRadius,
        colorIndex: w % this.colors.length
      });
    }

    // Smoothed heights for transitions
    this.smoothedHeights = new Array(this.points * this.waves).fill(0);

    // Set camera position
    this.cameraPosition = { x: 0, y: 10, z: 15 };
    this.cameraRotation = { x: -0.5, y: 0, z: 0 };
  }

  draw() {
    const timeData = this.getTimeData();
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update wave heights based on audio data
    let pointIndex = 0;

    this.waveRings.forEach((ring, ringIndex) => {
      ring.points.forEach((point, i) => {
        if (i < this.points) { // Skip the duplicate end point when updating
          // Get data index based on point position
          const dataIndex = Math.floor(i * timeData.length / this.points);

          // Calculate normalized value (-1 to 1)
          const value = ((timeData[dataIndex] - 128) / 128) * this.amplification;

          // Apply smoothing
          this.smoothedHeights[pointIndex] += (value - this.smoothedHeights[pointIndex]) * (1 - this.smoothing);

          // Update point height
          point.height = this.smoothedHeights[pointIndex] * this.waveHeight;

          // Update position
          point.position = {
            x: point.originalPosition.x,
            y: point.height,
            z: point.originalPosition.z
          };

          pointIndex++;
        }
      });
    });

    // Draw waves from back to front
    const sortedRings = [...this.waveRings].sort((a, b) => {
      // Sort based on camera rotation - determine which rings are further back
      const angleToSortBy = this.cameraRotation.y % (Math.PI * 2);

      // When looking from the side, sort by radius
      if (angleToSortBy < Math.PI / 4 || angleToSortBy > Math.PI * 7/4) {
        return b.radius - a.radius; // Larger radius is further back
      } else if (angleToSortBy < Math.PI * 3/4) {
        return a.radius - b.radius; // Smaller radius is further back
      } else if (angleToSortBy < Math.PI * 5/4) {
        return b.radius - a.radius; // Larger radius is further back
      } else {
        return a.radius - b.radius; // Smaller radius is further back
      }
    });

    // Draw each ring
    sortedRings.forEach(ring => {
      const color = this.getColor(ring.colorIndex);
      const points = ring.points;

      // Draw ring segments
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i].position;
        const p2 = points[i + 1].position;

        // Adjust line width based on energy
        const lineWidth = this.lineWidth * (1 + avgEnergy * 0.5);

        this.drawLine(p1, p2, color, lineWidth);
      }

      // Connect last and first point to close the loop
      this.drawLine(
        points[points.length - 1].position,
        points[0].position,
        color,
        this.lineWidth * (1 + avgEnergy * 0.5)
      );
    });
  }
}

// Terrain 3D Visualization
class Terrain3DVisualizer extends Base3DVisualizer {
  initialize() {
    super.initialize();

    // Settings
    this.gridSize = this.settings.gridSize || 32;
    this.gridSpacing = this.settings.gridSpacing || 0.5;
    this.maxHeight = this.settings.maxHeight || 5;
    this.smoothing = this.settings.smoothing || 0.8;
    this.amplification = this.settings.amplification || 1.5;
    this.wireframe = this.settings.wireframe !== undefined ? this.settings.wireframe : false;

    // Create terrain grid
    this.grid = [];

    // Calculate grid dimensions
    const halfSize = (this.gridSize - 1) * this.gridSpacing / 2;

    // Create grid points
    for (let z = 0; z < this.gridSize; z++) {
      const row = [];

      for (let x = 0; x < this.gridSize; x++) {
        row.push({
          position: {
            x: x * this.gridSpacing - halfSize,
            y: 0,
            z: z * this.gridSpacing - halfSize
          },
          height: 0
        });
      }

      this.grid.push(row);
    }

    // Smoothed heights for transitions
    this.smoothedHeights = new Array(this.gridSize * this.gridSize).fill(0);

    // Set camera position
    this.cameraPosition = { x: 0, y: 12, z: 15 };
    this.cameraRotation = { x: -0.5, y: 0, z: 0 };
  }

  draw() {
    const freqData = this.getFrequencyData();
    const avgEnergy = this.update(freqData);

    // Clear canvas
    this.clear();

    // Update terrain heights based on audio data
    for (let z = 0; z < this.gridSize; z++) {
      for (let x = 0; x < this.gridSize; x++) {
        const point = this.grid[z][x];
        const index = z * this.gridSize + x;

        // Calculate distance from center
        const centerX = (this.gridSize - 1) / 2;
        const centerZ = (this.gridSize - 1) / 2;
        const distFromCenter = Math.sqrt(
          Math.pow((x - centerX) / this.gridSize, 2) +
          Math.pow((z - centerZ) / this.gridSize, 2)
        ) * 2;

        // Get frequency value for this point
        const freqIndex = Math.floor(distFromCenter * freqData.length);
        let heightValue = (freqData[Math.min(freqIndex, freqData.length - 1)] / 255) * this.amplification;

        // Apply smoothing
        this.smoothedHeights[index] += (heightValue - this.smoothedHeights[index]) * (1 - this.smoothing);
        heightValue = this.smoothedHeights[index];

        // Update point height
        point.height = heightValue * this.maxHeight;
        point.position.y = point.height;
      }
    }

    // Draw terrain
    if (this.wireframe) {
      // Draw wireframe
      for (let z = 0; z < this.gridSize; z++) {
        for (let x = 0; x < this.gridSize; x++) {
          const point = this.grid[z][x].position;

          // Draw horizontal line (x direction)
          if (x < this.gridSize - 1) {
            const nextPoint = this.grid[z][x + 1].position;

            // Calculate color based on height
            const avgHeight = (point.y + nextPoint.y) / (2 * this.maxHeight);
            const colorIndex = Math.floor(avgHeight * this.colors.length);
            const color = this.getColor(colorIndex);

            this.drawLine(point, nextPoint, color, 1);
          }

          // Draw vertical line (z direction)
          if (z < this.gridSize - 1) {
            const nextPoint = this.grid[z + 1][x].position;

            // Calculate color based on height
            const avgHeight = (point.y + nextPoint.y) / (2 * this.maxHeight);
            const colorIndex = Math.floor(avgHeight * this.colors.length);
            const color = this.getColor(colorIndex);

            this.drawLine(point, nextPoint, color, 1);
          }
        }
      }
    } else {
      // Draw filled terrain with triangles
      for (let z = 0; z < this.gridSize - 1; z++) {
        for (let x = 0; x < this.gridSize - 1; x++) {
          const p1 = this.grid[z][x].position;
          const p2 = this.grid[z][x + 1].position;
          const p3 = this.grid[z + 1][x + 1].position;
          const p4 = this.grid[z + 1][x].position;

          // Calculate average height for color
          const avgHeight = (p1.y + p2.y + p3.y + p4.y) / (4 * this.maxHeight);
          const colorIndex = Math.floor(avgHeight * this.colors.length);
          const color = this.getColor(colorIndex);

          // Draw two triangles for the quad
          this.drawPolygon([p1, p2, p4], color);
          this.drawPolygon([p2, p3, p4], color);
        }
      }
    }
  }
}

// Type checking for props
AudioVisualizer.propTypes = {
  audioContext: PropTypes.object,
  analyzerNode: PropTypes.object,
  type: PropTypes.string,
  colors: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  style: PropTypes.object,
  settings: PropTypes.object,
  onVisualizationFrame: PropTypes.func,
  interactiveMode: PropTypes.bool
};

export default React.memo(AudioVisualizer);
