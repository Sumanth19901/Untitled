/* eslint-disable */
import { useState } from "react";
import { User } from "./LoginScreen";
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
} from "lucide-react";

interface TrainerDashboardProps { user: User; onLogout: () => void; }

interface TrainingSession {
  id: string; trainee: string; traineeId: string; scenario: string;
  status: "active" | "paused" | "completed"; startTime: string; duration: string; progress: number;
}

type Tab = "overview" | "diagram" | "signaling" | "trains" | "stations" | "analytics";

export function TrainerDashboard({ user, onLogout }: TrainerDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sessions, setSessions] = useState<TrainingSession[]>([
    { id: "TR-2026-05-28-001", trainee: "A. Kumar", traineeId: "TRE-001", scenario: "Signal Interlocking - VZA Main",  status: "active", startTime: "14:30:00", duration: "00:22:45", progress: 65 },
    { id: "TR-2026-05-28-002", trainee: "R. Patel", traineeId: "TRE-002", scenario: "Emergency Stop Procedures",       status: "active", startTime: "14:15:00", duration: "00:37:12", progress: 80 },
    { id: "TR-2026-05-28-003", trainee: "S. Lee",   traineeId: "TRE-003", scenario: "Point Junction Operations",       status: "paused", startTime: "13:45:00", duration: "01:07:33", progress: 45 },
  ]);

  const toggleSession = (id: string) =>
    setSessions(p => p.map(s => s.id === id ? { ...s, status: s.status === "active" ? "paused" : "active" } : s));

  const sessionStates: Record<string, TrainingSession["status"]> =
    Object.fromEntries(sessions.map(s => [s.traineeId, s.status]));

  const statusCls = (st: string) =>
    st === "active"    ? "text-signal-green border-signal-green bg-signal-green/10" :
    st === "paused"    ? "text-status-caution border-status-caution bg-status-caution/10" :
    st === "completed" ? "text-status-info border-status-info bg-status-info/10" :
                         "text-muted-foreground border-border";

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",   label: "OVERVIEW",    icon: <Eye className="w-4 h-4" /> },
    { key: "diagram",    label: "LIVE DIAGRAM", icon: <Radio className="w-4 h-4" /> },
    { key: "signaling",  label: "SIGNALING",    icon: <Shield className="w-4 h-4" /> },
    { key: "trains",     label: "TRAINS",       icon: <Train className="w-4 h-4" /> },
    { key: "stations",   label: "STATIONS",     icon: <MapPin className="w-4 h-4" /> },
    { key: "analytics",  label: "ANALYTICS",    icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-bg-very-dark-navy text-foreground">
      <header className="bg-bg-slate-gray border-b-2 border-primary-cyan/30 px-6 py-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-primary-cyan text-xl">TRAINER DASHBOARD — VZA Railway Training</h1>
            <div className="mono text-xs text-muted-foreground mt-1">Monitor & Guide Active Training Sessions</div>
          </div>
          <UserHeader user={user} onLogout={onLogout} />
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
                          <Button variant="secondary" size="sm"><Eye className="w-4 h-4" /> MONITOR</Button>
                          <Button variant="secondary" size="sm"><MessageSquare className="w-4 h-4" /></Button>
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

        </div>
      </div>
    </div>
  );
}
