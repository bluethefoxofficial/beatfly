import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import {
  CalendarRange,
  Sparkles,
  Music,
  User,
  Clock,
  ChevronRight,
  Stars,
  Flame,
  Compass,
  Trophy,
  Heart,
  ShieldAlert,
  ArrowUpRight,
  Headphones,
} from 'lucide-react';
import MusicAPI from '../services/api';

const palettes = [
  { name: 'Aurora', gradient: 'from-emerald-400/70 via-cyan-400/70 to-blue-700/80', text: 'text-emerald-50', accent: '#22d3ee' },
  { name: 'Sunset', gradient: 'from-orange-400/70 via-pink-500/70 to-violet-600/80', text: 'text-orange-50', accent: '#f472b6' },
  { name: 'Noir Neon', gradient: 'from-slate-900/80 via-purple-700/80 to-indigo-700/80', text: 'text-white', accent: '#a78bfa' },
  { name: 'Lush', gradient: 'from-lime-400/70 via-green-500/70 to-emerald-700/80', text: 'text-lime-50', accent: '#4ade80' },
  { name: 'Retro Wave', gradient: 'from-fuchsia-500/70 via-violet-500/70 to-indigo-600/80', text: 'text-fuchsia-50', accent: '#c084fc' },
  { name: 'Solar Flare', gradient: 'from-amber-400/70 via-orange-500/70 to-red-500/80', text: 'text-amber-50', accent: '#fb923c' },
  { name: 'Arctic Dawn', gradient: 'from-cyan-200/70 via-blue-300/70 to-indigo-400/80', text: 'text-cyan-50', accent: '#38bdf8' },
  { name: 'Velvet Night', gradient: 'from-slate-800/80 via-purple-900/70 to-black/80', text: 'text-purple-50', accent: '#6d28d9' },
  { name: 'Citrus Pop', gradient: 'from-lime-300/70 via-amber-300/70 to-orange-400/80', text: 'text-lime-50', accent: '#a3e635' },
  { name: 'Electric Blue', gradient: 'from-blue-500/70 via-sky-400/70 to-indigo-600/80', text: 'text-sky-50', accent: '#3b82f6' },
  { name: 'Desert Bloom', gradient: 'from-amber-300/70 via-rose-300/70 to-orange-400/80', text: 'text-amber-50', accent: '#fb7185' },
  { name: 'Neon Coral', gradient: 'from-rose-400/70 via-orange-400/70 to-amber-500/80', text: 'text-rose-50', accent: '#fb7185' },
  { name: 'Sapphire Mist', gradient: 'from-indigo-400/70 via-blue-500/70 to-slate-800/80', text: 'text-blue-50', accent: '#6366f1' },
  { name: 'Mint Chip', gradient: 'from-emerald-300/70 via-teal-300/70 to-cyan-300/80', text: 'text-emerald-50', accent: '#34d399' },
  { name: 'Firefly', gradient: 'from-amber-300/70 via-lime-300/70 to-emerald-400/80', text: 'text-amber-50', accent: '#fbbf24' },
  { name: 'Royal Pulse', gradient: 'from-indigo-500/70 via-purple-500/70 to-fuchsia-500/80', text: 'text-indigo-50', accent: '#8b5cf6' },
  { name: 'Amber Glass', gradient: 'from-amber-400/70 via-yellow-300/70 to-orange-500/80', text: 'text-amber-50', accent: '#f59e0b' },
  { name: 'Berry Crush', gradient: 'from-fuchsia-500/70 via-rose-500/70 to-purple-600/80', text: 'text-fuchsia-50', accent: '#e879f9' },
  { name: 'Midnight Petrol', gradient: 'from-slate-900/80 via-blue-900/70 to-sky-700/80', text: 'text-slate-50', accent: '#0ea5e9' },
  { name: 'Iridescent', gradient: 'from-cyan-200/70 via-violet-200/70 to-pink-200/80', text: 'text-slate-800', accent: '#a855f7' },
  { name: 'Golden Hour', gradient: 'from-orange-300/70 via-amber-400/70 to-rose-400/80', text: 'text-amber-50', accent: '#fbbf24' },
  { name: 'Ocean Tide', gradient: 'from-sky-300/70 via-cyan-400/70 to-emerald-500/80', text: 'text-sky-50', accent: '#0ea5e9' },
  { name: 'Copper Glow', gradient: 'from-amber-500/70 via-orange-600/70 to-red-500/80', text: 'text-amber-50', accent: '#ea580c' },
  { name: 'Hologram', gradient: 'from-fuchsia-400/70 via-cyan-300/70 to-indigo-400/80', text: 'text-fuchsia-50', accent: '#22d3ee' },
  { name: 'Forest Run', gradient: 'from-emerald-500/70 via-green-600/70 to-lime-500/80', text: 'text-emerald-50', accent: '#22c55e' },
  { name: 'Candy Coated', gradient: 'from-pink-300/70 via-purple-300/70 to-sky-300/80', text: 'text-pink-50', accent: '#ec4899' },
  { name: 'Cloudburst', gradient: 'from-slate-500/70 via-blue-500/70 to-indigo-600/80', text: 'text-slate-50', accent: '#475569' },
  { name: 'Hearth', gradient: 'from-rose-500/70 via-orange-500/70 to-amber-500/80', text: 'text-rose-50', accent: '#f97316' },
  { name: 'Cyber Lime', gradient: 'from-lime-400/70 via-emerald-400/70 to-green-500/80', text: 'text-lime-50', accent: '#a3e635' },
  { name: 'Crimson Drift', gradient: 'from-rose-500/70 via-red-500/70 to-amber-500/80', text: 'text-rose-50', accent: '#ef4444' },
  { name: 'Opal Skies', gradient: 'from-sky-200/70 via-indigo-200/70 to-purple-300/80', text: 'text-slate-800', accent: '#6366f1' },
  { name: 'Lagoon', gradient: 'from-teal-400/70 via-cyan-500/70 to-blue-600/80', text: 'text-teal-50', accent: '#14b8a6' },
  { name: 'Velvet Rose', gradient: 'from-rose-400/70 via-fuchsia-500/70 to-purple-600/80', text: 'text-rose-50', accent: '#e11d48' },
  { name: 'Saffron Heat', gradient: 'from-amber-400/70 via-orange-500/70 to-red-600/80', text: 'text-amber-50', accent: '#f97316' },
  { name: 'Ultraviolet', gradient: 'from-violet-500/70 via-indigo-600/70 to-fuchsia-600/80', text: 'text-violet-50', accent: '#7c3aed' },
  { name: 'Steel Wave', gradient: 'from-slate-500/70 via-slate-600/70 to-blue-500/80', text: 'text-slate-50', accent: '#0ea5e9' },
  { name: 'Aurora Gold', gradient: 'from-amber-300/70 via-yellow-300/70 to-green-400/80', text: 'text-amber-50', accent: '#f59e0b' },
  { name: 'Rose Dawn', gradient: 'from-rose-300/70 via-orange-200/70 to-amber-300/80', text: 'text-rose-50', accent: '#fb7185' },
  { name: 'Teal Bloom', gradient: 'from-teal-300/70 via-emerald-300/70 to-green-500/80', text: 'text-teal-50', accent: '#10b981' },
  { name: 'Indigo Storm', gradient: 'from-indigo-500/70 via-slate-700/70 to-black/70', text: 'text-indigo-50', accent: '#312e81' },
  { name: 'Glacier', gradient: 'from-slate-200/70 via-blue-200/70 to-cyan-300/80', text: 'text-slate-900', accent: '#38bdf8' },
  { name: 'Celestial', gradient: 'from-indigo-400/70 via-violet-500/70 to-sky-500/80', text: 'text-indigo-50', accent: '#818cf8' },
  { name: 'Coral Reef', gradient: 'from-orange-300/70 via-rose-300/70 to-teal-400/80', text: 'text-rose-50', accent: '#fb7185' },
  { name: 'Jade Circuit', gradient: 'from-emerald-400/70 via-teal-500/70 to-cyan-600/80', text: 'text-emerald-50', accent: '#34d399' },
  { name: 'Cobalt Prism', gradient: 'from-blue-500/70 via-indigo-500/70 to-slate-800/80', text: 'text-blue-50', accent: '#2563eb' },
  { name: 'Peach Nebula', gradient: 'from-orange-300/70 via-rose-300/70 to-fuchsia-400/80', text: 'text-rose-50', accent: '#fb923c' },
  { name: 'Digital Noir', gradient: 'from-slate-900/80 via-neutral-800/70 to-purple-800/70', text: 'text-white', accent: '#a78bfa' },
  { name: 'Canyon Dust', gradient: 'from-amber-400/70 via-orange-300/70 to-yellow-200/80', text: 'text-amber-50', accent: '#d97706' },
  { name: 'Night Market', gradient: 'from-indigo-900/80 via-amber-500/50 to-fuchsia-600/60', text: 'text-white', accent: '#f59e0b' },
  { name: 'Pastel Drive', gradient: 'from-sky-200/70 via-pink-200/70 to-lime-200/80', text: 'text-slate-800', accent: '#22d3ee' },
  { name: 'Neon Orchard', gradient: 'from-lime-300/70 via-emerald-400/70 to-fuchsia-400/70', text: 'text-lime-50', accent: '#84cc16' },
  { name: 'Marble Smoke', gradient: 'from-slate-300/70 via-gray-500/70 to-slate-800/80', text: 'text-slate-50', accent: '#94a3b8' },
  { name: 'Solaris', gradient: 'from-amber-400/70 via-orange-500/70 to-indigo-600/70', text: 'text-amber-50', accent: '#f97316' },
  { name: 'Moonlit Moss', gradient: 'from-emerald-700/70 via-teal-700/70 to-slate-900/80', text: 'text-emerald-50', accent: '#047857' },
  { name: 'Shadow Play', gradient: 'from-slate-900/80 via-slate-800/70 to-blue-800/70', text: 'text-white', accent: '#475569' },
  { name: 'Blue Raspberry', gradient: 'from-sky-400/70 via-cyan-400/70 to-blue-600/80', text: 'text-sky-50', accent: '#0ea5e9' },
  { name: 'Chrome Pulse', gradient: 'from-slate-200/70 via-slate-400/70 to-slate-800/80', text: 'text-slate-900', accent: '#94a3b8' },
  { name: 'Spectrum', gradient: 'from-red-400/70 via-amber-400/70 to-sky-400/80', text: 'text-white', accent: '#fbbf24' },
  { name: 'Cranberry Ice', gradient: 'from-rose-300/70 via-fuchsia-300/70 to-indigo-300/80', text: 'text-rose-50', accent: '#e11d48' },
  { name: 'Blush Vortex', gradient: 'from-pink-400/70 via-purple-400/70 to-indigo-500/80', text: 'text-pink-50', accent: '#ec4899' },
  { name: 'Rainforest', gradient: 'from-green-500/70 via-emerald-600/70 to-teal-700/80', text: 'text-green-50', accent: '#22c55e' },
  { name: 'Sandstorm', gradient: 'from-amber-300/70 via-orange-300/70 to-yellow-400/80', text: 'text-amber-50', accent: '#fcd34d' },
  { name: 'Tropical Punch', gradient: 'from-orange-400/70 via-pink-500/70 to-cyan-500/70', text: 'text-orange-50', accent: '#fb7185' },
];

