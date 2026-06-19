import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Sliders, Cloud, Zap, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./Button";
import { FaultToggle } from "./FaultToggle";

interface SimConfig {
  autoScaler: { active: boolean; scale: number; maxTrains: number };
  conflictScenario: { active: boolean; type: string; severity: "low" | "medium" | "high" };
  weatherImpact: { active: boolean; condition: string; visibilityPct: number; speedReductionPct: number };
  rapidDelay: { active: boolean; delayMin: number; delayMax: number; probability: number };
  timeCompression: { active: boolean; ratio: number };
}

interface SimulationEngineProps {
  onConfigChange?: (config: SimConfig) => void;
}

const CONFLICT_TYPES = ["Head-on Collision Risk", "Platform Overlap", "Junction Deadlock", "Signal Violation", "Overspeed in Zone"];
const WEATHER_CONDITIONS = ["Clear", "Heavy Rain", "Dense Fog", "Strong Crosswind", "Snow / Ice", "Heatwave"];

export function SimulationEngine({ onConfigChange }: SimulationEngineProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expandedPanel, setExpandedPanel] = useState<string | null>("timeCompression");

  const [config, setConfig] = useState<SimConfig>({
    autoScaler:      { active: false, scale: 1.0, maxTrains: 6 },
    conflictScenario:{ active: false, type: "Junction Deadlock", severity: "medium" },
    weatherImpact:   { active: false, condition: "Dense Fog", visibilityPct: 40, speedReductionPct: 30 },
    rapidDelay:      { active: false, delayMin: 2, delayMax: 15, probability: 25 },
    timeCompression: { active: false, ratio: 2 },
  });

  const [log, setLog] = useState<{ ts: string; level: "info" | "warn" | "error"; msg: string }[]>([
    { ts: "14:30:00", level: "info",  msg: "Simulation engine initialised — standby mode" },
    { ts: "14:28:45", level: "info",  msg: "All subsystem health checks passed" },
    { ts: "14:25:12", level: "warn",  msg: "Previous session ended with 1 unresolved conflict" },
  ]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const patch = <K extends keyof SimConfig>(key: K, val: Partial<SimConfig[K]>) => {
    const next = { ...config, [key]: { ...config[key], ...val } };
    setConfig(next);
    onConfigChange?.(next);
  };

  const pushLog = (level: "info" | "warn" | "error", msg: string) => {
    const ts = new Date().toTimeString().slice(0, 8);
    setLog((prev) => [{ ts, level, msg }, ...prev].slice(0, 50));
  };

  const handleRunToggle = () => {
    const next = !running;
    setRunning(next);
    pushLog("info", next ? "Simulation engine STARTED" : "Simulation engine PAUSED");
  };

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    pushLog("info", "Simulation reset to initial state");
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const toggle = (k: string) => setExpandedPanel((p) => (p === k ? null : k));

  const panels: { key: string; label: string; icon: React.ReactNode; activeKey: keyof SimConfig }[] = [
    { key: "timeCompression", label: "TIME COMPRESSION CONTROLLER", icon: <Clock className="w-4 h-4" />, activeKey: "timeCompression" },
    { key: "autoScaler",      label: "AUTO SCALER SIMULATOR",       icon: <Sliders className="w-4 h-4" />, activeKey: "autoScaler" },
    { key: "conflictScenario",label: "CONFLICT SCENARIO GENERATOR", icon: <AlertTriangle className="w-4 h-4" />, activeKey: "conflictScenario" },
    { key: "weatherImpact",   label: "WEATHER IMPACT SIMULATOR",    icon: <Cloud className="w-4 h-4" />, activeKey: "weatherImpact" },
    { key: "rapidDelay",      label: "RAPID DELAY SIMULATOR",       icon: <Zap className="w-4 h-4" />, activeKey: "rapidDelay" },
  ];

  return (
    <div className="space-y-4">
      {/* Master Control Bar */}
      <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="mono text-xs text-muted-foreground mb-1">ENGINE STATUS</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block"
                style={{ background: running ? "#00FF6B" : "#FF3B3B", boxShadow: `0 0 6px ${running ? "#00FF6B" : "#FF3B3B"}` }} />
              <span className="mono text-sm" style={{ color: running ? "#00FF6B" : "#FF3B3B" }}>
                {running ? "RUNNING" : "STANDBY"}
              </span>
            </div>
          </div>
          <div>
            <div className="mono text-xs text-muted-foreground mb-1">SIM TIME</div>
            <div className="mono text-sm text-primary-cyan">{fmt(elapsed * config.timeCompression.ratio)}</div>
          </div>
          <div>
            <div className="mono text-xs text-muted-foreground mb-1">WALL TIME</div>
            <div className="mono text-sm text-foreground">{fmt(elapsed)}</div>
          </div>
          <div>
            <div className="mono text-xs text-muted-foreground mb-1">ACTIVE MODULES</div>
            <div className="mono text-sm text-primary-cyan">
              {Object.values(config).filter((v) => v.active).length} / {Object.keys(config).length}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            RESET
          </Button>
          <Button variant={running ? "caution" : "primary"} size="sm" onClick={handleRunToggle}>
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? "PAUSE" : "RUN"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Accordion Panels */}
        <div className="lg:col-span-2 space-y-3">
          {panels.map(({ key, label, icon, activeKey }) => {
            const isOpen = expandedPanel === key;
            const isActive = config[activeKey].active;
            return (
              <div key={key} className="bg-bg-slate-gray border-2 border-border rounded-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-bg-very-dark-navy/50 transition-colors"
                  onClick={() => toggle(key)}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: isActive ? "#00D8FF" : "#6688AA" }}>{icon}</span>
                    <span className="mono text-xs" style={{ color: isActive ? "#00D8FF" : "#8899AA" }}>{label}</span>
                    {isActive && (
                      <span className="px-2 py-0.5 border rounded-sm mono text-xs"
                        style={{ color: "#00FF6B", borderColor: "#00FF6B44", background: "#00FF6B11" }}>ACTIVE</span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 bg-bg-very-dark-navy">
                    {key === "timeCompression" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="mono text-xs text-muted-foreground">ENABLE TIME COMPRESSION</span>
                          <FaultToggle
                            label="" enabled={config.timeCompression.active}
                            onToggle={() => { patch("timeCompression", { active: !config.timeCompression.active }); pushLog("info", `Time compression ${!config.timeCompression.active ? "enabled" : "disabled"}`); }}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="mono text-xs text-muted-foreground">COMPRESSION RATIO</span>
                            <span className="mono text-xs text-primary-cyan">{config.timeCompression.ratio}×</span>
                          </div>
                          <input type="range" min={1} max={10} step={0.5} value={config.timeCompression.ratio}
                            onChange={(e) => patch("timeCompression", { ratio: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                          <div className="flex justify-between mono text-xs text-muted-foreground mt-1"><span>1×</span><span>10×</span></div>
                        </div>
                        <div className="p-3 bg-bg-slate-gray rounded-sm mono text-xs text-muted-foreground">
                          At {config.timeCompression.ratio}× — 1 real minute = {config.timeCompression.ratio} simulated minutes
                        </div>
                      </div>
                    )}

                    {key === "autoScaler" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="mono text-xs text-muted-foreground">ENABLE AUTO SCALER</span>
                          <FaultToggle label="" enabled={config.autoScaler.active}
                            onToggle={() => { patch("autoScaler", { active: !config.autoScaler.active }); pushLog("info", `Auto scaler ${!config.autoScaler.active ? "enabled" : "disabled"}`); }} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="mono text-xs text-muted-foreground">TRAFFIC SCALE FACTOR</span>
                            <span className="mono text-xs text-primary-cyan">{config.autoScaler.scale.toFixed(1)}×</span>
                          </div>
                          <input type="range" min={0.5} max={3} step={0.1} value={config.autoScaler.scale}
                            onChange={(e) => patch("autoScaler", { scale: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="mono text-xs text-muted-foreground">MAX TRAINS IN NETWORK</span>
                            <span className="mono text-xs text-primary-cyan">{config.autoScaler.maxTrains}</span>
                          </div>
                          <input type="range" min={2} max={20} step={1} value={config.autoScaler.maxTrains}
                            onChange={(e) => patch("autoScaler", { maxTrains: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                      </div>
                    )}

                    {key === "conflictScenario" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="mono text-xs text-muted-foreground">INJECT CONFLICT</span>
                          <FaultToggle label="" enabled={config.conflictScenario.active}
                            onToggle={() => {
                              const next = !config.conflictScenario.active;
                              patch("conflictScenario", { active: next });
                              pushLog(next ? "warn" : "info", next ? `Conflict injected: ${config.conflictScenario.type}` : "Conflict scenario cleared");
                            }} />
                        </div>
                        <div>
                          <div className="mono text-xs text-muted-foreground mb-2">SCENARIO TYPE</div>
                          <div className="grid grid-cols-1 gap-2">
                            {CONFLICT_TYPES.map((t) => (
                              <button key={t} onClick={() => patch("conflictScenario", { type: t })}
                                className="text-left px-3 py-2 border rounded-sm mono text-xs transition-colors"
                                style={{
                                  borderColor: config.conflictScenario.type === t ? "#00D8FF" : "#223344",
                                  background:  config.conflictScenario.type === t ? "#00D8FF11" : "transparent",
                                  color:       config.conflictScenario.type === t ? "#00D8FF" : "#8899AA",
                                }}>{t}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mono text-xs text-muted-foreground mb-2">SEVERITY</div>
                          <div className="flex gap-2">
                            {(["low", "medium", "high"] as const).map((s) => (
                              <button key={s} onClick={() => patch("conflictScenario", { severity: s })}
                                className="flex-1 py-2 border rounded-sm mono text-xs uppercase transition-colors"
                                style={{
                                  borderColor: config.conflictScenario.severity === s ? (s === "low" ? "#00FF6B" : s === "medium" ? "#FFD700" : "#FF3B3B") : "#223344",
                                  background:  config.conflictScenario.severity === s ? (s === "low" ? "#00FF6B11" : s === "medium" ? "#FFD70011" : "#FF3B3B11") : "transparent",
                                  color:       config.conflictScenario.severity === s ? (s === "low" ? "#00FF6B" : s === "medium" ? "#FFD700" : "#FF3B3B") : "#8899AA",
                                }}>{s}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {key === "weatherImpact" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="mono text-xs text-muted-foreground">ENABLE WEATHER</span>
                          <FaultToggle label="" enabled={config.weatherImpact.active}
                            onToggle={() => { patch("weatherImpact", { active: !config.weatherImpact.active }); pushLog("info", `Weather: ${config.weatherImpact.condition} ${!config.weatherImpact.active ? "applied" : "cleared"}`); }} />
                        </div>
                        <div>
                          <div className="mono text-xs text-muted-foreground mb-2">CONDITION</div>
                          <div className="grid grid-cols-2 gap-2">
                            {WEATHER_CONDITIONS.map((c) => (
                              <button key={c} onClick={() => patch("weatherImpact", { condition: c })}
                                className="text-left px-3 py-2 border rounded-sm mono text-xs transition-colors"
                                style={{
                                  borderColor: config.weatherImpact.condition === c ? "#00D8FF" : "#223344",
                                  background:  config.weatherImpact.condition === c ? "#00D8FF11" : "transparent",
                                  color:       config.weatherImpact.condition === c ? "#00D8FF" : "#8899AA",
                                }}>{c}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="mono text-xs text-muted-foreground">VISIBILITY</span>
                            <span className="mono text-xs text-primary-cyan">{config.weatherImpact.visibilityPct}%</span>
                          </div>
                          <input type="range" min={5} max={100} value={config.weatherImpact.visibilityPct}
                            onChange={(e) => patch("weatherImpact", { visibilityPct: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="mono text-xs text-muted-foreground">SPEED REDUCTION</span>
                            <span className="mono text-xs text-status-caution">{config.weatherImpact.speedReductionPct}%</span>
                          </div>
                          <input type="range" min={0} max={60} value={config.weatherImpact.speedReductionPct}
                            onChange={(e) => patch("weatherImpact", { speedReductionPct: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                      </div>
                    )}

                    {key === "rapidDelay" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="mono text-xs text-muted-foreground">ENABLE DELAY GEN</span>
                          <FaultToggle label="" enabled={config.rapidDelay.active}
                            onToggle={() => { patch("rapidDelay", { active: !config.rapidDelay.active }); pushLog("warn", `Delay generator ${!config.rapidDelay.active ? "activated" : "deactivated"}`); }} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="mono text-xs text-muted-foreground">MIN DELAY (min)</span>
                            <span className="mono text-xs text-primary-cyan">{config.rapidDelay.delayMin}</span>
                          </div>
                          <input type="range" min={1} max={30} value={config.rapidDelay.delayMin}
                            onChange={(e) => patch("rapidDelay", { delayMin: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="mono text-xs text-muted-foreground">MAX DELAY (min)</span>
                            <span className="mono text-xs text-primary-cyan">{config.rapidDelay.delayMax}</span>
                          </div>
                          <input type="range" min={5} max={120} value={config.rapidDelay.delayMax}
                            onChange={(e) => patch("rapidDelay", { delayMax: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="mono text-xs text-muted-foreground">INJECTION PROBABILITY</span>
                            <span className="mono text-xs text-status-caution">{config.rapidDelay.probability}%</span>
                          </div>
                          <input type="range" min={5} max={80} value={config.rapidDelay.probability}
                            onChange={(e) => patch("rapidDelay", { probability: Number(e.target.value) })}
                            className="w-full accent-cyan-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Event Log */}
        <div className="bg-bg-slate-gray border-2 border-border rounded-sm flex flex-col">
          <div className="border-b border-border p-4">
            <span className="mono text-xs text-muted-foreground">ENGINE EVENT LOG</span>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[500px]">
            {log.map((l, i) => (
              <div key={i} className="p-2 bg-bg-very-dark-navy rounded-sm">
                <span className="mono text-xs text-muted-foreground">[{l.ts}]</span>
                <span className="mono text-xs ml-2"
                  style={{ color: l.level === "error" ? "#FF3B3B" : l.level === "warn" ? "#FFD700" : "#00D8FF" }}>
                  {l.level.toUpperCase()}
                </span>
                <div className="mono text-xs text-foreground mt-0.5">{l.msg}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
