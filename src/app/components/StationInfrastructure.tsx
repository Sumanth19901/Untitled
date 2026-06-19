import { useState } from "react";
import { MapPin, Layers, AlertTriangle, CheckCircle2, Settings } from "lucide-react";
import { Button } from "./Button";
import { FaultToggle } from "./FaultToggle";

interface TrackOccupancy {
  stationId: string;
  trackId: string;
  trackLabel: string;
  state: "clear" | "occupied" | "blocked" | "engineering";
  occupiedBy: string | null;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
}

interface PlatformAssignment {
  trainId: string;
  trainName: string;
  stationId: string;
  platform: string;
  track: string;
  eta: string;
  etd: string;
  status: "scheduled" | "arrived" | "departed" | "delayed" | "cancelled";
  delay: number;
}

interface LevelCrossing {
  id: string;
  location: string;
  km: string;
  state: "open" | "closed" | "fault";
  autoMode: boolean;
  lastActivated: string;
}

interface StationConfig {
  id: string;
  name: string;
  platforms: number;
  tracks: number;
  active: boolean;
  type: "junction" | "terminal" | "halt";
}

const INIT_OCCUPANCY: TrackOccupancy[] = [
  { stationId: "VZA", trackId: "P1-T1", trackLabel: "Platform 1 — Track 1", state: "occupied",    occupiedBy: "T-001", scheduledArrival: "14:25", scheduledDeparture: "14:35" },
  { stationId: "VZA", trackId: "P1-T2", trackLabel: "Platform 1 — Track 2", state: "clear",        occupiedBy: null,    scheduledArrival: "15:10", scheduledDeparture: null    },
  { stationId: "VZA", trackId: "P2-T3", trackLabel: "Platform 2 — Loop",    state: "clear",        occupiedBy: null,    scheduledArrival: null,    scheduledDeparture: null    },
  { stationId: "VZA", trackId: "SD-T1", trackLabel: "Siding S1",            state: "engineering",  occupiedBy: null,    scheduledArrival: null,    scheduledDeparture: null    },
  { stationId: "MRT", trackId: "P1-T1", trackLabel: "Platform 1 — Track 1", state: "occupied",    occupiedBy: "T-002", scheduledArrival: "14:15", scheduledDeparture: "15:00" },
  { stationId: "MRT", trackId: "P1-T2", trackLabel: "Platform 1 — Track 2", state: "clear",        occupiedBy: null,    scheduledArrival: "14:50", scheduledDeparture: null    },
  { stationId: "KLN", trackId: "P1-T1", trackLabel: "Platform 1 — Track 1", state: "clear",        occupiedBy: null,    scheduledArrival: "15:20", scheduledDeparture: null    },
  { stationId: "KLN", trackId: "P1-T2", trackLabel: "Platform 1 — Track 2", state: "clear",        occupiedBy: null,    scheduledArrival: null,    scheduledDeparture: null    },
  { stationId: "KLN", trackId: "P2-T3", trackLabel: "Platform 2 — Refuge",  state: "blocked",     occupiedBy: null,    scheduledArrival: null,    scheduledDeparture: null    },
  { stationId: "KLN", trackId: "P2-T4", trackLabel: "Platform 2 — Loop",    state: "clear",        occupiedBy: null,    scheduledArrival: null,    scheduledDeparture: null    },
];

const INIT_ASSIGNMENTS: PlatformAssignment[] = [
  { trainId: "T-001", trainName: "Vizag Express",   stationId: "MRT", platform: "P1", track: "T1", eta: "14:52", etd: "14:55", status: "scheduled", delay: 0 },
  { trainId: "T-001", trainName: "Vizag Express",   stationId: "KLN", platform: "P1", track: "T1", eta: "15:20", etd: "15:25", status: "scheduled", delay: 0 },
  { trainId: "T-002", trainName: "Murtazabad Pass", stationId: "MRT", platform: "P1", track: "T1", eta: "14:15", etd: "15:00", status: "arrived",   delay: 5 },
  { trainId: "T-002", trainName: "Murtazabad Pass", stationId: "KLN", platform: "P1", track: "T2", eta: "15:30", etd: "15:35", status: "delayed",   delay: 5 },
];

