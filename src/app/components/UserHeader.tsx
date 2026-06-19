import { User } from "./LoginScreen";
import { Button } from "./Button";
import { Shield, GraduationCap, Train, LogOut, Circle } from "lucide-react";

interface UserHeaderProps {
  user: User;
  onLogout: () => void;
  showLogout?: boolean;
}

export function UserHeader({ user, onLogout, showLogout = true }: UserHeaderProps) {
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
        <div
          className={`px-3 py-1 rounded-sm border mono text-xs uppercase ${getRoleBadgeColor()}`}
        >
          {user.role}
        </div>
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
