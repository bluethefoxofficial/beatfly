// Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useSidebar, useResponsive } from './MainLayout';
import {
  Home, Search, Library, PlusSquare,
  Heart, Clock, Music, ChevronLeft,
  ChevronRight, Plus, Mic, RefreshCcw,
  Music2, Menu, X, Github, MessageCircle,
  Shield, CalendarRange, Settings
} from 'lucide-react';
import MusicAPI from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Desktop NavItem component
const DesktopNavItem = ({ to, icon: Icon, children, isCollapsed, onClick = null }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <NavLink
      to={to}
      className={`
        relative flex items-center gap-3 px-4 py-3 text-sm font-medium
        transition-all duration-200 ease-out group rounded-md mx-2
        ${isActive
          ? 'text-white bg-accent/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
      onClick={onClick}
      onMouseEnter={() => isCollapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon
        size={20}
        className={`transition-transform duration-200 min-w-[20px]
          ${isActive ? 'text-accent' : ''}`}
      />
      <motion.div
        animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        className="overflow-hidden whitespace-nowrap"
      >
        {children}
      </motion.div>

      {isCollapsed && showTooltip && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-surface-light
        text-white rounded-md text-xs whitespace-nowrap z-50">
          {children}
        </div>
      )}
    </NavLink>
  );
};

// External Link Item for desktop
const ExternalLinkItem = ({ href, icon: Icon, children, isCollapsed }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        relative flex items-center gap-3 px-4 py-3 text-sm font-medium
        transition-all duration-200 ease-out group rounded-md mx-2
        text-gray-400 hover:text-white hover:bg-white/5
      `}
      onMouseEnter={() => isCollapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon
        size={20}
        className="transition-transform duration-200 min-w-[20px]"
      />
      <motion.div
        animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        className="overflow-hidden whitespace-nowrap"
      >
        {children}
      </motion.div>

      {isCollapsed && showTooltip && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-surface-light
        text-white rounded-md text-xs whitespace-nowrap z-50">
          {children}
        </div>
      )}
    </a>
  );
};

// Mobile NavItem component with liquid glass styling
const MobileNavItem = ({ to, icon: Icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className="relative flex flex-col items-center justify-center py-1.5 px-5 transition-all duration-300"
      onClick={onClick}
    >
      {/* Active glow effect */}
      {isActive && (
        <motion.div
          layoutId="navGlow"
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.2) 0%, transparent 70%)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Icon container with liquid glass effect when active */}
      <motion.div
        className="relative p-2.5 rounded-2xl transition-all duration-300"
        style={{
          background: isActive
            ? 'linear-gradient(135deg, rgba(236,72,153,0.25) 0%, rgba(139,92,246,0.15) 100%)'
            : 'transparent',
          boxShadow: isActive
            ? 'inset 0 1px 1px rgba(255,255,255,0.2), 0 2px 8px rgba(236,72,153,0.2)'
            : 'none'
        }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon
          size={22}
          className="transition-all duration-300"
          style={{
            color: isActive ? '#f472b6' : 'rgba(255,255,255,0.5)',
            filter: isActive ? 'drop-shadow(0 0 8px rgba(236,72,153,0.6))' : 'none'
          }}
        />
      </motion.div>

      <span
        className="text-[10px] font-medium mt-1 transition-all duration-300"
        style={{
          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
          textShadow: isActive ? '0 0 10px rgba(236,72,153,0.5)' : 'none'
        }}
      >
        {children}
      </span>
    </NavLink>
  );
};

