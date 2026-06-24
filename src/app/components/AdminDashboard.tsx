/* eslint-disable */
import { useState } from "react";
import { User, UserRole } from "./LoginScreen";
import { UserHeader } from "./UserHeader";
import { Button } from "./Button";
import { TextInput } from "./TextInput";
import { Checkbox } from "./Checkbox";
import { FaultToggle } from "./FaultToggle";
import {
  Users, Settings, Database, Activity, Server, Bell,
  FileText, RefreshCw, AlertTriangle, CheckCircle2, Plus, Shield,
} from "lucide-react";

interface AdminDashboardProps { user: User; onLogout: () => void; onRoleChange?: (role: UserRole) => void; }
type Tab = "overview" | "users" | "system" | "infrastructure" | "logs";

interface SysUser {
  id: string; name: string; role: "admin" | "trainer" | "trainee";
  status: "active" | "suspended" | "pending"; lastLogin: string; sessions: number;
}

const INIT_USERS: SysUser[] = [
  { id: "ADM-001", name: "M. Sharma",   role: "admin",   status: "active",    lastLogin: "2026-06-13 14:52", sessions: 0 },
  { id: "TRN-001", name: "M. Chen",     role: "trainer", status: "active",    lastLogin: "2026-06-13 09:14", sessions: 3 },
  { id: "TRN-002", name: "P. Singh",    role: "trainer", status: "active",    lastLogin: "2026-06-12 16:30", sessions: 2 },
  { id: "TRE-001", name: "A. Kumar",    role: "trainee", status: "active",    lastLogin: "2026-06-13 14:30", sessions: 8 },
  { id: "TRE-002", name: "R. Patel",    role: "trainee", status: "active",    lastLogin: "2026-06-13 14:15", sessions: 6 },
  { id: "TRE-003", name: "S. Lee",      role: "trainee", status: "suspended", lastLogin: "2026-06-11 10:05", sessions: 5 },
  { id: "TRE-004", name: "J. Williams", role: "trainee", status: "active",    lastLogin: "2026-06-13 08:45", sessions: 9 },
  { id: "TRE-005", name: "T. Anderson", role: "trainee", status: "pending",   lastLogin: "—",                sessions: 0 },
];

const SERVICES = [
  { id: "auth",      name: "Authentication Service",   host: "api.auth.vza-railway.local",      status: "online",   cpu: 12, mem: 34 },
  { id: "sim",       name: "Simulation Engine",         host: "sim-engine-01.vza-railway.local", status: "online",   cpu: 68, mem: 72 },
  { id: "db",        name: "Database Cluster",          host: "db-primary.vza-railway.local",    status: "online",   cpu: 24, mem: 58 },
  { id: "bus",       name: "Message Bus / Event Queue", host: "bus.vza-railway.local",           status: "online",   cpu: 8,  mem: 22 },
  { id: "cache",     name: "Cache Layer (Redis)",       host: "cache-01.vza-railway.local",      status: "online",   cpu: 5,  mem: 18 },
  { id: "api",       name: "API Gateway",               host: "api.vza-railway.local",           status: "online",   cpu: 31, mem: 44 },
  { id: "telemetry", name: "Telemetry Service",         host: "telemetry.vza-railway.local",     status: "degraded", cpu: 89, mem: 91 },
  { id: "ext",       name: "External Dashboard Relay",  host: "relay.vza-railway.external",      status: "offline",  cpu: 0,  mem: 0  },
];

