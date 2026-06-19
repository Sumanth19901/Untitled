/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { User } from "./LoginScreen";
import { UserHeader } from "./UserHeader";
import {
  Play, Pause, Square, SkipForward, AlertTriangle, CheckCircle2,
  BookOpen, BarChart2, Target, Award, Clock, TrendingUp, ChevronRight,
  Star, AlertCircle, Zap, Cloud, History, FileText, Radio,
  MapPin, Navigation, RotateCcw, Shield, Activity, LogOut,
  ChevronDown, ChevronUp, ArrowRight, Cpu,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TraineeDashboardProps { user: User; onLogout: () => void; }

interface Scenario {
  id: string; name: string; difficulty: "beginner" | "intermediate" | "advanced";
  duration: string; completed: boolean; score?: number; description: string;
  objectives: string[]; attempts: number;
}

type SimState = "idle" | "running" | "paused" | "complete" | "emergency";
type Tab = "dashboard" | "simulation" | "control" | "scenarios" | "performance";

// ─── Static data ──────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  { id: "SC-001", name: "Signal Interlocking Basics",  difficulty: "beginner",     duration: "30 min", completed: true,  score: 92, attempts: 2,
    description: "Learn fundamental signal interlocking principles on the VZA mainline.",
    objectives: ["Identify signal aspects", "Set basic route", "Respond to danger signal", "Clear interlocking correctly"] },
  { id: "SC-002", name: "Track Circuit Operations",    difficulty: "beginner",     duration: "25 min", completed: true,  score: 88, attempts: 1,
    description: "Understand how track circuits detect train presence and manage block sections.",
    objectives: ["Read track circuit display", "Understand occupied vs clear", "Handle track circuit failure", "Overlap management"] },
  { id: "SC-003", name: "Point Junction Management",   difficulty: "intermediate", duration: "45 min", completed: false, attempts: 0,
    description: "Operate point machines at J1–J4 junctions under various traffic scenarios.",
    objectives: ["Set points for route", "Handle point failure", "Reverse operations", "Verify point detection"] },
  { id: "SC-004", name: "Emergency Stop Procedures",   difficulty: "intermediate", duration: "40 min", completed: false, attempts: 0,
    description: "Execute correct emergency stop protocols for various incident types.",
    objectives: ["Identify emergency type", "Apply emergency brake", "Communicate to control", "Protect the line"] },
  { id: "SC-005", name: "VZA-Main Station Simulation", difficulty: "advanced",     duration: "60 min", completed: false, attempts: 0,
    description: "Full station simulation at VZA Junction under peak-hour traffic.",
    objectives: ["Manage 3 simultaneous trains", "Handle delay cascade", "Route setting under conflict", "Passenger safety protocols"] },
];

const MACROS = [
  { id: "M1", label: "PLATFORM CLEAR",   color: "#00FF6B", desc: "Signal all platform tracks clear" },
  { id: "M2", label: "ROUTE VZA→MRT",    color: "#00D8FF", desc: "Set standard UP route to Murtazabad" },
  { id: "M3", label: "ROUTE MRT→KLN",    color: "#00D8FF", desc: "Set standard UP route to Kalinagar" },
  { id: "M4", label: "LOOP ENTRY",        color: "#FFA500", desc: "Set goods loop entry route at J2" },
  { id: "M5", label: "HOLD ALL",          color: "#FFD700", desc: "Hold all trains at current positions" },
  { id: "M6", label: "RESET SIGNALS",     color: "#8899AA", desc: "Reset all signals to default aspects" },
];

const SIGNAL_CONTROLS = [
  { id: "S1", loc: "VZA Entry",   aspect: "green"         },
  { id: "S2", loc: "VZA Exit",    aspect: "yellow"        },
  { id: "S3", loc: "MRT Entry",   aspect: "red"           },
  { id: "S4", loc: "MRT Exit",    aspect: "green"         },
  { id: "S5", loc: "KLN Entry",   aspect: "double-yellow" },
  { id: "S6", loc: "Loop Entry",  aspect: "red"           },
  { id: "S7", loc: "Loop Exit",   aspect: "green"         },
];

const POINT_MACHINES = [
  { id: "J1", loc: "VZA North",  state: "normal"  },
  { id: "J2", loc: "Loop Entry", state: "normal"  },
  { id: "J3", loc: "Loop Exit",  state: "reverse" },
  { id: "J4", loc: "KLN South",  state: "normal"  },
];

const STATIONS = [
  { id: "VZA", name: "Vizag Junction",     km: "0.0",  tracks: 4, occupied: 1 },
  { id: "MRT", name: "Murtazabad Halt",    km: "8.4",  tracks: 2, occupied: 1 },
  { id: "KLN", name: "Kalinagar Terminal", km: "16.0", tracks: 4, occupied: 0 },
];

const perfHistory = [
  { session: "S1", score: 72 }, { session: "S2", score: 88 },
  { session: "S3", score: 85 }, { session: "S4", score: 92 }, { session: "S5", score: 89 },
];

const radarData = [
  { subject: "Signal",    A: 90 }, { subject: "Track",     A: 85 },
  { subject: "Points",    A: 60 }, { subject: "Emergency", A: 50 },
  { subject: "Station",   A: 40 }, { subject: "Comms",     A: 75 },
];

// ─── Color helpers ────────────────────────────────────────────────────────────

