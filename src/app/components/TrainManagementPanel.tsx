import { useState } from "react";
import { Train, Plus, Clock, Wrench, History, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "./Button";

type TrainStatus = "in-service" | "standby" | "maintenance" | "decommissioned";

interface TrainUnit {
  id: string;
  name: string;
  class: string;
  formation: string[];   // coach IDs
  maxSpeed: number;
  currentSpeed: number;
  status: TrainStatus;
  location: string;
  driver: string | null;
  delay: number;         // minutes
  nextService: string;
  totalKm: number;
}

interface DelayRecord {
  trainId: string;
  reason: string;
  minutes: number;
  injectedAt: string;
  resolved: boolean;
}

interface HistoryRecord {
  id: string;
  trainId: string;
  event: string;
  timestamp: string;
  detail: string;
}

const CLASSES = ["DMU-2200", "EMU-5000", "LOCO-WDP4", "MEMU-3000", "DEMu-1000"];
const LOCATIONS = ["VZA", "MRT", "KLN", "YARD", "WORKSHOP", "LOOP"];
const DELAY_REASONS = ["Signal failure", "Platform congestion", "Mechanical fault", "Track obstruction", "Weather", "Crew unavailable"];

const INIT_TRAINS: TrainUnit[] = [
  { id: "T-001", name: "Vizag Express",  class: "EMU-5000",   formation: ["C1","C2","C3","C4"],           maxSpeed: 110, currentSpeed: 45, status: "in-service",     location: "BS-A",      driver: "TRE-001", delay: 0,  nextService: "2026-06-20", totalKm: 128400 },
  { id: "T-002", name: "Murtazabad Pass",class: "DMU-2200",   formation: ["C5","C6","C7"],                maxSpeed: 90,  currentSpeed: 0,  status: "in-service",     location: "MRT P1-T1", driver: "TRE-002", delay: 5,  nextService: "2026-06-15", totalKm: 64200  },
  { id: "T-003", name: "Kalinagar Goods",class: "LOCO-WDP4", formation: ["G1","G2","G3","G4","G5","G6"], maxSpeed: 75,  currentSpeed: 22, status: "maintenance",    location: "LOOP",      driver: "TRE-003", delay: 12, nextService: "2026-06-10", totalKm: 312900 },
  { id: "T-004", name: "Reserve Unit 1", class: "MEMU-3000",  formation: ["C8","C9","C10"],               maxSpeed: 100, currentSpeed: 0,  status: "standby",        location: "YARD",      driver: null,      delay: 0,  nextService: "2026-07-01", totalKm: 22000  },
];

const INIT_HISTORY: HistoryRecord[] = [
  { id: "H1", trainId: "T-001", event: "DEPARTURE",    timestamp: "14:30:00", detail: "Departed VZA on time" },
  { id: "H2", trainId: "T-002", event: "ARRIVAL",      timestamp: "14:15:00", detail: "Arrived MRT — awaiting signal" },
  { id: "H3", trainId: "T-003", event: "FAULT",        timestamp: "13:45:00", detail: "Loco fault detected — speed restricted" },
  { id: "H4", trainId: "T-002", event: "DELAY",        timestamp: "13:30:00", detail: "5 min delay — platform congestion MRT" },
  { id: "H5", trainId: "T-001", event: "DEPARTURE",    timestamp: "12:00:00", detail: "Previous run: VZA→KLN completed" },
];

const statusColor = (s: TrainStatus) => {
  switch (s) {
    case "in-service":     return "#00D8FF";
    case "standby":        return "#8899AA";
    case "maintenance":    return "#FFD700";
    case "decommissioned": return "#FF3B3B";
  }
};

export function TrainManagementPanel() {
  const [trains, setTrains] = useState<TrainUnit[]>(INIT_TRAINS);
  const [history] = useState<HistoryRecord[]>(INIT_HISTORY);
  const [delays, setDelays] = useState<DelayRecord[]>([
    { trainId: "T-002", reason: "Platform congestion", minutes: 5,  injectedAt: "13:30:00", resolved: false },
    { trainId: "T-003", reason: "Mechanical fault",    minutes: 12, injectedAt: "13:45:00", resolved: false },
  ]);
  const [activeTab, setActiveTab] = useState<"composition" | "delay" | "history">("composition");
  const [showCreator, setShowCreator] = useState(false);
  const [newTrain, setNewTrain] = useState({ name: "", class: CLASSES[0], coaches: 4, maxSpeed: 100 });

  const createTrain = () => {
    const id = `T-00${trains.length + 1}`;
    setTrains((p) => [...p, {
      id, name: newTrain.name || `Unit ${id}`, class: newTrain.class,
      formation: Array.from({ length: newTrain.coaches }, (_, i) => `C${10 + i + trains.length}`),
      maxSpeed: newTrain.maxSpeed, currentSpeed: 0, status: "standby",
      location: "YARD", driver: null, delay: 0,
      nextService: "2026-07-15", totalKm: 0,
    }]);
    setShowCreator(false);
    setNewTrain({ name: "", class: CLASSES[0], coaches: 4, maxSpeed: 100 });
  };

  const injectDelay = (trainId: string) => {
    const reason = DELAY_REASONS[Math.floor(Math.random() * DELAY_REASONS.length)];
    const minutes = Math.floor(Math.random() * 20) + 2;
    const ts = new Date().toTimeString().slice(0, 8);
    setDelays((p) => [...p, { trainId, reason, minutes, injectedAt: ts, resolved: false }]);
    setTrains((p) => p.map((t) => t.id === trainId ? { ...t, delay: t.delay + minutes } : t));
  };

  const resolveDelay = (idx: number) => {
    setDelays((p) => p.map((d, i) => i === idx ? { ...d, resolved: true } : d));
  };

  const tabs = [
    { key: "composition", label: "COMPOSITION MANAGER", icon: <Train className="w-4 h-4" /> },
    { key: "delay",       label: "DELAY ADJUNCT",        icon: <Clock className="w-4 h-4" /> },
    { key: "history",     label: "HISTORY MANAGER",      icon: <History className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "IN-SERVICE",     value: trains.filter(t=>t.status==="in-service").length,     color: "#00D8FF" },
          { label: "STANDBY",        value: trains.filter(t=>t.status==="standby").length,         color: "#8899AA" },
          { label: "MAINTENANCE",    value: trains.filter(t=>t.status==="maintenance").length,     color: "#FFD700" },
          { label: "ACTIVE DELAYS",  value: delays.filter(d=>!d.resolved).length,                 color: "#FF3B3B" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="mono text-xs text-muted-foreground mb-1">{label}</div>
            <div className="mono text-lg" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="bg-bg-slate-gray border-2 border-border rounded-sm overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3 mono text-xs transition-colors"
              style={{
                color:       activeTab === key ? "#00D8FF" : "#6688AA",
                borderBottom: activeTab === key ? "2px solid #00D8FF" : "2px solid transparent",
              }}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ── COMPOSITION MANAGER ── */}
          {activeTab === "composition" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="mono text-xs text-muted-foreground">FLEET ROSTER — {trains.length} UNITS</span>
                <Button variant="primary" size="sm" onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4" /> CREATE UNIT
                </Button>
              </div>

              {showCreator && (
                <div className="bg-bg-very-dark-navy border border-primary-cyan/40 rounded-sm p-4 space-y-3">
                  <div className="mono text-xs text-primary-cyan mb-2">NEW TRAIN UNIT</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mono text-xs text-muted-foreground mb-1">TRAIN NAME</div>
                      <input value={newTrain.name}
                        onChange={(e) => setNewTrain((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Kalinagar Exp."
                        className="w-full bg-bg-slate-gray border border-border rounded-sm px-3 py-2 mono text-xs text-foreground focus:border-primary-cyan outline-none" />
                    </div>
                    <div>
                      <div className="mono text-xs text-muted-foreground mb-1">CLASS</div>
                      <select value={newTrain.class}
                        onChange={(e) => setNewTrain((p) => ({ ...p, class: e.target.value }))}
                        className="w-full bg-bg-slate-gray border border-border rounded-sm px-3 py-2 mono text-xs text-foreground focus:border-primary-cyan outline-none">
                        {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="mono text-xs text-muted-foreground">COACHES</span>
                        <span className="mono text-xs text-primary-cyan">{newTrain.coaches}</span>
                      </div>
                      <input type="range" min={2} max={12} value={newTrain.coaches}
                        onChange={(e) => setNewTrain((p) => ({ ...p, coaches: Number(e.target.value) }))}
                        className="w-full accent-cyan-400" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="mono text-xs text-muted-foreground">MAX SPEED</span>
                        <span className="mono text-xs text-primary-cyan">{newTrain.maxSpeed} km/h</span>
                      </div>
                      <input type="range" min={50} max={160} step={5} value={newTrain.maxSpeed}
                        onChange={(e) => setNewTrain((p) => ({ ...p, maxSpeed: Number(e.target.value) }))}
                        className="w-full accent-cyan-400" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowCreator(false)}>CANCEL</Button>
                    <Button variant="primary" size="sm" onClick={createTrain}>CREATE</Button>
                  </div>
                </div>
              )}

              {trains.map((t) => (
                <div key={t.id} className="bg-bg-very-dark-navy border rounded-sm p-4"
                  style={{ borderColor: statusColor(t.status) + "44" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(t.status), boxShadow: `0 0 6px ${statusColor(t.status)}` }} />
                      <div>
                        <div className="text-sm text-foreground">{t.name}</div>
                        <div className="mono text-xs text-muted-foreground">{t.id} · {t.class} · {t.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.delay > 0 && (
                        <span className="mono text-xs px-2 py-0.5 border rounded-sm"
                          style={{ color: "#FF3B3B", borderColor: "#FF3B3B44", background: "#FF3B3B11" }}>+{t.delay}min</span>
                      )}
                      <span className="mono text-xs px-2 py-0.5 border rounded-sm uppercase"
                        style={{ color: statusColor(t.status), borderColor: statusColor(t.status) + "44", background: statusColor(t.status) + "11" }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  {/* Formation */}
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    <span className="mono text-xs text-muted-foreground mr-1">FORMATION:</span>
                    {t.formation.map((c, i) => (
                      <div key={c} className="flex items-center">
                        <span className="mono text-xs px-2 py-0.5 border rounded-sm"
                          style={{ borderColor: "#00D8FF33", color: "#8899AA", background: "#00D8FF08" }}>{c}</span>
                        {i < t.formation.length - 1 && <span className="mono text-xs text-muted-foreground px-0.5">—</span>}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><div className="mono text-xs text-muted-foreground">SPEED</div><div className="mono text-xs text-foreground">{t.currentSpeed}/{t.maxSpeed} km/h</div></div>
                    <div><div className="mono text-xs text-muted-foreground">DRIVER</div><div className="mono text-xs text-foreground">{t.driver ?? "UNASSIGNED"}</div></div>
                    <div><div className="mono text-xs text-muted-foreground">TOTAL KM</div><div className="mono text-xs text-foreground">{t.totalKm.toLocaleString()}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── DELAY ADJUNCT ── */}
          {activeTab === "delay" && (
            <div className="space-y-4">
              <div className="mono text-xs text-muted-foreground">INJECT OR MANAGE DELAYS — {delays.filter(d=>!d.resolved).length} ACTIVE</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {trains.filter(t => t.status === "in-service" || t.status === "standby").map((t) => (
                  <button key={t.id} onClick={() => injectDelay(t.id)}
                    className="bg-bg-very-dark-navy border border-border rounded-sm p-3 text-left hover:border-status-caution/50 transition-colors">
                    <div className="mono text-xs text-foreground mb-1">{t.id}</div>
                    <div className="mono text-xs text-muted-foreground">{t.name}</div>
                    <div className="mono text-xs mt-2 flex items-center gap-1" style={{ color: "#FFD700" }}>
                      <AlertTriangle className="w-3 h-3" /> INJECT DELAY
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {delays.map((d, i) => (
                  <div key={i} className="bg-bg-very-dark-navy border rounded-sm p-3 flex items-center justify-between"
                    style={{ borderColor: d.resolved ? "#22334466" : "#FF3B3B44" }}>
                    <div className="flex items-center gap-4">
                      {d.resolved
                        ? <CheckCircle2 className="w-4 h-4 text-signal-green" />
                        : <AlertTriangle className="w-4 h-4 text-status-danger" />}
                      <div>
                        <div className="mono text-xs text-foreground">{d.trainId} — {d.reason}</div>
                        <div className="mono text-xs text-muted-foreground">{d.injectedAt} · +{d.minutes} min</div>
                      </div>
                    </div>
                    {!d.resolved && (
                      <Button variant="primary" size="sm" onClick={() => resolveDelay(i)}>
                        <CheckCircle2 className="w-3 h-3" /> RESOLVE
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HISTORY MANAGER ── */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="mono text-xs text-muted-foreground mb-2">TRAIN EVENT HISTORY — TODAY</div>
              {history.map((h) => {
                const color = h.event === "FAULT" ? "#FF3B3B" : h.event === "DELAY" ? "#FFD700" : h.event === "ARRIVAL" ? "#00D8FF" : "#00FF6B";
                return (
                  <div key={h.id} className="flex items-start gap-4 p-3 bg-bg-very-dark-navy border border-border rounded-sm">
                    <div className="mono text-xs text-muted-foreground whitespace-nowrap">{h.timestamp}</div>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="mono text-xs" style={{ color }}>{h.event}</span>
                    </div>
                    <div>
                      <div className="mono text-xs text-primary-cyan">{h.trainId}</div>
                      <div className="mono text-xs text-foreground">{h.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
