import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts';

// --- Components ---

const RadarChart = ({ data }: { data: { strength: number; spirit: number; mind: number; fuel: number } }) => {
    // Top (Spirit), Right (Strength), Bottom (Mind), Left (Fuel)
    // Actually, let's map them:
    // Top: Spirit
    // Right: Strength
    // Bottom: Fuel
    // Left: Mind

    // Scale 0-100 to radius 0-40
    const r = 40;
    const c = 50;

    const getPoint = (value: number, angle: number) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const dist = (value / 100) * r;
        return `${c + dist * Math.cos(rad)},${c + dist * Math.sin(rad)}`;
    };

    const pSpirit = getPoint(data.spirit, 0);
    const pStrength = getPoint(data.strength, 90);
    const pFuel = getPoint(data.fuel, 180);
    const pMind = getPoint(data.mind, 270);

    const points = `${pSpirit} ${pStrength} ${pFuel} ${pMind}`;

    // Background levels
    const levelPoints = (level: number) => {
        const d = level; // 0-100
        const p1 = getPoint(d, 0);
        const p2 = getPoint(d, 90);
        const p3 = getPoint(d, 180);
        const p4 = getPoint(d, 270);
        return `${p1} ${p2} ${p3} ${p4}`;
    };

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            {/* Grid */}
            <polygon points={levelPoints(100)} fill="none" stroke="#334155" strokeWidth="0.5" />
            <polygon points={levelPoints(75)} fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
            <polygon points={levelPoints(50)} fill="none" stroke="#334155" strokeWidth="0.5" />
            <polygon points={levelPoints(25)} fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* Axes */}
            <line x1="50" y1="50" x2="50" y2="10" stroke="#334155" strokeWidth="0.5" />
            <line x1="50" y1="50" x2="90" y2="50" stroke="#334155" strokeWidth="0.5" />
            <line x1="50" y1="50" x2="50" y2="90" stroke="#334155" strokeWidth="0.5" />
            <line x1="50" y1="50" x2="10" y2="50" stroke="#334155" strokeWidth="0.5" />

            {/* Labels */}
            <text x="50" y="8" textAnchor="middle" fontSize="6" fill="#10B981" className="font-mono">SPIRIT</text>
            <text x="92" y="52" textAnchor="start" fontSize="6" fill="#F43F5E" className="font-mono">STR</text>
            <text x="50" y="98" textAnchor="middle" fontSize="6" fill="#3B82F6" className="font-mono">FUEL</text>
            <text x="8" y="52" textAnchor="end" fontSize="6" fill="#8B5CF6" className="font-mono">MIND</text>

            {/* Data Area */}
            <polygon points={points} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="2" />

            {/* Data Points */}
            <circle cx={pSpirit.split(',')[0]} cy={pSpirit.split(',')[1]} r="2" fill="#10B981" />
            <circle cx={pStrength.split(',')[0]} cy={pStrength.split(',')[1]} r="2" fill="#F43F5E" />
            <circle cx={pFuel.split(',')[0]} cy={pFuel.split(',')[1]} r="2" fill="#3B82F6" />
            <circle cx={pMind.split(',')[0]} cy={pMind.split(',')[1]} r="2" fill="#8B5CF6" />
        </svg>
    );
};

