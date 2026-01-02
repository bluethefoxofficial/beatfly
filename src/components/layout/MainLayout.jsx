// MainLayout.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import Player from './Player/index';
import PlaybackSync from '../shared/PlaybackSync';

// Create contexts for sidebar and responsive state
export const SidebarContext = createContext(null);
export const ResponsiveContext = createContext(null);

// Hook for accessing sidebar state
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Hook for accessing responsive state
export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};

const MainLayout = () => {
  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // Initial check
    checkIfMobile();

    // Add resize listener
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <ResponsiveContext.Provider value={{ isMobile }}>
      <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
        <div className="relative flex flex-col h-screen text-white overflow-hidden">
          <PlaybackSync />
          {/* Ambient background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
            <div className="absolute -left-40 top-10 w-[380px] h-[380px] bg-accent/30 blur-[140px] opacity-60" />
            <div className="absolute -right-24 top-24 w-[300px] h-[300px] bg-indigo-500/25 blur-[140px]" />
            <div className="absolute -bottom-32 left-10 w-[320px] h-[320px] bg-emerald-400/20 blur-[140px]" />
          </div>

          <div className="relative flex flex-col h-full bg-background/70 backdrop-blur-xl">
            {/* Only show TitleBar on desktop */}
            {!isMobile && <TitleBar />}

            {/* Main content wrapper */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main content area with conditional margin for desktop */}
              <motion.main
                initial={false}
                animate={{
                  marginLeft: isMobile ? 0 : (isCollapsed ? '5rem' : '16rem')
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`relative z-10 flex-1 overflow-y-auto ${isMobile ? 'pb-[148px]' : 'pb-[72px]'}`}
              >
                <Outlet />
              </motion.main>
            </div>

            {/* Player & Sidebar */}
            <Player />
            <Sidebar />
          </div>
        </div>
      </SidebarContext.Provider>
    </ResponsiveContext.Provider>
  );
};

export default MainLayout;
