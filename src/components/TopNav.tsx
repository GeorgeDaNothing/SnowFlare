import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function TopNav() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-surface/80 backdrop-blur-md shadow-sm docked full-width top-0 sticky z-50 flex justify-end items-center w-full px-6 py-3 max-w-full border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container">
              <img 
                alt="User profile" 
                className="w-full h-full object-cover" 
                src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=ab3500&color=fff'}
                referrerPolicy="no-referrer"
              />
            </div>
            <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", menuOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-surface-container-low rounded-xl shadow-lg border border-outline-variant/10 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-outline-variant/10">
                  <p className="text-sm font-semibold text-on-surface truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                </div>
                <div className="border-t border-outline-variant/10 py-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error-container/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
