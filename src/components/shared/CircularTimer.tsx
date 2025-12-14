// ============================================================
// Circular Timer Display Component
// ============================================================

import { formatTime } from '../../utils';
import type { TimerPhase } from '../../types';

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  phase: TimerPhase;
  size?: 'sm' | 'md' | 'lg';
}

const PHASE_COLORS = {
  IDLE: { stroke: 'stroke-gray-500', text: 'text-gray-400' },
  PREP: { stroke: 'stroke-amber-500', text: 'text-amber-400' },
  WORK: { stroke: 'stroke-stemmy-lime', text: 'text-stemmy-lime' },
  REST: { stroke: 'stroke-sky-500', text: 'text-sky-400' },
  COMPLETE: { stroke: 'stroke-stemmy-lime', text: 'text-stemmy-lime' },
};

const SIZE_CONFIG = {
  sm: { size: 120, strokeWidth: 6, fontSize: 'text-2xl' },
  md: { size: 180, strokeWidth: 8, fontSize: 'text-4xl' },
  lg: { size: 240, strokeWidth: 10, fontSize: 'text-5xl' },
};

export function CircularTimer({
  timeRemaining,
  totalTime,
  phase,
  size = 'md',
}: CircularTimerProps) {
  const config = SIZE_CONFIG[size];
  const colors = PHASE_COLORS[phase];

  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? (timeRemaining / totalTime) : 1;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-white/10"
        />

        {/* Progress Circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colors.stroke} transition-all duration-1000 ease-linear`}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono font-bold ${config.fontSize} ${colors.text}`}>
          {formatTime(timeRemaining)}
        </span>
        <span className="text-xs uppercase tracking-wider text-gray-500 mt-1">
          {phase}
        </span>
      </div>
    </div>
  );
}
