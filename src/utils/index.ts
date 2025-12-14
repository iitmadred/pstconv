// ============================================================
// Utility Functions
// ============================================================

/**
 * Format seconds into MM:SS or M:SS display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format time as HH:MM for display
 */
export function formatTimeHHMM(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a time string (HH:MM) is in the past for today
 */
export function isTimePast(time: string): boolean {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const taskTime = new Date();
  taskTime.setHours(hours, minutes, 0, 0);
  return now > taskTime;
}

/**
 * Check if a time string (HH:MM) is the current hour
 */
export function isCurrentHour(time: string): boolean {
  const [hours] = time.split(':').map(Number);
  const now = new Date();
  return now.getHours() === hours;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Vibrate device if supported
 */
export function vibrate(pattern: number | number[] = 50): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Get day of week
 */
export function getDayOfWeek(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate total workout duration from exercises
 */
export function calculateWorkoutDuration(exercises: Array<{ sets: number; work: number; rest: number }>): number {
  return exercises.reduce((total, ex) => {
    return total + (ex.sets * ex.work) + ((ex.sets - 1) * ex.rest);
  }, 0);
}

/**
 * Format duration in minutes
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}
