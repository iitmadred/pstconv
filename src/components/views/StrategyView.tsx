// ============================================================
// Strategy View - Workout Selection & Tracking
// ============================================================

import { Play, Clock, Dumbbell, Zap, Heart, Award, Trophy, Target } from 'lucide-react';
import type { WorkoutPreset, WorkoutStats } from '../../types';
import { calculateWorkoutDuration, formatDuration } from '../../utils';

interface StrategyViewProps {
  workouts: WorkoutPreset[];
  stats: WorkoutStats;
  onWorkoutSelect: (workout: WorkoutPreset) => void;
}

const WORKOUT_ICONS: { [key: string]: React.ReactNode } = {
  '💪': <Dumbbell className="w-6 h-6" />,
  '⚡': <Zap className="w-6 h-6" />,
  '❤️': <Heart className="w-6 h-6" />,
  '🏆': <Award className="w-6 h-6" />,
};

// Stat Card Component
function StatCard({
  value,
  label,
  icon: Icon,
  color,
}: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClass = {
    'neon-purple': 'text-neon-purple bg-neon-purple/10 border-neon-purple/20',
    'neon-blue': 'text-neon-blue bg-neon-blue/10 border-neon-blue/20',
    'neon-pink': 'text-neon-pink bg-neon-pink/10 border-neon-pink/20',
    'emerald': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }[color] || 'text-white bg-white/10 border-white/20';

  return (
    <div className="glass-card p-4 rounded-xl border border-white/10 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClass.split(' ').slice(1).join(' ')}`}>
        <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
      </div>
      <div className="text-xs text-gray-400">
        {label}
      </div>
    </div>
  );
}

export function StrategyView({
  workouts,
  stats,
  onWorkoutSelect,
}: StrategyViewProps) {
  return (
    <div className="px-4 py-4 pb-24 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-1 text-white">
          Workout Strategy
        </h2>
        <p className="text-sm text-gray-400">
          Select a workout to begin your session
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={stats.totalWorkouts}
          label="Total Workouts"
          icon={Dumbbell}
          color="neon-blue"
        />
        <StatCard
          value={stats.streak}
          label="Day Streak"
          icon={Trophy}
          color="neon-purple"
        />
        <StatCard
          value={Math.round(stats.totalTime / 60)}
          label="Minutes Trained"
          icon={Clock}
          color="neon-pink"
        />
        <StatCard
          value={stats.lastWorkout
            ? new Date(stats.lastWorkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '-'
          }
          label="Last Workout"
          icon={Target}
          color="emerald"
        />
      </div>

      {/* Workout Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-gray-400">
          Available Workouts
        </h3>
        <div className="space-y-3">
          {workouts.map(workout => {
            const duration = calculateWorkoutDuration(workout.exercises);
            const exerciseCount = workout.exercises.length;
            const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

            return (
              <button
                key={workout.id}
                onClick={() => onWorkoutSelect(workout)}
                className="w-full glass-card rounded-2xl p-4 border border-white/10 transition-all active:scale-[0.98] group hover:border-neon-blue/50 hover:bg-white/5"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-3 rounded-xl bg-neon-blue/10 text-neon-blue group-hover:bg-neon-blue/20 transition-colors shadow-[0_0_10px_rgba(0,243,255,0.1)]">
                    {WORKOUT_ICONS[workout.icon] || <Dumbbell className="w-6 h-6" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                        {workout.name}
                      </h3>
                      {workout.routine && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-gray-300 border border-white/5">
                          Routine {workout.routine}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(duration)}
                      </span>
                      <span>{exerciseCount} exercises</span>
                      <span>{totalSets} sets</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <div className="p-2 rounded-full bg-white/5 text-gray-400 group-hover:bg-neon-blue group-hover:text-black transition-all shadow-lg">
                    <Play className="w-5 h-5" />
                  </div>
                </div>

                {/* Exercise Preview */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {workout.exercises.slice(0, 4).map((ex, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg text-xs bg-white/5 text-gray-400 border border-white/5"
                      >
                        {ex.name}
                      </span>
                    ))}
                    {workout.exercises.length > 4 && (
                      <span className="px-2 py-1 rounded-lg text-xs bg-white/5 text-gray-400 border border-white/5">
                        +{workout.exercises.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
