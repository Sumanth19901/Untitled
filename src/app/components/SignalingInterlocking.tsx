import { useState } from "react";
import { Lock, Unlock, Shield, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "./Button";

type AspectType = "green" | "yellow" | "double-yellow" | "red";
type BlockState = "clear" | "occupied" | "locked" | "fault";

interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  signals: string[];
  points: { id: string; required: "normal" | "reverse" }[];
  locked: boolean;
  conflictsWith: string[];
}

interface BlockSection {
  id: string;
  label: string;
  from: string;
  to: string;
  state: BlockState;
  occupiedBy: string | null;
  length: string;
}

interface SignalRecord {
  id: string;
  location: string;
  aspect: AspectType;
  override: boolean;
  routeLocked: boolean;
}

const INIT_ROUTES: Route[] = [
  { id: "R1", name: "VZA UP MAIN",     from: "VZA",  to: "MRT",  signals: ["S1","S2"],       points: [{ id: "J1", required: "normal" }],                                 locked: false, conflictsWith: ["R3"] },
  { id: "R2", name: "VZA DOWN MAIN",   from: "MRT",  to: "VZA",  signals: ["S3","S4"],       points: [{ id: "J1", required: "normal" }],                                 locked: false, conflictsWith: ["R4"] },
  { id: "R3", name: "MRT→KLN MAIN",   from: "MRT",  to: "KLN",  signals: ["S4","S5"],       points: [{ id: "J3", required: "normal" }, { id: "J4", required: "normal" }], locked: true,  conflictsWith: ["R1"] },
  { id: "R4", name: "LOOP ENTRY",      from: "VZA",  to: "LOOP", signals: ["S2","S6"],       points: [{ id: "J2", required: "reverse" }],                                locked: false, conflictsWith: ["R2"] },
  { id: "R5", name: "LOOP EXIT",       from: "LOOP", to: "KLN",  signals: ["S7","S5"],       points: [{ id: "J3", required: "reverse" }, { id: "J4", required: "normal" }], locked: false, conflictsWith: [] },
  { id: "R6", name: "VZA SIDING",     from: "VZA",  to: "SIDING",signals: ["S1"],            points: [{ id: "J1", required: "reverse" }],                                locked: false, conflictsWith: ["R1","R2"] },
];

const INIT_BLOCKS: BlockSection[] = [
  { id: "BS-A", label: "Block A", from: "VZA",  to: "J2",   state: "occupied", occupiedBy: "T-001", length: "3.2km" },
  { id: "BS-B", label: "Block B", from: "J2",   to: "MRT",  state: "clear",    occupiedBy: null,     length: "5.2km" },
  { id: "BS-C", label: "Block C", from: "MRT",  to: "J3",   state: "occupied", occupiedBy: "T-002", length: "3.8km" },
  { id: "BS-D", label: "Block D", from: "J3",   to: "KLN",  state: "locked",   occupiedBy: null,     length: "4.0km" },
  { id: "BS-L", label: "Loop",    from: "J2",   to: "J3",   state: "fault",    occupiedBy: "T-003", length: "2.1km" },
];

const INIT_SIGNALS: SignalRecord[] = [
  { id: "S1", location: "VZA (UP Entry)",     aspect: "green",         override: false, routeLocked: false },
  { id: "S2", location: "VZA (UP Exit)",      aspect: "yellow",        override: false, routeLocked: false },
  { id: "S3", location: "MRT (UP Entry)",     aspect: "red",           override: false, routeLocked: true  },
  { id: "S4", location: "MRT (UP Exit)",      aspect: "green",         override: false, routeLocked: true  },
  { id: "S5", location: "KLN (Entry)",        aspect: "double-yellow", override: false, routeLocked: false },
  { id: "S6", location: "Loop (Entry)",       aspect: "red",           override: false, routeLocked: false },
  { id: "S7", location: "Loop (Exit)",        aspect: "green",         override: false, routeLocked: false },
];

const aspectColor = (a: AspectType) => {
  switch (a) {
    case "green":         return "#00FF6B";
    case "yellow":        return "#FFD700";
    case "double-yellow": return "#FFA500";
    case "red":           return "#FF3B3B";
  }
};

const blockColor = (s: BlockState) => {
  switch (s) {
    case "clear":    return "#00FF6B";
    case "occupied": return "#00D8FF";
    case "locked":   return "#FFA500";
    case "fault":    return "#FF3B3B";
  }
};