// Mobile menu item for the slide-out menu
const MobileMenuItem = ({ to, icon: Icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 text-sm rounded-md
        transition-all duration-200 ease-out
        ${isActive
          ? 'text-white bg-accent/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
      onClick={onClick}
    >
      <Icon size={20} className={isActive ? 'text-accent' : ''} />
      <span>{children}</span>
    </NavLink>
  );
};

// External Link Item for mobile menu
const MobileExternalLinkItem = ({ href, icon: Icon, children, onClick }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center gap-3 px-4 py-3 text-sm rounded-md
        transition-all duration-200 ease-out
        text-gray-400 hover:text-white hover:bg-white/5
      `}
      onClick={onClick}
    >
      <Icon size={20} />
      <span>{children}</span>
    </a>
  );
};

// Desktop playlist section
const PlaylistSection = ({ isCollapsed, playlists, fetchPlaylists }) => {
  return (
    <div className="mt-6 flex-1 overflow-hidden">
      <div className="px-4 py-2 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Your Playlists
            </div>
            <button
              onClick={fetchPlaylists}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        )}
      </div>

      <motion.div
        animate={{
          height: !isCollapsed ? 'auto' : 0,
          opacity: !isCollapsed ? 1 : 0
        }}
        className="overflow-y-auto"
      >
        {playlists.length === 0 ? (
          <div className="flex flex-col gap-2 px-6 py-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Music size={16} />
              <span>No playlists found.</span>
            </div>
            <NavLink
              to="/create-playlist"
              className="flex items-center gap-2 w-fit px-3 py-1 bg-white/5
              hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Create Playlist</span>
            </NavLink>
          </div>
        ) : (
          playlists.map((playlist) => (
            <NavLink
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              className={({ isActive }) => `
              flex items-center gap-3 px-6 py-2 text-sm
              transition-all duration-200 hover:bg-white/5
              ${isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}
              `}
            >
              <Music size={16} />
              <span className="truncate">{playlist.name}</span>
            </NavLink>
          ))
        )}
      </motion.div>
    </div>
  );
};

// Mobile menu sheet component with swipe gestures
const MobileMenuSheet = ({
  isOpen,
  onClose,
  playlists,
  isArtist,
  isAdmin,
  isYearInReviewSeason,
  navigate,
  fetchPlaylists
}) => {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Menu panel with swipe to close */}
          <motion.div
            className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-surface z-50 flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25 }}
            drag="x"
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.x < -80) {
                onClose();
              }
            }}
          >
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <h2 className="text-xl font-bold">Menu</h2>
              <button 
                className="p-2 text-gray-400 hover:text-white"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <div className="p-2 space-y-1">
                <div className="px-2 py-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Browse Music
                  </span>
                </div>
                <MobileMenuItem to="/" icon={Home} onClick={onClose}>Home</MobileMenuItem>
                <MobileMenuItem to="/search" icon={Search} onClick={onClose}>Search</MobileMenuItem>
                <MobileMenuItem to="/library" icon={Library} onClick={onClose}>Your Library</MobileMenuItem>
                <MobileMenuItem to="/create-playlist" icon={PlusSquare} onClick={onClose}>Create Playlist</MobileMenuItem>
                <MobileMenuItem to="/liked-songs" icon={Heart} onClick={onClose}>Liked Songs</MobileMenuItem>
                <MobileMenuItem to="/recent" icon={Clock} onClick={onClose}>Recently Played</MobileMenuItem>
                {isYearInReviewSeason && (
                  <MobileMenuItem to="/year-in-review" icon={CalendarRange} onClick={onClose}>Year in Review</MobileMenuItem>
                )}
                {isArtist && (
                  <MobileMenuItem to="/artist/dashboard" icon={Mic} onClick={onClose}>Artist Dashboard</MobileMenuItem>
                )}
                {isAdmin && (
                  <MobileMenuItem to="/admin" icon={Shield} onClick={onClose}>Admin Panel</MobileMenuItem>
                )}
                <div className="px-2 py-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Account
                  </span>
                </div>
                <MobileMenuItem to="/settings" icon={Settings} onClick={onClose}>Settings</MobileMenuItem>
              </div>
              
              <div className="px-2 py-4">
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Community
                </span>
              </div>
              
              <div className="p-2 space-y-1">
                <MobileExternalLinkItem 
                  href="https://github.com/Beatfly-music" 
                  icon={Github} 
                  onClick={onClose}
                >
                  GitHub
                </MobileExternalLinkItem>
                <MobileExternalLinkItem 
                  href="https://discord.gg/Q8ad8X36Ye" 
                  icon={MessageCircle} 
                  onClick={onClose}
                >
                  Discord Community
                </MobileExternalLinkItem>
              </div>
              
              <div className="px-4 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Your Playlists
                  </span>
                  <button
                    onClick={fetchPlaylists}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>
              
              <div className="px-2">
                {playlists.length === 0 ? (
                  <div className="flex flex-col gap-2 px-4 py-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Music size={16} />
                      <span>No playlists found.</span>
                    </div>
                  </div>
                ) : (
                  playlists.map((playlist) => (
                    <NavLink
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 text-sm rounded-md
                        transition-all duration-200 hover:bg-white/5
                        ${isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}
                      `}
                      onClick={onClose}
                    >
                      <Music size={16} />
                      <span className="truncate">{playlist.name}</span>
                    </NavLink>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  navigate('/create-playlist');
                  onClose();
                }}
                className="flex items-center justify-center w-full gap-2 h-12
                bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors mb-3"
              >
                <Plus size={20} />
                <span className="text-sm font-medium">New Playlist</span>
              </button>
              
              {!isArtist && (
                <button
                  onClick={() => {
                    navigate('/artist/dashboard');
                    onClose();
                  }}
                  className="flex items-center justify-center w-full gap-2 h-12
                  bg-gradient-to-r from-accent to-accent-light
                  hover:opacity-90 rounded-lg text-white transition-colors"
                >
                  <Music2 size={20} />
                  <span className="text-sm font-medium">Become an Artist</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main Sidebar component that handles both desktop and mobile
const Sidebar = () => {
  // Get sidebar state from context
  const { isCollapsed, setIsCollapsed } = useSidebar();
  // Get responsive state from context
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  
  // Local state
  const [playlists, setPlaylists] = useState([]);
  const [isArtist, setIsArtist] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isAdmin = !!(user?.is_admin || user?.isAdmin || user?.role === 'admin');
  const isYearInReviewSeason = new Date().getMonth() === 11;

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch playlists from API
  const fetchPlaylists = async () => {
    try {
      const response = await MusicAPI.getPlaylists();
      setPlaylists(prevPlaylists => {
        const newPlaylists = response.data.playlists || response.data;
        if (JSON.stringify(prevPlaylists) !== JSON.stringify(newPlaylists)) {
          return newPlaylists;
        }
        return prevPlaylists;
      });
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  // Check if user is an artist
  const checkArtistStatus = async () => {
    try {
      const userProfile = await MusicAPI.getUserProfile();
      const artistProfile = await MusicAPI.getArtistProfile(userProfile.data.id);
      setIsArtist(!!artistProfile.data?.stage_name);
    } catch (error) {
      setIsArtist(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPlaylists();
    checkArtistStatus();
    const interval = setInterval(fetchPlaylists, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handler for becoming an artist
  const handleBecomeArtist = () => {
    navigate('/artist/dashboard');
  };

  // Swipe gesture detection for mobile
  useEffect(() => {
    if (!isMobile) return;
    
    let touchStartX = 0;
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      
      // Right swipe from left edge to open menu
      if (deltaX > 70 && touchStartX < 30) {
        setShowMenu(true);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // Mobile bottom navigation bar
  if (isMobile) {
    return (
      <>
        {/* Bottom Navigation Bar - Floating Liquid Glass Design */}
        <div
          className="fixed bottom-3 left-3 right-3 h-[64px] flex items-center justify-around z-30 rounded-[22px] overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg,
                rgba(255,255,255,0.12) 0%,
                rgba(255,255,255,0.05) 40%,
                rgba(236,72,153,0.08) 70%,
                rgba(139,92,246,0.06) 100%
              )
            `,
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: `
              0 8px 32px rgba(0,0,0,0.4),
              0 2px 8px rgba(236,72,153,0.08),
              inset 0 1px 1px rgba(255,255,255,0.2),
              inset 0 -1px 1px rgba(0,0,0,0.1)
            `
          }}
        >
          {/* Top reflection highlight */}
          <div
            className="absolute inset-x-0 top-0 h-8 pointer-events-none rounded-t-[22px]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)'
            }}
          />

          {/* Subtle gradient overlay for depth */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[22px]"
            style={{
              background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(139,92,246,0.08) 0%, transparent 60%)'
            }}
          />

          <MobileNavItem to="/" icon={Home}>Home</MobileNavItem>
          <MobileNavItem to="/search" icon={Search}>Search</MobileNavItem>
          <MobileNavItem to="/library" icon={Library}>Library</MobileNavItem>

          {/* More button with liquid glass style */}
          <motion.button
            onClick={() => setShowMenu(true)}
            className="relative flex flex-col items-center justify-center py-1.5 px-5"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="p-2.5 rounded-2xl transition-all duration-300"
              whileTap={{ scale: 0.9 }}
            >
              <Menu
                size={22}
                style={{ color: 'rgba(255,255,255,0.5)' }}
              />
            </motion.div>
            <span
              className="text-[10px] font-medium mt-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              More
            </span>
          </motion.button>
        </div>
        
        {/* Mobile Menu Sheet with swipe gestures */}
        <MobileMenuSheet 
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          playlists={playlists}
          isArtist={isArtist}
          isAdmin={isAdmin}
          isYearInReviewSeason={isYearInReviewSeason}
          navigate={navigate}
          fetchPlaylists={fetchPlaylists}
        />
      </>
    );
  }

  // Desktop sidebar - Liquid Glass Design
  return (
    <motion.div
      animate={{ width: isCollapsed ? '5rem' : '16rem' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 bottom-[72px] flex flex-col z-30"
      style={{
        background: `
          linear-gradient(180deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.02) 20%,
            rgba(6,9,18,0.95) 100%
          )
        `,
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Fixed header with collapse button */}
      <div className="flex-shrink-0 flex justify-end p-2">
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-white/5 text-gray-400
          hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </motion.button>
      </div>

      {/* Scrollable content area */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 8px, black calc(100% - 8px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 8px, black calc(100% - 8px), transparent)'
        }}
      >
        <div className="space-y-1 py-2">
          <DesktopNavItem to="/" icon={Home} isCollapsed={isCollapsed}>Home</DesktopNavItem>
          <DesktopNavItem to="/search" icon={Search} isCollapsed={isCollapsed}>Search</DesktopNavItem>
          <DesktopNavItem to="/library" icon={Library} isCollapsed={isCollapsed}>Your Library</DesktopNavItem>
        </div>

        <div className="mt-4 space-y-1 py-2">
          <DesktopNavItem to="/create-playlist" icon={PlusSquare} isCollapsed={isCollapsed}>Create Playlist</DesktopNavItem>
          <DesktopNavItem to="/liked-songs" icon={Heart} isCollapsed={isCollapsed}>Liked Songs</DesktopNavItem>
          <DesktopNavItem to="/recent" icon={Clock} isCollapsed={isCollapsed}>Recently Played</DesktopNavItem>
          <DesktopNavItem to="/settings" icon={Settings} isCollapsed={isCollapsed}>Settings</DesktopNavItem>
          {isYearInReviewSeason && (
            <DesktopNavItem to="/year-in-review" icon={CalendarRange} isCollapsed={isCollapsed}>Year in Review</DesktopNavItem>
          )}
          {isArtist && (
            <DesktopNavItem to="/artist/dashboard" icon={Mic} isCollapsed={isCollapsed}>Artist Dashboard</DesktopNavItem>
          )}
          {isAdmin && (
            <DesktopNavItem to="/admin" icon={Shield} isCollapsed={isCollapsed}>Admin Panel</DesktopNavItem>
          )}
        </div>

        {/* Social Links */}
        <div className="mt-4 space-y-1 py-2">
          <ExternalLinkItem
            href="https://github.com/Beatfly-music"
            icon={Github}
            isCollapsed={isCollapsed}
          >
            GitHub
          </ExternalLinkItem>
          <ExternalLinkItem
            href="https://discord.gg/Q8ad8X36Ye"
            icon={MessageCircle}
            isCollapsed={isCollapsed}
          >
            Discord Community
          </ExternalLinkItem>
        </div>

        {/* Playlists section */}
        <PlaylistSection
          isCollapsed={isCollapsed}
          playlists={playlists}
          fetchPlaylists={fetchPlaylists}
        />

        {/* Bottom padding for scroll */}
        <div className="h-4" />
      </div>

      {/* Fixed footer buttons */}
      {!isCollapsed && (
        <div className="flex-shrink-0 p-4 space-y-3 border-t border-white/5">
          <NavLink
            to="/create-playlist"
            className="flex items-center justify-center gap-2 h-10 bg-white/5
            hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <Plus size={20} />
            <span className="text-sm font-medium">New Playlist</span>
          </NavLink>

          {!isArtist && (
            <button
              onClick={handleBecomeArtist}
              className="flex items-center justify-center w-full gap-2 h-10
              bg-gradient-to-r from-accent to-accent-light
              hover:opacity-90 rounded-full text-white transition-colors"
            >
              <Music2 size={20} />
              <span className="text-sm font-medium">Become an Artist</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;
