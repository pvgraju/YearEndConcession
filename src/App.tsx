import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("sc_auth") === "1"
  );

  const login = () => {
    sessionStorage.setItem("sc_auth", "1");
    setAuthed(true);
  };

  const logout = () => {
    sessionStorage.removeItem("sc_auth");
    setAuthed(false);
  };

  if (!authed) return <LoginPage onLogin={login} />;
  return <Dashboard onLogout={logout} />;
}
