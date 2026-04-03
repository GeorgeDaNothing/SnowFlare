import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  History, 
  BookOpen, 
  Users, 
  Activity, 
  HelpCircle, 
  LogOut,
  Play
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: History, label: 'Session Log', path: '/sessions' },
  { icon: BookOpen, label: 'Technique Library', path: '/library' },
  { icon: Users, label: 'Team Feed', path: '/team' },
  { icon: Activity, label: 'Gear Lab', path: '/gear' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low border-r border-outline-variant/10 pt-16">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <img 
            alt="Pro Athlete Avatar" 
            className="w-10 h-10 rounded-lg object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHT8SIuXcP-5k88qAONiCuHMZXtYEtxqzsfedkwojHm0O8EPecJ4MD5kBRw5EvPRb0E0mSr9ZdTISqmfSKVACBIESwlZtBpG2BAVdPjEw34zuf6hWgfByoWYs3i6a_7eTwlpiQo0bb7-QgOirsS71jFOj8bbe6QkU0tMlPgSCjFffiuEW1Y0pC7M-Ay_KDwInRRApjHlpq3XUt2i4BiR7vEhomfdj5IEN4SnvFV70InXks8Ev1LZasOzpXocpYn5UWFHbn-x2MHaE"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-sm font-bold text-on-surface leading-tight">Elite Performance</p>
            <p className="text-xs text-on-surface-variant opacity-70">Winter Season 24/25</p>
          </div>
        </div>
        
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

      <div className="mt-auto px-6 py-8 space-y-4">
        <button className="w-full py-3 bg-primary bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Play className="w-4 h-4 fill-current" />
          Start Simulation
        </button>
        
        <div className="pt-4 border-t border-outline-variant/20">
          <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:translate-x-1 duration-200 text-sm" href="#">
            <HelpCircle className="w-4 h-4" />
            Support
          </a>
          <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:translate-x-1 duration-200 text-sm" href="#">
            <LogOut className="w-4 h-4" />
            Sign Out
          </a>
        </div>
      </div>
    </aside>
  );
}
