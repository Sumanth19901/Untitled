import { useState } from "react";
import { LoginScreen, User, UserRole } from "./components/LoginScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { TrainerDashboard } from "./components/TrainerDashboard";
import { TraineeDashboard } from "./components/TraineeDashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("vza_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load user from localStorage", e);
      return null;
    }
  });

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("vza_user", JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("vza_user");
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (!user) return;
    const mockDetails = {
      admin: { id: "ADM-001", username: "admin001", fullName: "System Administrator" },
      trainer: { id: "TRN-001", username: "trainer01", fullName: "M. Chen" },
      trainee: { id: "TRE-001", username: "trainee01", fullName: "A. Kumar" }
    };
    const updatedUser = {
      ...user,
      role: newRole,
      id: mockDetails[newRole].id,
      username: mockDetails[newRole].username,
      fullName: mockDetails[newRole].fullName
    };
    setUser(updatedUser);
    localStorage.setItem("vza_user", JSON.stringify(updatedUser));
  };

  // Show login screen if no user is logged in
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "admin":
      return <AdminDashboard user={user} onLogout={handleLogout} onRoleChange={handleRoleChange} />;
    case "trainer":
      return <TrainerDashboard user={user} onLogout={handleLogout} onRoleChange={handleRoleChange} />;
    case "trainee":
      return <TraineeDashboard user={user} onLogout={handleLogout} onRoleChange={handleRoleChange} />;
    default:
      return <LoginScreen onLogin={handleLogin} />;
  }
}