const LOGS = [
  { ts: "2026-06-13 14:52:31", level: "INFO",    msg: "User trainer01 logged in from 192.168.1.45" },
  { ts: "2026-06-13 14:48:12", level: "SUCCESS", msg: "Training session TR-2026-06-13-042 completed successfully" },
  { ts: "2026-06-13 14:45:03", level: "WARNING", msg: "Failed login attempt for user trainee03 from 192.168.1.67" },
  { ts: "2026-06-13 14:42:55", level: "INFO",    msg: "System configuration updated by ADM-001" },
  { ts: "2026-06-13 14:38:21", level: "SUCCESS", msg: "Database backup completed — 2.4 GB" },
  { ts: "2026-06-13 14:31:10", level: "INFO",    msg: "Simulation engine started by TRN-001" },
  { ts: "2026-06-13 14:28:44", level: "WARNING", msg: "Telemetry CPU threshold exceeded 85%" },
  { ts: "2026-06-13 14:22:07", level: "ERROR",   msg: "External relay connection lost — retrying…" },
  { ts: "2026-06-13 14:15:00", level: "INFO",    msg: "Route R3 locked by trainer session TR-2026-06-13-041" },
  { ts: "2026-06-13 14:00:00", level: "SUCCESS", msg: "Daily system health check passed (9/9 services)" },
];

const rc = (r: string) => r === "admin" ? "#FF3B3B" : r === "trainer" ? "#00D8FF" : "#FFD700";
const sc = (s: string) => s === "active" ? "#00FF6B" : s === "suspended" ? "#FF3B3B" : "#FFA500";
const lc = (l: string) => l === "ERROR" ? "#FF3B3B" : l === "WARNING" ? "#FFD700" : l === "SUCCESS" ? "#00FF6B" : "#00D8FF";
const vc = (s: string) => s === "online" ? "#00FF6B" : s === "degraded" ? "#FFD700" : "#FF3B3B";

