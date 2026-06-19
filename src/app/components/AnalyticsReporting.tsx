import { useState } from "react";
import { BarChart2, Zap, FileText, Play, Pause, SkipBack, SkipForward, Download, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "./Button";

const performanceData = [
  { time: "08:00", score: 72, energy: 420, incidents: 1 },
  { time: "09:00", score: 78, energy: 380, incidents: 0 },
  { time: "10:00", score: 85, energy: 410, incidents: 1 },
  { time: "11:00", score: 88, energy: 350, incidents: 0 },
  { time: "12:00", score: 82, energy: 390, incidents: 2 },
  { time: "13:00", score: 91, energy: 320, incidents: 0 },
  { time: "14:00", score: 94, energy: 300, incidents: 0 },
  { time: "15:00", score: 89, energy: 340, incidents: 1 },
];

const traineePerf = [
  { name: "A. Kumar",   score: 94, sessions: 8, avgTime: "32min", incidents: 0, trend: "up"   },
  { name: "R. Patel",   score: 80, sessions: 6, avgTime: "41min", incidents: 2, trend: "down" },
  { name: "S. Lee",     score: 72, sessions: 5, avgTime: "55min", incidents: 3, trend: "up"   },
  { name: "J. Williams",score: 92, sessions: 9, avgTime: "28min", incidents: 1, trend: "up"   },
  { name: "T. Anderson",score: 88, sessions: 7, avgTime: "35min", incidents: 0, trend: "up"   },
];

const incidentLog = [
  { id: "INC-001", ts: "14:37:22", trainee: "R. Patel",  type: "Signal Violation",   severity: "high",   resolved: false, detail: "Passed signal S3 at danger during Emergency Stop scenario" },
  { id: "INC-002", ts: "13:52:11", trainee: "S. Lee",    type: "Speed Exceedance",   severity: "medium", resolved: false, detail: "Exceeded 75km/h limit in restricted zone near J2" },
  { id: "INC-003", ts: "12:18:45", trainee: "S. Lee",    type: "Wrong Route Set",     severity: "medium", resolved: true,  detail: "Incorrectly set route R4 instead of R3 at MRT junction" },
  { id: "INC-004", ts: "11:04:30", trainee: "R. Patel",  type: "Communication Fail", severity: "low",    resolved: true,  detail: "No response to trainer prompt for 90 seconds" },
];

const energyData = [
  { seg: "VZA→J2", kwh: 142, regen: 18 },
  { seg: "J2→MRT", kwh: 198, regen: 22 },
  { seg: "MRT→J3", kwh: 175, regen: 15 },
  { seg: "J3→KLN", kwh: 210, regen: 28 },
  { seg: "LOOP",   kwh: 95,  regen: 8  },
];

const playbackFrames = [
  { t: 0,  desc: "T-001 departs VZA — signal S1 GREEN" },
  { t: 5,  desc: "T-001 passes J1 — junction N" },
  { t: 12, desc: "T-002 arrives MRT — signal S3 RED applied" },
  { t: 18, desc: "Conflict event: R. Patel approaches S3 at speed" },
  { t: 22, desc: "INCIDENT: Signal S3 at danger passed — intervention" },
  { t: 28, desc: "T-001 arrives MRT — signal S4 cleared" },
  { t: 35, desc: "Session paused by Trainer — debrief started" },
];

const severityColor = (s: string) => s === "high" ? "#FF3B3B" : s === "medium" ? "#FFD700" : "#8899AA";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-slate-gray border border-border rounded-sm p-3 mono text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export function AnalyticsReporting() {
  const [activeTab, setActiveTab] = useState<"performance" | "energy" | "incidents" | "playback">("performance");
  const [playbackIdx, setPlaybackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const tabs = [
    { key: "performance", label: "PERFORMANCE ANALYSER", icon: <BarChart2 className="w-4 h-4" /> },
    { key: "energy",      label: "ENERGY MONITORING",    icon: <Zap className="w-4 h-4" /> },
    { key: "incidents",   label: "INCIDENT REPORTS",     icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "playback",    label: "HISTORICAL PLAYBACK",  icon: <Play className="w-4 h-4" /> },
  ] as const;

  const playbackStep = (dir: 1 | -1) => {
    setPlaybackIdx((p) => Math.max(0, Math.min(playbackFrames.length - 1, p + dir)));
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "AVG SESSION SCORE", value: "85%",    color: "#00FF6B" },
          { label: "TOTAL SESSIONS",    value: "156",    color: "#00D8FF" },
          { label: "OPEN INCIDENTS",    value: incidentLog.filter(i=>!i.resolved).length.toString(), color: "#FF3B3B" },
          { label: "ENERGY TODAY",      value: "820 kWh",color: "#FFD700" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="mono text-xs text-muted-foreground mb-1">{label}</div>
            <div className="mono text-lg" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-slate-gray border-2 border-border rounded-sm overflow-hidden">
        {/* Tab row */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3 mono text-xs whitespace-nowrap transition-colors"
              style={{
                color: activeTab === key ? "#00D8FF" : "#6688AA",
                borderBottom: activeTab === key ? "2px solid #00D8FF" : "2px solid transparent",
              }}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── PERFORMANCE ANALYSER ── */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="h-48">
                <div className="mono text-xs text-muted-foreground mb-2">SESSION SCORE TREND — TODAY</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00D8FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D8FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1A2535" />
                    <XAxis dataKey="time" stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <YAxis domain={[60, 100]} stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" stroke="#00D8FF" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: "#00D8FF", r: 3 }} name="Score %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-bg-very-dark-navy border border-border rounded-sm overflow-hidden">
                <div className="grid grid-cols-5 p-3 border-b border-border mono text-xs text-muted-foreground">
                  <span>TRAINEE</span><span>SCORE</span><span>SESSIONS</span><span>AVG TIME</span><span>INCIDENTS</span>
                </div>
                {traineePerf.map((t) => (
                  <div key={t.name} className="grid grid-cols-5 p-3 border-b border-border items-center hover:bg-bg-slate-gray/50 transition-colors">
                    <span className="text-sm text-foreground">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="mono text-sm" style={{ color: t.score >= 90 ? "#00FF6B" : t.score >= 80 ? "#FFD700" : "#FF3B3B" }}>{t.score}%</span>
                      {t.trend === "up" ? <TrendingUp className="w-3 h-3 text-signal-green" /> : <TrendingDown className="w-3 h-3 text-status-danger" />}
                    </div>
                    <span className="mono text-xs text-foreground">{t.sessions}</span>
                    <span className="mono text-xs text-foreground">{t.avgTime}</span>
                    <span className="mono text-xs" style={{ color: t.incidents > 0 ? "#FF3B3B" : "#00FF6B" }}>{t.incidents}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ENERGY MONITORING ── */}
          {activeTab === "energy" && (
            <div className="space-y-6">
              <div className="h-48">
                <div className="mono text-xs text-muted-foreground mb-2">ENERGY CONSUMPTION vs REGENERATION BY SEGMENT (kWh)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={energyData}>
                    <CartesianGrid stroke="#1A2535" />
                    <XAxis dataKey="seg" stroke="#445566" tick={{ fill: "#6688AA", fontSize: 9, fontFamily: "IBM Plex Mono" }} />
                    <YAxis stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="kwh"  fill="#00D8FF" name="Consumption" radius={[2,2,0,0]} opacity={0.8} />
                    <Bar dataKey="regen" fill="#00FF6B" name="Regenerated" radius={[2,2,0,0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-40">
                <div className="mono text-xs text-muted-foreground mb-2">HOURLY ENERGY (kWh)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid stroke="#1A2535" />
                    <XAxis dataKey="time" stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <YAxis stroke="#445566" tick={{ fill: "#6688AA", fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="energy" stroke="#FFD700" strokeWidth={2} dot={false} name="Energy kWh" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "TOTAL CONSUMED", value: "820 kWh", color: "#00D8FF" },
                  { label: "REGENERATED",    value: "91 kWh",  color: "#00FF6B" },
                  { label: "NET USAGE",      value: "729 kWh", color: "#FFD700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-bg-very-dark-navy border border-border rounded-sm p-4">
                    <div className="mono text-xs text-muted-foreground mb-2">{label}</div>
                    <div className="mono text-xl" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INCIDENT REPORTS ── */}
          {activeTab === "incidents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="mono text-xs text-muted-foreground">
                  {incidentLog.filter(i=>!i.resolved).length} OPEN · {incidentLog.filter(i=>i.resolved).length} RESOLVED
                </span>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4" /> EXPORT PDF
                </Button>
              </div>
              {incidentLog.map((inc) => (
                <div key={inc.id} className="bg-bg-very-dark-navy border rounded-sm p-4"
                  style={{ borderColor: inc.resolved ? "#22334466" : severityColor(inc.severity) + "44" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: severityColor(inc.severity) }} />
                      <div>
                        <div className="text-sm text-foreground">{inc.type}</div>
                        <div className="mono text-xs text-muted-foreground">{inc.id} · {inc.ts} · {inc.trainee}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="mono text-xs px-2 py-0.5 border rounded-sm uppercase"
                        style={{ color: severityColor(inc.severity), borderColor: severityColor(inc.severity) + "44", background: severityColor(inc.severity) + "11" }}>
                        {inc.severity}
                      </span>
                      {inc.resolved
                        ? <span className="mono text-xs text-signal-green">RESOLVED</span>
                        : <span className="mono text-xs text-status-danger">OPEN</span>}
                    </div>
                  </div>
                  <div className="mono text-xs text-muted-foreground bg-bg-slate-gray rounded-sm p-2">{inc.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORICAL PLAYBACK ── */}
          {activeTab === "playback" && (
            <div className="space-y-4">
              <div className="mono text-xs text-muted-foreground">SESSION REPLAY — TR-2026-05-28-002 · R. Patel · Emergency Stop Procedures</div>

              {/* Timeline */}
              <div className="bg-bg-very-dark-navy border border-border rounded-sm p-4">
                <div className="relative">
                  {/* Track line */}
                  <div className="h-1 bg-border rounded-full relative">
                    <div className="h-1 bg-primary-cyan rounded-full transition-all duration-300"
                      style={{ width: `${(playbackIdx / (playbackFrames.length - 1)) * 100}%` }} />
                    {playbackFrames.map((f, i) => (
                      <button key={i}
                        onClick={() => setPlaybackIdx(i)}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all"
                        style={{
                          left:        `${(i / (playbackFrames.length - 1)) * 100}%`,
                          background:  i <= playbackIdx ? "#00D8FF" : "#223344",
                          borderColor: i === playbackIdx ? "#00D8FF" : "#445566",
                          boxShadow:   i === playbackIdx ? "0 0 8px #00D8FF" : "none",
                        }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 mono text-xs text-muted-foreground">
                    <span>T+0:00</span><span>T+{playbackFrames[playbackFrames.length - 1].t}:00</span>
                  </div>
                </div>
              </div>

              {/* Current event */}
              <div className="bg-bg-very-dark-navy border border-primary-cyan/30 rounded-sm p-4">
                <div className="mono text-xs text-muted-foreground mb-1">FRAME {playbackIdx + 1} / {playbackFrames.length} · T+{playbackFrames[playbackIdx].t} min</div>
                <div className="text-sm text-foreground">{playbackFrames[playbackIdx].desc}</div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setPlaybackIdx(0)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => playbackStep(-1)} disabled={playbackIdx === 0}>
                  ‹ PREV
                </Button>
                <Button variant={playing ? "caution" : "primary"} size="sm" onClick={() => setPlaying((p) => !p)}>
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {playing ? "PAUSE" : "PLAY"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => playbackStep(1)} disabled={playbackIdx === playbackFrames.length - 1}>
                  NEXT ›
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPlaybackIdx(playbackFrames.length - 1)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Full event list */}
              <div className="space-y-2">
                {playbackFrames.map((f, i) => (
                  <button key={i} onClick={() => setPlaybackIdx(i)}
                    className="w-full text-left p-3 border rounded-sm flex items-center gap-4 transition-colors hover:border-primary-cyan/40"
                    style={{
                      borderColor: i === playbackIdx ? "#00D8FF44" : "#1A2535",
                      background:  i === playbackIdx ? "#00D8FF08" : "transparent",
                    }}>
                    <span className="mono text-xs text-muted-foreground whitespace-nowrap">T+{f.t}:00</span>
                    <span className="mono text-xs" style={{ color: i === playbackIdx ? "#00D8FF" : "#8899AA" }}>{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
