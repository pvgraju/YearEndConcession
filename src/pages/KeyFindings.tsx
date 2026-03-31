import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import scLogo from "@/assets/sc-logo.png";
import rawData from "@/data/students.json";

interface Student {
  STATE: string; CITY_NAME: string; CAMPUS_NAME: string; CAMPUS_TYPE: string;
  ZONE_INCHARGE: string; ADM_NO: number; NAME: string; SURNAME: string;
  PARENT_NAME: string; MOBILE_NO: number | string; STREAM: string; PROGRAM_NAME: string;
  COURSE_TRACK: string;
  MARKS_AVG: number; JEE_MAINS_MARKS: number; COURSE_FEE: number;
  FEE_PAID: number; SPONSORED_BY: string; REASON: string; REASON_DESCRIPTION: string;
}

const students: Student[] = rawData as Student[];

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

export default function KeyFindings({ onBack }: { onBack: () => void }) {
  // 1. Campus Type breakdown (Residential vs Dayscholar)
  const campusTypeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      map.set(s.CAMPUS_TYPE, (map.get(s.CAMPUS_TYPE) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, []);

  // 2. Zone Incharge performance — who has most concession students & what % are Not Met
  const zoneData = useMemo(() => {
    const map = new Map<string, { total: number; notMet: number; feePaidSum: number }>();
    for (const s of students) {
      if (!map.has(s.ZONE_INCHARGE)) map.set(s.ZONE_INCHARGE, { total: 0, notMet: 0, feePaidSum: 0 });
      const z = map.get(s.ZONE_INCHARGE)!;
      z.total++;
      z.feePaidSum += s.FEE_PAID;
      // Not Met: marks <= 100 OR jee <= 95 (skip 0 JEE)
      const marksFail = s.MARKS_AVG <= 100;
      const jeeFail = s.JEE_MAINS_MARKS > 0 && s.JEE_MAINS_MARKS <= 95;
      if (marksFail || jeeFail) z.notMet++;
    }
    return [...map.entries()].map(([name, d]) => ({
      name: name.length > 15 ? name.slice(0, 14) + "…" : name,
      fullName: name,
      total: d.total,
      met: d.total - d.notMet,
      notMet: d.notMet,
      avgFeePaid: Math.round(d.feePaidSum / d.total),
      notMetPct: Math.round((d.notMet / d.total) * 100),
    })).sort((a, b) => b.total - a.total);
  }, []);

  // 3. State-level split
  const stateData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) map.set(s.STATE, (map.get(s.STATE) || 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, []);

  // 4. Top 10 cities by student count
  const cityData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) map.set(s.CITY_NAME, (map.get(s.CITY_NAME) || 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, []);

  // 5. Fee Paid distribution
  const feeDistData = useMemo(() => {
    const buckets = [
      { name: "₹0", min: 0, max: 0, count: 0 },
      { name: "₹1–999", min: 1, max: 999, count: 0 },
      { name: "₹1K–3K", min: 1000, max: 2999, count: 0 },
      { name: "₹3K–5K", min: 3000, max: 4999, count: 0 },
      { name: "₹5K–10K", min: 5000, max: 9999, count: 0 },
    ];
    for (const s of students) {
      for (const b of buckets) {
        if (s.FEE_PAID >= b.min && s.FEE_PAID <= b.max) { b.count++; break; }
      }
    }
    return buckets.map((b) => ({ name: b.name, students: b.count }));
  }, []);

  // 6. Reason breakdown
  const reasonData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      const r = s.REASON || "Unknown";
      map.set(r, (map.get(r) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, []);

  // Key stats
  const totalStudents = students.length;
  const zeroFeePaid = students.filter((s) => s.FEE_PAID === 0).length;
  const avgFeePaid = Math.round(students.reduce((a, s) => a + s.FEE_PAID, 0) / totalStudents);
  const avgCourseFee = Math.round(students.reduce((a, s) => a + s.COURSE_FEE, 0) / totalStudents);
  const concessionPct = Math.round(((avgCourseFee - avgFeePaid) / avgCourseFee) * 100);
  const bestZone = [...zoneData].sort((a, b) => a.notMetPct - b.notMetPct)[0];
  const worstZone = [...zoneData].sort((a, b) => b.notMetPct - a.notMetPct)[0];

  return (
    <div className="min-h-screen bg-[hsl(220,14%,98%)]">
      <header className="bg-white border-b border-[hsl(220,13%,91%)] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-[hsl(14,80%,42%)] hover:underline">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div className="h-5 w-px bg-[hsl(220,13%,91%)]" />
            <img src={scLogo} alt="SC" className="w-7 h-7 object-contain" />
            <h1 className="font-bold text-[hsl(220,20%,14%)] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Key Findings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Top-level stats */}
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

        {/* Best & Worst Zone Incharge */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Zone Incharge — Met vs Not Met */}
          <Card title="Zone Incharge — Met vs Not Met (all students)">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={zoneData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, name: string) => [v, name === "met" ? "Met" : "Not Met"]} />
                <Bar dataKey="met" stackId="a" fill={GREEN} name="met" radius={[0, 0, 0, 0]} />
                <Bar dataKey="notMet" stackId="a" fill={RED} name="notMet" radius={[0, 4, 4, 0]} />
                <Legend formatter={(v) => v === "met" ? "Met" : "Not Met"} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Campus Type Pie */}
          <Card title="Students by Campus Type">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={campusTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {campusTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top 10 Cities */}
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

          {/* Fee Paid Distribution */}
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

          {/* State Split */}
          <Card title="Students by State">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stateData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [fmt(v), "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Reason Breakdown */}
          <Card title="Concession Reason Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {reasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
