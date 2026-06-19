import { useState } from "react";
import { LoginScreen, User } from "./components/LoginScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { TrainerDashboard } from "./components/TrainerDashboard";
import { TraineeDashboard } from "./components/TraineeDashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Show login screen if no user is logged in
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "admin":
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    case "trainer":
      return <TrainerDashboard user={user} onLogout={handleLogout} />;
    case "trainee":
      return <TraineeDashboard user={user} onLogout={handleLogout} />;
    default:
      return <LoginScreen onLogin={handleLogin} />;
  }
}
