import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  History, 
  BookOpen, 
  Settings,
  HelpCircle, 
  Play
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Simulation', path: '/' },
  { icon: History, label: 'Training Log', path: '/training-log' },
  { icon: BookOpen, label: 'Technique Library', path: '/library' },
  { icon: Settings, label: 'Presets', path: '/presets' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low border-r border-outline-variant/10 pt-16">
      <div className="px-6 py-8">
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
        <Link to="/designer" className="w-full py-3 bg-primary bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Play className="w-4 h-4 fill-current" />
          Move Designer
        </Link>
        
        <div className="pt-4 border-t border-outline-variant/20">
          <a className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:translate-x-1 duration-200 text-sm" href="#">
            <HelpCircle className="w-4 h-4" />
            Support
          </a>
        </div>
      </div>
    </aside>
  );
}