export function SignalingInterlocking() {
  const [routes,  setRoutes]  = useState<Route[]>(INIT_ROUTES);
  const [blocks,  setBlocks]  = useState<BlockSection[]>(INIT_BLOCKS);
  const [signals, setSignals] = useState<SignalRecord[]>(INIT_SIGNALS);
  const [log, setLog] = useState<{ ts: string; type: "lock" | "unlock" | "conflict" | "override" | "clear"; msg: string }[]>([
    { ts: "14:31:02", type: "lock",    msg: "Route R3 (MRT→KLN MAIN) locked by Trainer" },
    { ts: "14:30:45", type: "clear",   msg: "Block BS-B cleared — T-001 departed VZA" },
    { ts: "14:29:11", type: "conflict",msg: "Conflict detected R1 vs R3 — route lock prevented" },
  ]);

  const addLog = (type: typeof log[0]["type"], msg: string) => {
    const ts = new Date().toTimeString().slice(0, 8);
    setLog((p) => [{ ts, type, msg }, ...p].slice(0, 60));
  };

  const lockRoute = (id: string) => {
    const route = routes.find((r) => r.id === id)!;
    const conflicts = routes.filter((r) => route.conflictsWith.includes(r.id) && r.locked);
    if (conflicts.length) {
      addLog("conflict", `Cannot lock ${route.name} — conflicts with ${conflicts.map((r) => r.name).join(", ")}`);
      return;
    }
    setRoutes((p) => p.map((r) => r.id === id ? { ...r, locked: true } : r));
    setSignals((p) => p.map((s) => route.signals.includes(s.id) ? { ...s, routeLocked: true } : s));
    addLog("lock", `Route ${id} (${route.name}) LOCKED`);
  };

  const unlockRoute = (id: string) => {
    const route = routes.find((r) => r.id === id)!;
    setRoutes((p) => p.map((r) => r.id === id ? { ...r, locked: false } : r));
    setSignals((p) => p.map((s) => route.signals.includes(s.id) ? { ...s, routeLocked: false } : s));
    addLog("unlock", `Route ${id} (${route.name}) RELEASED`);
  };

  const cycleSignal = (id: string) => {
    const cycle: AspectType[] = ["green", "yellow", "double-yellow", "red"];
    setSignals((p) => p.map((s) => {
      if (s.id !== id) return s;
      const next = cycle[(cycle.indexOf(s.aspect) + 1) % cycle.length];
      addLog("override", `Signal ${id} manually set → ${next.toUpperCase()}`);
      return { ...s, aspect: next, override: true };
    }));
  };

  const clearOverride = (id: string) => {
    setSignals((p) => p.map((s) => s.id === id ? { ...s, override: false } : s));
    addLog("clear", `Signal ${id} override cleared — reverted to auto`);
  };

  const lockedCount  = routes.filter((r) => r.locked).length;
  const faultBlocks  = blocks.filter((b) => b.state === "fault").length;
  const overrideCount = signals.filter((s) => s.override).length;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ROUTES LOCKED",    value: `${lockedCount}/${routes.length}`,      color: lockedCount > 0 ? "#FFA500" : "#6688AA" },
          { label: "OCCUPIED BLOCKS",  value: blocks.filter(b=>b.state==="occupied").length, color: "#00D8FF" },
          { label: "FAULT BLOCKS",     value: faultBlocks,  color: faultBlocks > 0 ? "#FF3B3B" : "#6688AA" },
          { label: "SIGNAL OVERRIDES", value: overrideCount, color: overrideCount > 0 ? "#FFD700" : "#6688AA" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="mono text-xs text-muted-foreground mb-1">{label}</div>
            <div className="mono text-lg" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Route Setting & Locking */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
            <div className="border-b border-border p-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-cyan" />
              <span className="mono text-xs text-muted-foreground">ROUTE SETTING & LOCKING</span>
            </div>
            <div className="p-4 space-y-3">
              {routes.map((route) => {
                const hasConflict = routes.some((r) => route.conflictsWith.includes(r.id) && r.locked);
                return (
                  <div key={route.id}
                    className="bg-bg-very-dark-navy border rounded-sm p-3"
                    style={{ borderColor: route.locked ? "#FFA500" : hasConflict ? "#FF3B3B44" : "#223344" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="mono text-xs text-muted-foreground">{route.id}</span>
                        <span className="text-sm text-foreground">{route.name}</span>
                        <div className="flex items-center gap-1 mono text-xs text-muted-foreground">
                          <span>{route.from}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{route.to}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasConflict && !route.locked && (
                          <AlertTriangle className="w-4 h-4 text-status-danger" />
                        )}
                        {route.locked
                          ? <Button variant="caution" size="sm" onClick={() => unlockRoute(route.id)}>
                              <Unlock className="w-3 h-3" /> RELEASE
                            </Button>
                          : <Button variant={hasConflict ? "secondary" : "primary"} size="sm" onClick={() => lockRoute(route.id)}>
                              <Lock className="w-3 h-3" /> LOCK
                            </Button>
                        }
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="mono text-xs text-muted-foreground">Signals:</span>
                      {route.signals.map((s) => (
                        <span key={s} className="mono text-xs px-1.5 py-0.5 border rounded-sm"
                          style={{ borderColor: "#00D8FF33", color: "#00D8FF", background: "#00D8FF11" }}>{s}</span>
                      ))}
                      <span className="mono text-xs text-muted-foreground ml-2">Points:</span>
                      {route.points.map((p) => (
                        <span key={p.id} className="mono text-xs px-1.5 py-0.5 border rounded-sm"
                          style={{ borderColor: "#FFA50033", color: "#FFA500", background: "#FFA50011" }}>
                          {p.id}:{p.required.toUpperCase().slice(0,1)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block Section Manager */}
          <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
            <div className="border-b border-border p-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-cyan" />
              <span className="mono text-xs text-muted-foreground">BLOCK SECTION MANAGER</span>
            </div>
            <div className="p-4 space-y-2">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-bg-very-dark-navy border rounded-sm"
                  style={{ borderColor: blockColor(block.state) + "44" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full"
                      style={{ background: blockColor(block.state), boxShadow: `0 0 6px ${blockColor(block.state)}` }} />
                    <div>
                      <div className="mono text-xs text-foreground">{block.label}</div>
                      <div className="mono text-xs text-muted-foreground">{block.from} → {block.to} · {block.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {block.occupiedBy && (
                      <span className="mono text-xs px-2 py-0.5 border rounded-sm"
                        style={{ color: "#00D8FF", borderColor: "#00D8FF33", background: "#00D8FF11" }}>
                        {block.occupiedBy}
                      </span>
                    )}
                    <span className="mono text-xs uppercase" style={{ color: blockColor(block.state) }}>
                      {block.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Control */}
          <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
            <div className="border-b border-border p-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-cyan" />
              <span className="mono text-xs text-muted-foreground">SIGNAL CONTROL — MANUAL OVERRIDE</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {signals.map((sig) => (
                <div key={sig.id} className="bg-bg-very-dark-navy border rounded-sm p-3"
                  style={{ borderColor: sig.override ? "#FFD70044" : "#223344" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full"
                        style={{ background: aspectColor(sig.aspect), boxShadow: `0 0 6px ${aspectColor(sig.aspect)}` }} />
                      <span className="mono text-xs text-foreground">{sig.id}</span>
                      {sig.routeLocked && <Lock className="w-3 h-3 text-status-caution" />}
                      {sig.override && <span className="mono text-xs text-status-caution">OVERRIDE</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => cycleSignal(sig.id)}
                        className="px-2 py-1 border border-border rounded-sm mono text-xs text-muted-foreground hover:border-primary-cyan/50 hover:text-foreground transition-colors">
                        CYCLE
                      </button>
                      {sig.override && (
                        <button onClick={() => clearOverride(sig.id)}
                          className="px-2 py-1 border rounded-sm mono text-xs transition-colors"
                          style={{ borderColor: "#FFD70044", color: "#FFD700", background: "#FFD70011" }}>
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mono text-xs text-muted-foreground">{sig.location}</div>
                  <div className="mono text-xs mt-1" style={{ color: aspectColor(sig.aspect) }}>
                    {sig.aspect.toUpperCase().replace("-", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interlocking Event Log */}
        <div className="bg-bg-slate-gray border-2 border-border rounded-sm flex flex-col">
          <div className="border-b border-border p-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary-cyan" />
            <span className="mono text-xs text-muted-foreground">INTERLOCKING LOG</span>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[600px]">
            {log.map((l, i) => {
              const color = l.type === "conflict" ? "#FF3B3B"
                          : l.type === "lock"    ? "#FFA500"
                          : l.type === "override"? "#FFD700"
                          : "#00FF6B";
              return (
                <div key={i} className="p-2 bg-bg-very-dark-navy rounded-sm">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs text-muted-foreground">{l.ts}</span>
                    <span className="mono text-xs uppercase" style={{ color }}>{l.type}</span>
                  </div>
                  <div className="mono text-xs text-foreground mt-0.5">{l.msg}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
