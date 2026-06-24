/* eslint-disable */
import { useState, useEffect } from "react";
import { User, UserRole } from "./LoginScreen";
import { UserHeader } from "./UserHeader";
import { Button } from "./Button";
import { TrainLayout } from "./TrainLayout";
import { SimulationEngine } from "./SimulationEngine";
import { SignalingInterlocking } from "./SignalingInterlocking";
import { TrainManagementPanel } from "./TrainManagementPanel";
import { AnalyticsReporting } from "./AnalyticsReporting";
import { StationInfrastructure } from "./StationInfrastructure";
import {
  Users, Play, Pause, AlertTriangle, Clock, CheckCircle2,
  Eye, MessageSquare, Radio, Cpu, Shield, Train, BarChart2, MapPin,
  ArrowLeft, Send, Cloud, BookOpen, Activity, WifiOff
} from "lucide-react";

interface TrainerDashboardProps { user: User; onLogout: () => void; onRoleChange?: (role: UserRole) => void; }

interface TrainingSession {
  id: string; trainee: string; traineeId: string; scenario: string;
  status: "active" | "paused" | "completed"; startTime: string; duration: string; progress: number;
}

export function TrainerDashboard({ user, onLogout, onRoleChange }: TrainerDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sessions, setSessions] = useState<TrainingSession[]>([
    { id: "TR-2026-05-28-001", trainee: "A. Kumar", traineeId: "TRE-001", scenario: "Signal Interlocking - VZA Main",  status: "active", startTime: "14:30:00", duration: "00:22:45", progress: 65 },
    { id: "TR-2026-05-28-002", trainee: "R. Patel", traineeId: "TRE-002", scenario: "Emergency Stop Procedures",       status: "active", startTime: "14:15:00", duration: "00:37:12", progress: 80 },
    { id: "TR-2026-05-28-003", trainee: "S. Lee",   traineeId: "TRE-003", scenario: "Point Junction Operations",       status: "paused", startTime: "13:45:00", duration: "01:07:33", progress: 45 },
  ]);

  const [monitoringSessionId, setMonitoringSessionId] = useState<string | null>(null);

  // Per-trainee weather state (default to "Clear")
  const [traineeWeather, setTraineeWeather] = useState<Record<string, string>>({
    "TRE-001": "Clear",
    "TRE-002": "Clear",
    "TRE-003": "Clear",
  });

  // Per-trainee speed/time compression (default to 1)
  const [traineeSpeed, setTraineeSpeed] = useState<Record<string, number>>({
    "TRE-001": 1,
    "TRE-002": 1,
    "TRE-003": 1,
  });

  // Per-trainee active faults
  const [traineeFaults, setTraineeFaults] = useState<Record<string, Record<string, boolean>>>({
    "TRE-001": { trackObstruction: false, pointJam: false, signalLamp: false, brakePressure: false, commsFailure: false },
    "TRE-002": { trackObstruction: false, pointJam: false, signalLamp: false, brakePressure: false, commsFailure: false },
    "TRE-003": { trackObstruction: false, pointJam: false, signalLamp: false, brakePressure: false, commsFailure: false },
  });

  // Per-trainee signals state
  const [traineeSignals, setTraineeSignals] = useState<Record<string, any[]>>({
    "TRE-001": [
      { id: "S1", x: 120, y: 120, aspect: "green",         label: "S1" },
      { id: "S2", x: 280, y: 120, aspect: "yellow",        label: "S2" },
      { id: "S3", x: 440, y: 120, aspect: "red",           label: "S3" },
      { id: "S4", x: 600, y: 120, aspect: "green",         label: "S4" },
      { id: "S5", x: 760, y: 120, aspect: "double-yellow", label: "S5" },
      { id: "S6", x: 280, y: 220, aspect: "red",           label: "S6" },
      { id: "S7", x: 600, y: 220, aspect: "green",         label: "S7" },
    ],
    "TRE-002": [
      { id: "S1", x: 120, y: 120, aspect: "green",         label: "S1" },
      { id: "S2", x: 280, y: 120, aspect: "yellow",        label: "S2" },
      { id: "S3", x: 440, y: 120, aspect: "red",           label: "S3" },
      { id: "S4", x: 600, y: 120, aspect: "green",         label: "S4" },
      { id: "S5", x: 760, y: 120, aspect: "double-yellow", label: "S5" },
      { id: "S6", x: 280, y: 220, aspect: "red",           label: "S6" },
      { id: "S7", x: 600, y: 220, aspect: "green",         label: "S7" },
    ],
    "TRE-003": [
      { id: "S1", x: 120, y: 120, aspect: "green",         label: "S1" },
      { id: "S2", x: 280, y: 120, aspect: "yellow",        label: "S2" },
      { id: "S3", x: 440, y: 120, aspect: "red",           label: "S3" },
      { id: "S4", x: 600, y: 120, aspect: "green",         label: "S4" },
      { id: "S5", x: 760, y: 120, aspect: "double-yellow", label: "S5" },
      { id: "S6", x: 280, y: 220, aspect: "red",           label: "S6" },
      { id: "S7", x: 600, y: 220, aspect: "green",         label: "S7" },
    ],
  });

  // Per-trainee points state
  const [traineePoints, setTraineePoints] = useState<Record<string, any[]>>({
    "TRE-001": [
      { id: "J1", x: 210, y: 175, state: "normal",  label: "J1" },
      { id: "J2", x: 370, y: 175, state: "normal",  label: "J2" },
      { id: "J3", x: 530, y: 175, state: "reverse", label: "J3" },
      { id: "J4", x: 690, y: 175, state: "normal",  label: "J4" },
    ],
    "TRE-002": [
      { id: "J1", x: 210, y: 175, state: "normal",  label: "J1" },
      { id: "J2", x: 370, y: 175, state: "normal",  label: "J2" },
      { id: "J3", x: 530, y: 175, state: "reverse", label: "J3" },
      { id: "J4", x: 690, y: 175, state: "normal",  label: "J4" },
    ],
    "TRE-003": [
      { id: "J1", x: 210, y: 175, state: "normal",  label: "J1" },
      { id: "J2", x: 370, y: 175, state: "normal",  label: "J2" },
      { id: "J3", x: 530, y: 175, state: "reverse", label: "J3" },
      { id: "J4", x: 690, y: 175, state: "normal",  label: "J4" },
    ],
  });

  // Chat message state
  const [traineeChats, setTraineeChats] = useState<Record<string, { sender: "trainer" | "trainee"; text: string; ts: string }[]>>({
    "TRE-001": [
      { sender: "trainee", text: "Ready to start route interlocking scenario.", ts: "14:30:15" },
    ],
    "TRE-002": [
      { sender: "trainee", text: "Commencing emergency stop procedures.", ts: "14:15:30" },
    ],
    "TRE-003": [
      { sender: "trainee", text: "Request assistance with junction points setup.", ts: "13:46:20" },
    ],
  });

  const [chatInput, setChatInput] = useState("");

  const SCENARIO_OBJECTIVES: Record<string, string[]> = {
    "TRE-001": [
      "Identify signal aspects",
      "Set basic route",
      "Respond to danger signal",
      "Clear interlocking correctly"
    ],
    "TRE-002": [
      "Identify emergency type",
      "Apply emergency brake",
      "Communicate to control",
      "Protect the line"
    ],
    "TRE-003": [
      "Set points for route",
      "Handle point failure",
      "Reverse operations",
      "Verify point detection"
    ]
  };

  const getObjectivesForTrainee = (traineeId: string, progress: number) => {
    const objs = SCENARIO_OBJECTIVES[traineeId] || [
      "Initialize training environment",
      "Perform track checks",
      "Complete run operations",
      "Log out of session"
    ];
    return objs.map((obj, i) => {
      const stepPct = 100 / objs.length;
      const completed = progress >= (i + 1) * stepPct;
      const inProgress = progress > i * stepPct && progress < (i + 1) * stepPct;
      return { label: obj, completed, inProgress };
    });
  };

  const parseDuration = (d: string): number => {
    const parts = d.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const formatDuration = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
  };

  // Background simulation ticks for progress and duration of active sessions
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev =>
        prev.map(s => {
          if (s.status !== "active") return s;
          
          const speedFactor = traineeSpeed[s.traineeId] || 1;
          const weather = traineeWeather[s.traineeId] || "Clear";
          
          // Weather speed multiplier
          let weatherMultiplier = 1.0;
          if (weather === "Heavy Rain") weatherMultiplier = 0.8;
          else if (weather === "Dense Fog") weatherMultiplier = 0.6;
          else if (weather === "Snow / Ice") weatherMultiplier = 0.7;

          const faults = traineeFaults[s.traineeId] || {};
          let progressIncrement = 0.2 * speedFactor * weatherMultiplier;
          if (faults.brakePressure || faults.trackObstruction) {
            progressIncrement = 0; // Halted
          }

          const nextProgress = Math.min(s.progress + progressIncrement, 100);
          const nextStatus = nextProgress >= 100 ? "completed" as const : s.status;
          
          // Increment duration
          const currentSec = parseDuration(s.duration);
          const nextSec = currentSec + 1 * speedFactor;
          const nextDuration = formatDuration(nextSec);

          return {
            ...s,
            progress: parseFloat(nextProgress.toFixed(1)),
            status: nextStatus,
            duration: nextDuration,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [traineeSpeed, traineeWeather, traineeFaults]);

  const handleSendMessage = () => {
    const activeSession = sessions.find(s => s.id === monitoringSessionId);
    if (!chatInput.trim() || !activeSession) return;
    
    const traineeId = activeSession.traineeId;
    const trainerMsg = chatInput.trim();
    const timestamp = new Date().toTimeString().slice(0, 8);
    
    setTraineeChats(prev => ({
      ...prev,
      [traineeId]: [...(prev[traineeId] || []), { sender: "trainer", text: trainerMsg, ts: timestamp }]
    }));
    setChatInput("");

    setTimeout(() => {
      let reply = "Understood. Updating control settings accordingly.";
      const lower = trainerMsg.toLowerCase();
      
      if (lower.includes("weather") || lower.includes("rain") || lower.includes("fog") || lower.includes("snow")) {
        reply = "Copy that. Speed reduced and headlights set to maximum visibility.";
      } else if (lower.includes("stop") || lower.includes("emergency") || lower.includes("halt")) {
        reply = "Emergency brakes applied. Train is fully stopped at block signal.";
      } else if (lower.includes("clear") || lower.includes("proceed") || lower.includes("go")) {
        reply = "Acknowledged. Proceeding under caution. Throttle set to notch 2.";
      } else if (lower.includes("point") || lower.includes("junction") || lower.includes("switch")) {
        reply = "Point junction alignment verified on cab display. Setting route now.";
      } else if (lower.includes("fault") || lower.includes("obstruction") || lower.includes("block")) {
        reply = "Alert received. Standing by for instructions to route around it.";
      } else if (lower.includes("speed") || lower.includes("slow")) {
        reply = "Reducing throttle. Decelerating to specified restricted speed limit.";
      } else if (lower.includes("status") || lower.includes("how is")) {
        reply = `Traction systems nominal. Current speed is ${activeSession.status === "active" ? "45 km/h" : "0 km/h"}. Progressing at ${activeSession.progress}%.`;
      }

      const replyTime = new Date().toTimeString().slice(0, 8);
      setTraineeChats(prev => ({
        ...prev,
        [traineeId]: [...(prev[traineeId] || []), { sender: "trainee", text: reply, ts: replyTime }]
      }));
    }, 2000);
  };

  const toggleSession = (id: string) =>
    setSessions(p => p.map(s => s.id === id ? { ...s, status: s.status === "active" ? "paused" : "active" } : s));

  const sessionStates: Record<string, TrainingSession["status"]> =
    Object.fromEntries(sessions.map(s => [s.traineeId, s.status]));

  const statusCls = (st: string) =>
    st === "active"    ? "text-signal-green border-signal-green bg-signal-green/10" :
    st === "paused"    ? "text-status-caution border-status-caution bg-status-caution/10" :
    st === "completed" ? "text-status-info border-status-info bg-status-info/10" :
                         "text-muted-foreground border-border";

  const activeSession = sessions.find(s => s.id === monitoringSessionId);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",   label: "OVERVIEW",    icon: <Eye className="w-4 h-4" /> },
    { key: "diagram",    label: "LIVE DIAGRAM", icon: <Radio className="w-4 h-4" /> },
    { key: "signaling",  label: "SIGNALING",    icon: <Shield className="w-4 h-4" /> },
    { key: "trains",     label: "TRAINS",       icon: <Train className="w-4 h-4" /> },
    { key: "stations",   label: "STATIONS",     icon: <MapPin className="w-4 h-4" /> },
    { key: "analytics",  label: "ANALYTICS",    icon: <BarChart2 className="w-4 h-4" /> },
  ];

  if (monitoringSessionId) {
    TABS.push({ key: "monitor", label: "MONITORING ACTIVE", icon: <Activity className="w-4 h-4 text-primary-cyan animate-pulse" /> });
  }

  return (
    <div className="min-h-screen bg-bg-very-dark-navy text-foreground">
      <header className="bg-bg-slate-gray border-b-2 border-primary-cyan/30 px-6 py-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-primary-cyan text-xl">TRAINER DASHBOARD — VZA Railway Training</h1>
            <div className="mono text-xs text-muted-foreground mt-1">Monitor & Guide Active Training Sessions</div>
          </div>
          <UserHeader user={user} onLogout={onLogout} onRoleChange={onRoleChange} />
        </div>
      </header>

      <div className="bg-bg-slate-gray border-b border-border px-6 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-3 mono text-sm transition-colors whitespace-nowrap"
              style={{ color: tab === key ? "#00D8FF" : "#6688AA", borderBottom: tab === key ? "2px solid #00D8FF" : "2px solid transparent" }}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: <Users className="w-8 h-8 text-signal-green" />,      val: sessions.filter(s => s.status === "active").length, label: "Active Trainees",  sub: "Currently training",    sc: "#00FF6B" },
                  { icon: <Clock className="w-8 h-8 text-primary-cyan" />,       val: 12,   label: "Sessions Today",   sub: "8 completed",           sc: "#6688AA" },
                  { icon: <CheckCircle2 className="w-8 h-8 text-signal-green" />,val: "94%",label: "Success Rate",     sub: "Above target",          sc: "#00FF6B" },
                  { icon: <AlertTriangle className="w-8 h-8 text-status-caution" />, val: 2, label: "Alerts",          sub: "Needs attention",       sc: "#FFD700" },
                ].map(({ icon, val, label, sub, sc }) => (
                  <div key={label} className="bg-bg-slate-gray border-2 border-border p-6 rounded-sm">
                    <div className="flex items-center justify-between mb-3">{icon}<div className="mono text-2xl text-foreground font-medium">{val}</div></div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="mono text-xs mt-1" style={{ color: sc }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                <div className="border-b border-border p-4 flex items-center justify-between">
                  <h2 className="text-sm text-muted-foreground">ACTIVE TRAINING SESSIONS</h2>
                  <Button variant="primary" size="sm"><Play className="w-4 h-4" /> START NEW SESSION</Button>
                </div>
                <div className="p-4 space-y-4">
                  {sessions.map(s => (
                    <div key={s.id} className="bg-bg-very-dark-navy border-2 border-border rounded-sm p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-sm font-medium text-foreground">{s.trainee}</h3>
                            <span className={`px-2 py-1 border mono text-xs rounded-sm uppercase ${statusCls(s.status)}`}>{s.status}</span>
                          </div>
                          <div className="mono text-xs text-muted-foreground space-y-1">
                            <div>ID: {s.traineeId} · Session: {s.id}</div>
                            <div>Scenario: {s.scenario}</div>
                            <div>Started: {s.startTime} · Duration: {s.duration}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setMonitoringSessionId(s.id);
                            setTab("monitor");
                          }}><Eye className="w-4 h-4" /> MONITOR</Button>
                          <Button variant="secondary" size="sm" onClick={() => {
                            setMonitoringSessionId(s.id);
                            setTab("monitor");
                          }}><MessageSquare className="w-4 h-4" /></Button>
                          {s.status === "active"
                            ? <Button variant="caution" size="sm" onClick={() => toggleSession(s.id)}><Pause className="w-4 h-4" /></Button>
                            : <Button variant="primary" size="sm" onClick={() => toggleSession(s.id)}><Play className="w-4 h-4" /></Button>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="mono text-xs text-muted-foreground">Progress</span>
                          <span className="mono text-xs text-primary-cyan">{s.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
                          <div className="h-full bg-primary-cyan transition-all" style={{ width: `${s.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                  <div className="border-b border-border p-4"><h2 className="text-sm text-muted-foreground">ALERTS & NOTIFICATIONS</h2></div>
                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-status-caution/10 border border-status-caution/30 rounded-sm">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-status-caution flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm text-foreground">Trainee R. Patel exceeded time limit</div>
                          <div className="mono text-xs text-muted-foreground mt-1">Emergency Stop Procedures — 5 minutes ago</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-status-info/10 border border-status-info/30 rounded-sm">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-status-info flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm text-foreground">Help request from S. Lee</div>
                          <div className="mono text-xs text-muted-foreground mt-1">Point Junction Operations — Session paused</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                  <div className="border-b border-border p-4"><h2 className="text-sm text-muted-foreground">COMPLETED TODAY</h2></div>
                  <div className="p-4 space-y-3">
                    {[{ name: "J. Williams", sc: "Track Circuit Basics", score: 92 }, { name: "T. Anderson", sc: "Signal Aspects", score: 88 }, { name: "M. Zhang", sc: "Route Setting", score: 95 }].map(({ name, sc, score }) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-bg-very-dark-navy rounded-sm">
                        <div><div className="text-sm text-foreground">{name}</div><div className="mono text-xs text-muted-foreground">{sc} — Score: {score}%</div></div>
                        <CheckCircle2 className="w-5 h-5 text-signal-green" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "diagram" && (
            <div className="space-y-6">
              <TrainLayout sessionStates={sessionStates} />
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                <div className="border-b border-border p-4 flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-primary-cyan" />
                  <span className="mono text-xs text-muted-foreground">SIMULATION ENGINE — ACTIVE CONTROLS</span>
                </div>
                <div className="p-4">
                  <SimulationEngine />
                </div>
              </div>
            </div>
          )}
          {tab === "signaling"  && <SignalingInterlocking />}
          {tab === "trains"     && <TrainManagementPanel />}
          {tab === "stations"   && <StationInfrastructure />}
          {tab === "analytics"  && <AnalyticsReporting />}

          {tab === "monitor" && activeSession && (
            <div className="space-y-6">
              {/* Back & Profile Header */}
              <div className="bg-bg-slate-gray border-2 border-border p-4 rounded-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="secondary" size="sm" onClick={() => setTab("overview")}>
                    <ArrowLeft className="w-4 h-4" /> BACK
                  </Button>
                  <div className="border-l border-border pl-4">
                    <h2 className="text-md font-bold text-primary-cyan uppercase">
                      MONITORING: {activeSession.trainee}
                    </h2>
                    <div className="mono text-xs text-muted-foreground mt-0.5">
                      Session: {activeSession.id} · ID: {activeSession.traineeId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="mono text-xs text-muted-foreground">SCENARIO</div>
                    <div className="mono text-sm text-foreground">{activeSession.scenario}</div>
                  </div>
                  <div>
                    <div className="mono text-xs text-muted-foreground">ELAPSED</div>
                    <div className="mono text-sm text-primary-cyan">{activeSession.duration}</div>
                  </div>
                  <div>
                    <div className="mono text-xs text-muted-foreground">PROGRESS</div>
                    <div className="mono text-sm text-signal-green">{activeSession.progress}%</div>
                  </div>
                  <div>
                    <div className="mono text-xs text-muted-foreground">WEATHER</div>
                    <div className="mono text-sm text-status-caution">{traineeWeather[activeSession.traineeId]}</div>
                  </div>
                  <div>
                    <div className="mono text-xs text-muted-foreground">COMPRESSION</div>
                    <div className="mono text-sm text-foreground">{traineeSpeed[activeSession.traineeId]}×</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {activeSession.status === "active" ? (
                      <Button variant="caution" size="sm" onClick={() => toggleSession(activeSession.id)}>
                        <Pause className="w-4 h-4" /> PAUSE
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => toggleSession(activeSession.id)}>
                        <Play className="w-4 h-4" /> RESUME
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => {
                      setTraineeSpeed(prev => ({ ...prev, [activeSession.traineeId]: 1 }));
                      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, status: "paused" } : s));
                      setTraineeFaults(prev => ({
                        ...prev,
                        [activeSession.traineeId]: {
                          ...prev[activeSession.traineeId],
                          brakePressure: true
                        }
                      }));
                      setTraineeChats(prev => ({
                        ...prev,
                        [activeSession.traineeId]: [
                          ...(prev[activeSession.traineeId] || []),
                          { sender: "trainee", text: "[SYSTEM ALARM] Emergency Stop triggered by Supervisor! Train halting.", ts: new Date().toTimeString().slice(0, 8) }
                        ]
                      }));
                    }}>
                      <AlertTriangle className="w-4 h-4" /> FORCE EMERGENCY
                    </Button>
                  </div>
                </div>
              </div>

              {/* Injected Fault Alert banner */}
              {Object.values(traineeFaults[activeSession.traineeId] || {}).some(Boolean) && (
                <div className="border-2 border-status-danger bg-status-danger/10 p-4 rounded-sm flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-status-danger animate-bounce" />
                    <div>
                      <span className="mono text-xs text-status-danger font-bold uppercase">
                        CRITICAL MALFUNCTION ACTIVE IN TRAINEE SIMULATION ENVIRONMENT
                      </span>
                      <div className="mono text-xs text-muted-foreground mt-0.5">
                        Active Faults: {Object.entries(traineeFaults[activeSession.traineeId])
                          .filter(([_, active]) => active)
                          .map(([name]) => name.replace(/([A-Z])/g, " $1").toUpperCase())
                          .join(", ")}
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setTraineeFaults(prev => ({
                      ...prev,
                      [activeSession.traineeId]: { trackObstruction: false, pointJam: false, signalLamp: false, brakePressure: false, commsFailure: false }
                    }));
                  }}>
                    CLEAR ALL FAULTS
                  </Button>
                </div>
              )}

              {/* Live Track Layout Display */}
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
                <div className="border-b border-border p-4 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-primary-cyan animate-pulse" />
                    <span className="mono text-xs text-muted-foreground">LIVE TRACK DIAGRAM — INTERACTIVE TELEMETRY</span>
                  </div>
                  <div className="flex items-center gap-4 mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00D8FF] inline-block" /> Active Train
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8899AA] inline-block" /> Stopped Train
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B] inline-block" /> Fault Status
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#10141D]/40">
                  <TrainLayout
                    sessionStates={{ [activeSession.traineeId]: activeSession.status }}
                    signals={traineeSignals[activeSession.traineeId]}
                    onSignalClick={(sigId) => {
                      setTraineeSignals(prev => ({
                        ...prev,
                        [activeSession.traineeId]: prev[activeSession.traineeId].map(s => {
                          if (s.id !== sigId) return s;
                          const cycle = ["green", "yellow", "double-yellow", "red"];
                          return { ...s, aspect: cycle[(cycle.indexOf(s.aspect) + 1) % cycle.length] };
                        })
                      }));
                    }}
                    points={traineePoints[activeSession.traineeId]}
                    onPointClick={(pointId) => {
                      setTraineePoints(prev => ({
                        ...prev,
                        [activeSession.traineeId]: prev[activeSession.traineeId].map(p =>
                          p.id === pointId ? { ...p, state: p.state === "normal" ? "reverse" : "normal" } : p
                        )
                      }));
                    }}
                    progress={activeSession.progress}
                    simState={activeSession.status === "active" ? "running" : activeSession.status === "paused" ? "paused" : "idle"}
                    speed={traineeSpeed[activeSession.traineeId]}
                  />
                </div>
              </div>

              {/* Three column Control Deck */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1: Objectives checklist & Environment Controls */}
                <div className="space-y-6">
                  {/* Checklist */}
                  <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <BookOpen className="w-4 h-4 text-primary-cyan" />
                      <span className="mono text-xs text-muted-foreground">SCENARIO OBJECTIVES CHECKLIST</span>
                    </div>
                    <div className="space-y-2">
                      {getObjectivesForTrainee(activeSession.traineeId, activeSession.progress).map((obj, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 border rounded-sm transition-all"
                          style={{
                            borderColor: obj.completed ? "#00FF6B33" : obj.inProgress ? "#00D8FF44" : "#22334466",
                            background: obj.completed ? "#00FF6B08" : obj.inProgress ? "#00D8FF08" : "transparent"
                          }}>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: obj.completed ? "#00FF6B" : obj.inProgress ? "#00D8FF" : "#334455" }}>
                            {obj.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
                            ) : (
                              <span className="mono text-[10px]" style={{ color: obj.inProgress ? "#00D8FF" : "#445566" }}>{i + 1}</span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: obj.completed ? "#00FF6B" : obj.inProgress ? "#00D8FF" : "#6688AA" }}>
                            {obj.label}
                          </span>
                          {obj.inProgress && (
                            <span className="ml-auto mono text-[10px] text-primary-cyan animate-pulse">TRAINEE BUSY</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environment controls */}
                  <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Cloud className="w-4 h-4 text-primary-cyan" />
                      <span className="mono text-xs text-muted-foreground">SIMULATED ENVIRONMENT MODIFIERS</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="mono text-xs text-muted-foreground mb-2">WEATHER CONDITION</div>
                        <div className="grid grid-cols-3 gap-2">
                          {["Clear", "Heavy Rain", "Dense Fog"].map(w => (
                            <button key={w} onClick={() => {
                              setTraineeWeather(prev => ({ ...prev, [activeSession.traineeId]: w }));
                              setTraineeChats(prev => ({
                                ...prev,
                                [activeSession.traineeId]: [
                                  ...(prev[activeSession.traineeId] || []),
                                  { sender: "trainer", text: `[ENV UPDATE] Weather set to: ${w.toUpperCase()}`, ts: new Date().toTimeString().slice(0, 8) }
                                ]
                              }));
                            }}
                              className="py-1.5 border rounded-sm mono text-[10px] transition-all"
                              style={{
                                borderColor: traineeWeather[activeSession.traineeId] === w ? "#00D8FF" : "#223344",
                                background: traineeWeather[activeSession.traineeId] === w ? "#00D8FF22" : "transparent",
                                color: traineeWeather[activeSession.traineeId] === w ? "#00D8FF" : "#6688AA",
                              }}>{w}</button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mono text-xs text-muted-foreground mb-2">TIME COMPRESSION (SPEED)</div>
                        <div className="flex gap-2">
                          {[1, 2, 4].map(s => (
                            <button key={s} onClick={() => {
                              setTraineeSpeed(prev => ({ ...prev, [activeSession.traineeId]: s }));
                            }}
                              className="flex-1 py-1 border rounded-sm mono text-xs transition-all"
                              style={{
                                borderColor: traineeSpeed[activeSession.traineeId] === s ? "#00D8FF" : "#223344",
                                background: traineeSpeed[activeSession.traineeId] === s ? "#00D8FF22" : "transparent",
                                color: traineeSpeed[activeSession.traineeId] === s ? "#00D8FF" : "#6688AA",
                              }}>{s}×</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Subsystem Fault Injector */}
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Activity className="w-4 h-4 text-primary-cyan" />
                    <span className="mono text-xs text-muted-foreground">TRAINING FAULT INJECTION BAY</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        key: "trackObstruction",
                        label: "TRACK OBSTRUCTION",
                        desc: "Simulates vehicle obstruction on route track segment. Halts trainee train.",
                        icon: <AlertTriangle className="w-4 h-4" />
                      },
                      {
                        key: "pointJam",
                        label: "POINT MACHINE JAM",
                        desc: "Jams Point J2 switch machine. Prevents route locking or alignment changes.",
                        icon: <Zap className="w-4 h-4" />
                      },
                      {
                        key: "signalLamp",
                        label: "SIGNAL LAMP FAILURE",
                        desc: "S3 aspect light bulbs burn out. Forces red caution signal state for all routes.",
                        icon: <Shield className="w-4 h-4" />
                      },
                      {
                        key: "brakePressure",
                        label: "BRAKE PRESSURE LOSS",
                        desc: "Injects sudden leak in pneumatic brake lines. Halts train movement immediately.",
                        icon: <AlertTriangle className="w-4 h-4" />
                      },
                      {
                        key: "commsFailure",
                        label: "COMMS LINK DISRUPTION",
                        desc: "Disrupts voice and digital communications. Mutes cab radio systems.",
                        icon: <WifiOff className="w-4 h-4" />
                      }
                    ].map(fault => {
                      const isActive = (traineeFaults[activeSession.traineeId] || {})[fault.key];
                      return (
                        <button key={fault.key}
                          onClick={() => {
                            setTraineeFaults(prev => {
                              const updatedFaults = {
                                ...prev[activeSession.traineeId],
                                [fault.key]: !isActive
                              };
                              
                              const time = new Date().toTimeString().slice(0, 8);
                              let alertMsg = "";
                              let traineeMsg = "";
                              
                              if (!isActive) {
                                if (fault.key === "trackObstruction") {
                                  alertMsg = "[MALFUNCTION INJECTED] Obstruction detected on Block B1-T1.";
                                  traineeMsg = "[Trainee]: Cab signal warns of track obstruction ahead. Halting train.";
                                } else if (fault.key === "pointJam") {
                                  alertMsg = "[MALFUNCTION INJECTED] Point switch J2 jam alarm.";
                                  traineeMsg = "[Trainee]: J2 point failure warning. Switch alignment locked.";
                                } else if (fault.key === "signalLamp") {
                                  alertMsg = "[MALFUNCTION INJECTED] Signal S3 lamp failure.";
                                  traineeMsg = "[Trainee]: Signal S3 display blank. Proceeding under restricted speed.";
                                } else if (fault.key === "brakePressure") {
                                  alertMsg = "[MALFUNCTION INJECTED] Sudden loss of brake cylinder pressure.";
                                  traineeMsg = "[Trainee]: Low brake pressure warning! Emergency brakes applied automatically.";
                                } else if (fault.key === "commsFailure") {
                                  alertMsg = "[MALFUNCTION INJECTED] Cab radio communication link down.";
                                  traineeMsg = "[Trainee]: (Static interference on radio)";
                                }
                              } else {
                                alertMsg = `[RESOLVED] ${fault.label} has been cleared by trainer.`;
                                traineeMsg = `[Trainee]: System alarms cleared. Resuming normal operations.`;
                              }

                              setTraineeChats(chatPrev => ({
                                ...chatPrev,
                                [activeSession.traineeId]: [
                                  ...(chatPrev[activeSession.traineeId] || []),
                                  { sender: "trainee", text: alertMsg, ts: time },
                                  { sender: "trainee", text: traineeMsg, ts: time }
                                ]
                              }));

                              return {
                                ...prev,
                                [activeSession.traineeId]: updatedFaults
                              };
                            });
                          }}
                          className="w-full text-left p-3 border rounded-sm transition-all hover:bg-bg-very-dark-navy/40"
                          style={{
                            borderColor: isActive ? "#FF3B3B" : "#223344",
                            background: isActive ? "#FF3B3B0A" : "transparent"
                          }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span style={{ color: isActive ? "#FF3B3B" : "#6688AA" }}>{fault.icon}</span>
                              <span className="mono text-xs font-bold" style={{ color: isActive ? "#FF3B3B" : "#8899AA" }}>
                                {fault.label}
                              </span>
                            </div>
                            <span className="mono text-[10px] px-2 py-0.5 border rounded-sm"
                              style={{
                                color: isActive ? "#FF3B3B" : "#445566",
                                borderColor: isActive ? "#FF3B3B44" : "#223344",
                                background: isActive ? "#FF3B3B11" : "transparent"
                              }}>
                              {isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            {fault.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Communication Console */}
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-5 flex flex-col h-[460px]">
                  <div className="flex items-center gap-2 border-b border-border pb-2 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary-cyan" />
                    <span className="mono text-xs text-muted-foreground">SUPERVISOR-TRAINEE COMMS CONSOLE</span>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1">
                    {(traineeChats[activeSession.traineeId] || []).map((msg, i) => {
                      const isTrainer = msg.sender === "trainer";
                      const isSystem = msg.text.startsWith("[");
                      return (
                        <div key={i} className={`flex flex-col ${isTrainer ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1.5 mono text-[10px] text-muted-foreground mb-0.5">
                            <span>{isTrainer ? "SUPERVISOR" : isSystem ? "TELEMETRY" : "TRAINEE"}</span>
                            <span>·</span>
                            <span>{msg.ts}</span>
                          </div>
                          <div className="px-3 py-2 rounded-sm text-xs max-w-[85%] leading-relaxed"
                            style={{
                              background: isTrainer ? "#00D8FF1A" : isSystem ? "#FF3B3B0D" : "#1A2535",
                              border: isTrainer ? "1px solid #00D8FF33" : isSystem ? "1px solid #FF3B3B22" : "1px solid #334455",
                              color: isSystem ? "#FF8888" : "#E2E8F0"
                            }}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send box */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border flex-shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Send instruction to trainee..."
                      className="flex-1 bg-bg-very-dark-navy border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary-cyan transition-colors"
                    />
                    <Button variant="primary" size="sm" onClick={handleSendMessage} className="h-8">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