const mulberry32 = (seed) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const useSeededTheme = (year) => useMemo(() => {
  const rand = mulberry32(year);
  const choice = palettes[Math.floor(rand() * palettes.length)] || palettes[0];
  return choice;
}, [year]);

const useSegmentPalette = (year) => useMemo(() => {
  const cache = new Map();
  return (index = 0) => {
    if (cache.has(index)) return cache.get(index);
    const rand = mulberry32(year + index + 13);
    const choice = palettes[Math.floor(rand() * palettes.length)] || palettes[0];
    cache.set(index, choice);
    return choice;
  };
}, [year]);

const toRGBA = (hex, alpha = 1) => {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const num = parseInt(sanitized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hashToRGB = (input = '') => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return {
    r: (hash >>> 16) & 255,
    g: (hash >>> 8) & 255,
    b: hash & 255,
  };
};

const mixColors = (colors = []) => {
  if (!colors.length) return { r: 132, g: 94, b: 255 };
  const total = colors.reduce((acc, c) => ({
    r: acc.r + (c?.r || 0),
    g: acc.g + (c?.g || 0),
    b: acc.b + (c?.b || 0),
  }), { r: 0, g: 0, b: 0 });
  return {
    r: total.r / colors.length,
    g: total.g / colors.length,
    b: total.b / colors.length,
  };
};

const rgbToString = (color) => `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;

const describeColor = (color) => {
  const { r, g, b } = color || {};
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  if (spread < 20) return 'Glass Bloom';
  if (max === r && g > b) return 'Sunset Moss';
  if (max === r) return 'Signal Flare';
  if (max === g && b > r) return 'Neon Tide';
  if (max === g) return 'Forest Neon';
  if (max === b && r > g) return 'Midnight Magenta';
  return 'Deep Indigo';
};

const formatNumber = (value) => new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(value || 0);

const AnimatedCounter = ({ value = 0, formatter = formatNumber, duration = 1.2 }) => {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(formatter(0));

  useEffect(() => {
    const controls = animate(motionValue, Number.isFinite(value) ? value : 0, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(formatter(v)),
    });
    return () => controls.stop();
  }, [motionValue, value, duration, formatter]);

  return <span>{display}</span>;
};

const AnimatedText = ({ text, className = '', delay = 0 }) => (
  <span className={className}>
    {text.split('').map((char, idx) => {
      const glyph = char === ' ' ? '\u00a0' : char;
      return (
        <motion.span
          key={`${glyph}-${idx}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + idx * 0.015, duration: 0.35, ease: 'easeOut' }}
          className="inline-block"
        >
          {glyph}
        </motion.span>
      );
    })}
  </span>
);