const dc = (d: string) => d === "beginner" ? "#00FF6B" : d === "intermediate" ? "#FFD700" : "#FF3B3B";
const aspectColor = (a: string) => {
  switch (a) {
    case "green": return "#00FF6B";
    case "yellow": return "#FFD700";
    case "double-yellow": return "#FFA500";
    case "red": return "#FF3B3B";
    default: return "#445566";
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBtn({
  label, icon, variant = "default", disabled = false, confirm = false, onClick, size = "md",
}: {
  label: string; icon?: React.ReactNode; variant?: "green" | "yellow" | "red" | "blue" | "default" | "ghost";
  disabled?: boolean; confirm?: boolean; onClick?: () => void; size?: "sm" | "md" | "lg";
}) {
  const [confirming, setConfirming] = useState(false);

  const colors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    green:   { border: "#00FF6B", bg: "#00FF6B18", text: "#00FF6B", glow: "0 0 12px #00FF6B44" },
    yellow:  { border: "#FFD700", bg: "#FFD70018", text: "#FFD700", glow: "0 0 12px #FFD70044" },
    red:     { border: "#FF3B3B", bg: "#FF3B3B18", text: "#FF3B3B", glow: "0 0 14px #FF3B3B66" },
    blue:    { border: "#00D8FF", bg: "#00D8FF18", text: "#00D8FF", glow: "0 0 12px #00D8FF44" },
    default: { border: "#334455", bg: "#1A2535",   text: "#8899AA", glow: "none" },
    ghost:   { border: "#223344", bg: "transparent", text: "#6688AA", glow: "none" },
  };

  const c = colors[variant];
  const pad = size === "lg" ? "px-5 py-3" : size === "sm" ? "px-2.5 py-1.5" : "px-4 py-2.5";
  const txt = size === "lg" ? "text-sm" : "text-xs";

  const handleClick = () => {
    if (disabled) return;
    if (confirm && !confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 2000); return; }
    setConfirming(false);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${pad} border rounded-sm mono ${txt} font-medium flex items-center justify-center gap-2 transition-all active:scale-95 select-none`}
      style={{
        borderColor: confirming ? "#FF3B3B" : disabled ? "#1A2535" : c.border,
        background:  confirming ? "#FF3B3B22" : disabled ? "#0A1218" : c.bg,
        color:       confirming ? "#FF3B3B"   : disabled ? "#334455"  : c.text,
        boxShadow:   disabled ? "none" : confirming ? "0 0 14px #FF3B3B55" : c.glow,
        cursor:      disabled ? "not-allowed" : "pointer",
        opacity:     disabled ? 0.5 : 1,
      }}
    >
      {icon}
      {confirming ? "CONFIRM?" : label}
    </button>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="mono text-xs px-2 py-0.5 border rounded-sm uppercase inline-flex items-center gap-1.5"
      style={{ color, borderColor: color + "44", background: color + "11" }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      {label}
    </span>
  );
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-slate-gray border border-border rounded-sm p-3 mono text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export function TraineeDashboard({ user, onLogout }: TraineeDashboardProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [simState, setSimState] = useState<SimState>("idle");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [progress, setProgress]  = useState(0);
  const [currentObj, setCurrentObj] = useState(0);
  const [elapsed, setElapsed]    = useState(0);
  const [speed, setSpeed]        = useState(1);
  const [weather, setWeather]    = useState("Clear");
  const [signals, setSignals]    = useState(SIGNAL_CONTROLS);
  const [points, setPoints]      = useState(POINT_MACHINES);
  const [macroLog, setMacroLog]  = useState<{ ts: string; label: string }[]>([]);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [replayOpen, setReplayOpen]   = useState(false);
  const [replayFrame, setReplayFrame] = useState(0);
  const emergencyRef = useRef(false);

  const completed = SCENARIOS.filter(s => s.completed).length;
  const avgScore  = SCENARIOS.filter(s => s.score).reduce((a, s) => a + (s.score ?? 0), 0) / SCENARIOS.filter(s => s.score).length;

  // Sim timer
  useEffect(() => {
    if (simState !== "running") return;
    const t = setInterval(() => {
      setElapsed(e => e + 1);
      setProgress(p => {
        const next = Math.min(p + 0.3 * speed, 100);
        const objCount = selectedScenario?.objectives.length ?? 4;
        setCurrentObj(Math.min(Math.floor(next / (100 / objCount)), objCount - 1));
        if (next >= 100) { setSimState("complete"); clearInterval(t); }
        return next;
      });
    }, 200);
    return () => clearInterval(t);
  }, [simState, speed, selectedScenario]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const triggerEmergency = () => {
    setSimState("emergency");
    emergencyRef.current = true;
    setTab("simulation");
  };

  const resetSim = () => {
    setSimState("idle");
    setProgress(0);
    setCurrentObj(0);
    setElapsed(0);
    setSpeed(1);
    emergencyRef.current = false;
  };

  const fireMacro = (label: string) => {
    const ts = new Date().toTimeString().slice(0, 8);
    setMacroLog(p => [{ ts, label }, ...p].slice(0, 20));
  };

  const cycleSignal = (id: string) => {
    const cycle = ["green", "yellow", "double-yellow", "red"];
    setSignals(p => p.map(s => s.id === id
      ? { ...s, aspect: cycle[(cycle.indexOf(s.aspect) + 1) % cycle.length] }
      : s
    ));
  };

  const togglePoint = (id: string) => {
    setPoints(p => p.map(pt => pt.id === id
      ? { ...pt, state: pt.state === "normal" ? "reverse" : "normal" }
      : pt
    ));
  };

  // ── Sim state derived values ──────────────────────────────────────────────
  const simStateColor =
    simState === "running"   ? "#00FF6B" :
    simState === "paused"    ? "#FFD700" :
    simState === "complete"  ? "#00D8FF" :
    simState === "emergency" ? "#FF3B3B" : "#445566";

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard",   label: "DASHBOARD",    icon: <Target className="w-4 h-4" /> },
    { key: "simulation",  label: "SIMULATION",   icon: <Cpu className="w-4 h-4" /> },
    { key: "control",     label: "CONTROL PANEL",icon: <Radio className="w-4 h-4" /> },
    { key: "scenarios",   label: "SCENARIOS",    icon: <BookOpen className="w-4 h-4" /> },
    { key: "performance", label: "PERFORMANCE",  icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-bg-very-dark-navy text-foreground flex flex-col">

      {/* ── HEADER ── */}
      <header className="bg-bg-slate-gray border-b-2 border-primary-cyan/30 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* System title */}
          <div>
            <h1 className="text-primary-cyan text-lg leading-tight">VZA RAILWAY TMS — TRAINEE CONTROL PANEL</h1>
            <div className="mono text-xs text-muted-foreground mt-0.5">Safety-Critical Operations Training System · Desktop Mode</div>
          </div>

          {/* Trainee ID card */}
          <div className="flex items-center gap-4 bg-bg-very-dark-navy border border-primary-cyan/30 rounded-sm px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-cyan/20 border border-primary-cyan flex items-center justify-center mono text-xs text-primary-cyan font-bold">
              {user.name?.split(" ").map(n => n[0]).join("") || "TR"}
            </div>
            <div>
              <div className="mono text-xs text-primary-cyan">{user.name || "Trainee"}</div>
              <div className="mono text-xs text-muted-foreground">ID: TRE-001 · Level 2</div>
            </div>
            <div className="border-l border-border pl-4 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="mono text-xs text-muted-foreground">PROGRESS</span>
                <span className="mono text-xs text-primary-cyan">{Math.round((completed / SCENARIOS.length) * 100)}%</span>
              </div>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary-cyan rounded-full" style={{ width: `${(completed / SCENARIOS.length) * 100}%` }} />
              </div>
            </div>
            <StatusBadge
              label={simState === "idle" ? "STANDBY" : simState.toUpperCase()}
              color={simStateColor}
            />
          </div>

          {/* Clock + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="mono text-xs text-muted-foreground">SIM TIME</div>
              <div className="mono text-sm text-primary-cyan">{fmt(elapsed * speed)}</div>
            </div>
            <UserHeader user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      {/* ── EMERGENCY STOP BAR — always visible when sim running ── */}
      {(simState === "running" || simState === "paused" || simState === "emergency") && (
        <div className={`flex-shrink-0 px-6 py-2 flex items-center justify-between border-b-2 transition-colors ${simState === "emergency" ? "bg-red-950/60 border-red-500" : "bg-bg-very-dark-navy border-red-900/40"}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4" style={{ color: "#FF3B3B" }} />
            <span className="mono text-xs" style={{ color: simState === "emergency" ? "#FF3B3B" : "#6688AA" }}>
              {simState === "emergency" ? "⚠ EMERGENCY STOP ACTIVATED — ALL TRAINS HALTED" : "EMERGENCY CONTROLS ACTIVE — SESSION IN PROGRESS"}
            </span>
          </div>
          <button
            onClick={triggerEmergency}
            disabled={simState === "emergency"}
            className="px-6 py-2 border-2 rounded-sm mono text-sm font-bold tracking-widest flex items-center gap-2 transition-all active:scale-95"
            style={{
              borderColor: "#FF3B3B",
              background:  simState === "emergency" ? "#FF3B3B" : "#FF3B3B22",
              color:       simState === "emergency" ? "#000" : "#FF3B3B",
              boxShadow:   "0 0 20px #FF3B3B55",
            }}>
            <AlertTriangle className="w-4 h-4" />
            EMERGENCY STOP
          </button>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="bg-bg-slate-gray border-b border-border px-6 flex-shrink-0 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-5 py-3 mono text-sm transition-colors whitespace-nowrap"
              style={{
                color:        tab === key ? "#00D8FF" : "#6688AA",
                borderBottom: tab === key ? "2px solid #00D8FF" : "2px solid transparent",
                background:   tab === key ? "#00D8FF08" : "transparent",
              }}>
              {icon}{label}
              {key === "simulation" && simState === "running" && (
                <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" style={{ boxShadow: "0 0 6px #00FF6B" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">

          {/* ════════════════════════════════════════
              DASHBOARD TAB
          ════════════════════════════════════════ */}
          {tab === "dashboard" && (
            <div className="space-y-6">

              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Target className="w-7 h-7"   style={{ color:"#00D8FF" }} />, val: "TRE-001",             label: "Trainee ID",          sub: "Level 2 Certification",   subC: "#00D8FF" },
                  { icon: <CheckCircle2 className="w-7 h-7 text-signal-green" />,        val: `${completed}/${SCENARIOS.length}`, label: "Completed Scenarios", sub: `${100 - Math.round((completed/SCENARIOS.length)*100)}% remaining`, subC: "#6688AA" },
                  { icon: <Award className="w-7 h-7 text-primary-cyan" />,               val: `${avgScore.toFixed(0)}%`, label: "Performance Score",  sub: "Above target threshold",  subC: "#00FF6B" },
                  { icon: <TrendingUp className="w-7 h-7 text-signal-green" />,          val: "+12%",               label: "Progress Growth",     sub: "Since last week",         subC: "#00FF6B" },
                ].map(({ icon, val, label, sub, subC }) => (
                  <div key={label} className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                    <div className="flex items-center justify-between mb-3">{icon}<div className="mono text-xl text-foreground font-medium">{val}</div></div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="mono text-xs mt-1" style={{ color: subC }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Certification progress */}
              <div className="bg-bg-slate-gray border-2 border-primary-cyan/30 rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-foreground">CERTIFICATION TRACK — Level 2 Railway Operations</div>
                    <div className="mono text-xs text-muted-foreground mt-0.5">5 modules · {completed} completed · est. 3h remaining</div>
                  </div>
                  <div className="mono text-2xl text-primary-cyan">{Math.round((completed / SCENARIOS.length) * 100)}%</div>
                </div>
                <div className="w-full h-3 bg-muted rounded-sm overflow-hidden mb-2">
                  <div className="h-full bg-primary-cyan transition-all duration-500 relative"
                    style={{ width: `${(completed / SCENARIOS.length) * 100}%` }}>
                    <div className="absolute right-0 top-0 h-full w-3 bg-white/20" />
                  </div>
                </div>
                <div className="flex justify-between mono text-xs text-muted-foreground">
                  <span>BEGINNER</span><span>INTERMEDIATE</span><span>ADVANCED</span>
                </div>
              </div>

              {/* Quick Launch + Status split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick actions */}
                <div className="lg:col-span-2 bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="mono text-xs text-muted-foreground mb-4">QUICK ACTIONS</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <ActionBtn label="START SIMULATION" icon={<Play className="w-4 h-4" />} variant="green" size="lg"
                      disabled={simState === "running" || simState === "emergency"}
                      onClick={() => { if (selectedScenario) { setSimState("running"); setTab("simulation"); } else { setTab("scenarios"); } }} />
                    <ActionBtn label="SCENARIO SELECT" icon={<BookOpen className="w-4 h-4" />} variant="blue" size="lg"
                      onClick={() => setTab("scenarios")} />
                    <ActionBtn label="CONTROL PANEL" icon={<Radio className="w-4 h-4" />} variant="blue" size="lg"
                      onClick={() => setTab("control")} />
                    <ActionBtn label="HISTORICAL REPLAY" icon={<History className="w-4 h-4" />} variant="default" size="lg"
                      onClick={() => { setReplayOpen(true); setTab("simulation"); }} />
                    <ActionBtn label="PERFORMANCE RPT" icon={<FileText className="w-4 h-4" />} variant="default" size="lg"
                      onClick={() => setTab("performance")} />
                    <ActionBtn label="EMERGENCY STOP" icon={<AlertTriangle className="w-4 h-4" />} variant="red" size="lg"
                      confirm disabled={simState === "idle" || simState === "emergency" || simState === "complete"}
                      onClick={triggerEmergency} />
                  </div>
                </div>

                {/* Current scenario card */}
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="mono text-xs text-muted-foreground mb-3">ACTIVE SCENARIO</div>
                  {selectedScenario ? (
                    <div>
                      <div className="text-sm text-foreground mb-1">{selectedScenario.name}</div>
                      <div className="flex items-center gap-2 mb-3">
                        <StatusBadge label={selectedScenario.difficulty} color={dc(selectedScenario.difficulty)} />
                        <span className="mono text-xs text-muted-foreground">{selectedScenario.duration}</span>
                      </div>
                      <div className="mono text-xs text-muted-foreground mb-1">PROGRESS</div>
                      <div className="w-full h-2 bg-muted rounded-sm overflow-hidden mb-1">
                        <div className="h-full bg-primary-cyan transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mono text-xs text-primary-cyan">{progress.toFixed(0)}% · {fmt(elapsed)}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 gap-2">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                      <div className="mono text-xs text-muted-foreground">No scenario selected</div>
                      <button onClick={() => setTab("scenarios")} className="mono text-xs text-primary-cyan hover:underline">Browse scenarios →</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent + Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                  <div className="border-b border-border p-4 mono text-xs text-muted-foreground">RECENT PERFORMANCE</div>
                  <div className="p-4 space-y-3">
                    {SCENARIOS.filter(s => s.completed).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-bg-very-dark-navy rounded-sm">
                        <div>
                          <div className="text-sm text-foreground">{s.name}</div>
                          <div className="mono text-xs text-muted-foreground">Attempt {s.attempts} · {s.duration}</div>
                        </div>
                        <div className="mono text-lg font-medium" style={{ color: (s.score ?? 0) >= 90 ? "#00FF6B" : "#FFD700" }}>{s.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                  <div className="border-b border-border p-4 mono text-xs text-muted-foreground">TRAINER RECOMMENDATIONS</div>
                  <div className="p-4 space-y-3">
                    {[
                      { icon: <ChevronRight className="w-4 h-4 text-primary-cyan" />, color: "#00D8FF11", border: "#00D8FF33", title: "Next: Point Junction Management", sub: "Continue intermediate track — prerequisites met" },
                      { icon: <AlertCircle className="w-4 h-4 text-status-caution" />, color: "#FFD70011", border: "#FFD70033", title: "Focus: Emergency Response Time", sub: "Average 4.2s above target — trainer flagged" },
                      { icon: <Star className="w-4 h-4 text-signal-green" />, color: "#00FF6B11", border: "#00FF6B33", title: "Achievement Unlocked", sub: "Signal Mastery badge — 90%+ on 2 signal scenarios" },
                    ].map(({ icon, color, border, title, sub }) => (
                      <div key={title} className="p-3 rounded-sm border" style={{ background: color, borderColor: border }}>
                        <div className="flex items-start gap-3">
                          {icon}
                          <div>
                            <div className="text-sm text-foreground">{title}</div>
                            <div className="mono text-xs text-muted-foreground mt-0.5">{sub}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              SIMULATION TAB
          ════════════════════════════════════════ */}
          {tab === "simulation" && (
            <div className="space-y-5">

              {/* Emergency overlay */}
              {simState === "emergency" && (
                <div className="border-2 border-red-500 bg-red-950/40 rounded-sm p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
                    <div>
                      <div className="text-red-400 text-lg mono font-bold">EMERGENCY STOP ACTIVATED</div>
                      <div className="mono text-xs text-red-300 mt-1">All train movements halted · Await trainer clearance before resuming</div>
                    </div>
                  </div>
                  <ActionBtn label="RESET SESSION" icon={<RotateCcw className="w-4 h-4" />} variant="default" onClick={resetSim} size="lg" />
                </div>
              )}

              {/* Scenario selector (if none selected) */}
              {!selectedScenario && simState === "idle" && (
                <div className="bg-bg-slate-gray border-2 border-primary-cyan/30 rounded-sm p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-foreground">No scenario selected</div>
                      <div className="mono text-xs text-muted-foreground mt-0.5">Select a training scenario to begin simulation</div>
                    </div>
                  </div>
                  <ActionBtn label="SELECT SCENARIO" icon={<ArrowRight className="w-4 h-4" />} variant="blue" onClick={() => setTab("scenarios")} size="lg" />
                </div>
              )}

              {/* Simulation status banner */}
              {selectedScenario && (
                <div className="bg-bg-slate-gray border-2 rounded-sm p-4 flex items-center justify-between flex-wrap gap-4"
                  style={{ borderColor: simStateColor + "66" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full" style={{ background: simStateColor, boxShadow: `0 0 10px ${simStateColor}`, animation: simState === "running" ? "pulse 1.5s infinite" : "none" }} />
                    <div>
                      <div className="text-sm text-foreground">{selectedScenario.name}</div>
                      <div className="mono text-xs text-muted-foreground">{selectedScenario.id} · {selectedScenario.difficulty} · {selectedScenario.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="mono text-xs text-muted-foreground">ELAPSED</div>
                      <div className="mono text-lg text-primary-cyan">{fmt(elapsed)}</div>
                    </div>
                    <div className="text-center">
                      <div className="mono text-xs text-muted-foreground">PROGRESS</div>
                      <div className="mono text-lg" style={{ color: simStateColor }}>{progress.toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="mono text-xs text-muted-foreground">SPEED</div>
                      <div className="mono text-lg text-foreground">{speed}×</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main simulation controls */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                <div className="mono text-xs text-muted-foreground mb-4">SIMULATION CONTROLS</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-5">
                  <ActionBtn label="START" icon={<Play className="w-4 h-4" />} variant="green" size="lg"
                    disabled={simState === "running" || simState === "complete" || simState === "emergency" || !selectedScenario}
                    onClick={() => setSimState("running")} />
                  <ActionBtn label="PAUSE" icon={<Pause className="w-4 h-4" />} variant="yellow" size="lg"
                    disabled={simState !== "running"}
                    onClick={() => setSimState("paused")} />
                  <ActionBtn label="RESUME" icon={<Play className="w-4 h-4" />} variant="green" size="lg"
                    disabled={simState !== "paused"}
                    onClick={() => setSimState("running")} />
                  <ActionBtn label="STOP" icon={<Square className="w-4 h-4" />} variant="default" size="lg"
                    disabled={simState === "idle" || simState === "emergency"}
                    confirm onClick={resetSim} />
                  <ActionBtn label="FAST FWD" icon={<SkipForward className="w-4 h-4" />} variant="blue" size="lg"
                    disabled={simState !== "running"}
                    onClick={() => setSpeed(s => s >= 4 ? 1 : s + 1)} />
                  <ActionBtn label="RESET" icon={<RotateCcw className="w-4 h-4" />} variant="ghost" size="lg"
                    onClick={resetSim} />
                </div>

                {/* Progress bar */}
                {selectedScenario && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="mono text-xs text-muted-foreground">SCENARIO PROGRESS</span>
                      <span className="mono text-xs" style={{ color: simStateColor }}>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-sm overflow-hidden mb-3">
                      <div className="h-full rounded-sm transition-all duration-300 relative"
                        style={{ width: `${progress}%`, background: simState === "emergency" ? "#FF3B3B" : simState === "paused" ? "#FFD700" : "#00D8FF" }}>
                        {simState === "running" && <div className="absolute right-0 top-0 h-full w-4 bg-white/20 animate-pulse" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* Speed control */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="mono text-xs text-muted-foreground">TIME COMPRESSION:</span>
                  {[1, 2, 4, 8].map(s => (
                    <button key={s} onClick={() => setSpeed(s)}
                      className="px-3 py-1 border rounded-sm mono text-xs transition-all"
                      style={{
                        borderColor: speed === s ? "#00D8FF" : "#223344",
                        background:  speed === s ? "#00D8FF22" : "transparent",
                        color:       speed === s ? "#00D8FF" : "#6688AA",
                      }}>{s}×</button>
                  ))}
                </div>
              </div>

              {/* Weather simulation */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cloud className="w-4 h-4 text-primary-cyan" />
                  <span className="mono text-xs text-muted-foreground">WEATHER SIMULATION</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["Clear", "Heavy Rain", "Dense Fog", "Strong Wind", "Snow / Ice", "Heatwave"].map(w => (
                    <button key={w} onClick={() => setWeather(w)}
                      className="px-3 py-2 border rounded-sm mono text-xs transition-all"
                      style={{
                        borderColor: weather === w ? "#00D8FF" : "#223344",
                        background:  weather === w ? "#00D8FF22" : "transparent",
                        color:       weather === w ? "#00D8FF" : "#6688AA",
                      }}>{w}</button>
                  ))}
                </div>
                {weather !== "Clear" && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-950/30 border border-yellow-700/30 rounded-sm">
                    <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                    <span className="mono text-xs text-yellow-500">{weather} active — speed restrictions applied, increased stopping distance</span>
                  </div>
                )}
              </div>

              {/* Historical Replay */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                <button className="w-full flex items-center justify-between p-4 hover:bg-bg-very-dark-navy/50 transition-colors"
                  onClick={() => setReplayOpen(o => !o)}>
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-primary-cyan" />
                    <span className="mono text-xs text-muted-foreground">HISTORICAL REPLAY</span>
                  </div>
                  {replayOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {replayOpen && (
                  <div className="border-t border-border p-5 bg-bg-very-dark-navy">
                    <div className="mono text-xs text-muted-foreground mb-4">SESSION: TR-2026-06-13-042 · Signal Interlocking Basics · A. Kumar</div>
                    {/* Timeline */}
                    <div className="relative mb-5">
                      <div className="h-1 bg-border rounded-full">
                        <div className="h-1 bg-primary-cyan rounded-full transition-all" style={{ width: `${(replayFrame / 6) * 100}%` }} />
                        {[0,1,2,3,4,5,6].map(i => (
                          <button key={i} onClick={() => setReplayFrame(i)}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all"
                            style={{ left: `${(i / 6) * 100}%`, background: i <= replayFrame ? "#00D8FF" : "#223344", borderColor: i === replayFrame ? "#00D8FF" : "#334455", boxShadow: i === replayFrame ? "0 0 8px #00D8FF" : "none" }} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 mono text-xs text-muted-foreground"><span>T+0:00</span><span>T+35:00</span></div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => setReplayFrame(0)} className="p-2 border border-border rounded-sm text-muted-foreground hover:border-primary-cyan/50 transition-colors"><span className="mono text-xs">|◀</span></button>
                      <button onClick={() => setReplayFrame(f => Math.max(0, f - 1))} className="p-2 border border-border rounded-sm text-muted-foreground hover:border-primary-cyan/50 transition-colors"><span className="mono text-xs">◀</span></button>
                      <button className="px-4 py-2 border border-primary-cyan/40 rounded-sm bg-primary-cyan/10 mono text-xs text-primary-cyan">▶ PLAY</button>
                      <button onClick={() => setReplayFrame(f => Math.min(6, f + 1))} className="p-2 border border-border rounded-sm text-muted-foreground hover:border-primary-cyan/50 transition-colors"><span className="mono text-xs">▶</span></button>
                      <button onClick={() => setReplayFrame(6)} className="p-2 border border-border rounded-sm text-muted-foreground hover:border-primary-cyan/50 transition-colors"><span className="mono text-xs">▶|</span></button>
                    </div>
                    {[
                      "T-001 departs VZA — signal S1 GREEN",
                      "T-001 passes J1 — point set NORMAL",
                      "Signal S2 set to YELLOW — approach caution",
                      "T-002 arrives MRT — platform P1-T1 occupied",
                      "INCIDENT: S3 passed at DANGER — instructor note",
                      "Emergency stop applied — session paused",
                      "Session resumed after debrief",
                    ].slice(0, replayFrame + 1).map((e, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 border-b border-border last:border-0 mono text-xs">
                        <span className="text-muted-foreground w-16 flex-shrink-0">T+{i * 5}:00</span>
                        <span className={i === replayFrame ? "text-primary-cyan" : "text-muted-foreground"}>{e}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Objectives */}
              {selectedScenario && (
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="mono text-xs text-muted-foreground mb-4">LEARNING OBJECTIVES</div>
                  <div className="space-y-2">
                    {selectedScenario.objectives.map((obj, i) => {
                      const done = simState === "complete" || i < currentObj;
                      const cur  = i === currentObj && simState === "running";
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-sm transition-all"
                          style={{ borderColor: done ? "#00FF6B33" : cur ? "#00D8FF44" : "#22334466", background: done ? "#00FF6B08" : cur ? "#00D8FF08" : "transparent" }}>
                          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: done ? "#00FF6B" : cur ? "#00D8FF" : "#334455" }}>
                            {done ? <CheckCircle2 className="w-4 h-4 text-signal-green" /> : <span className="mono text-xs" style={{ color: cur ? "#00D8FF" : "#334455" }}>{i + 1}</span>}
                          </div>
                          <span className="text-sm" style={{ color: done ? "#00FF6B" : cur ? "#00D8FF" : "#6688AA" }}>{obj}</span>
                          {cur && <span className="ml-auto mono text-xs text-primary-cyan animate-pulse">IN PROGRESS</span>}
                        </div>
                      );
                    })}
                  </div>
                  {simState === "complete" && (
                    <div className="mt-4 p-4 bg-signal-green/10 border border-signal-green/30 rounded-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-signal-green" />
                        <div>
                          <div className="text-sm text-foreground">Scenario Complete!</div>
                          <div className="mono text-xs text-muted-foreground">All objectives achieved · Time: {fmt(elapsed)}</div>
                        </div>
                      </div>
                      <div className="mono text-2xl text-signal-green">92%</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════
              CONTROL PANEL TAB
          ════════════════════════════════════════ */}
          {tab === "control" && (
            <div className="space-y-5">

              {/* Route controls */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Navigation className="w-4 h-4 text-primary-cyan" />
                  <span className="mono text-xs text-muted-foreground">ROUTE SETTING</span>
                  {activeRoute && <StatusBadge label={`ROUTE ${activeRoute} LOCKED`} color="#FFA500" />}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[
                    { id: "R1", label: "ROUTE VZA→MRT", color: "blue"    as const },
                    { id: "R2", label: "ROUTE MRT→KLN", color: "blue"    as const },
                    { id: "R3", label: "LOOP ENTRY",     color: "yellow"  as const },
                    { id: "R4", label: "LOOP EXIT",       color: "yellow"  as const },
                  ].map(({ id, label, color }) => (
                    <ActionBtn key={id} label={label} icon={<ArrowRight className="w-3 h-3" />}
                      variant={activeRoute === id ? "yellow" : color}
                      onClick={() => setActiveRoute(activeRoute === id ? null : id)} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ActionBtn label="ROUTE SET" icon={<CheckCircle2 className="w-4 h-4" />} variant="green" size="lg"
                    disabled={!activeRoute}
                    onClick={() => fireMacro(`Route ${activeRoute} SET`)} />
                  <ActionBtn label="ROUTE CANCEL" icon={<Square className="w-4 h-4" />} variant="red" size="lg"
                    disabled={!activeRoute} confirm
                    onClick={() => { setActiveRoute(null); fireMacro("Route CANCELLED"); }} />
                </div>
              </div>

              {/* Signal control + Point machines side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Signal Control */}
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-primary-cyan" />
                    <span className="mono text-xs text-muted-foreground">SIGNAL CONTROL — CLICK TO CYCLE</span>
                  </div>
                  <div className="space-y-2">
                    {signals.map(sig => (
                      <button key={sig.id} onClick={() => cycleSignal(sig.id)}
                        className="w-full flex items-center justify-between p-3 border rounded-sm hover:border-primary-cyan/40 transition-all active:scale-[0.99]"
                        style={{ borderColor: aspectColor(sig.aspect) + "44", background: aspectColor(sig.aspect) + "08" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ background: aspectColor(sig.aspect), boxShadow: `0 0 8px ${aspectColor(sig.aspect)}` }} />
                          <span className="mono text-xs text-foreground">{sig.id}</span>
                          <span className="mono text-xs text-muted-foreground">{sig.loc}</span>
                        </div>
                        <span className="mono text-xs uppercase" style={{ color: aspectColor(sig.aspect) }}>
                          {sig.aspect.replace("-", " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Point Machine Control */}
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-primary-cyan" />
                    <span className="mono text-xs text-muted-foreground">POINT MACHINE CONTROL</span>
                  </div>
                  <div className="space-y-3">
                    {points.map(pt => (
                      <div key={pt.id} className="flex items-center justify-between p-3 border rounded-sm"
                        style={{ borderColor: pt.state === "normal" ? "#00D8FF33" : "#FFA50033" }}>
                        <div>
                          <div className="mono text-xs text-foreground">{pt.id} — {pt.loc}</div>
                          <div className="mono text-xs mt-0.5" style={{ color: pt.state === "normal" ? "#00D8FF" : "#FFA500" }}>
                            {pt.state === "normal" ? "NORMAL" : "REVERSE"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { if (pt.state !== "normal") togglePoint(pt.id); fireMacro(`${pt.id} → NORMAL`); }}
                            className="px-3 py-1.5 border rounded-sm mono text-xs transition-all"
                            style={{ borderColor: pt.state === "normal" ? "#00D8FF" : "#334455", background: pt.state === "normal" ? "#00D8FF22" : "transparent", color: pt.state === "normal" ? "#00D8FF" : "#6688AA" }}>N</button>
                          <button onClick={() => { if (pt.state !== "reverse") togglePoint(pt.id); fireMacro(`${pt.id} → REVERSE`); }}
                            className="px-3 py-1.5 border rounded-sm mono text-xs transition-all"
                            style={{ borderColor: pt.state === "reverse" ? "#FFA500" : "#334455", background: pt.state === "reverse" ? "#FFA50022" : "transparent", color: pt.state === "reverse" ? "#FFA500" : "#6688AA" }}>R</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Station Control */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary-cyan" />
                  <span className="mono text-xs text-muted-foreground">STATION CONTROL BUTTONS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {STATIONS.map(st => (
                    <div key={st.id} className="bg-bg-very-dark-navy border border-border rounded-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="mono text-sm text-primary-cyan">{st.id}</div>
                          <div className="text-xs text-muted-foreground">{st.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="mono text-xs text-muted-foreground">{st.occupied}/{st.tracks} occupied</div>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-primary-cyan" style={{ width: `${(st.occupied / st.tracks) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <ActionBtn label="CLEAR PLT"  variant="green"   size="sm" onClick={() => fireMacro(`${st.id} Platform Clear`)} />
                        <ActionBtn label="HOLD ALL"   variant="yellow"  size="sm" onClick={() => fireMacro(`${st.id} Hold All`)} />
                        <ActionBtn label="DEPT READY" variant="blue"    size="sm" onClick={() => fireMacro(`${st.id} Departure Ready`)} />
                        <ActionBtn label="EMERGENCY"  variant="red"     size="sm" confirm onClick={() => fireMacro(`${st.id} EMERGENCY`)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro Execution */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-primary-cyan" />
                  <span className="mono text-xs text-muted-foreground">MACRO EXECUTION BUTTONS</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {MACROS.map(m => (
                    <button key={m.id} onClick={() => fireMacro(m.label)}
                      title={m.desc}
                      className="p-3 border rounded-sm mono text-xs text-center transition-all hover:scale-[1.02] active:scale-95"
                      style={{ borderColor: m.color + "44", background: m.color + "11", color: m.color }}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {/* Macro log */}
                {macroLog.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <div className="mono text-xs text-muted-foreground mb-2">EXECUTION LOG</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {macroLog.map((l, i) => (
                        <div key={i} className="mono text-xs text-muted-foreground">
                          <span className="text-primary-cyan">[{l.ts}]</span> {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              SCENARIOS TAB
          ════════════════════════════════════════ */}
          {tab === "scenarios" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="mono text-xs text-muted-foreground">{completed}/{SCENARIOS.length} COMPLETED — SELECT A SCENARIO TO LOAD IT</div>
                {selectedScenario && (
                  <StatusBadge label={`LOADED: ${selectedScenario.id}`} color="#00D8FF" />
                )}
              </div>
              {SCENARIOS.map(s => (
                <div key={s.id}
                  className="bg-bg-slate-gray border-2 rounded-sm p-5 cursor-pointer transition-all hover:border-primary-cyan/40"
                  style={{ borderColor: selectedScenario?.id === s.id ? "#00D8FF" : "#223344" }}
                  onClick={() => setSelectedScenario(s)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-foreground">{s.name}</h3>
                        <StatusBadge label={s.difficulty} color={dc(s.difficulty)} />
                        {s.completed && <CheckCircle2 className="w-4 h-4 text-signal-green" />}
                        {selectedScenario?.id === s.id && <StatusBadge label="SELECTED" color="#00D8FF" />}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{s.description}</div>
                      <div className="mono text-xs text-muted-foreground">{s.id} · {s.duration} · {s.attempts} attempt{s.attempts !== 1 ? "s" : ""}{s.score ? ` · Best: ${s.score}%` : ""}</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <ActionBtn
                        label={s.completed ? "RETRY" : "START"}
                        icon={<Play className="w-3 h-3" />}
                        variant={s.completed ? "default" : "green"}
                        onClick={() => { setSelectedScenario(s); resetSim(); setTab("simulation"); }} />
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="mono text-xs text-muted-foreground mb-2">OBJECTIVES</div>
                    <div className="flex flex-wrap gap-2">
                      {s.objectives.map((obj, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 border rounded-sm"
                          style={{ borderColor: s.completed ? "#00FF6B33" : "#22334466" }}>
                          {s.completed ? <CheckCircle2 className="w-3 h-3 text-signal-green" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                          <span className="mono text-xs" style={{ color: s.completed ? "#00FF6B" : "#6688AA" }}>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════
              PERFORMANCE TAB
          ════════════════════════════════════════ */}
          {tab === "performance" && (
            <div className="space-y-6">
              {/* Score + radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="mono text-xs text-muted-foreground mb-3">SKILL COMPETENCY RADAR</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1A2535" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                        <Radar name="Score" dataKey="A" stroke="#00D8FF" fill="#00D8FF" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5">
                  <div className="mono text-xs text-muted-foreground mb-3">SCORE TREND — LAST 5 SESSIONS</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={perfHistory}>
                        <defs>
                          <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00D8FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00D8FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1A2535" />
                        <XAxis dataKey="session" stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                        <YAxis domain={[60, 100]} stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                        <Tooltip content={<Tip />} />
                        <Area type="monotone" dataKey="score" stroke="#00D8FF" fill="url(#sg2)" strokeWidth={2} dot={{ fill: "#00D8FF", r: 4 }} name="Score %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Performance report table */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm overflow-hidden">
                <div className="border-b border-border p-4 flex items-center justify-between">
                  <span className="mono text-xs text-muted-foreground">PERFORMANCE REPORT — ALL SCENARIOS</span>
                  <ActionBtn label="EXPORT PDF" icon={<FileText className="w-3 h-3" />} variant="ghost" size="sm" onClick={() => {}} />
                </div>
                <table className="w-full">
                  <thead className="bg-bg-very-dark-navy border-b border-border">
                    <tr>
                      {["SCENARIO", "DIFFICULTY", "SCORE", "TIME", "ATTEMPTS", "STATUS"].map(h => (
                        <th key={h} className="text-left p-4 mono text-xs text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SCENARIOS.map(s => (
                      <tr key={s.id} className="border-b border-border hover:bg-bg-very-dark-navy transition-colors">
                        <td className="p-4 text-sm text-foreground">{s.name}</td>
                        <td className="p-4"><StatusBadge label={s.difficulty} color={dc(s.difficulty)} /></td>
                        <td className="p-4 mono text-sm" style={{ color: s.score ? (s.score >= 90 ? "#00FF6B" : "#FFD700") : "#6688AA" }}>{s.score ? `${s.score}%` : "—"}</td>
                        <td className="p-4 mono text-xs text-foreground">{s.duration}</td>
                        <td className="p-4 mono text-xs text-foreground">{s.attempts}</td>
                        <td className="p-4">
                          {s.completed
                            ? <StatusBadge label="COMPLETE" color="#00FF6B" />
                            : <span className="mono text-xs text-muted-foreground">PENDING</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
