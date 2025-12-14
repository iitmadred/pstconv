// ============================================================
// Planner View - Modern Timeline of Daily Tasks
// ============================================================

import { useMemo } from 'react';
import {
  Clock,
  Dumbbell,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Circle,
  Play,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { Task } from '../../types';
import { isCurrentHour, calculateProgress } from '../../utils';
// import { useTheme } from '../../contexts';

interface PlannerViewProps {
  tasks: Task[];
  activeRoutine: 'A' | 'B';
  onTaskToggle: (taskId: string) => void;
  onRoutineToggle: () => void;
  onWorkoutPress: (workoutId: string) => void;
}

// Time Block Icons
const TimeBlockIcon = ({ block }: { block: 'morning' | 'afternoon' | 'evening' }) => {
  const icons = {
    morning: Sun,
    afternoon: Sunset,
    evening: Moon,
  };
  const Icon = icons[block];
  return <Icon className="w-4 h-4" />;
};

// Progress Ring for Header
function MiniProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  // const { theme } = useTheme();
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#A5EB3F"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// Modern Task Card
function TimelineTaskCard({
  task,
  onToggle,
  onPress,
  isHighlighted,
  isLast
}: {
  task: Task;
  onToggle: (id: string) => void;
  onPress?: () => void;
  isHighlighted: boolean;
  isLast: boolean;
}) {
  // const { theme } = useTheme();
  // const isDark = theme === 'dark';

  const handleClick = () => {
    if (task.type === 'workout' && onPress) {
      onPress();
    } else {
      onToggle(task.id);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div
          className={`
            w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300
            ${task.completed
              ? 'bg-stemmy-lime scale-100'
              : isHighlighted
                ? 'bg-stemmy-lime animate-pulse'
                : 'bg-gray-700'
            }
          `}
        />
        {!isLast && (
          <div
            className={`
              w-0.5 flex-1 min-h-8 transition-colors duration-300
              ${task.completed
                ? 'bg-stemmy-lime/50'
                : 'bg-gray-800'
              }
            `}
          />
        )}
      </div>

      {/* Task Card */}
      <button
        onClick={handleClick}
        className={`
          flex-1 mb-2 p-3 rounded-xl text-left transition-all duration-200
          ${isHighlighted
            ? 'ring-1 ring-stemmy-lime/50 shadow-lg shadow-stemmy-lime/10'
            : ''
          }
          ${task.completed
            ? 'bg-stemmy-lime/10 border border-stemmy-lime/20'
            : 'bg-stemmy-card border border-stemmy-border hover:bg-white/5'
          }
          active:scale-[0.98]
        `}
      >
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0">
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-stemmy-lime" />
            ) : (
              <Circle className="w-5 h-5 text-gray-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`
                text-xs font-medium px-2 py-0.5 rounded-full
                ${isHighlighted
                  ? 'bg-stemmy-lime/20 text-stemmy-lime'
                  : 'bg-gray-800 text-gray-400'
                }
              `}>
                {task.time}
              </span>
              {task.type === 'workout' && (
                <span className="text-xs bg-stemmy-lime/20 text-stemmy-lime px-2 py-0.5 rounded-full">
                  Workout
                </span>
              )}
            </div>
            <p className={`
              mt-1 font-medium truncate
              ${task.completed
                ? 'text-gray-400 line-through'
                : 'text-primary'
              }
            `}>
              {task.title}
            </p>
          </div>

          {/* Action Indicator */}
          {task.type === 'workout' && !task.completed && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-stemmy-lime flex items-center justify-center">
                <Play className="w-4 h-4 text-black ml-0.5" />
              </div>
            </div>
          )}
          {task.type !== 'workout' && !task.completed && (
            <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-600" />
          )}
        </div>
      </button>
    </div>
  );
}

// Time Block Section
function TimeBlock({
  title,
  block,
  tasks,
  onTaskToggle,
  onWorkoutPress
}: {
  title: string;
  block: 'morning' | 'afternoon' | 'evening';
  tasks: Task[];
  onTaskToggle: (id: string) => void;
  onWorkoutPress: (workoutId: string) => void;
}) {
  // const { theme } = useTheme();
  // const isDark = theme === 'dark';
  const completedCount = tasks.filter(t => t.completed).length;

  const blockColors = {
    morning: 'text-stemmy-lime',
    afternoon: 'text-stemmy-lime',
    evening: 'text-stemmy-lime',
  };

  if (tasks.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Block Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={blockColors[block]}>
          <TimeBlockIcon block={block} />
        </div>
        <span className="text-sm font-semibold text-primary">
          {title}
        </span>
        <span className="text-xs text-gray-500">
          {completedCount}/{tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="pl-1">
        {tasks.map((task, index) => (
          <TimelineTaskCard
            key={task.id}
            task={task}
            onToggle={onTaskToggle}
            onPress={
              task.type === 'workout' && task.meta?.workoutId
                ? () => onWorkoutPress(task.meta!.workoutId!)
                : undefined
            }
            isHighlighted={isCurrentHour(task.time)}
            isLast={index === tasks.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

export function PlannerView({
  tasks,
  activeRoutine,
  onTaskToggle,
  onRoutineToggle,
  onWorkoutPress,
}: PlannerViewProps) {
  // const { theme } = useTheme();
  // const isDark = theme === 'dark';

  // Calculate completion stats
  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    return {
      completed,
      total: tasks.length,
      percentage: calculateProgress(completed, tasks.length),
    };
  }, [tasks]);

  // Group tasks by time blocks (morning, afternoon, evening)
  const groupedTasks = useMemo(() => {
    const morning: Task[] = [];
    const afternoon: Task[] = [];
    const evening: Task[] = [];

    tasks.forEach(task => {
      const hour = parseInt(task.time.split(':')[0], 10);
      if (hour < 12) {
        morning.push(task);
      } else if (hour < 17) {
        afternoon.push(task);
      } else {
        evening.push(task);
      }
    });

    return { morning, afternoon, evening };
  }, [tasks]);

  // Get current time for "Now" indicator
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const formattedTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-full bg-stemmy-bg">
      {/* Header Section */}
      <div className="px-4 py-4 space-y-4">
        {/* Progress Card */}
        <div className="rounded-2xl p-4 border bg-stemmy-card border-stemmy-border">
          <div className="flex items-center gap-4">
            <MiniProgressRing progress={stats.percentage} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stemmy-lime" />
                <span className="text-sm font-semibold text-primary">
                  Today's Progress
                </span>
              </div>
              <p className="text-xs mt-1 text-gray-400">
                {stats.completed} of {stats.total} tasks completed
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500">
                  Now: {formattedTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Routine Toggle */}
        <div className="flex items-center justify-between rounded-xl p-3 border bg-stemmy-card border-stemmy-border">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-stemmy-lime" />
            <span className="text-sm font-medium text-primary">
              Evening Workout
            </span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40">
            <button
              onClick={() => activeRoutine !== 'A' && onRoutineToggle()}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeRoutine === 'A'
                  ? 'bg-stemmy-lime text-black shadow-lg shadow-stemmy-lime/20'
                  : 'text-gray-400 hover:text-primary'
                }
              `}
            >
              A
            </button>
            <button
              onClick={() => activeRoutine !== 'B' && onRoutineToggle()}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeRoutine === 'B'
                  ? 'bg-stemmy-lime text-black shadow-lg shadow-stemmy-lime/20'
                  : 'text-gray-400 hover:text-primary'
                }
              `}
            >
              B
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <TimeBlock
          title="Morning"
          block="morning"
          tasks={groupedTasks.morning}
          onTaskToggle={onTaskToggle}
          onWorkoutPress={onWorkoutPress}
        />
        <TimeBlock
          title="Afternoon"
          block="afternoon"
          tasks={groupedTasks.afternoon}
          onTaskToggle={onTaskToggle}
          onWorkoutPress={onWorkoutPress}
        />
        <TimeBlock
          title="Evening"
          block="evening"
          tasks={groupedTasks.evening}
          onTaskToggle={onTaskToggle}
          onWorkoutPress={onWorkoutPress}
        />

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 mb-4 text-gray-700" />
            <p className="text-sm text-gray-500">
              No tasks scheduled for today
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