const StatTile = ({ label, value, icon: Icon, accent, delay = 0, animated = false, formatter = formatNumber }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    whileHover={{ y: -4, scale: 1.01 }}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
    style={{ boxShadow: `0 18px 70px ${toRGBA(accent, 0.25)}` }}
  >
    <div className="flex items-center gap-3">
      <div className="p-3 rounded-xl bg-white/10 text-white">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
        <p className="text-2xl font-semibold text-white">
          {animated && typeof value === 'number'
            ? <AnimatedCounter value={value} formatter={formatter} />
            : (typeof value === 'number' ? formatter(value) : value)}
        </p>
      </div>
    </div>
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: `radial-gradient(120% 120% at 0% 0%, ${toRGBA(accent, 0.14)}, transparent)` }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.div>
);

const StoryCard = ({ title, subtitle, meta, icon: Icon, accent, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
    whileHover={{ scale: 1.01, rotate: -0.2 }}
    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
  >
    <div
      className="absolute inset-0 opacity-60"
      style={{
        background: `radial-gradient(90% 90% at 80% 10%, ${toRGBA(accent, 0.18)}, transparent), linear-gradient(120deg, transparent 0%, ${toRGBA(accent, 0.07)} 40%, transparent 90%)`,
      }}
    />
    <div className="relative space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white/10 text-white">
            <Icon size={16} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Chapter {index + 1}</p>
        </div>
        <ArrowUpRight size={16} className="text-white/30" />
      </div>
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="text-white/70">{subtitle}</p>
      {meta && (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-white/80">
          <Sparkles size={14} />
          {meta}
        </div>
      )}
    </div>
  </motion.div>
);

const TrackHighlight = ({ track, index, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.35, delay: index * 0.05 }}
    whileHover={{ scale: 1.01, y: -2 }}
    className="relative flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5"
    style={{ boxShadow: `0 10px 40px ${toRGBA(accent, 0.2)}` }}
  >
    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-surface flex-shrink-0">
      {track?.track_image ? (
        <img
          src={track.track_image}
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/40">
          <Music size={18} />
        </div>
      )}
      <span className="absolute -top-2 -left-2 px-2 py-1 text-[11px] font-semibold rounded-full bg-black/60 border border-white/10">
        #{index + 1}
      </span>
    </div>
    <div className="flex-1">
      <p className="font-semibold text-white">{track?.title || 'Untitled track'}</p>
      <p className="text-sm text-white/60">{track?.artist || 'Unknown artist'}</p>
    </div>
    <div className="text-right text-sm text-white/60">
      {track?.listenCount ? `${formatNumber(track.listenCount)} plays` : '—'}
    </div>
  </motion.div>
);