const INIT_CROSSINGS: LevelCrossing[] = [
  { id: "LC-1", location: "Vizag North Rd",  km: "1.2",  state: "open",  autoMode: true,  lastActivated: "13:45:22" },
  { id: "LC-2", location: "Industrial Zone", km: "4.8",  state: "closed",autoMode: true,  lastActivated: "14:28:15" },
  { id: "LC-3", location: "Murtazabad Rd",   km: "8.4",  state: "open",  autoMode: false, lastActivated: "14:10:05" },
  { id: "LC-4", location: "KLN Approach",    km: "14.2", state: "fault", autoMode: false, lastActivated: "12:00:00" },
];

const STATION_CONFIGS: StationConfig[] = [
  { id: "VZA", name: "Vizag Junction",      platforms: 2, tracks: 4, active: true, type: "junction"  },
  { id: "MRT", name: "Murtazabad Halt",     platforms: 1, tracks: 2, active: true, type: "halt"      },
  { id: "KLN", name: "Kalinagar Terminal",  platforms: 2, tracks: 4, active: true, type: "terminal"  },
];

const stateColor = (s: string) => {
  switch (s) {
    case "clear":       return "#00FF6B";
    case "occupied":    return "#00D8FF";
    case "blocked":     return "#FF3B3B";
    case "engineering": return "#FFA500";
    default:            return "#6688AA";
  }
};

const assignColor = (s: PlatformAssignment["status"]) => {
  switch (s) {
    case "arrived":   return "#00D8FF";
    case "scheduled": return "#8899AA";
    case "departed":  return "#00FF6B";
    case "delayed":   return "#FFD700";
    case "cancelled": return "#FF3B3B";
  }
};

