import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  History, 
  BookOpen, 
  Settings,
  LogOut,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: Home, label: 'Simulation', path: '/' },
  { icon: History, label: 'Training Log', path: '/training-log' },
  { icon: BookOpen, label: 'Technique Library', path: '/library' },
  { icon: Settings, label: 'Presets', path: '/presets' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low border-r border-outline-variant/10">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-outline-variant/10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="SnowFlare" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <span className="text-xl font-bold tracking-tighter text-on-surface block leading-none">SnowFlare</span>
            <span className="text-[10px] text-on-surface-variant tracking-wider uppercase">Snowboarding Simulator</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="px-6 py-6 flex-1">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "bg-surface-container-highest text-primary font-semibold" 
                    : "text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 py-5 border-t border-outline-variant/10 space-y-1">
        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all">
          <img 
            alt="Profile" 
            className="w-5 h-5 rounded-full object-cover ring-1 ring-outline-variant/30" 
            src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=ab3500&color=fff'}
            referrerPolicy="no-referrer"
          />
          Profile
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error-container/50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
