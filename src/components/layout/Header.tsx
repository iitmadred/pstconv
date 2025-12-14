// ============================================================
// Header Component - App Branding, Streak & Theme Toggle
// ============================================================

import { Flame, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts';
import { getGreeting, getDayOfWeek, formatDate } from '../../utils';

interface HeaderProps {
  streak?: number;
  totalWorkouts?: number;
}

export function Header({ streak = 0 }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const today = new Date();

  return (
    <header className="px-4 py-3 glass-panel border-b-0 sticky top-0 z-50 mb-4">
      <div className="flex items-center justify-between">
        {/* Brand & Greeting */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
              <Zap className="w-5 h-5 text-neon-blue" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white">
              STEMMY
            </h1>
          </div>
          <p className="text-xs mt-1 text-gray-400 font-medium">
            {getGreeting()} • {getDayOfWeek()}, {formatDate(today)}
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Streak Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${streak > 0
            ? 'bg-neon-purple/10 border-neon-purple/30 shadow-[0_0_10px_rgba(176,251,93,0.2)]'
            : 'bg-white/5 border-white/10'
            }`}>
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-neon-purple fill-neon-purple/20' : 'text-gray-500'}`} />
            <span className={`text-xs font-bold ${streak > 0 ? 'text-neon-purple' : 'text-gray-500'}`}>
              {streak}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
