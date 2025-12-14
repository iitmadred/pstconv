// ============================================================
// Task Card Component - For Planner Timeline
// ============================================================

import { Check, Utensils, Pill, Dumbbell, Droplet, CheckCircle, Activity } from 'lucide-react';
import type { Task, TaskType } from '../../types';
import { formatTimeHHMM } from '../../utils';

interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onPress?: (task: Task) => void;
  isHighlighted?: boolean;
}

const TASK_ICONS: Record<TaskType, React.ComponentType<{ className?: string }>> = {
  meal: Utensils,
  supplement: Pill,
  workout: Dumbbell,
  hydration: Droplet,
  habit: CheckCircle,
  cardio: Activity,
};

const TASK_COLORS: Record<TaskType, { bg: string; text: string; border: string }> = {
  meal: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  supplement: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  workout: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  hydration: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  habit: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  cardio: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export function TaskCard({ task, onToggle, onPress, isHighlighted }: TaskCardProps) {
  const Icon = TASK_ICONS[task.type];
  const colors = TASK_COLORS[task.type];

  return (
    <div
      onClick={() => onPress?.(task)}
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all
        ${task.completed 
          ? 'bg-slate-800/30 border-slate-700/30 opacity-60' 
          : `${colors.bg} ${colors.border}`
        }
        ${isHighlighted ? 'ring-2 ring-amber-500/50 scale-[1.02]' : ''}
        ${onPress ? 'cursor-pointer active:scale-[0.98]' : ''}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          transition-all active:scale-90
          ${task.completed 
            ? 'bg-emerald-500 border-emerald-500' 
            : 'border-slate-500 hover:border-slate-400'
          }
        `}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Icon */}
      <div className={`p-2 rounded-lg ${task.completed ? 'bg-slate-700/50' : colors.bg}`}>
        <Icon className={`w-4 h-4 ${task.completed ? 'text-slate-500' : colors.text}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
          {task.title}
        </p>
        {task.subtitle && (
          <p className="text-xs text-slate-500 truncate">{task.subtitle}</p>
        )}
      </div>

      {/* Time */}
      <span className={`text-xs font-mono ${task.completed ? 'text-slate-600' : 'text-slate-400'}`}>
        {formatTimeHHMM(task.time)}
      </span>
    </div>
  );
}
