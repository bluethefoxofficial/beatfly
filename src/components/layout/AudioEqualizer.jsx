import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/contexts/AudioContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Settings, Waves, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const AudioEqualizer = ({ isOpen, onClose }) => {
  const { audioRef } = useAudio();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [filters, setFilters] = useState(null);
  const [activeView, setActiveView] = useState('visualizer'); // 'visualizer', 'presets', 'manual'
  const [presets, setPresets] = useState({
    flat: {
      name: 'Flat',
      gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    rock: {
      name: 'Rock',
      gains: [4, 3, 2, 1, -1, -1, 2, 3, 3, 4]
    },
    pop: {
      name: 'Pop',
      gains: [-1, -1, 0, 2, 4, 4, 2, 0, -1, -1]
    },
    classical: {
      name: 'Classical',
      gains: [4, 4, 3, 2, -1, -1, 0, 2, 3, 4]
    },
    jazz: {
      name: 'Jazz',
      gains: [3, 2, 1, 2, -1, -2, 0, 1, 2, 3]
    },
    bass: {
      name: 'Bass Boost',
      gains: [6, 5, 4, 3, 1, 0, 0, 0, 0, 0]
    }
  });
  const [currentPreset, setCurrentPreset] = useState('flat');

  // Frequency bands for the equalizer (in Hz)
  const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const [gains, setGains] = useState(frequencies.map(() => 0));

  useEffect(() => {
    if (!audioContext && audioRef.current) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;
      setAudioContext(context);
      setAnalyser(analyserNode);

      // Create filters
      const filterNodes = frequencies.map(frequency => {
        const filter = context.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      setFilters(filterNodes);

      // Connect audio nodes
      const source = context.createMediaElementSource(audioRef.current);
      source.connect(filterNodes[0]);
      filterNodes.forEach((filter, i) => {
        if (i < filterNodes.length - 1) {
          filter.connect(filterNodes[i + 1]);
        }
      });
      filterNodes[filterNodes.length - 1].connect(analyserNode);
      analyserNode.connect(context.destination);
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioRef]);

  useEffect(() => {
    if (!filters) return;
    gains.forEach((gain, i) => {
      if (filters[i]) filters[i].gain.value = gain;
    });
  }, [gains, filters]);

  const drawVisualizer = () => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(17, 24, 39)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const hue = (i / bufferLength) * 240;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  };

  useEffect(() => {
    const cleanup = drawVisualizer();
    return cleanup;
  }, [analyser]);

  const handlePresetChange = (presetName) => {
    setCurrentPreset(presetName);
    setGains([...presets[presetName].gains]);
  };

  const handleReset = () => {
    handlePresetChange('flat');
  };

  const handleSliderChange = (index, value) => {
    const newGains = [...gains];
    newGains[index] = value[0];
    setGains(newGains);
    setCurrentPreset('custom');
  };

  const NavButton = ({ view, icon: Icon, label, isActive }) => (
    <Button
    variant={isActive ? "default" : "ghost"}
    size="sm"
    onClick={() => setActiveView(view)}
    className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
    >
    <Icon className="w-4 h-4" />
    <span className="text-xs">{label}</span>
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
    <SheetContent
    side="bottom"
    className="h-[80vh] sm:h-auto sm:w-96 sm:side-left p-0"
    >
    {/* Mobile Header with Close Button */}
    <div className="flex items-center justify-between p-4 border-b sm:hidden">
    <SheetTitle>Equalizer</SheetTitle>
    <Button
    variant="ghost"
    size="sm"
    onClick={onClose}
    className="h-8 w-8 p-0"
    >
    <X className="w-4 h-4" />
    </Button>
    </div>

    {/* Desktop Header */}
    <SheetHeader className="hidden sm:block p-6 pb-0">
    <SheetTitle>Equalizer</SheetTitle>
    </SheetHeader>

    {/* Mobile Navigation */}
    <div className="flex border-b sm:hidden">
    <NavButton
    view="visualizer"
    icon={Waves}
    label="Visual"
    isActive={activeView === 'visualizer'}
    />
    <NavButton
    view="presets"
    icon={Settings}
    label="Presets"
    isActive={activeView === 'presets'}
    />
    <NavButton
    view="manual"
    icon={Settings}
    label="Manual"
    isActive={activeView === 'manual'}
    />
    </div>

    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
    {/* Desktop: Show all content */}
    <div className="hidden sm:block space-y-6">
    {/* Visualizer */}
    <canvas
    ref={canvasRef}
    width={320}
    height={160}
    className="w-full rounded-lg bg-background"
    />

    {/* Presets */}
    <div className="flex flex-wrap gap-2">
    {Object.entries(presets).map(([key, preset]) => (
      <Button
      key={key}
      size="sm"
      variant={currentPreset === key ? "default" : "outline"}
      onClick={() => handlePresetChange(key)}
      >
      {preset.name}
      </Button>
    ))}
    </div>

    {/* Manual Sliders */}
    <div className="grid grid-cols-5 gap-4">
    {frequencies.map((freq, index) => (
      <div key={freq} className="flex flex-col items-center gap-2">
      <Slider
      orientation="vertical"
      min={-12}
      max={12}
      step={1}
      value={[gains[index]]}
      onValueChange={(value) => handleSliderChange(index, value)}
      className="h-32"
      />
      <span className="text-xs text-muted-foreground">
      {freq >= 1000 ? `${freq/1000}K` : freq}
      </span>
      </div>
    ))}
    </div>

    {/* Controls */}
    <div className="flex justify-end gap-2">
    <Button
    variant="outline"
    size="sm"
    onClick={handleReset}
    >
    <RotateCcw className="w-4 h-4 mr-2" />
    Reset
    </Button>
    </div>
    </div>

    {/* Mobile: Show content based on active view */}
    <div className="sm:hidden">
    {activeView === 'visualizer' && (
      <div className="space-y-4">
      <canvas
      ref={canvasRef}
      width={280}
      height={140}
      className="w-full rounded-lg bg-background"
      />
      <div className="text-center">
      <p className="text-sm text-muted-foreground">
      Current: {presets[currentPreset]?.name || 'Custom'}
      </p>
      </div>
      </div>
    )}

    {activeView === 'presets' && (
      <div className="space-y-4">
      <h3 className="font-medium">Select Preset</h3>
      <div className="grid grid-cols-2 gap-3">
      {Object.entries(presets).map(([key, preset]) => (
        <Button
        key={key}
        variant={currentPreset === key ? "default" : "outline"}
        onClick={() => handlePresetChange(key)}
        className="h-12"
        >
        {preset.name}
        </Button>
      ))}
      </div>
      <div className="flex justify-center pt-4">
      <Button
      variant="outline"
      onClick={handleReset}
      >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset to Flat
      </Button>
      </div>
      </div>
    )}

    {activeView === 'manual' && (
      <div className="space-y-4">
      <h3 className="font-medium">Manual Adjustment</h3>
      <div className="grid grid-cols-5 gap-2">
      {frequencies.map((freq, index) => (
        <div key={freq} className="flex flex-col items-center gap-2">
        <Slider
        orientation="vertical"
        min={-12}
        max={12}
        step={1}
        value={[gains[index]]}
        onValueChange={(value) => handleSliderChange(index, value)}
        className="h-24"
        />
        <span className="text-xs text-muted-foreground text-center">
        {freq >= 1000 ? `${freq/1000}K` : freq}
        </span>
        <span className="text-xs font-mono">
        {gains[index] > 0 ? '+' : ''}{gains[index]}
        </span>
        </div>
      ))}
      </div>
      </div>
    )}
    </div>
    </div>
    </SheetContent>
    </Sheet>
  );
};

export default AudioEqualizer;
