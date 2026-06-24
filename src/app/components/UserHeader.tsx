import { User, UserRole } from "./LoginScreen";
import { Button } from "./Button";
import { Shield, GraduationCap, Train, LogOut, Circle } from "lucide-react";

interface UserHeaderProps {
  user: User;
  onLogout: () => void;
  onRoleChange?: (role: UserRole) => void;
  showLogout?: boolean;
}

export function UserHeader({ user, onLogout, onRoleChange, showLogout = true }: UserHeaderProps) {
  const getRoleIcon = () => {
    switch (user.role) {
      case "admin":
        return <Shield className="w-5 h-5 text-status-info" />;
      case "trainer":
        return <GraduationCap className="w-5 h-5 text-signal-green" />;
      case "trainee":
        return <Train className="w-5 h-5 text-status-caution" />;
    }
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case "admin":
        return "bg-status-info/10 border-status-info text-status-info";
      case "trainer":
        return "bg-signal-green/10 border-signal-green text-signal-green";
      case "trainee":
        return "bg-status-caution/10 border-status-caution text-status-caution";
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {getRoleIcon()}
          <div>
            <div className="text-sm font-medium text-foreground">{user.fullName}</div>
            <div className="mono text-xs text-muted-foreground">ID: {user.id}</div>
          </div>
        </div>
        {onRoleChange ? (
          <div className="relative">
            <select
              value={user.role}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className={`px-3 py-1 rounded-sm border mono text-xs uppercase ${getRoleBadgeColor()} bg-bg-slate-gray cursor-pointer outline-none focus:border-primary-cyan transition-colors appearance-none pr-7`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300D8FF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 6px center',
                backgroundSize: '12px'
              }}
            >
              <option value="trainee" className="bg-bg-very-dark-navy text-foreground">Trainee</option>
              <option value="trainer" className="bg-bg-very-dark-navy text-foreground">Trainer</option>
              <option value="admin" className="bg-bg-very-dark-navy text-foreground">Admin</option>
            </select>
          </div>
        ) : (
          <div
            className={`px-3 py-1 rounded-sm border mono text-xs uppercase ${getRoleBadgeColor()}`}
          >
            {user.role}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Circle className="w-2 h-2 text-signal-green fill-signal-green animate-pulse" />
          <span className="mono text-xs text-signal-green">ACTIVE SESSION</span>
        </div>
        {showLogout && (
          <Button variant="secondary" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
            LOGOUT
          </Button>
        )}
      </div>
    </div>
  );
}
