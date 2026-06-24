import { useState, useEffect } from "react";
import { AlertTriangle, Zap, Radio, X, Train, ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Signal {
  id: string;
  x: number;
  y: number;
  aspect: "green" | "yellow" | "red" | "double-yellow";
  label: string;
}

interface PlatformTrack {
  id: string;
  label: string;          // e.g. "Track 1 — UP MAIN"
  type: "main" | "loop" | "siding" | "refuge";
  occupiedBy: string | null; // train label or null
  traineeId: string | null;
  trainStatus: "moving" | "stopped" | "fault" | null;
  entrySignal: Signal["aspect"] | null;
  exitSignal: Signal["aspect"] | null;
  length: string;          // e.g. "620m"
  direction: string;       // e.g. "UP (→ KLN)"
}

interface StationDetail {
  id: string;
  name: string;
  fullName: string;
  km: string;
  platforms: {
    id: string;
    label: string;
    tracks: PlatformTrack[];
  }[];
}

interface TrainPosition {
  id: string;
  x: number;
  y: number;
  label: string;
  traineeId: string;
  speed: number;
  direction: "forward" | "backward";
  status: "moving" | "stopped" | "fault";
  trackSegment: string;
}

interface Point {
  id: string;
  x: number;
  y: number;
  state: "normal" | "reverse";
  label: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const SIGNALS_INIT: Signal[] = [
  { id: "S1", x: 120, y: 120, aspect: "green",         label: "S1" },
  { id: "S2", x: 280, y: 120, aspect: "yellow",        label: "S2" },
  { id: "S3", x: 440, y: 120, aspect: "red",           label: "S3" },
  { id: "S4", x: 600, y: 120, aspect: "green",         label: "S4" },
  { id: "S5", x: 760, y: 120, aspect: "double-yellow", label: "S5" },
  { id: "S6", x: 280, y: 220, aspect: "red",           label: "S6" },
  { id: "S7", x: 600, y: 220, aspect: "green",         label: "S7" },
];

const SVG_STATIONS = [
  { id: "VZA", x: 130, y: 160 },
  { id: "MRT", x: 450, y: 160 },
  { id: "KLN", x: 770, y: 160 },
];

const POINTS_INIT: Point[] = [
  { id: "J1", x: 210, y: 175, state: "normal",  label: "J1" },
  { id: "J2", x: 370, y: 175, state: "normal",  label: "J2" },
  { id: "J3", x: 530, y: 175, state: "reverse", label: "J3" },
  { id: "J4", x: 690, y: 175, state: "normal",  label: "J4" },
];

const STATION_DETAILS: Record<string, StationDetail> = {
  VZA: {
    id: "VZA",
    name: "VZA",
    fullName: "Vizag Junction",
    km: "0.0 km",
    platforms: [
      {
        id: "P1",
        label: "Platform 1",
        tracks: [
          {
            id: "VZA-P1-T1",
            label: "Track 1 — UP MAIN",
            type: "main",
            occupiedBy: "T-001",
            traineeId: "TRE-001",
            trainStatus: "moving",
            entrySignal: "green",
            exitSignal: "yellow",
            length: "620m",
            direction: "UP (→ MRT)",
          },
          {
            id: "VZA-P1-T2",
            label: "Track 2 — DOWN MAIN",
            type: "main",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "green",
            exitSignal: "green",
            length: "620m",
            direction: "DOWN (← MRT)",
          },
        ],
      },
      {
        id: "P2",
        label: "Platform 2",
        tracks: [
          {
            id: "VZA-P2-T3",
            label: "Track 3 — LOOP",
            type: "loop",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "red",
            exitSignal: "red",
            length: "340m",
            direction: "LOOP",
          },
        ],
      },
      {
        id: "SD",
        label: "Siding",
        tracks: [
          {
            id: "VZA-SD-T1",
            label: "Siding S1 — GOODS",
            type: "siding",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: null,
            exitSignal: null,
            length: "180m",
            direction: "DEAD-END",
          },
        ],
      },
    ],
  },
  MRT: {
    id: "MRT",
    name: "MRT",
    fullName: "Murtazabad Halt",
    km: "8.4 km",
    platforms: [
      {
        id: "P1",
        label: "Platform 1",
        tracks: [
          {
            id: "MRT-P1-T1",
            label: "Track 1 — UP MAIN",
            type: "main",
            occupiedBy: "T-002",
            traineeId: "TRE-002",
            trainStatus: "stopped",
            entrySignal: "red",
            exitSignal: "red",
            length: "480m",
            direction: "UP (→ KLN)",
          },
          {
            id: "MRT-P1-T2",
            label: "Track 2 — DOWN MAIN",
            type: "main",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "green",
            exitSignal: "green",
            length: "480m",
            direction: "DOWN (← VZA)",
          },
        ],
      },
    ],
  },
  KLN: {
    id: "KLN",
    name: "KLN",
    fullName: "Kalinagar Terminal",
    km: "16.0 km",
    platforms: [
      {
        id: "P1",
        label: "Platform 1",
        tracks: [
          {
            id: "KLN-P1-T1",
            label: "Track 1 — UP MAIN",
            type: "main",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "double-yellow",
            exitSignal: "green",
            length: "550m",
            direction: "TERMINUS",
          },
          {
            id: "KLN-P1-T2",
            label: "Track 2 — DOWN MAIN",
            type: "main",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "green",
            exitSignal: "green",
            length: "550m",
            direction: "DOWN (← MRT)",
          },
        ],
      },
      {
        id: "P2",
        label: "Platform 2",
        tracks: [
          {
            id: "KLN-P2-T3",
            label: "Track 3 — REFUGE",
            type: "refuge",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "red",
            exitSignal: null,
            length: "260m",
            direction: "DEAD-END",
          },
          {
            id: "KLN-P2-T4",
            label: "Track 4 — LOOP",
            type: "loop",
            occupiedBy: null,
            traineeId: null,
            trainStatus: null,
            entrySignal: "yellow",
            exitSignal: "green",
            length: "310m",
            direction: "LOOP",
          },
        ],
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signalColor(aspect: Signal["aspect"] | null): string {
  if (!aspect) return "#334455";
  switch (aspect) {
    case "green":         return "#00FF6B";
    case "yellow":        return "#FFD700";
    case "double-yellow": return "#FFA500";
    case "red":           return "#FF3B3B";
  }
}

function signalGlow(aspect: Signal["aspect"]): string {
  switch (aspect) {
    case "green":         return "drop-shadow(0 0 4px #00FF6B)";
    case "yellow":        return "drop-shadow(0 0 4px #FFD700)";
    case "double-yellow": return "drop-shadow(0 0 4px #FFA500)";
    case "red":           return "drop-shadow(0 0 6px #FF3B3B)";
  }
}

function trainColor(status: TrainPosition["status"] | "stopped" | "moving" | "fault" | null): string {
  switch (status) {
    case "moving":  return "#00D8FF";
    case "stopped": return "#8899AA";
    case "fault":   return "#FF3B3B";
    default:        return "#445566";
  }
}

function trackTypeColor(type: PlatformTrack["type"]): string {
  switch (type) {
    case "main":    return "#00D8FF";
    case "loop":    return "#8899AA";
    case "siding":  return "#556677";
    case "refuge":  return "#FFA500";
  }
}

// ─── Station Platform Panel ───────────────────────────────────────────────────

function StationPlatformPanel({
  station,
  onClose,
}: {
  station: StationDetail;
  onClose: () => void;
}) {
  const totalTracks = station.platforms.reduce((s, p) => s + p.tracks.length, 0);
  const occupiedTracks = station.platforms
    .flatMap((p) => p.tracks)
    .filter((t) => t.occupiedBy).length;

  return (
    <div className="border-t-2 border-primary-cyan/40 bg-bg-very-dark-navy">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-primary-cyan" />
            <span className="mono text-sm text-primary-cyan">{station.name}</span>
            <span className="text-muted-foreground text-xs">—</span>
            <span className="text-sm text-foreground">{station.fullName}</span>
          </div>
          <span className="mono text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-sm">
            {station.km}
          </span>
          <span className="mono text-xs px-2 py-0.5 rounded-sm border"
            style={{
              color: occupiedTracks > 0 ? "#00D8FF" : "#6688AA",
              borderColor: occupiedTracks > 0 ? "#00D8FF33" : "#33445566",
              background: occupiedTracks > 0 ? "#00D8FF11" : "transparent",
            }}>
            {occupiedTracks}/{totalTracks} OCCUPIED
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Platforms */}
      <div className="p-5 space-y-5">
        {station.platforms.map((platform) => (
          <div key={platform.id}>
            <div className="mono text-xs text-muted-foreground mb-3 flex items-center gap-2">
              <span>{platform.label.toUpperCase()}</span>
              <span className="flex-1 border-b border-border" />
            </div>

            {/* Track diagram SVG */}
            <div className="space-y-3">
              {platform.tracks.map((track, idx) => (
                <PlatformTrackRow key={track.id} track={track} index={idx} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-border px-5 py-3 flex items-center gap-6">
        <span className="mono text-xs text-muted-foreground">LEGEND:</span>
        {[
          { label: "OCCUPIED", color: "#00D8FF" },
          { label: "EMPTY", color: "#223344" },
          { label: "FAULT", color: "#FF3B3B" },
          { label: "REFUGE/SIDING", color: "#FFA500" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-8 h-3 rounded-sm inline-block border"
              style={{ background: color + "33", borderColor: color + "88" }} />
            <span className="mono text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformTrackRow({ track, index }: { track: PlatformTrack; index: number }) {
  const occupied = !!track.occupiedBy;
  const isFault = track.trainStatus === "fault";

  const trackFill = isFault
    ? "#FF3B3B22"
    : occupied
    ? "#00D8FF11"
    : "#0A1520";

  const trackBorder = isFault
    ? "#FF3B3B"
    : occupied
    ? "#00D8FF"
    : "#223344";

  const typeColor = trackTypeColor(track.type);

  return (
    <div
      className="rounded-sm border overflow-hidden"
      style={{ borderColor: trackBorder, background: trackFill }}
    >
      {/* Track diagram row */}
      <div className="flex items-stretch" style={{ minHeight: "64px" }}>
        {/* Left: entry signal */}
        <div
          className="flex flex-col items-center justify-center px-3 border-r"
          style={{ borderColor: "#1A2535", minWidth: "52px" }}
        >
          {track.entrySignal ? (
            <>
              <div
                className="w-3 h-3 rounded-full mb-1"
                style={{
                  background: signalColor(track.entrySignal),
                  boxShadow: `0 0 6px ${signalColor(track.entrySignal)}`,
                }}
              />
              <span className="mono text-xs" style={{ color: signalColor(track.entrySignal) }}>
                {track.entrySignal === "double-yellow" ? "2Y" : track.entrySignal.toUpperCase().slice(0, 1)}
              </span>
            </>
          ) : (
            <span className="mono text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Centre: SVG platform+track */}
        <div className="flex-1 relative flex items-center px-4">
          <svg width="100%" height="54" viewBox="0 0 480 54" preserveAspectRatio="none">
            {/* Platform edge (top) */}
            <rect x="0" y="4" width="480" height="6" fill="#1E2E3E" rx="1" />
            {/* Platform surface markings */}
            {Array.from({ length: 16 }).map((_, i) => (
              <rect key={i} x={10 + i * 29} y="5" width="14" height="4" fill="#253545" rx="0.5" />
            ))}

            {/* Track ballast */}
            <rect x="0" y="24" width="480" height="14" fill="#141E2A" />
            {/* Sleepers */}
            {Array.from({ length: 23 }).map((_, i) => (
              <rect key={i} x={5 + i * 20} y="25" width="5" height="11" fill="#1E2E3E" rx="0.5" />
            ))}
            {/* Rails */}
            <line x1="0" y1="27" x2="480" y2="27"
              stroke={occupied ? trackBorder : "#2A3A4A"} strokeWidth="2"
              style={occupied ? { filter: `drop-shadow(0 0 2px ${trackBorder})` } : {}}
            />
            <line x1="0" y1="33" x2="480" y2="33"
              stroke={occupied ? trackBorder : "#2A3A4A"} strokeWidth="2"
              style={occupied ? { filter: `drop-shadow(0 0 2px ${trackBorder})` } : {}}
            />

            {/* Train (if occupied) */}
            {occupied && (
              <g>
                {/* Train body */}
                <rect x="60" y="22" width="280" height="18" rx="2"
                  fill={isFault ? "#200808" : "#0A1A2A"}
                  stroke={trainColor(track.trainStatus)}
                  strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0 0 4px ${trainColor(track.trainStatus)})` }}
                />
                {/* Cab end */}
                <rect x="320" y="22" width="22" height="18" rx="1"
                  fill={trainColor(track.trainStatus)} opacity="0.5" />
                {/* Windows */}
                {[90, 130, 170, 210, 250].map((wx) => (
                  <rect key={wx} x={wx} y="26" width="22" height="10" rx="1"
                    fill={isFault ? "#440808" : "#0D2030"} stroke={trainColor(track.trainStatus)}
                    strokeWidth="0.5" opacity="0.8"
                  />
                ))}
                {/* Fault stripe */}
                {isFault && (
                  <>
                    <line x1="60" y1="22" x2="340" y2="40" stroke="#FF3B3B" strokeWidth="1" opacity="0.3" />
                    <line x1="60" y1="40" x2="340" y2="22" stroke="#FF3B3B" strokeWidth="1" opacity="0.3" />
                  </>
                )}
                {/* Train ID */}
                <text x="200" y="35" fill={trainColor(track.trainStatus)}
                  fontSize="9" textAnchor="middle"
                  fontFamily="'IBM Plex Mono', monospace" fontWeight="700"
                >
                  {track.occupiedBy}
                </text>
              </g>
            )}

            {/* Buffer stops for dead-ends */}
            {(track.direction === "DEAD-END") && (
              <rect x="462" y="23" width="8" height="16" fill="#445566" rx="1" />
            )}

            {/* Empty track label */}
            {!occupied && (
              <text x="240" y="33" fill="#2A3A4A" fontSize="9" textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
              >
                ── EMPTY ──
              </text>
            )}

            {/* Platform edge (bottom) */}
            <rect x="0" y="44" width="480" height="6" fill="#1E2E3E" rx="1" />
          </svg>
        </div>

        {/* Right: exit signal */}
        <div
          className="flex flex-col items-center justify-center px-3 border-l"
          style={{ borderColor: "#1A2535", minWidth: "52px" }}
        >
          {track.exitSignal ? (
            <>
              <div
                className="w-3 h-3 rounded-full mb-1"
                style={{
                  background: signalColor(track.exitSignal),
                  boxShadow: `0 0 6px ${signalColor(track.exitSignal)}`,
                }}
              />
              <span className="mono text-xs" style={{ color: signalColor(track.exitSignal) }}>
                {track.exitSignal === "double-yellow" ? "2Y" : track.exitSignal.toUpperCase().slice(0, 1)}
              </span>
            </>
          ) : (
            <span className="mono text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Track metadata footer */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t"
        style={{ borderColor: "#1A2535" }}
      >
        <div className="flex items-center gap-3">
          <span className="mono text-xs px-2 py-0.5 rounded-sm border"
            style={{ color: typeColor, borderColor: typeColor + "44", background: typeColor + "11" }}>
            {track.type.toUpperCase()}
          </span>
          <span className="mono text-xs text-muted-foreground">{track.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 mono text-xs text-muted-foreground">
            <ArrowRight className="w-3 h-3" />
            <span>{track.direction}</span>
          </div>
          <span className="mono text-xs text-muted-foreground">{track.length}</span>
          {occupied ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block"
                style={{ background: trainColor(track.trainStatus), boxShadow: `0 0 4px ${trainColor(track.trainStatus)}` }} />
              <span className="mono text-xs" style={{ color: trainColor(track.trainStatus) }}>
                {track.traineeId} · {track.trainStatus?.toUpperCase()}
              </span>
            </div>
          ) : (
            <span className="mono text-xs text-muted-foreground">VACANT</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TrainLayoutProps {
  sessionStates?: Record<string, "active" | "paused" | "completed">;
  signals?: Signal[];
  onSignalClick?: (id: string) => void;
  points?: Point[];
  onPointClick?: (id: string) => void;
  progress?: number;
  simState?: string;
  speed?: number;
}

const TRAIN_TRAINEE_MAP: Record<string, string> = {
  T1: "TRE-001",
  T2: "TRE-002",
  T3: "TRE-003",
};

// Base speed per train (used when session is active)
const BASE_SPEED: Record<string, number> = {
  T1: 45,
  T2: 0,   // T2 is stopped even when active (scenario: stopped at station)
  T3: 22,
};

export function TrainLayout({
  sessionStates = {},
  signals: propsSignals,
  onSignalClick,
  points: propsPoints,
  onPointClick,
  progress,
  simState,
  speed: propsSpeed,
}: TrainLayoutProps) {
  const [trains, setTrains] = useState<TrainPosition[]>([
    { id: "T1", x: 160,  y: 175, label: "T-001", traineeId: "TRE-001", speed: 45, direction: "forward",  status: "moving",  trackSegment: "A-B" },
    { id: "T2", x: 460,  y: 175, label: "T-002", traineeId: "TRE-002", speed: 0,  direction: "forward",  status: "stopped", trackSegment: "C"   },
    { id: "T3", x: 320,  y: 235, label: "T-003", traineeId: "TRE-003", speed: 22, direction: "forward",  status: "fault",   trackSegment: "LOOP"},
  ]);

  const [signals, setSignals] = useState<Signal[]>(SIGNALS_INIT);
  const [points,  setPoints]  = useState<Point[]>(POINTS_INIT);
  const [selectedTrain,   setSelectedTrain]   = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const signalsState = propsSignals || signals;
  const pointsState = propsPoints || points;

  // Derive whether each train is allowed to move based on session state
  const isTrainRunning = (trainId: string, currentStatus: TrainPosition["status"]): boolean => {
    if (currentStatus === "fault") return false;
    const traineeId = TRAIN_TRAINEE_MAP[trainId];
    const sessionStatus = sessionStates[traineeId];
    // If no session info yet, fall back to own status
    if (!sessionStatus) return currentStatus === "moving";
    return sessionStatus === "active";
  };

  useEffect(() => {
    if (typeof progress === "number") return; // Position driven by progress prop
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setTrains((prev) =>
        prev.map((train) => {
          // T2 never moves (stopped at station scenario), T3 is fault
          if (train.id === "T2" || train.id === "T3") {
            // Update speed display to reflect session toggle
            const traineeId = TRAIN_TRAINEE_MAP[train.id];
            const sessionStatus = sessionStates[traineeId];
            const paused = sessionStatus === "paused";
            if (train.id === "T3") return train; // always fault
            return { ...train, speed: paused ? 0 : BASE_SPEED[train.id] };
          }

          const running = isTrainRunning(train.id, train.status);
          if (!running) {
            return { ...train, speed: 0, status: "stopped" };
          }

          let x = train.x + (train.direction === "forward" ? 1 : -1);
          let direction = train.direction;
          if (train.id === "T1") {
            if (x > 680) direction = "backward";
            if (x < 160) direction = "forward";
          }
          return { ...train, x, direction, status: "moving", speed: BASE_SPEED[train.id] };
        })
      );
    }, 80);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sessionStates), progress]);

  const toggleSignal = (id: string) => {
    if (onSignalClick) {
      onSignalClick(id);
      return;
    }
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const cycle: Signal["aspect"][] = ["green", "yellow", "double-yellow", "red"];
        return { ...s, aspect: cycle[(cycle.indexOf(s.aspect) + 1) % cycle.length] };
      })
    );
  };

  const togglePoint = (id: string) => {
    if (onPointClick) {
      onPointClick(id);
      return;
    }
    setPoints((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, state: p.state === "normal" ? "reverse" : "normal" } : p
      )
    );
  };

  const handleStationClick = (id: string) => {
    setSelectedStation((prev) => (prev === id ? null : id));
    setSelectedTrain(null);
  };

  const displayTrains = trains.map(t => {
    if (t.id === "T1" && typeof progress === "number") {
      const activeProgress = progress;
      const x = 160 + (activeProgress / 100) * 600;
      
      const j2 = pointsState.find(p => p.id === "J2")?.state;
      const j3 = pointsState.find(p => p.id === "J3")?.state;
      
      let y = 175;
      if (x > 370 && x < 530) {
        if (j2 === "reverse" || j3 === "reverse") {
          if (x < 400) {
            const pct = (x - 370) / 30;
            y = 175 + pct * 60;
          } else if (x > 500) {
            const pct = (530 - x) / 30;
            y = 175 + pct * 60;
          } else {
            y = 235;
          }
        }
      }
      
      let status = "stopped";
      if (simState === "running") {
        status = "moving";
      } else if (simState === "emergency") {
        status = "fault";
      }
      
      const trainSpeed = simState === "running" ? (45 * (propsSpeed || 1)) : 0;
      
      return {
        ...t,
        x,
        y,
        status: status as any,
        speed: trainSpeed,
        trackSegment: x > 370 && x < 530 && (j2 === "reverse" || j3 === "reverse") ? "LOOP" : t.trackSegment,
      };
    }
    return t;
  });

  const selectedTrainData   = displayTrains.find((t) => t.id === selectedTrain);
  const selectedStationData = selectedStation ? STATION_DETAILS[selectedStation] : null;

  return (
    <div className="bg-bg-slate-gray border-2 border-border rounded-sm">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Radio className="w-4 h-4 text-primary-cyan" />
          <h2 className="text-sm text-muted-foreground">VZA RAILWAY NETWORK — LIVE TRACK DIAGRAM</h2>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { label: "CLEAR",   color: "#00FF6B" },
            { label: "CAUTION", color: "#FFD700" },
            { label: "DANGER",  color: "#FF3B3B" },
            { label: "TRAIN",   color: "#00D8FF" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="mono text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
          <span className="mono text-xs text-primary-cyan/60 border border-primary-cyan/20 px-2 py-0.5 rounded-sm">
            CLICK STATION FOR PLATFORMS
          </span>
        </div>
      </div>

      {/* SVG Track Diagram */}
      <div className="p-4 overflow-x-auto">
        <svg
          width="920" height="310" viewBox="0 0 920 310"
          className="w-full"
          style={{ minWidth: "700px", background: "#10141D", borderRadius: "2px" }}
        >
          {/* Grid */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={310} stroke="#1A2030" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 50} x2={920} y2={i * 50} stroke="#1A2030" strokeWidth={0.5} />
          ))}

          {/* Main line */}
          <line x1="60"  y1="177" x2="860" y2="177" stroke="#2A3A4A" strokeWidth="10" />
          <line x1="60"  y1="173" x2="860" y2="173" stroke="#2A3A4A" strokeWidth="10" />
          <line x1="60"  y1="172" x2="860" y2="172" stroke="#445566" strokeWidth="2" />
          <line x1="60"  y1="178" x2="860" y2="178" stroke="#445566" strokeWidth="2" />
          <line x1="60"  y1="172" x2="860" y2="172" stroke="#00D8FF" strokeWidth="1" opacity="0.25" />
          <line x1="60"  y1="178" x2="860" y2="178" stroke="#00D8FF" strokeWidth="1" opacity="0.25" />
          {Array.from({ length: 40 }).map((_, i) => (
            <rect key={`sl${i}`} x={65 + i * 20} y={169} width="6" height="11" fill="#2A3A4A" rx="1" />
          ))}

          {/* Loop */}
          <path d="M370,175 Q385,210 400,235" stroke="#2A3A4A" strokeWidth="10" fill="none" />
          <path d="M370,175 Q385,210 400,235" stroke="#445566" strokeWidth="2" fill="none" />
          <line x1="400" y1="235" x2="580" y2="235" stroke="#2A3A4A" strokeWidth="10" />
          <line x1="400" y1="235" x2="580" y2="235" stroke="#445566" strokeWidth="2" />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={`ls${i}`} x={405 + i * 18} y={231} width="5" height="9" fill="#2A3A4A" rx="1" />
          ))}
          <path d="M580,235 Q595,210 610,175" stroke="#2A3A4A" strokeWidth="10" fill="none" />
          <path d="M580,235 Q595,210 610,175" stroke="#445566" strokeWidth="2" fill="none" />

          {/* Siding */}
          <path d="M115,175 Q115,200 140,210" stroke="#2A3A4A" strokeWidth="8" fill="none" />
          <path d="M115,175 Q115,200 140,210" stroke="#445566" strokeWidth="1.5" fill="none" />
          <line x1="140" y1="210" x2="200" y2="210" stroke="#2A3A4A" strokeWidth="8" />
          <line x1="140" y1="210" x2="200" y2="210" stroke="#445566" strokeWidth="1.5" />

          {/* Stations — clickable */}
          {SVG_STATIONS.map((st) => {
            const isSelected = selectedStation === st.id;
            return (
              <g
                key={st.id}
                style={{ cursor: "pointer" }}
                onClick={() => handleStationClick(st.id)}
              >
                {/* Selection pulse ring */}
                {isSelected && (
                  <rect
                    x={st.x - 44} y={st.y - 24}
                    width="88" height="48"
                    fill="none" stroke="#00D8FF"
                    strokeWidth="1.5" strokeDasharray="4,3"
                    rx="4" opacity="0.9"
                  />
                )}
                {/* Station box */}
                <rect
                  x={st.x - 38} y={st.y - 18}
                  width="76" height="36"
                  fill={isSelected ? "#1A3040" : "#1A2535"}
                  stroke={isSelected ? "#00D8FF" : "#00D8FF"}
                  strokeWidth={isSelected ? "2" : "1.5"}
                  rx="2"
                />
                <rect x={st.x - 38} y={st.y - 18} width="76" height="8"
                  fill="#00D8FF" opacity={isSelected ? 0.3 : 0.15} />
                <text x={st.x} y={st.y - 5}
                  fill="#00D8FF" fontSize="9" textAnchor="middle"
                  fontFamily="'IBM Plex Mono', monospace" fontWeight="700"
                >
                  {st.id}
                </text>
                <text x={st.x} y={st.y + 8}
                  fill={isSelected ? "#00D8FF" : "#6688AA"} fontSize="7" textAnchor="middle"
                  fontFamily="'IBM Plex Mono', monospace"
                >
                  {STATION_DETAILS[st.id].platforms.reduce((s, p) => s + p.tracks.length, 0)} TRACKS
                </text>
                {/* Click hint arrow */}
                {!isSelected && (
                  <text x={st.x} y={st.y + 22} fill="#334455" fontSize="6" textAnchor="middle"
                    fontFamily="'IBM Plex Mono', monospace">▼</text>
                )}
                {isSelected && (
                  <text x={st.x} y={st.y + 22} fill="#00D8FF" fontSize="6" textAnchor="middle"
                    fontFamily="'IBM Plex Mono', monospace">▲</text>
                )}
              </g>
            );
          })}

          {/* Points */}
          {pointsState.map((pt) => (
            <g key={pt.id} style={{ cursor: "pointer" }} onClick={() => togglePoint(pt.id)}>
              <circle cx={pt.x} cy={pt.y} r={9}
                fill={pt.state === "normal" ? "#0A1A2A" : "#1A0A0A"}
                stroke={pt.state === "normal" ? "#00D8FF" : "#FFA500"}
                strokeWidth="1.5"
              />
              <text x={pt.x} y={pt.y + 3}
                fill={pt.state === "normal" ? "#00D8FF" : "#FFA500"}
                fontSize="6" textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace" fontWeight="700"
              >{pt.label}</text>
              <text x={pt.x} y={pt.y + 20}
                fill={pt.state === "normal" ? "#00D8FF" : "#FFA500"}
                fontSize="6" textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
              >{pt.state === "normal" ? "N" : "R"}</text>
            </g>
          ))}

          {/* Signals */}
          {signalsState.map((sig) => (
            <g key={sig.id} style={{ cursor: "pointer" }} onClick={() => toggleSignal(sig.id)}>
              <line x1={sig.x} y1={sig.y + 8} x2={sig.x} y2={sig.y + 30} stroke="#445566" strokeWidth="1.5" />
              <rect x={sig.x - 8} y={sig.y - 8} width="16" height="16"
                fill="#0A1520" stroke="#445566" strokeWidth="1" rx="2" />
              <circle cx={sig.x} cy={sig.y} r={5}
                fill={signalColor(sig.aspect)}
                style={{ filter: signalGlow(sig.aspect) }}
              />
              {sig.aspect === "double-yellow" && (
                <circle cx={sig.x} cy={sig.y - 8} r={3} fill="#FFA500"
                  style={{ filter: "drop-shadow(0 0 3px #FFA500)" }} />
              )}
              <text x={sig.x + 12} y={sig.y + 4} fill="#6688AA" fontSize="7"
                fontFamily="'IBM Plex Mono', monospace">{sig.label}</text>
            </g>
          ))}

          {/* Trains */}
          {displayTrains.map((train) => (
            <g key={train.id} style={{ cursor: "pointer" }}
              onClick={() => { setSelectedTrain(train.id === selectedTrain ? null : train.id); setSelectedStation(null); }}>
              {selectedTrain === train.id && (
                <rect x={train.x - 22} y={train.y - 14} width="44" height="22"
                  fill="none" stroke="#00D8FF" strokeWidth="1" strokeDasharray="3,2" rx="2" opacity="0.8" />
              )}
              <rect x={train.x - 20} y={train.y - 10} width="40" height="14"
                fill={train.status === "fault" ? "#200808" : "#0A1A2A"}
                stroke={trainColor(train.status)} strokeWidth="1.5" rx="2"
                style={{ filter: `drop-shadow(0 0 ${train.status === "moving" ? "5px" : "2px"} ${trainColor(train.status)})` }}
              />
              <rect
                x={train.direction === "forward" ? train.x + 12 : train.x - 20}
                y={train.y - 10} width="8" height="14"
                fill={trainColor(train.status)} opacity="0.5" rx="1"
              />
              {train.status === "fault" && (
                <text x={train.x} y={train.y + 2} fill="#FF3B3B" fontSize="8"
                  textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontWeight="700">!</text>
              )}
              <text x={train.x} y={train.y - 15} fill={trainColor(train.status)} fontSize="7"
                textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontWeight="700">{train.label}</text>
              <text x={train.x} y={train.y + 22} fill="#6688AA" fontSize="6"
                textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">{train.speed}km/h</text>
            </g>
          ))}

          {/* Labels */}
          <text x="490" y="258" fill="#334455" fontSize="7" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">GOODS LOOP</text>
          <text x="80"  y="228" fill="#334455" fontSize="7" fontFamily="'IBM Plex Mono', monospace">SIDING</text>

          {/* Km posts */}
          {[0, 2, 4, 6, 8, 10, 12, 14, 16].map((km, i) => (
            <g key={km}>
              <line x1={80 + i * 96} y1={185} x2={80 + i * 96} y2={192} stroke="#334455" strokeWidth="1" />
              <text x={80 + i * 96} y={200} fill="#334455" fontSize="6" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">{km}km</text>
            </g>
          ))}

          {/* Buffers */}
          <rect x="50"  y="168" width="8" height="14" fill="#334455" rx="1" />
          <rect x="862" y="168" width="8" height="14" fill="#334455" rx="1" />

          <text x="0" y="0" fill="transparent" fontSize="1">{tick}</text>
        </svg>
      </div>

      {/* Station Platform Detail Panel */}
      {selectedStationData && (
        <StationPlatformPanel
          station={selectedStationData}
          onClose={() => setSelectedStation(null)}
        />
      )}

      {/* Control Row */}
      <div className="border-t border-border p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Selected Train Info */}
        <div>
          <div className="mono text-xs text-muted-foreground mb-3">
            {selectedTrainData ? `SELECTED: ${selectedTrainData.label}` : "CLICK TRAIN TO INSPECT"}
          </div>
          {selectedTrainData ? (
            <div className="bg-bg-very-dark-navy border border-border rounded-sm p-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {[
                  ["TRAIN ID",  selectedTrainData.label,      "text-primary-cyan"],
                  ["OPERATOR",  selectedTrainData.traineeId,   "text-foreground"],
                  ["STATUS",    selectedTrainData.status,      ""],
                  ["SPEED",     `${selectedTrainData.speed} km/h`, "text-foreground"],
                  ["SEGMENT",   selectedTrainData.trackSegment,"text-foreground"],
                  ["DIRECTION", selectedTrainData.direction,   "text-foreground"],
                ].map(([k, v, cls]) => (
                  <>
                    <div key={k + "k"} className="mono text-xs text-muted-foreground">{k}</div>
                    <div key={k + "v"} className={`mono text-xs uppercase ${cls}`}
                      style={k === "STATUS" ? { color: trainColor(selectedTrainData.status) } : {}}>{v}</div>
                  </>
                ))}
              </div>
              {selectedTrainData.status === "fault" && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-status-danger/10 border border-status-danger/30 rounded-sm">
                  <AlertTriangle className="w-3 h-3 text-status-danger flex-shrink-0" />
                  <span className="mono text-xs text-status-danger">FAULT DETECTED — INTERVENTION REQUIRED</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-bg-very-dark-navy border border-border rounded-sm p-3 h-24 flex items-center justify-center">
              <span className="mono text-xs text-muted-foreground">NO TRAIN SELECTED</span>
            </div>
          )}
        </div>

        {/* Junction + Signal controls */}
        <div>
          <div className="mono text-xs text-muted-foreground mb-3">JUNCTION STATES — CLICK TO TOGGLE</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {pointsState.map((pt) => (
              <button key={pt.id} onClick={() => togglePoint(pt.id)}
                className="bg-bg-very-dark-navy border border-border rounded-sm p-2 flex items-center justify-between hover:border-primary-cyan/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3" style={{ color: pt.state === "normal" ? "#00D8FF" : "#FFA500" }} />
                  <span className="mono text-xs text-foreground">{pt.label}</span>
                </div>
                <span className="mono text-xs px-2 py-0.5 border rounded-sm uppercase"
                  style={{
                    color:        pt.state === "normal" ? "#00D8FF" : "#FFA500",
                    borderColor:  pt.state === "normal" ? "#00D8FF44" : "#FFA50044",
                    background:   pt.state === "normal" ? "#00D8FF11" : "#FFA50011",
                  }}>
                  {pt.state === "normal" ? "N" : "R"}
                </span>
              </button>
            ))}
          </div>
          <div className="mono text-xs text-muted-foreground mb-2">SIGNAL ASPECTS — CLICK TO CYCLE</div>
          <div className="flex flex-wrap gap-2">
            {signalsState.map((sig) => (
              <button key={sig.id} onClick={() => toggleSignal(sig.id)}
                className="bg-bg-very-dark-navy border border-border rounded-sm px-2 py-1 flex items-center gap-2 hover:border-primary-cyan/50 transition-colors">
                <span className="w-2 h-2 rounded-full inline-block"
                  style={{ background: signalColor(sig.aspect), boxShadow: `0 0 4px ${signalColor(sig.aspect)}` }} />
                <span className="mono text-xs text-muted-foreground">{sig.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