export function AdminDashboard({ user, onLogout, onRoleChange }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<SysUser[]>(INIT_USERS);
  const [logFilter, setLogFilter] = useState("ALL");

  const toggleUser = (id: string) =>
    setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));

  const approveUser = (id: string) =>
    setUsers(p => p.map(u => u.id === id ? { ...u, status: "active" } : u));

  const filteredLogs = logFilter === "ALL" ? LOGS : LOGS.filter(l => l.level === logFilter);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",       label: "OVERVIEW",       icon: <Activity className="w-4 h-4" /> },
    { key: "users",          label: "USER MGMT",      icon: <Users className="w-4 h-4" /> },
    { key: "system",         label: "SYSTEM CONFIG",  icon: <Settings className="w-4 h-4" /> },
    { key: "infrastructure", label: "INFRASTRUCTURE", icon: <Server className="w-4 h-4" /> },
    { key: "logs",           label: "AUDIT LOGS",     icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-bg-very-dark-navy text-foreground">
      <header className="bg-bg-slate-gray border-b-2 border-primary-cyan/30 px-6 py-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-primary-cyan text-xl">ADMIN CONTROL PANEL — VZA Railway System</h1>
            <div className="mono text-xs text-muted-foreground mt-1">System Configuration & User Management</div>
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

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: <Users className="w-8 h-8 text-primary-cyan" />,      val: users.length, label: "Total Users",       sub: `${users.filter(u => u.status === "active").length} active`, sub_c: "#00FF6B" },
                  { icon: <Activity className="w-8 h-8 text-signal-green" />,   val: 8,            label: "Active Sessions",   sub: "5 trainees online",   sub_c: "#00D8FF" },
                  { icon: <Server className="w-8 h-8 text-status-info" />,      val: "99.8%",      label: "System Uptime",     sub: "All systems nominal", sub_c: "#00FF6B" },
                  { icon: <Database className="w-8 h-8 text-status-caution" />, val: 156,          label: "Training Sessions", sub: "This month",          sub_c: "#6688AA" },
                ].map(({ icon, val, label, sub, sub_c }) => (
                  <div key={label} className="bg-bg-slate-gray border-2 border-border p-6 rounded-sm">
                    <div className="flex items-center justify-between mb-3">{icon}<div className="mono text-2xl text-foreground font-medium">{val}</div></div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="mono text-xs mt-1" style={{ color: sub_c }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-6">
                <h2 className="text-sm text-muted-foreground mb-4">SYSTEM HEALTH — QUICK VIEW</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SERVICES.slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-bg-very-dark-navy rounded-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: vc(s.status), boxShadow: `0 0 5px ${vc(s.status)}` }} />
                        <div>
                          <div className="text-sm text-foreground">{s.name}</div>
                          <div className="mono text-xs text-muted-foreground">{s.host}</div>
                        </div>
                      </div>
                      <span className="mono text-xs uppercase" style={{ color: vc(s.status) }}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-6">
                <h2 className="text-sm text-muted-foreground mb-4">RECENT ALERTS</h2>
                <div className="space-y-2">
                  {LOGS.filter(l => l.level !== "INFO" && l.level !== "SUCCESS").slice(0, 4).map((l, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-sm border"
                      style={{ borderColor: lc(l.level) + "33", background: lc(l.level) + "08" }}>
                      <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: lc(l.level) }} />
                      <div><div className="text-sm text-foreground">{l.msg}</div><div className="mono text-xs text-muted-foreground mt-1">{l.ts}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT */}
          {tab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-lg text-foreground">User Management</div>
                  <div className="mono text-xs text-muted-foreground mt-1">
                    {users.filter(u => u.status === "active").length} active · {users.filter(u => u.status === "pending").length} pending · {users.filter(u => u.status === "suspended").length} suspended
                  </div>
                </div>
                <Button variant="primary"><Plus className="w-4 h-4" /> Add New User</Button>
              </div>
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-bg-very-dark-navy border-b border-border">
                    <tr>{["USER ID","NAME","ROLE","SESSIONS","LAST LOGIN","STATUS","ACTIONS"].map(h => (
                      <th key={h} className="text-left p-4 mono text-xs text-muted-foreground">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border hover:bg-bg-very-dark-navy transition-colors">
                        <td className="p-4 mono text-sm text-muted-foreground">{u.id}</td>
                        <td className="p-4 text-sm text-foreground">{u.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 border mono text-xs rounded-sm uppercase"
                            style={{ color: rc(u.role), borderColor: rc(u.role)+"44", background: rc(u.role)+"11" }}>{u.role}</span>
                        </td>
                        <td className="p-4 mono text-sm text-foreground">{u.sessions}</td>
                        <td className="p-4 mono text-xs text-muted-foreground">{u.lastLogin}</td>
                        <td className="p-4 mono text-xs uppercase" style={{ color: sc(u.status) }}>{u.status}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {u.status === "pending" && (
                              <Button variant="primary" size="sm" onClick={() => approveUser(u.id)}>
                                <CheckCircle2 className="w-3 h-3" /> APPROVE
                              </Button>
                            )}
                            {u.status !== "pending" && (
                              <Button variant={u.status === "active" ? "caution" : "secondary"} size="sm" onClick={() => toggleUser(u.id)}>
                                {u.status === "active" ? "SUSPEND" : "REINSTATE"}
                              </Button>
                            )}
                            <Button variant="secondary" size="sm">EDIT</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYSTEM CONFIG */}
          {tab === "system" && (
            <div className="space-y-6">
              <h2 className="text-lg text-foreground">System Configuration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-6 space-y-5">
                  <h3 className="text-sm text-muted-foreground">GENERAL SETTINGS</h3>
                  <TextInput label="System Name" value="VZA Railway Training System" />
                  <TextInput label="Administrator Email" value="admin@vza-railway.local" />
                  <div className="grid grid-cols-2 gap-4">
                    <TextInput label="Session Timeout (min)" value="30" />
                    <TextInput label="Max Concurrent Users" value="50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextInput label="Default Sim Time Ratio" value="1" />
                    <TextInput label="Max Trains / Network" value="20" />
                  </div>
                </div>
                <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-6 space-y-4">
                  <h3 className="text-sm text-muted-foreground">SECURITY SETTINGS</h3>
                  <div className="space-y-3">
                    <Checkbox label="Require two-factor authentication" checked={true} />
                    <Checkbox label="Enable audit logging" checked={true} />
                    <Checkbox label="Force password change every 90 days" checked={false} />
                    <Checkbox label="Lock account after 5 failed attempts" checked={true} />
                  </div>
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm text-muted-foreground mb-3">MODULE TOGGLES</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Simulation Engine",        enabled: true  },
                        { label: "Signaling & Interlocking", enabled: true  },
                        { label: "Analytics & Reporting",    enabled: true  },
                        { label: "External Integration",     enabled: false },
                        { label: "Historical Playback",      enabled: true  },
                        { label: "Train Management",         enabled: true  },
                        { label: "Station Infrastructure",   enabled: true  },
                      ].map(({ label, enabled }) => (
                        <div key={label} className="flex items-center justify-between py-1">
                          <span className="mono text-xs text-foreground">{label}</span>
                          <FaultToggle label="" enabled={enabled} onToggle={() => {}} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary">Reset to Defaults</Button>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          )}

          {/* INFRASTRUCTURE */}
          {tab === "infrastructure" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg text-foreground">Service Infrastructure</h2>
                <Button variant="secondary" size="sm"><RefreshCw className="w-4 h-4" /> REFRESH</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICES.map(s => (
                  <div key={s.id} className="bg-bg-slate-gray border-2 rounded-sm p-5"
                    style={{ borderColor: vc(s.status) + "44" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: vc(s.status), boxShadow: `0 0 6px ${vc(s.status)}` }} />
                        <div>
                          <div className="text-sm text-foreground">{s.name}</div>
                          <div className="mono text-xs text-muted-foreground">{s.host}</div>
                        </div>
                      </div>
                      <span className="mono text-xs uppercase px-2 py-1 border rounded-sm"
                        style={{ color: vc(s.status), borderColor: vc(s.status)+"44", background: vc(s.status)+"11" }}>{s.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[{ label: "CPU", val: s.cpu }, { label: "MEM", val: s.mem }].map(({ label, val }) => (
                        <div key={label}>
                          <div className="mono text-xs text-muted-foreground mb-1">{label} — {val}%</div>
                          <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
                            <div className="h-full rounded-sm transition-all"
                              style={{ width: `${val}%`, background: val > 80 ? "#FF3B3B" : val > 60 ? "#FFD700" : "#00FF6B" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {s.status !== "online" && (
                      <div className="mt-3 flex items-center gap-2 p-2 border rounded-sm"
                        style={{ borderColor: vc(s.status)+"44", background: vc(s.status)+"08" }}>
                        <AlertTriangle className="w-3 h-3" style={{ color: vc(s.status) }} />
                        <span className="mono text-xs" style={{ color: vc(s.status) }}>
                          {s.status === "degraded" ? "High resource usage — investigate" : "Service unreachable — check network"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {tab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg text-foreground">Audit Logs</h2>
                <div className="flex gap-2 flex-wrap">
                  {["ALL","INFO","SUCCESS","WARNING","ERROR"].map(f => (
                    <button key={f} onClick={() => setLogFilter(f)}
                      className="px-3 py-1.5 border rounded-sm mono text-xs transition-colors"
                      style={{ borderColor: logFilter===f ? lc(f) : "#223344", background: logFilter===f ? lc(f)+"11" : "transparent", color: logFilter===f ? lc(f) : "#8899AA" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredLogs.map((l, i) => (
                    <div key={i} className="p-2 bg-bg-very-dark-navy rounded-sm">
                      <span className="mono text-xs text-muted-foreground">[{l.ts}]</span>
                      <span className="mono text-xs ml-2" style={{ color: lc(l.level) }}>{l.level}</span>
                      <span className="mono text-xs text-foreground ml-2">{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
