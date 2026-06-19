import { useState } from "react";
import { Button } from "./Button";
import { TextInput } from "./TextInput";
import { Shield, Train, GraduationCap, AlertCircle } from "lucide-react";

export type UserRole = "admin" | "trainer" | "trainee";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
}

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock user database - in production, this would be a backend API call
  const mockUsers: Record<string, { password: string; user: User }> = {
    "admin001": {
      password: "admin123",
      user: {
        id: "ADM-001",
        username: "admin001",
        role: "admin",
        fullName: "System Administrator",
      },
    },
    "trainer01": {
      password: "trainer123",
      user: {
        id: "TRN-001",
        username: "trainer01",
        role: "trainer",
        fullName: "M. Chen",
      },
    },
    "trainee01": {
      password: "trainee123",
      user: {
        id: "TRE-001",
        username: "trainee01",
        role: "trainee",
        fullName: "A. Kumar",
      },
    },
  };

  const handleLogin = () => {
    setError("");
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (!username || !password) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      const userRecord = mockUsers[username.toLowerCase()];

      if (!userRecord) {
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      if (userRecord.password !== password) {
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      if (selectedRole && userRecord.user.role !== selectedRole) {
        setError(`This account is not registered as a ${selectedRole}`);
        setIsLoading(false);
        return;
      }

      // Success
      onLogin(userRecord.user);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-bg-very-dark-navy flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Train className="w-12 h-12 text-primary-cyan" />
            <h1 className="text-3xl text-primary-cyan">VZA Railway</h1>
          </div>
          <h2 className="text-xl text-foreground">Training Simulation System</h2>
          <p className="mono text-xs text-muted-foreground">
            Secure Access Portal · Mission-Critical Operations
          </p>
        </div>

        {/* Role Selection */}
        {!selectedRole ? (
          <div className="bg-bg-slate-gray border-2 border-border rounded-sm p-6 space-y-4">
            <h3 className="text-sm text-muted-foreground text-center mb-6">
              SELECT YOUR ROLE
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedRole("admin")}
                className="w-full bg-bg-very-dark-navy border-2 border-border hover:border-primary-cyan p-4 rounded-sm transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <Shield className="w-8 h-8 text-status-info group-hover:text-primary-cyan transition-colors" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Administrator</div>
                    <div className="mono text-xs text-muted-foreground">
                      System Configuration & Management
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("trainer")}
                className="w-full bg-bg-very-dark-navy border-2 border-border hover:border-primary-cyan p-4 rounded-sm transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <GraduationCap className="w-8 h-8 text-signal-green group-hover:text-primary-cyan transition-colors" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Trainer / Supervisor</div>
                    <div className="mono text-xs text-muted-foreground">
                      Monitor & Guide Training Sessions
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("trainee")}
                className="w-full bg-bg-very-dark-navy border-2 border-border hover:border-primary-cyan p-4 rounded-sm transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <Train className="w-8 h-8 text-status-caution group-hover:text-primary-cyan transition-colors" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Trainee</div>
                    <div className="mono text-xs text-muted-foreground">
                      Participate in Training Exercises
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-bg-slate-gray border-2 border-primary-cyan/30 rounded-sm p-6 space-y-6">
            {/* Role Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                {selectedRole === "admin" && (
                  <Shield className="w-6 h-6 text-status-info" />
                )}
                {selectedRole === "trainer" && (
                  <GraduationCap className="w-6 h-6 text-signal-green" />
                )}
                {selectedRole === "trainee" && (
                  <Train className="w-6 h-6 text-status-caution" />
                )}
                <div>
                  <div className="text-sm font-medium text-foreground capitalize">
                    {selectedRole} Login
                  </div>
                  <div className="mono text-xs text-muted-foreground">
                    Enter your credentials
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setUsername("");
                  setPassword("");
                  setError("");
                }}
                className="mono text-xs text-primary-cyan hover:underline"
              >
                Change Role
              </button>
            </div>

            {/* Login Form */}
            <div className="space-y-4">
              <TextInput
                label="Username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <TextInput
                label="Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />

              {error && (
                <div className="bg-status-danger/10 border border-status-danger/30 p-3 rounded-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-status-danger">{error}</span>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? "AUTHENTICATING..." : "LOGIN"}
              </Button>
            </div>

            {/* Demo Credentials */}
            <div className="pt-4 border-t border-border">
              <details className="cursor-pointer">
                <summary className="mono text-xs text-muted-foreground hover:text-primary-cyan">
                  Demo Credentials (Click to view)
                </summary>
                <div className="mt-3 mono text-xs space-y-2 text-muted-foreground bg-bg-very-dark-navy p-3 rounded-sm">
                  <div>
                    <strong className="text-status-info">Admin:</strong> admin001 / admin123
                  </div>
                  <div>
                    <strong className="text-signal-green">Trainer:</strong> trainer01 / trainer123
                  </div>
                  <div>
                    <strong className="text-status-caution">Trainee:</strong> trainee01 / trainee123
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          <div className="mono text-xs text-muted-foreground">
            Secure Connection · All sessions are logged
          </div>
          <div className="mono text-xs text-muted-foreground">
            VZA Railway Training System v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
