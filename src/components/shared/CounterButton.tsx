// ============================================================
// Counter Button Component - For Protein & Hydration Tracking
// ============================================================

import { Plus, Minus } from 'lucide-react';

interface CounterButtonProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  color?: 'amber' | 'sky' | 'emerald';
}

const COLOR_CLASSES = {
  amber: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    button: 'hover:bg-amber-500/30 active:bg-amber-500/40',
  },
  sky: {
    bg: 'bg-sky-500/20',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    button: 'hover:bg-sky-500/30 active:bg-sky-500/40',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    button: 'hover:bg-emerald-500/30 active:bg-emerald-500/40',
  },
};

export function CounterButton({
  value,
  onIncrement,
  onDecrement,
  label,
  unit = '',
  min = 0,
  max = Infinity,
  color = 'amber',
}: CounterButtonProps) {
  const colors = COLOR_CLASSES[color];
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
      {/* Label */}
      <span className="text-sm text-slate-300">{label}</span>

      {/* Counter Controls */}
      <div className="flex items-center gap-2">
        {/* Decrement */}
        <button
          onClick={onDecrement}
          disabled={!canDecrement}
          className={`
            p-2 rounded-lg transition-colors
            ${canDecrement ? colors.button : 'opacity-30 cursor-not-allowed'}
          `}
          aria-label={`Decrease ${label}`}
        >
          <Minus className={`w-4 h-4 ${colors.text}`} />
        </button>

        {/* Value Display */}
        <div className="min-w-[60px] text-center">
          <span className={`text-lg font-bold ${colors.text}`}>{value}</span>
          {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
        </div>

        {/* Increment */}
        <button
          onClick={onIncrement}
          disabled={!canIncrement}
          className={`
            p-2 rounded-lg transition-colors
            ${canIncrement ? colors.button : 'opacity-30 cursor-not-allowed'}
          `}
          aria-label={`Increase ${label}`}
        >
          <Plus className={`w-4 h-4 ${colors.text}`} />
        </button>
      </div>
    </div>
  );
}
