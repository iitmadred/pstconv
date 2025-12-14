// ============================================================
// Progress Bar Component
// ============================================================

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const COLOR_CLASSES = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  max,
  label,
  showPercentage = false,
  color = 'amber',
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-medium text-slate-300">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${SIZE_CLASSES[size]}`}>
        <div
          className={`
            ${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} rounded-full
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