const ArtistChip = ({ artist, index, accent }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.35, delay: index * 0.05 }}
    whileHover={{ x: 4 }}
    className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5"
    style={{ boxShadow: `0 10px 40px ${toRGBA(accent, 0.15)}` }}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/80">
        {index + 1}
      </div>
      <div>
        <p className="text-white font-semibold">{artist?.artist || 'Unknown artist'}</p>
        <p className="text-xs text-white/60">{artist?.listenCount ? `${formatNumber(artist.listenCount)} plays` : '—'}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-white/30" />
  </motion.div>
);

const SegmentFrame = ({ accent, kicker, title, body, icon: Icon, footer, children, animation }) => {
  const particles = useMemo(
    () => Array.from({ length: 18 }, (_, idx) => ({
      id: `${kicker}-${idx}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
    })),
    [kicker]
  );

  const ribbons = useMemo(
    () => Array.from({ length: 8 }, (_, idx) => ({
      id: `${kicker}-line-${idx}`,
      y: Math.random() * 100,
      width: Math.random() * 60 + 30,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.2,
    })),
    [kicker]
  );

  const floatingVariants = {
    initial: { rotate: 0, scale: 0.98 },
    animate: { rotate: animation === 'orbit' ? 1.4 : 0, scale: 1 },
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' },
  };

  return (
    <motion.div
      className="relative mx-auto max-w-md w-full aspect-[9/16] rounded-[28px] overflow-hidden border border-white/15 bg-white/5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] flex flex-col"
      initial={{ rotate: animation === 'tilt' ? -1 : 0, scale: 0.98, opacity: 0.94 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${toRGBA(accent, 0.32)} 0%, ${toRGBA(accent, 0.14)} 45%, rgba(255,255,255,0.06) 100%)`,
        }}
        variants={floatingVariants}
        initial="initial"
        animate="animate"
        transition={floatingVariants.transition}
      />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0, transparent 30%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.16) 0, transparent 30%)' }} />
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage: `repeating-linear-gradient(120deg, ${toRGBA(accent, 0.12)} 0, ${toRGBA(accent, 0.12)} 1px, transparent 1px, transparent 20px)`,
        }}
        animate={{ backgroundPosition: ['0% 0%', '12% 10%', '0% 0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.4 }}
            animate={{
              y: animation === 'drift' ? ['0%', '8%', '0%'] : ['0%', '-6%', '0%'],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 6 + p.delay,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {ribbons.map((r) => (
          <motion.div
            key={r.id}
            className="absolute h-px"
            style={{
              left: '-10%',
              right: '-10%',
              top: `${r.y}%`,
              background: `linear-gradient(90deg, transparent, ${toRGBA(accent, 0.4)}, transparent)`,
              opacity: r.opacity,
            }}
            animate={{ x: ['-8%', '12%', '-8%'] }}
            transition={{ duration: 7 + r.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <motion.div
          className="absolute inset-8 rounded-[32px] border border-white/10"
          style={{ boxShadow: `0 0 0 1px ${toRGBA(accent, 0.12)}` }}
          animate={{ rotate: animation === 'orbit' ? [0, 1.6, 0] : 0, scale: animation === 'tilt' ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="relative h-full flex flex-col p-6 gap-4 text-center">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/70">
          <div className="inline-flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/30 border border-white/10">{kicker}</span>
            <span className="hidden sm:inline">Mobile Story</span>
          </div>
          {Icon && <Icon size={16} className="text-white/80" />}
        </div>
        <div className="space-y-2">
          <AnimatedText text={title} className="text-2xl font-semibold text-white leading-tight block" />
          <motion.p
            className="text-white/75 text-sm leading-relaxed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {body}
          </motion.p>
        </div>
        <div className="flex-1 min-h-[200px] flex items-center justify-center">
          {children}
        </div>
        {footer}
      </div>
    </motion.div>
  );
};

const SegmentNavigation = ({ count, active, onPrev, onNext, onSelect, accent }) => (
  <div className="flex items-center justify-between gap-4 px-1">
    <button
      type="button"
      onClick={onPrev}
      className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10"
    >
      Prev
    </button>
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(idx)}
          className={`h-2.5 rounded-full transition-all border border-white/10 ${idx === active ? 'w-8 bg-white/90' : 'w-2.5 bg-white/30'}`}
          style={idx === active ? { boxShadow: `0 0 0 4px ${toRGBA(accent, 0.15)}` } : {}}
          aria-label={`Go to segment ${idx + 1}`}
        />
      ))}
    </div>
    <button
      type="button"
      onClick={onNext}
      className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10"
    >
      Next
    </button>
  </div>
);

const YearInReview = () => {
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSegment, setActiveSegment] = useState(0);

  const now = new Date();
  const isDecember = now.getMonth() === 11;
  const year = review?.year || now.getFullYear();
  const theme = useSeededTheme(year);
  const paletteForSegment = useSegmentPalette(year);

  useEffect(() => {
    const fetchReview = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await MusicAPI.getYearInReview();
        setReview(res.data);
      } catch (err) {
        setReview(null);
        setError(err.response?.data?.error || 'Unable to load your Year in Review');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, []);

  const summary = review?.summary || {};
  const topTracks = review?.topTracks?.slice(0, 3) || [];
  const topArtists = review?.topArtists?.slice(0, 3) || [];
  const signatureColor = useMemo(() => {
    const covers = review?.topTracks?.slice(0, 6) || [];
    if (!covers.length) return { r: 132, g: 94, b: 255 };
    const colors = covers.map((track, idx) => hashToRGB(track.track_image || track.title || String(track.trackId || idx)));
    return mixColors(colors);
  }, [review?.topTracks]);
  const signatureColorString = useMemo(() => rgbToString(signatureColor), [signatureColor]);
  const signatureNickname = useMemo(() => describeColor(signatureColor), [signatureColor]);
  const signName = useMemo(() => {
    const artist = summary.topArtist || topArtists[0]?.artist || 'Beatfly';
    return `${artist} ${signatureNickname}`;
  }, [summary.topArtist, topArtists, signatureNickname]);
  const segments = useMemo(() => {
    const anthem = topTracks[0];
    const firstArtist = topArtists[0];
    const crowdSize = summary.totalListens || 0;
    const wordpile = ['neon', 'ripple', 'echo', 'bloom', 'glitch', 'confetti', 'spark', 'drift', 'lumen', 'pulse', 'orbit', 'fizz', 'haze', 'pop', 'flare'];

    const base = [
      {
        key: 'theme',
        kicker: 'Segment 01',
        title: `${year} arrives in ${theme.name}`,
        body: `Each recap ships with a seeded palette. This year is drenched in ${theme.name}, so every slide feels like your personal cover art.`,
        icon: Compass,
        animation: 'orbit',
      },
      {
        key: 'pulse',
        kicker: 'Segment 02',
        title: 'Listening pulse',
        body: summary.totalListens
          ? `You hit play ${formatNumber(summary.totalListens)} times and explored ${formatNumber(summary.uniqueTracks)} unique tracks.`
          : 'Your listening rhythm starts recording once you press play.',
        icon: Headphones,
        animation: 'drift',
      },
      {
        key: 'tracks',
        kicker: 'Segment 03',
        title: 'Anthems of the year',
        body: anthem
          ? `${anthem.title} by ${anthem.artist} stole the spotlight. Two more anthems made your heavy rotation.`
          : 'When a track rises above the rest, it will headline here with supporting acts.',
        icon: Music,
        animation: 'tilt',
      },
      {
        key: 'cover-fusion',
        kicker: 'Fun Page 01',
        title: 'Cover cauldron',
        body: topTracks.length
          ? `We melted your top covers into one hue and called it the ${signName} sign. It is literally your album art blended into a vibe.`
          : 'Spin a few tracks and we will stir their covers into a single signature hue.',
        icon: Stars,
        animation: 'orbit',
      },
      {
        key: 'artists',
        kicker: 'Segment 04',
        title: 'Cast list',
        body: firstArtist
          ? `${firstArtist.artist} kept returning for encores. Here are the other names that filled your marquee.`
          : 'Play more artists to see who claims the marquee.',
        icon: User,
        animation: 'orbit',
      },
      {
        key: 'fortune-cookie',
        kicker: 'Fun Page 02',
        title: 'Fortune cookie remix',
        body: anthem
          ? `Crack the cookie: ${anthem.title} is your lucky loop, ${signName} is the color ink, and ${summary.totalListens || 0} replays is the spell.`
          : 'Your fortune unlocks when a track starts dominating the spins.',
        icon: Sparkles,
        animation: 'tilt',
      },
      {
        key: 'library',
        kicker: 'Segment 05',
        title: 'Library moves',
        body: `Saved ${formatNumber(review?.favouritesAdded?.length)} favorites, flagged ${formatNumber(review?.recentDislikes?.length)} skips, and blocked ${formatNumber(review?.blockedArtists?.length)} artists. A curator in motion.`,
        icon: Heart,
        animation: 'drift',
      },
      {
        key: 'origin',
        kicker: 'Segment 06',
        title: 'Opening scene + encore',
        body: summary.firstListen
          ? `You opened ${year} with ${summary.firstListen}. ${anthem ? `${anthem.title} is your encore track so far.` : 'Keep playing to reveal your encore.'}`
          : 'Press play to lock in the first track of the story. An encore will appear once a song dominates.',
        icon: Flame,
        animation: 'tilt',
      },
      {
        key: 'night-runner',
        kicker: 'Segment 07',
        title: 'Night runner mode',
        body: 'Late plays, soft glow, and a skyline of loops. Your soundtrack keeps the lights on.',
        icon: Sparkles,
        animation: 'orbit',
      },
      {
        key: 'skip-parade',
        kicker: 'Segment 08',
        title: 'Skip parade',
        body: `${formatNumber(review?.recentDislikes?.length)} skips marched past. Every skip sharpens the mix.`,
        icon: ShieldAlert,
        animation: 'drift',
      },
      {
        key: 'discovery',
        kicker: 'Segment 09',
        title: 'Discovery meter',
        body: `You touched ${formatNumber(summary.uniqueTracks)} different tracks. That is a curious ear in motion.`,
        icon: Compass,
        animation: 'tilt',
      },
      {
        key: 'playlist-hook',
        kicker: 'Segment 10',
        title: 'Playlist hook',
        body: review?.playlistId
          ? 'Your top tracks already live in a playlist. Spin it, share it, repeat it.'
          : 'As soon as you crown some tracks, we auto-build a playlist.',
        icon: ChevronRight,
        animation: 'orbit',
      },
      {
        key: 'palette-remix',
        kicker: 'Segment 11',
        title: 'Palette remix',
        body: `Accent hue: ${theme.accent}. Seeded gradients keep the vibe locked to ${year}.`,
        icon: Stars,
        animation: 'drift',
      },
      {
        key: 'wordpile',
        kicker: 'Segment 12',
        title: 'Wordpile confetti',
        body: 'Neon riddles, echo noodles, synth sprinkles—your recap speaks in color.',
        icon: Sparkles,
        animation: 'tilt',
      },
      {
        key: 'album-spin',
        kicker: 'Segment 13',
        title: 'Album art spin',
        body: 'Your covers swirl like stickers on a laptop. Let them orbit.',
        icon: Music,
        animation: 'orbit',
      },
      {
        key: 'crowd-meter',
        kicker: 'Segment 14',
        title: 'Crowd meter',
        body: `${formatNumber(crowdSize)} cheers so far. Volume keeps rising.`,
        icon: Headphones,
        animation: 'drift',
      },
      {
        key: 'future-postcard',
        kicker: 'Segment 15',
        title: 'Future postcard',
        body: 'Keep listening. We will remix this postcard with every new loop.',
        icon: ArrowUpRight,
        animation: 'tilt',
      },
    ];

    return base.map((segment, idx) => {
      const accent = paletteForSegment(idx).accent;
      if (segment.key === 'theme') {
        segment.content = (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Palette</p>
              <p className="text-lg font-semibold text-white">
                <AnimatedText text={theme.name} />
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Year</p>
              <p className="text-lg font-semibold text-white">
                <AnimatedCounter value={year} formatter={(v) => Math.round(v).toString()} duration={0.8} />
              </p>
            </div>
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Stars size={14} />
            <span>Seeded visuals stay consistent for this year.</span>
          </div>
        );
      } else if (segment.key === 'pulse') {
        segment.content = (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Total listens</p>
              <p className="text-2xl font-semibold text-white">
                <AnimatedCounter value={summary.totalListens || 0} />
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Unique tracks</p>
              <p className="text-2xl font-semibold text-white">
                <AnimatedCounter value={summary.uniqueTracks || 0} />
              </p>
            </div>
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Sparkles size={14} />
            <span>Stats refresh whenever you generate your recap.</span>
          </div>
        );
      } else if (segment.key === 'tracks') {
        segment.content = (
          <div className="space-y-3 mt-3">
            {topTracks.length ? topTracks.map((track, idx) => (
              <div
                key={track.trackId || idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-black/30 border border-white/10"
              >
                <motion.div
                  className="w-12 h-12 rounded-xl overflow-hidden bg-surface flex-shrink-0"
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  animate={{ rotate: [0, 1.2, 0], scale: [1, 1.02, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {track.track_image ? (
                    <img src={track.track_image} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Music size={16} />
                    </div>
                  )}
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{track.title}</p>
                  <p className="text-xs text-white/60">{track.artist}</p>
                </div>
                <span className="text-xs text-white/60">#{idx + 1}</span>
              </div>
            )) : (
              <div className="text-white/60 text-sm">Spin some tracks to crown an anthem.</div>
            )}
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <ChevronRight size={14} />
            <span>Top tracks auto-build a playlist for you.</span>
          </div>
        );
      } else if (segment.key === 'cover-fusion') {
        const collage = review?.topTracks?.slice(0, 4) || [];
        segment.content = (
          <div className="flex flex-col items-center gap-3 mt-3">
            <div
              className="relative w-28 h-28 rounded-full border border-white/20"
              style={{
                background: `radial-gradient(120% 120% at 50% 50%, ${signatureColorString} 0%, rgba(255,255,255,0.12) 70%)`,
                boxShadow: `0 0 70px ${signatureColorString}`,
              }}
            >
              <span className="absolute inset-0 rounded-full bg-black/10 mix-blend-overlay" />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
              {collage.map((track, idx) => (
                <div
                  key={track.trackId || idx}
                  className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40"
                  style={{ transform: `rotate(${idx % 2 === 0 ? -1.5 : 1.5}deg)` }}
                >
                  {track.track_image ? (
                    <img src={track.track_image} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/60">
                      <Music size={18} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-white/70 text-sm text-center">
              Your covers fused into <span className="text-white font-semibold">{signName}</span>. That is your sonic sign for {year}.
            </p>
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Stars size={14} />
            <span>We remix the hue whenever your top covers change.</span>
          </div>
        );
      } else if (segment.key === 'artists') {
        segment.content = (
          <div className="space-y-3 mt-3">
            {topArtists.length ? topArtists.map((artist, idx) => (
              <div key={`${artist.artist}-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/80 text-sm">{idx + 1}</span>
                  <span className="text-white font-semibold">{artist.artist}</span>
                </div>
                <span className="text-xs text-white/60">{artist.listenCount ? `${formatNumber(artist.listenCount)} plays` : ''}</span>
              </div>
            )) : (
              <div className="text-white/60 text-sm">Artists you loop will appear here.</div>
            )}
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Trophy size={14} />
            <span>Your cast reshuffles as listening changes.</span>
          </div>
        );
      } else if (segment.key === 'fortune-cookie') {
        segment.content = (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Lucky loop</p>
              <p className="text-sm font-semibold text-white">{anthem?.title || 'Press play'}</p>
              <p className="text-xs text-white/60">{anthem?.artist || ''}</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Sonic sign</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-6 h-6 rounded-full border border-white/20" style={{ background: signatureColorString }} />
                <span className="text-white text-sm font-semibold">{signName}</span>
              </div>
            </div>
            <div className="col-span-2 p-3 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Fortune</p>
              <p className="text-sm text-white/80 mt-1">
                When {summary.topArtist || topArtists[0]?.artist || 'your favorite'} shows up, ride the volume past {formatNumber(summary.totalListens || 0)} plays and let {signatureNickname.toLowerCase()} light the room.
              </p>
            </div>
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Sparkles size={14} />
            <span>Fortunes re-roll as your plays change.</span>
          </div>
        );
      } else if (segment.key === 'library') {
        segment.content = (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Faves</p>
              <p className="text-2xl font-semibold text-white">
                <AnimatedCounter value={review?.favouritesAdded?.length || 0} />
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Dislikes</p>
              <p className="text-2xl font-semibold text-white">
                <AnimatedCounter value={review?.recentDislikes?.length || 0} />
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Blocked</p>
              <p className="text-2xl font-semibold text-white">
                <AnimatedCounter value={review?.blockedArtists?.length || 0} />
              </p>
            </div>
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <ShieldAlert size={14} />
            <span>Your filters refine what shows up next.</span>
          </div>
        );
      } else if (segment.key === 'origin') {
        segment.content = (
          <div className="space-y-3 mt-3">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">First listen</p>
              <p className="text-lg font-semibold text-white">{summary.firstListen || 'Awaiting first play'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Encore track</p>
              <p className="text-lg font-semibold text-white">{anthem?.title || 'Crowning soon'}</p>
              <p className="text-xs text-white/60">{anthem?.artist || ''}</p>
            </div>
          </div>
        );
        segment.footer = (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Sparkles size={14} />
            <span>Encore updates with every replay.</span>
          </div>
        );
      } else if (segment.key === 'night-runner') {
        segment.content = (
          <motion.div
            className="p-4 rounded-2xl bg-white/10 border border-white/10"
            animate={{ rotate: [0, 0.4, 0], scale: [1, 1.01, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AnimatedText text="City lights flicker with your loops." className="text-white font-semibold" />
            <p className="text-white/70 text-sm mt-2">Best enjoyed with headphones and a skyline.</p>
          </motion.div>
        );
      } else if (segment.key === 'skip-parade') {
        segment.content = (
          <div className="flex flex-col items-center gap-3 mt-2">
            <AnimatedCounter value={review?.recentDislikes?.length || 0} formatter={(v) => `${formatNumber(v)} skips`} />
            <p className="text-white/70 text-sm text-center">Every skip teaches the mix what not to do.</p>
          </div>
        );
      } else if (segment.key === 'discovery') {
        segment.content = (
          <div className="flex flex-col items-center gap-3 mt-2">
            <AnimatedCounter value={summary.uniqueTracks || 0} formatter={(v) => `${formatNumber(v)} finds`} />
            <p className="text-white/70 text-sm text-center">Curiosity unlocked. Keep exploring.</p>
          </div>
        );
      } else if (segment.key === 'playlist-hook') {
        segment.content = (
          <motion.div
            className="p-4 rounded-2xl bg-white/10 border border-white/10 text-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-white font-semibold mb-1">Playlist: ready when you are</p>
            <p className="text-white/70 text-sm">Tap the Top Tracks segment to open it.</p>
          </motion.div>
        );
      } else if (segment.key === 'palette-remix') {
        segment.content = (
          <div className="flex flex-col items-center gap-3 mt-2">
            <div className="w-20 h-20 rounded-full border border-white/20" style={{ boxShadow: `0 0 40px ${toRGBA(accent, 0.4)}` }} />
            <p className="text-white/70 text-sm">Seeded hue keeps {year} recognizable.</p>
          </div>
        );
      } else if (segment.key === 'wordpile') {
        segment.content = (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {wordpile.map((word, idx) => (
              <motion.span
                key={word}
                className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-sm"
                animate={{ y: [0, -4, 0], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3 + idx * 0.1, repeat: Infinity, ease: 'easeInOut' }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        );
      } else if (segment.key === 'album-spin') {
        const cover = topTracks[0]?.track_image;
        segment.content = (
          <motion.div
            className="w-28 h-28 rounded-3xl overflow-hidden border border-white/15 bg-black/40"
            animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {cover ? (
              <img src={cover} alt="Top cover" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                <Music size={28} />
              </div>
            )}
          </motion.div>
        );
      } else if (segment.key === 'crowd-meter') {
        segment.content = (
          <div className="flex flex-col items-center gap-3 mt-2">
            <AnimatedCounter value={crowdSize} formatter={(v) => `${formatNumber(v)} cheers`} />
            <p className="text-white/70 text-sm text-center">Crowd noise rises with every replay.</p>
          </div>
        );
      } else if (segment.key === 'future-postcard') {
        segment.content = (
          <motion.div
            className="p-4 rounded-2xl bg-white/10 border border-white/10 text-center"
            animate={{ scale: [1, 1.02, 1], rotate: [0, 0.6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-white font-semibold mb-1">See you in the next loop.</p>
            <p className="text-white/70 text-sm">We keep the postcard updated as you listen.</p>
          </motion.div>
        );
      }

      return { ...segment, accent };
    });
  }, [
    review?.blockedArtists?.length,
    review?.favouritesAdded?.length,
    review?.recentDislikes?.length,
    summary.firstListen,
    summary.topArtist,
    summary.totalListens,
    summary.uniqueTracks,
    theme.accent,
    theme.name,
    year,
    topArtists,
    topTracks,
    signName,
    signatureColorString,
    signatureNickname,
    paletteForSegment,
  ]);

  const handlePrevSegment = () => {
    setActiveSegment((prev) => (prev - 1 + segments.length) % segments.length);
  };

  const handleNextSegment = () => {
    setActiveSegment((prev) => (prev + 1) % segments.length);
  };

  if (!isDecember && !review) {
    return (
      <div className="relative min-h-screen p-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${toRGBA(theme.accent, 0.22)}, transparent 40%), radial-gradient(circle at 80% 0%, ${toRGBA(theme.accent, 0.16)}, transparent 36%), linear-gradient(120deg, rgba(255,255,255,0.06), transparent)`,
          }}
        />
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="page-shell relative z-10 py-12">
          <div className={`glass-hero rounded-3xl p-8 border border-white/10 bg-gradient-to-r ${theme.gradient}`}>
            <div className="flex items-center gap-3">
              <CalendarRange size={24} className="text-white" />
              <p className="text-white/70 uppercase tracking-[0.3em] text-xs">Year in Review</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mt-4">Unlocks in December</h2>
            <p className="text-white/80 max-w-2xl mt-3">
              Your recap opens each December with a seeded theme. Check back when the lights go up, or keep listening so the story is packed when it lands.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.65 }}
        animate={{ opacity: [0.65, 0.8, 0.65] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(140% 120% at 15% 20%, ${toRGBA(theme.accent, 0.2)}, transparent), radial-gradient(120% 140% at 85% 0%, ${toRGBA(theme.accent, 0.18)}, transparent), linear-gradient(120deg, rgba(255,255,255,0.04), transparent)`,
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 16px)',
        }}
        animate={{ backgroundPosition: ['0% 0%', '12% 8%', '0% 0%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div className="page-shell relative z-10 py-10 space-y-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs uppercase tracking-[0.3em] text-white/70">
            <Stars size={14} />
            <span>Your {year} Story</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
            Year in Review • {theme.name}
          </h1>
          {!isDecember && (
            <p className="text-white/70 text-sm">Showing your last generated snapshot.</p>
          )}
        </motion.div>

        {loading && (
          <div className="grid gap-4">
            <div className="h-48 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-32 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <div className="glass-card rounded-xl p-4 border border-white/10 text-white/80">
            {error}
          </div>
        )}

        {!loading && review && (
          <>
            <section className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Segmented recap</p>
                  <h3 className="text-2xl font-semibold text-white">{segments.length} mobile-style pages</h3>
                  <p className="text-white/70 text-sm">Tap through a wrapped-style stack tailored to your data.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sm text-white/80">{activeSegment + 1} / {segments.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={segments[activeSegment]?.key}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.08}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80 || info.velocity.x < -400) handleNextSegment();
                    if (info.offset.x > 80 || info.velocity.x > 400) handlePrevSegment();
                  }}
                >
                  <SegmentFrame
                    accent={segments[activeSegment]?.accent || theme.accent}
                    kicker={segments[activeSegment]?.kicker}
                    title={segments[activeSegment]?.title}
                    body={segments[activeSegment]?.body}
                    icon={segments[activeSegment]?.icon}
                    footer={segments[activeSegment]?.footer}
                    animation={segments[activeSegment]?.animation}
                  >
                    {segments[activeSegment]?.content}
                  </SegmentFrame>
                </motion.div>
              </AnimatePresence>
              <SegmentNavigation
                count={segments.length}
                active={activeSegment}
                onPrev={handlePrevSegment}
                onNext={handleNextSegment}
                onSelect={setActiveSegment}
                accent={segments[activeSegment]?.accent || theme.accent}
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label="Total listens" value={summary.totalListens || 0} icon={Headphones} accent={theme.accent} animated />
              <StatTile label="Unique tracks" value={summary.uniqueTracks || 0} icon={Sparkles} accent={theme.accent} delay={0.05} animated />
              <StatTile label="First listen" value={summary.firstListen || 'Locked in December'} icon={Clock} accent={theme.accent} delay={0.1} />
              <StatTile label="Top artist" value={summary.topArtist || 'TBD'} icon={User} accent={theme.accent} delay={0.15} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-3xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Top Tracks</p>
                    <h3 className="text-2xl font-semibold text-white">Your headline set</h3>
                  </div>
                  {review.playlistId && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/playlist/${review.playlistId}`)}
                      className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-full bg-white/10 border border-white/15 text-white"
                    >
                      Open playlist
                      <ChevronRight size={14} />
                    </motion.button>
                  )}
                </div>
                <div className="space-y-3">
                  {review.topTracks?.length ? review.topTracks.map((track, idx) => (
                    <TrackHighlight key={track.trackId || idx} track={track} index={idx} accent={theme.accent} />
                  )) : (
                    <div className="text-white/60">No top tracks yet.</div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Top Artists</p>
                    <h3 className="text-xl font-semibold text-white">The repeat offenders</h3>
                  </div>
                  <Trophy size={18} className="text-white/60" />
                </div>
                <div className="space-y-3">
                  {review.topArtists?.length ? review.topArtists.map((artist, idx) => (
                    <ArtistChip key={`${artist.artist}-${idx}`} artist={artist} index={idx} accent={theme.accent} />
                  )) : (
                    <div className="text-white/60">No artist data yet.</div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatTile
                label="Favorites added"
                value={review.favouritesAdded?.length || 0}
                icon={Heart}
                accent={theme.accent}
                animated
              />
              <StatTile
                label="Recent dislikes"
                value={review.recentDislikes?.length || 0}
                icon={Flame}
                accent={theme.accent}
                delay={0.05}
                animated
              />
              <StatTile
                label="Blocked artists"
                value={review.blockedArtists?.length || 0}
                icon={ShieldAlert}
                accent={theme.accent}
                delay={0.1}
                animated
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default YearInReview;
