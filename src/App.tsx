import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import KeyFindings from "./pages/KeyFindings";

export default function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("sc_auth") === "1"
  );
  const [view, setView] = useState<"dashboard" | "findings">("dashboard");

  const login = () => {
    sessionStorage.setItem("sc_auth", "1");
    setAuthed(true);
  };

  const logout = () => {
    sessionStorage.removeItem("sc_auth");
    setAuthed(false);
    setView("dashboard");
  };

  if (!authed) return <LoginPage onLogin={login} />;
  if (view === "findings") return <KeyFindings onBack={() => setView("dashboard")} />;
  return <Dashboard onLogout={logout} onKeyFindings={() => setView("findings")} />;
}
