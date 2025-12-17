import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, AppProvider, AuthProvider, useApp, useAuth } from './contexts';
import {
  LoginScreen,
  OnboardingNameScreen,
  OnboardingGoalsScreen,
  DashboardScreen,
  PlannerScreen,
  WorkoutScreen,
  StatsScreen,
  ProfileScreen,
  WorkoutManagerScreen,
  AnalyticsScreen,
  AuthCallback
} from './components/views';
import { useTimer, useAudio, useWakeLock } from './hooks/index';
import { WORKOUTS } from './data.ts';
import type { TimerPhase } from './types/index';

// ============================================================
// Auth Guard Component - Strict Supabase Authentication
// ============================================================
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const { isAuthenticated, isSupabaseEnabled, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="dark bg-black min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  // Public routes that don't require auth
  const publicRoutes = ['/', '/auth/callback'];

  // If Supabase is enabled, require authentication for all non-public routes
  if (isSupabaseEnabled && !isAuthenticated && !publicRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // If authenticated but not onboarded, allow only onboarding routes
  if (isAuthenticated && !user.isOnboarded) {
    const onboardingRoutes = ['/', '/onboarding-name', '/onboarding-goals'];
    if (!onboardingRoutes.includes(location.pathname)) {
      return <Navigate to="/onboarding-name" replace />;
    }
  }

  return <>{children}</>;
}

// ============================================================
// Main App Content with Routing
// ============================================================
function AppRoutes() {
  const navigate = useNavigate();
  const {
    filteredTasks,
    toggleTask,
    activeWorkout,
    selectWorkout,
    recordWorkout,
    availableWorkouts,
  } = useApp();

  // --- Audio & Wake Lock ---
  const { playSound, initAudio } = useAudio();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // --- Timer Hook ---
  const timer = useTimer(activeWorkout?.exercises || [], {
    onPhaseChange: (phase: TimerPhase) => {
      if (phase === 'WORK' || phase === 'REST') {
        playSound('WORK_START');
      } else if (phase === 'COMPLETE') {
        playSound('WORKOUT_DONE');
        releaseWakeLock();
      }
    },
    onTick: (remaining: number) => {
      if (remaining <= 3 && remaining > 0) {
        playSound('COUNTDOWN');
      }
    },
  });

  // --- Initialize Audio ---
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initAudio]);

  // --- Handlers ---
  const handleWorkoutSelect = useCallback((workoutId: string) => {
    const workout = WORKOUTS.find(w => w.id === workoutId) || WORKOUTS[0];
    selectWorkout(workout);
    requestWakeLock();
    navigate('/workout');
  }, [selectWorkout, requestWakeLock, navigate]);

  const handleWorkoutComplete = useCallback((workoutStats: { duration: number; exercises: number }) => {
    if (activeWorkout) {
      recordWorkout({
        workoutId: activeWorkout.id,
        duration: workoutStats.duration,
        exercises: workoutStats.exercises,
      });
    }
    releaseWakeLock();
    timer.reset();
    navigate('/dashboard');
  }, [activeWorkout, recordWorkout, releaseWakeLock, timer, navigate]);

  const handleWorkoutExit = useCallback(() => {
    timer.reset();
    releaseWakeLock();
    selectWorkout(null);
    navigate(-1);
  }, [timer, releaseWakeLock, selectWorkout, navigate]);

  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/onboarding-name" element={<OnboardingNameScreen />} />
        <Route path="/onboarding-goals" element={<OnboardingGoalsScreen />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/dashboard" element={<DashboardScreen />} />

        <Route path="/planner" element={
          <PlannerScreen
            tasks={filteredTasks}
            onTaskToggle={toggleTask}
            onWorkoutSelect={handleWorkoutSelect}
            availableWorkouts={availableWorkouts}
          />
        } />

        <Route path="/workout" element={
          <WorkoutScreen
            workout={activeWorkout || WORKOUTS[0]}
            timer={timer}
            onClose={handleWorkoutExit}
            onComplete={handleWorkoutComplete}
          />
        } />

        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/workouts" element={<WorkoutManagerScreen />} />
        <Route path="/analytics" element={<AnalyticsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGuard>
  );
}

// ============================================================
// App Root
// ============================================================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