const Heatmap = ({ history }: { history: any[] }) => {
    // Generate last 126 days (18 weeks)
    const days = useMemo(() => {
        const d = [];
        const today = new Date();
        for (let i = 125; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const record = history.find(h => h.date === dateStr);
            let score = 0;
            if (record) {
                // Calculate rough score
                if (record.prayers?.completed?.length >= 5) score += 30;
                else score += (record.prayers?.completed?.length || 0) * 5;
                if (record.workout?.count > 0) score += 30;
                if (record.nutrition?.protein >= 100) score += 20;
                if (record.mindfulness?.minutes >= 10) score += 20;
            }
            // Normalize score 0-100
            score = Math.min(100, score);

            d.push({ date: dateStr, score });
        }
        return d;
    }, [history]);

    const getColor = (score: number) => {
        if (score === 0) return 'bg-white/5';
        if (score < 30) return 'bg-emerald-900/50';
        if (score < 60) return 'bg-emerald-700/60';
        if (score < 90) return 'bg-emerald-500/70';
        return 'bg-emerald-400';
    };

    return (
        <div className="flex gap-1 flex-wrap justify-center max-w-md mx-auto">
            {days.map((day) => (
                <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${getColor(day.score)}`}
                    title={`${day.date}: ${day.score}%`}
                />
            ))}
        </div>
    );
};

export function AnalyticsScreen() {
    const { history, user } = useApp();
    const navigate = useNavigate();

    // Stats Calculation
    const stats = useMemo(() => {
        if (history.length === 0) return { strength: 0, spirit: 0, mind: 0, fuel: 0, level: 1 };

        let spiritTotal = 0;
        let strengthTotal = 0;
        let fuelTotal = 0;
        let mindTotal = 0;

        history.forEach(h => {
            // Spirit: 5 prayers = 100%
            const prayers = h.prayers?.completed?.length || 0;
            spiritTotal += (prayers / 5) * 100;

            // Strength: Workout > 0 = 100%
            if (h.workout?.count > 0) strengthTotal += 100;

            // Fuel: Protein > 120 = 100%, > 80 = 50%
            const protein = h.nutrition?.protein || 0;
            if (protein >= 120) fuelTotal += 100;
            else if (protein >= 80) fuelTotal += (protein / 120) * 100;

            // Mind: > 10 mins = 100%
            if (h.mindfulness?.minutes >= 10) mindTotal += 100;
            else mindTotal += (h.mindfulness?.minutes || 0) * 10;
        });

        const count = history.length;

        // Calculate Level based on days tracked
        const level = Math.floor(count / 7) + 1; // Level up every week

        return {
            strength: Math.round(strengthTotal / count),
            spirit: Math.round(spiritTotal / count),
            mind: Math.round(mindTotal / count),
            fuel: Math.round(fuelTotal / count),
            level
        };
    }, [history]);

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                >
                    <span className="material-icons-round text-gray-400">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        SYSTEM ANALYTICS
                    </h1>
                    <span className="text-xs font-mono text-gray-500">USER: {user.name.toUpperCase()}</span>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="space-y-6 max-w-lg mx-auto relative z-10">

                {/* Level Card */}
                <div className="glass-dark p-6 rounded-3xl border border-white/5 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-xs font-mono text-emerald-500 mb-1">CURRENT RANK</p>
                    <h2 className="text-5xl font-bold text-white mb-2">LVL {stats.level}</h2>
                    <p className="text-gray-400 text-sm">Consistent Action over Time</p>
                    <div className="mt-4 h-1 w-32 bg-gray-800 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-3/4 animate-pulse"></div>
                    </div>
                </div>

                {/* Radar Chart Section */}
                <div className="glass-dark p-6 rounded-3xl border border-white/5 aspect-square flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 left-6 text-xs font-mono text-gray-500">ATTRIBUTES</div>
                    <div className="w-full h-full max-w-[280px] max-h-[280px]">
                        <RadarChart data={stats} />
                    </div>
                </div>

                {/* Heatmap Section */}
                <div className="glass-dark p-6 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-300">CONSISTENCY GRID</h3>
                        <span className="text-xs font-mono text-emerald-500">LAST 18 WEEKS</span>
                    </div>
                    <Heatmap history={history} />
                </div>

                {/* Stat Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass-dark p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-xs text-emerald-400 font-mono mb-1">SPIRIT</p>
                        <p className="text-2xl font-bold">{stats.spirit}%</p>
                    </div>
                    <div className="glass-dark p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                        <p className="text-xs text-rose-400 font-mono mb-1">STRENGTH</p>
                        <p className="text-2xl font-bold">{stats.strength}%</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
