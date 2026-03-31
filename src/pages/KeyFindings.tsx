import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ArrowLeft, ChevronDown } from "lucide-react";
import scLogo from "@/assets/sc-logo.png";
import { cn } from "@/lib/cn";
import type { Student, Stream } from "@/App";

const COLORS = ["#c0521e", "#e8853d", "#f5a623", "#4ade80", "#38bdf8", "#a78bfa", "#f472b6", "#94a3b8"];
const GREEN = "#22c55e";
const RED = "#ef4444";
const ORANGE = "#f59e0b";
const BLUE = "#3b82f6";

function fmt(n: number) { return n.toLocaleString("en-IN"); }

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[hsl(220,13%,91%)] rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-[hsl(220,20%,14%)]">{title}</h3>
      {children}
    </div>
  );
}

/* Stream Toggle */
function StreamToggle({ stream, onChange }: { stream: Stream; onChange: (s: Stream) => void }) {
  return (
    <div className="flex items-center bg-[hsl(220,14%,96%)] rounded-lg p-0.5">
      {(["MPC", "BIPC"] as Stream[]).map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
            stream === s ? "bg-[hsl(14,80%,42%)] text-white shadow-sm" : "text-[hsl(220,10%,46%)] hover:text-[hsl(220,20%,14%)]")}>
          {s === "BIPC" ? "Bi.P.C" : s}
        </button>
      ))}
    </div>
  );
}

interface Props {
  students: Student[]; stream: Stream; examLabel: string;
  onBack: () => void; onStreamChange: (s: Stream) => void;
}