export function StationInfrastructure() {
  const [occupancy, setOccupancy]   = useState<TrackOccupancy[]>(INIT_OCCUPANCY);
  const [assignments]               = useState<PlatformAssignment[]>(INIT_ASSIGNMENTS);
  const [crossings, setCrossings]   = useState<LevelCrossing[]>(INIT_CROSSINGS);
  const [configs, setConfigs]       = useState<StationConfig[]>(STATION_CONFIGS);
  const [activeTab, setActiveTab]   = useState<"occupancy" | "platform" | "crossing" | "config">("occupancy");
  const [selectedStation, setSelectedStation] = useState<string>("ALL");

  const toggleCrossing = (id: string) => {
    setCrossings((p) => p.map((c) => {
      if (c.id !== id || c.state === "fault") return c;
      const ts = new Date().toTimeString().slice(0, 8);
      return { ...c, state: c.state === "open" ? "closed" : "open", lastActivated: ts };
    }));
  };

  const toggleCrossingAuto = (id: string) => {
    setCrossings((p) => p.map((c) => c.id === id ? { ...c, autoMode: !c.autoMode } : c));
  };

  const filteredOccupancy = selectedStation === "ALL" ? occupancy : occupancy.filter(o => o.stationId === selectedStation);

  const tabs = [
    { key: "occupancy", label: "TRACK OCCUPANCY",       icon: <Layers className="w-4 h-4" /> },
    { key: "platform",  label: "PLATFORM ASSIGNMENT",   icon: <MapPin className="w-4 h-4" /> },
    { key: "crossing",  label: "LEVEL CROSSING",        icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "config",    label: "STATION CONFIG",        icon: <Settings className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CLEAR TRACKS",      value: occupancy.filter(o=>o.state==="clear").length,       color: "#00FF6B" },
          { label: "OCCUPIED TRACKS",   value: occupancy.filter(o=>o.state==="occupied").length,    color: "#00D8FF" },
          { label: "BLOCKED / ENG.",    value: occupancy.filter(o=>["blocked","engineering"].includes(o.state)).length, color: "#FFD700" },
          { label: "CROSSING FAULTS",   value: crossings.filter(c=>c.state==="fault").length,       color: "#FF3B3B" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="mono text-xs text-muted-foreground mb-1">{label}</div>
            <div className="mono text-lg" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-slate-gray border-2 border-border rounded-sm overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3 mono text-xs whitespace-nowrap transition-colors"
              style={{
                color:        activeTab === key ? "#00D8FF" : "#6688AA",
                borderBottom: activeTab === key ? "2px solid #00D8FF" : "2px solid transparent",
              }}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── TRACK OCCUPANCY ── */}
          {activeTab === "occupancy" && (
            <div className="space-y-4">
              {/* Station filter */}
              <div className="flex gap-2 flex-wrap">
                {["ALL", ...STATION_CONFIGS.map(s => s.id)].map((s) => (
                  <button key={s} onClick={() => setSelectedStation(s)}
                    className="px-3 py-1.5 border rounded-sm mono text-xs transition-colors"
                    style={{
                      borderColor: selectedStation === s ? "#00D8FF" : "#223344",
                      background:  selectedStation === s ? "#00D8FF11" : "transparent",
                      color:       selectedStation === s ? "#00D8FF" : "#8899AA",
                    }}>{s}</button>
                ))}
              </div>

              {STATION_CONFIGS.filter(sc => selectedStation === "ALL" || sc.id === selectedStation).map((sc) => {
                const tracks = filteredOccupancy.filter(o => o.stationId === sc.id);
                return (
                  <div key={sc.id} className="bg-bg-very-dark-navy border border-border rounded-sm overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary-cyan" />
                        <span className="mono text-xs text-primary-cyan">{sc.id}</span>
                        <span className="text-sm text-foreground">{sc.name}</span>
                      </div>
                      <span className="mono text-xs px-2 py-0.5 border rounded-sm uppercase"
                        style={{ color: "#8899AA", borderColor: "#22334466" }}>{sc.type}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {tracks.map((t) => (
                        <div key={t.trackId} className="flex items-center justify-between p-2.5 border rounded-sm"
                          style={{ borderColor: stateColor(t.state) + "33" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full"
                              style={{ background: stateColor(t.state), boxShadow: `0 0 5px ${stateColor(t.state)}` }} />
                            <span className="mono text-xs text-foreground">{t.trackLabel}</span>
                            {t.occupiedBy && (
                              <span className="mono text-xs px-2 py-0.5 border rounded-sm"
                                style={{ color: "#00D8FF", borderColor: "#00D8FF33", background: "#00D8FF11" }}>
                                {t.occupiedBy}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {t.scheduledArrival && (
                              <span className="mono text-xs text-muted-foreground">ARR: {t.scheduledArrival}</span>
                            )}
                            {t.scheduledDeparture && (
                              <span className="mono text-xs text-muted-foreground">DEP: {t.scheduledDeparture}</span>
                            )}
                            <span className="mono text-xs uppercase" style={{ color: stateColor(t.state) }}>{t.state}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PLATFORM ASSIGNMENT ── */}
          {activeTab === "platform" && (
            <div className="space-y-3">
              <div className="mono text-xs text-muted-foreground">SCHEDULED PLATFORM ASSIGNMENTS — TODAY</div>
              <div className="bg-bg-very-dark-navy border border-border rounded-sm overflow-hidden">
                <div className="grid grid-cols-6 p-3 border-b border-border mono text-xs text-muted-foreground">
                  <span>TRAIN</span><span>STATION</span><span>PLATFORM</span><span>ETA</span><span>ETD</span><span>STATUS</span>
                </div>
                {assignments.map((a, i) => (
                  <div key={i} className="grid grid-cols-6 p-3 border-b border-border items-center hover:bg-bg-slate-gray/30 transition-colors">
                    <div>
                      <div className="mono text-xs text-primary-cyan">{a.trainId}</div>
                      <div className="mono text-xs text-muted-foreground">{a.trainName}</div>
                    </div>
                    <span className="mono text-xs text-foreground">{a.stationId}</span>
                    <span className="mono text-xs text-foreground">{a.platform}-{a.track}</span>
                    <div>
                      <div className="mono text-xs text-foreground">{a.eta}</div>
                      {a.delay > 0 && <div className="mono text-xs text-status-caution">+{a.delay}min</div>}
                    </div>
                    <span className="mono text-xs text-foreground">{a.etd}</span>
                    <span className="mono text-xs uppercase" style={{ color: assignColor(a.status) }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LEVEL CROSSING ── */}
          {activeTab === "crossing" && (
            <div className="space-y-4">
              <div className="mono text-xs text-muted-foreground">LEVEL CROSSING CONTROL — {crossings.filter(c=>c.state==="closed").length} CURRENTLY CLOSED</div>
              {crossings.map((c) => (
                <div key={c.id} className="bg-bg-very-dark-navy border rounded-sm p-4"
                  style={{ borderColor: c.state === "fault" ? "#FF3B3B44" : c.state === "closed" ? "#FFD70044" : "#22334466" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full"
                        style={{ background: c.state === "open" ? "#00FF6B" : c.state === "closed" ? "#FFD700" : "#FF3B3B",
                                 boxShadow: `0 0 8px ${c.state === "open" ? "#00FF6B" : c.state === "closed" ? "#FFD700" : "#FF3B3B"}` }} />
                      <div>
                        <div className="text-sm text-foreground">{c.id} — {c.location}</div>
                        <div className="mono text-xs text-muted-foreground">km {c.km} · Last: {c.lastActivated}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs text-muted-foreground">AUTO</span>
                        <FaultToggle label="" enabled={c.autoMode} onToggle={() => toggleCrossingAuto(c.id)} />
                      </div>
                      {c.state === "fault" ? (
                        <span className="mono text-xs px-3 py-1 border rounded-sm"
                          style={{ color: "#FF3B3B", borderColor: "#FF3B3B44", background: "#FF3B3B11" }}>FAULT</span>
                      ) : (
                        <Button
                          variant={c.state === "closed" ? "caution" : "primary"} size="sm"
                          onClick={() => toggleCrossing(c.id)}>
                          {c.state === "closed" ? "OPEN" : "CLOSE"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STATION CONFIG ── */}
          {activeTab === "config" && (
            <div className="space-y-4">
              {configs.map((sc) => (
                <div key={sc.id} className="bg-bg-very-dark-navy border border-border rounded-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="mono text-sm text-primary-cyan">{sc.id}</span>
                      <span className="text-sm text-foreground">{sc.name}</span>
                      <span className="mono text-xs px-2 py-0.5 border rounded-sm uppercase"
                        style={{ color: "#8899AA", borderColor: "#22334466" }}>{sc.type}</span>
                    </div>
                    <FaultToggle label="ACTIVE" enabled={sc.active}
                      onToggle={() => setConfigs(p => p.map(s => s.id === sc.id ? { ...s, active: !s.active } : s))} />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "PLATFORMS",  value: sc.platforms },
                      { label: "TRACKS",     value: sc.tracks },
                      { label: "OCCUPIED",   value: occupancy.filter(o=>o.stationId===sc.id&&o.state==="occupied").length },
                      { label: "CLEAR",      value: occupancy.filter(o=>o.stationId===sc.id&&o.state==="clear").length },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-bg-slate-gray rounded-sm p-3">
                        <div className="mono text-xs text-muted-foreground mb-1">{label}</div>
                        <div className="mono text-lg text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
