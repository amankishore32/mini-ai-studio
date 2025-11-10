import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./components/Auth";
import Studio from "./components/Studio";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return <Studio user={user} onLogout={handleLogout} />;
}
