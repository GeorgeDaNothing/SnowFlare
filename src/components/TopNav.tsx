import React from 'react';
import { Bell, Settings, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Move Designer', path: '/designer' },
  { label: 'Video Analysis', path: '/analysis' },
  { label: 'AI Insights', path: '/insights' },
];

export function TopNav() {
  const location = useLocation();

  return (
    <nav className="bg-surface/80 backdrop-blur-md shadow-sm docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-6 py-3 max-w-full border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold tracking-tighter text-on-surface">
          Horizon Pulse
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium tracking-tight transition-all pb-1",
                  isActive 
                    ? "text-primary border-b-2 border-primary font-bold" 
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container">
          <img 
            alt="User profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUd2CVUpriVeVTHI1t_QJyT6VeZzM7ZOkaCa7GFGqvElc1GCl9E_uFl2qJYe3SSEp-cKss0tu6317dHE2FYhVGipINWg1x2o7ZWqy8XHVnLTjzBFf0EOnYn55OAWe4DoQEZAk0016u-TWt75hqPrOf35dIwi25bOVcJjdkprTuGmHOBRyr3_egUfhXvfstEUymytp5c3u4VX-Fifxs5t5KtggJ_ScjJJXhZFz-NzS7rSPS8ib5iPzJnTmPjiPr40DstmkibcR9QK0"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </nav>
  );
}
