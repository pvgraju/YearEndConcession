import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import KeyFindings from "./pages/KeyFindings";
import mpcData from "./data/mpc.json";
import bipcData from "./data/bipc.json";

export type Stream = "MPC" | "BIPC";

export interface Student {
  STATE: string; CITY_NAME: string; CAMPUS_NAME: string; CAMPUS_TYPE: string;
  ZONE_INCHARGE: string; ADM_NO: number; NAME: string; SURNAME: string;
  PARENT_NAME: string; MOBILE_NO: number | string; STREAM: string;
  PROGRAM_NAME: string; COURSE_TRACK: string; MARKS_AVG: number;
  EXAM_MARKS: number; COURSE_FEE: number; FEE_PAID: number;
  SPONSORED_BY: string; REASON: string; REASON_DESCRIPTION: string;
}

const DATA: Record<Stream, Student[]> = {
  MPC: mpcData as Student[],
  BIPC: bipcData as Student[],
};

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("sc_auth") === "1");
  const [view, setView] = useState<"dashboard" | "findings">("dashboard");
  const [stream, setStream] = useState<Stream>("MPC");

  const login = () => { sessionStorage.setItem("sc_auth", "1"); setAuthed(true); };
  const logout = () => { sessionStorage.removeItem("sc_auth"); setAuthed(false); setView("dashboard"); };

  if (!authed) return <LoginPage onLogin={login} />;

  const students = DATA[stream];
  const examLabel = stream === "MPC" ? "JEE Mains" : "NEET";

  if (view === "findings") return (
    <KeyFindings students={students} stream={stream} examLabel={examLabel}
      onBack={() => setView("dashboard")} onStreamChange={setStream} />
  );

  return (
    <Dashboard students={students} stream={stream} examLabel={examLabel}
      onLogout={logout} onKeyFindings={() => setView("findings")} onStreamChange={setStream} />
  );
}