export default function KeyFindings({ students, stream, examLabel, onBack, onStreamChange }: Props) {
  const [selZone, setSelZone] = useState("");
  const isBIPC = stream === "BIPC";

  const allZones = useMemo(() => [...new Set(students.map((s) => s.ZONE_INCHARGE))].sort(), [students]);
  const data = useMemo(() => selZone ? students.filter((s) => s.ZONE_INCHARGE === selZone) : students, [students, selZone]);

  // Status: marks ≤ 100 or exam ≤ 95 (skip 0 exam)
  const getStatus = (s: Student) => {
    const marksFail = s.MARKS_AVG <= 100;
    const examFail = !isBIPC && s.EXAM_MARKS > 0 && s.EXAM_MARKS <= 95;
    return (marksFail || examFail) ? "Not Met" : "Met";
  };

  // Campus Type
  const campusTypeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) map.set(s.CAMPUS_TYPE, (map.get(s.CAMPUS_TYPE) || 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  // Zone performance
  const zoneData = useMemo(() => {
    const map = new Map<string, { total: number; notMet: number; feeSum: number }>();
    for (const s of data) {
      if (!map.has(s.ZONE_INCHARGE)) map.set(s.ZONE_INCHARGE, { total: 0, notMet: 0, feeSum: 0 });
      const z = map.get(s.ZONE_INCHARGE)!;
      z.total++; z.feeSum += s.FEE_PAID;
      if (getStatus(s) === "Not Met") z.notMet++;
    }
    return [...map.entries()].map(([name, d]) => ({
      name: name.length > 15 ? name.slice(0, 14) + "…" : name, fullName: name,
      total: d.total, met: d.total - d.notMet, notMet: d.notMet,
      notMetPct: Math.round((d.notMet / d.total) * 100),
    })).sort((a, b) => b.total - a.total);
  }, [data]);

  // State
  const stateData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) map.set(s.STATE, (map.get(s.STATE) || 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [data]);

  // Top cities
  const cityData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) map.set(s.CITY_NAME, (map.get(s.CITY_NAME) || 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data]);

  // Fee distribution
  const feeDistData = useMemo(() => {
    const buckets = [
      { name: "₹0", min: 0, max: 0, count: 0 },
      { name: "₹1–999", min: 1, max: 999, count: 0 },
      { name: "₹1K–3K", min: 1000, max: 2999, count: 0 },
      { name: "₹3K–5K", min: 3000, max: 4999, count: 0 },
      { name: "₹5K–10K", min: 5000, max: 9999, count: 0 },
    ];
    for (const s of data) for (const b of buckets) if (s.FEE_PAID >= b.min && s.FEE_PAID <= b.max) { b.count++; break; }
    return buckets.map((b) => ({ name: b.name, students: b.count }));
  }, [data]);

  // Reason
  const reasonData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) map.set(s.REASON || "Unknown", (map.get(s.REASON || "Unknown") || 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  // Met vs Not Met overall
  const metTotal = data.filter((s) => getStatus(s) === "Met").length;
  const notMetTotal = data.filter((s) => getStatus(s) === "Not Met").length;
  const metPieData = [{ name: "Met", value: metTotal }, { name: "Not Met", value: notMetTotal }];

  // Stats
  const totalStudents = data.length;
  const zeroFeePaid = data.filter((s) => s.FEE_PAID === 0).length;
  const avgFeePaid = totalStudents ? Math.round(data.reduce((a, s) => a + s.FEE_PAID, 0) / totalStudents) : 0;
  const avgCourseFee = totalStudents ? Math.round(data.reduce((a, s) => a + s.COURSE_FEE, 0) / totalStudents) : 0;
  const concessionPct = avgCourseFee > 0 ? Math.round(((avgCourseFee - avgFeePaid) / avgCourseFee) * 100) : 0;
  const bestZone = [...zoneData].sort((a, b) => a.notMetPct - b.notMetPct)[0];
  const worstZone = [...zoneData].sort((a, b) => b.notMetPct - a.notMetPct)[0];

  return (
    <div className="min-h-screen bg-[hsl(220,14%,98%)]">
      <header className="bg-white border-b border-[hsl(220,13%,91%)] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-[hsl(14,80%,42%)] hover:underline">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="h-5 w-px bg-[hsl(220,13%,91%)]" />
            <img src={scLogo} alt="SC" className="w-7 h-7 object-contain" />
            <h1 className="font-bold text-[hsl(220,20%,14%)] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Key Findings</h1>
            <StreamToggle stream={stream} onChange={onStreamChange} />
          </div>
          {/* Zone filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(220,10%,46%)]">Zone Incharge:</span>
            <div className="relative">
              <select value={selZone} onChange={(e) => setSelZone(e.target.value)}
                className="appearance-none bg-white border border-[hsl(220,13%,91%)] rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-[hsl(220,20%,14%)] outline-none cursor-pointer">
                <option value="">All ({allZones.length})</option>
                {allZones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(220,10%,46%)] pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {isBIPC && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            <strong>Note:</strong> NEET exam is yet to happen — NEET marks will be populated after results.
          </div>
        )}

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Students", value: fmt(totalStudents), color: "text-[hsl(14,80%,42%)]" },
            { label: "Zero Fee Paid", value: fmt(zeroFeePaid), color: "text-red-600" },
            { label: "Avg Fee Paid", value: `₹${fmt(avgFeePaid)}`, color: "text-[hsl(220,20%,14%)]" },
            { label: "Avg Course Fee", value: `₹${fmt(avgCourseFee)}`, color: "text-[hsl(220,20%,14%)]" },
            { label: "Avg Concession", value: `${concessionPct}%`, color: "text-[hsl(14,80%,42%)]" },
            { label: "Zone Incharges", value: String(zoneData.length), color: "text-[hsl(220,20%,14%)]" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[hsl(220,13%,91%)] rounded-xl p-4">
              <p className={`text-2xl font-bold ${s.color} leading-none`}>{s.value}</p>
              <p className="text-[11px] text-[hsl(220,10%,46%)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Best/Worst */}
        {zoneData.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-800 font-semibold uppercase tracking-wider">Best Performing Zone Incharge</p>
              <p className="text-lg font-bold text-green-700 mt-1">{bestZone?.fullName}</p>
              <p className="text-xs text-green-600 mt-0.5">{bestZone?.total} students · Only {bestZone?.notMetPct}% Not Met</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-800 font-semibold uppercase tracking-wider">Needs Attention — Highest Not Met %</p>
              <p className="text-lg font-bold text-red-700 mt-1">{worstZone?.fullName}</p>
              <p className="text-xs text-red-600 mt-0.5">{worstZone?.total} students · {worstZone?.notMetPct}% Not Met</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Met vs Not Met Pie */}
          <Card title="Overall — Met vs Not Met">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={metPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  <Cell fill={GREEN} />
                  <Cell fill={RED} />
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Campus Type Pie */}
          <Card title="Students by Campus Type">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={campusTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {campusTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Zone — Met vs Not Met */}
          {!selZone && (
            <Card title="Zone Incharge — Met vs Not Met">
              <ResponsiveContainer width="100%" height={Math.max(300, zoneData.length * 28)}>
                <BarChart data={zoneData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, name: string) => [v, name === "met" ? "Met" : "Not Met"]} />
                  <Bar dataKey="met" stackId="a" fill={GREEN} name="met" />
                  <Bar dataKey="notMet" stackId="a" fill={RED} name="notMet" radius={[0, 4, 4, 0]} />
                  <Legend formatter={(v) => v === "met" ? "Met" : "Not Met"} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Top Cities */}
          <Card title="Top 10 Cities by Student Count">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
                <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Fee Distribution */}
          <Card title="Fee Paid Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feeDistData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
                <Bar dataKey="students" fill={ORANGE} radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Reason */}
          <Card title="Concession Reason Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {reasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* State */}
          <Card title="Students by State">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stateData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </main>
    </div>
  );
}
