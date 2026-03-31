import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LogOut, Users, AlertTriangle, GraduationCap,
  ChevronDown, ChevronRight, ChevronLeft, X, FileText, Search,
} from "lucide-react";
import scLogo from "@/assets/sc-logo.png";
import rawData from "@/data/students.json";
import { cn } from "@/lib/cn";

interface Student {
  STATE: string; CITY_NAME: string; CAMPUS_NAME: string; CAMPUS_TYPE: string;
  ZONE_INCHARGE: string; ADM_NO: number; NAME: string; SURNAME: string;
  MOBILE_NO: number | string; STREAM: string; PROGRAM_NAME: string;
  MARKS_AVG: number; JEE_MAINS_MARKS: number; COURSE_FEE: number;
  FEE_PAID: number; SPONSORED_BY: string; REASON: string; REASON_DESCRIPTION: string;
}

interface GroupRow {
  key: string;
  state: string; city: string; campus: string; zone: string; program: string;
  total: number; lowMarks: number; jeeFail: number; met: number; notMet: number;
  students: Student[];
}

const students: Student[] = rawData as Student[];
const PAGE_SIZE = 20;

const FEE_OPTIONS = [
  { label: "All", value: Infinity },
  { label: "= 0", value: 0 },
  { label: "< 1,000", value: 1000 },
  { label: "< 5,000", value: 5000 },
  { label: "< 10,000", value: 10000 },
];

/* Column tooltips */
const COL_TIPS: Record<string, string> = {
  state: "State where the campus is located",
  city: "City of the campus",
  campus: "Campus name",
  zone: "Zone Incharge responsible for this campus",
  program: "Student program (e.g. SR_MPC_LEO, SR_ICON_CIPL)",
  total: "Total concession students in this group matching all filters",
  lowMarks: "Students with Marks Avg ≤ threshold — low academic performance despite concession",
  jeeFail: "Students with JEE Mains ≤ threshold — did not meet JEE criteria despite concession",
  met: "Students who meet all active academic criteria — concession appears justified",
  notMet: "Students who failed one or more criteria — priority for review",
};

/* ------------------------------------------------------------------ */
/*  Multi-select dropdown                                              */
/* ------------------------------------------------------------------ */
function MultiSelect({ selected, onChange, options, placeholder, searchable }: {
  selected: string[]; onChange: (v: string[]) => void; options: string[];
  placeholder: string; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isAll = selected.length === 0;
  const isSearching = searchable && search.length > 0;
  const vis = isSearching ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options;

  const toggle = (val: string) => {
    if (isAll || isSearching) {
      if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
      else onChange([...selected, val]);
    } else if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      const next = [...selected, val];
      onChange(next.length === options.length ? [] : next);
    }
  };

  const label = isAll ? `${placeholder} (${options.length})` : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className={cn("flex items-center justify-between w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors cursor-pointer",
          isAll ? "bg-surface border-edge text-ink-muted" : "bg-surface-card border-brand/40 text-ink")}>
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className="text-ink-light ml-2 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-surface-card border border-edge rounded-lg shadow-lg overflow-hidden">
          {searchable && (
            <div className="px-2 py-2 border-b border-edge">
              <div className="flex items-center gap-1.5 bg-surface border border-edge rounded-md px-2 py-1.5">
                <Search size={13} className="text-ink-light shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search..." autoFocus
                  className="w-full text-xs text-ink bg-transparent outline-none placeholder:text-ink-light" />
              </div>
            </div>
          )}
          <div className="max-h-52 overflow-y-auto scrollbar-thin">
            {!search && (
              <label className="flex items-center gap-2 px-3 py-2 hover:bg-surface-muted cursor-pointer border-b border-edge">
                <input type="checkbox" checked={isAll} onChange={() => onChange([])} className="w-3.5 h-3.5 rounded accent-[hsl(14,80%,42%)]" />
                <span className="text-xs font-semibold text-ink">All ({options.length})</span>
              </label>
            )}
            {vis.map((o) => (
              <label key={o} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-muted cursor-pointer">
                <input type="checkbox" checked={isSearching ? selected.includes(o) : (isAll || selected.includes(o))} onChange={() => toggle(o)}
                  className="w-3.5 h-3.5 rounded accent-[hsl(14,80%,42%)]" />
                <span className="text-xs text-ink">{o}</span>
              </label>
            ))}
            {vis.length === 0 && <p className="text-xs text-ink-muted px-3 py-3 text-center">No matches</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip header cell                                                */
/* ------------------------------------------------------------------ */
function Th({ children, tip, className: cls }: { children: React.ReactNode; tip: string; className?: string }) {
  return (
    <th title={tip} className={cn("px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider cursor-help", cls)}>
      {children}
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, icon: Icon, color, tooltip }: {
  label: string; value: number; icon: typeof Users; color: string; tooltip: string;
}) {
  return (
    <div className="relative group bg-surface-card border border-edge rounded-xl p-4 flex items-center gap-3 cursor-default">
      <div className={cn("rounded-lg p-2.5", color)}><Icon size={18} className="text-white" /></div>
      <div>
        <p className="text-2xl font-bold text-ink leading-none">{value.toLocaleString("en-IN")}</p>
        <p className="text-[11px] text-ink-muted mt-0.5">{label}</p>
      </div>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-ink text-white text-xs leading-snug p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-lg">{tooltip}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
export default function Dashboard({ onLogout, onKeyFindings }: { onLogout: () => void; onKeyFindings: () => void }) {
  const [selStates, setSelStates] = useState<string[]>([]);
  const [selCities, setSelCities] = useState<string[]>([]);
  const [selZones, setSelZones] = useState<string[]>([]);
  const [selCampuses, setSelCampuses] = useState<string[]>([]);
  const [feeFilter, setFeeFilter] = useState<number>(1000);
  const [marksLte, setMarksLte] = useState<number>(100);
  const [jeeLte, setJeeLte] = useState<number>(95);
  const [skipZeroMarks, setSkipZeroMarks] = useState(false);
  const [skipZeroJEE, setSkipZeroJEE] = useState(true);
  const [ignoreMarks, setIgnoreMarks] = useState(false);
  const [ignoreJEE, setIgnoreJEE] = useState(false);

  const [detailGroup, setDetailGroup] = useState<GroupRow | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailStatus, setDetailStatus] = useState<"all" | "met" | "notmet">("all");

  const fmt = (n: number) => n.toLocaleString("en-IN");

  // Cascading options
  const states = useMemo(() => [...new Set(students.map((s) => s.STATE))].sort(), []);
  const cities = useMemo(() => {
    const pool = selStates.length > 0 ? students.filter((s) => selStates.includes(s.STATE)) : students;
    return [...new Set(pool.map((s) => s.CITY_NAME))].sort();
  }, [selStates]);
  const campuses = useMemo(() => {
    let pool = students as Student[];
    if (selStates.length > 0) pool = pool.filter((s) => selStates.includes(s.STATE));
    if (selCities.length > 0) pool = pool.filter((s) => selCities.includes(s.CITY_NAME));
    return [...new Set(pool.map((s) => s.CAMPUS_NAME))].sort();
  }, [selStates, selCities]);
  const zones = useMemo(() => {
    let pool = students as Student[];
    if (selStates.length > 0) pool = pool.filter((s) => selStates.includes(s.STATE));
    if (selCities.length > 0) pool = pool.filter((s) => selCities.includes(s.CITY_NAME));
    if (selCampuses.length > 0) pool = pool.filter((s) => selCampuses.includes(s.CAMPUS_NAME));
    return [...new Set(pool.map((s) => s.ZONE_INCHARGE))].sort();
  }, [selStates, selCities, selCampuses]);

  // Status helpers
  const isLowMarks = (s: Student) => { if (ignoreMarks) return false; if (skipZeroMarks && s.MARKS_AVG === 0) return false; return s.MARKS_AVG <= marksLte; };
  const isJEEFail = (s: Student) => { if (ignoreJEE) return false; if (skipZeroJEE && s.JEE_MAINS_MARKS === 0) return false; return s.JEE_MAINS_MARKS <= jeeLte; };
  const getStatus = (s: Student) => (isLowMarks(s) || isJEEFail(s)) ? "Not Met" : "Met";

  // Filtered
  const filtered = useMemo(() => {
    let pool = students as Student[];
    if (selStates.length > 0) pool = pool.filter((s) => selStates.includes(s.STATE));
    if (selCities.length > 0) pool = pool.filter((s) => selCities.includes(s.CITY_NAME));
    if (selZones.length > 0) pool = pool.filter((s) => selZones.includes(s.ZONE_INCHARGE));
    if (selCampuses.length > 0) pool = pool.filter((s) => selCampuses.includes(s.CAMPUS_NAME));
    if (feeFilter !== Infinity) {
      pool = feeFilter === 0 ? pool.filter((s) => s.FEE_PAID === 0) : pool.filter((s) => s.FEE_PAID < feeFilter);
    }
    return pool;
  }, [selStates, selCities, selZones, selCampuses, feeFilter]);

  // Grouped rows: State + City + Campus + Zone Incharge + Program
  const groupRows = useMemo((): GroupRow[] => {
    const map = new Map<string, Student[]>();
    for (const s of filtered) {
      const key = `${s.STATE}||${s.CITY_NAME}||${s.CAMPUS_NAME}||${s.ZONE_INCHARGE}||${s.PROGRAM_NAME}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()].map(([key, list]) => {
      const f = list[0];
      return {
        key, state: f.STATE, city: f.CITY_NAME, campus: f.CAMPUS_NAME, zone: f.ZONE_INCHARGE, program: f.PROGRAM_NAME,
        total: list.length, lowMarks: list.filter(isLowMarks).length, jeeFail: list.filter(isJEEFail).length,
        met: list.filter((s) => getStatus(s) === "Met").length, notMet: list.filter((s) => getStatus(s) === "Not Met").length,
        students: list.sort((a, b) => a.FEE_PAID - b.FEE_PAID),
      };
    }).sort((a, b) => b.notMet - a.notMet || b.total - a.total);
  }, [filtered, marksLte, jeeLte, skipZeroMarks, skipZeroJEE, ignoreMarks, ignoreJEE]);

  const totalRecords = students.length;
  const filteredCount = filtered.length;
  const totalLowMarks = groupRows.reduce((a, g) => a + g.lowMarks, 0);
  const totalJeeFail = groupRows.reduce((a, g) => a + g.jeeFail, 0);
  const totalMet = groupRows.reduce((a, g) => a + g.met, 0);
  const totalNotMet = groupRows.reduce((a, g) => a + g.notMet, 0);

  const clearFilters = () => {
    setSelStates([]); setSelCities([]); setSelZones([]); setSelCampuses([]);
    setFeeFilter(1000); setMarksLte(100); setJeeLte(95);
    setSkipZeroMarks(false); setSkipZeroJEE(true); setIgnoreMarks(false); setIgnoreJEE(false); setDetailGroup(null);
  };
  const hasFilters = selStates.length > 0 || selCities.length > 0 || selZones.length > 0 || selCampuses.length > 0 || feeFilter !== 1000 || marksLte !== 100 || jeeLte !== 95;

  const colCount = 9 + (ignoreMarks ? 0 : 1) + (ignoreJEE ? 0 : 1);

  // Detail pagination
  const detailAllStudents = detailGroup?.students || [];
  const detailStudents = detailStatus === "all" ? detailAllStudents
    : detailStatus === "met" ? detailAllStudents.filter((s) => getStatus(s) === "Met")
    : detailAllStudents.filter((s) => getStatus(s) === "Not Met");
  const detailMetCount = detailAllStudents.filter((s) => getStatus(s) === "Met").length;
  const detailNotMetCount = detailAllStudents.filter((s) => getStatus(s) === "Not Met").length;
  const detailTotalPages = Math.max(1, Math.ceil(detailStudents.length / PAGE_SIZE));
  const detailSafePage = Math.min(detailPage, detailTotalPages);
  const detailPageData = detailStudents.slice((detailSafePage - 1) * PAGE_SIZE, detailSafePage * PAGE_SIZE);

  /* ================================================================ */
  /*  DETAIL VIEW                                                      */
  /* ================================================================ */
  if (detailGroup) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="bg-surface-card border-b border-edge sticky top-0 z-30">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setDetailGroup(null)} className="flex items-center gap-1 text-sm text-brand hover:underline">
                <ChevronLeft size={16} /> Back
              </button>
              <div className="h-5 w-px bg-edge" />
              <img src={scLogo} alt="SC" className="w-7 h-7 object-contain" />
              <div>
                <p className="text-sm font-semibold text-ink">{detailGroup.campus}</p>
                <p className="text-[11px] text-ink-muted">{detailGroup.state} · {detailGroup.city} · {detailGroup.program} · <strong className="text-ink">{detailGroup.zone}</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span>Total: <strong className="text-brand">{detailGroup.total}</strong></span>
              {!ignoreMarks && <span>Low Marks: <strong className="text-status-warning">{detailGroup.lowMarks}</strong></span>}
              {!ignoreJEE && <span>JEE Not Met: <strong className="text-status-danger">{detailGroup.jeeFail}</strong></span>}
              <span>Met: <strong className="text-status-success">{detailGroup.met}</strong></span>
              <span>Not Met: <strong className="text-red-600">{detailGroup.notMet}</strong></span>
            </div>
          </div>
        </header>

        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-4">
          <section className="bg-surface-card border border-edge rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-edge flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-muted">{fmt(detailStudents.length)} students · Page {detailSafePage} of {detailTotalPages}</span>
                {/* Status filter pills */}
                <div className="flex items-center bg-surface-muted rounded-lg p-0.5">
                  {(["all", "met", "notmet"] as const).map((s) => (
                    <button key={s} onClick={() => { setDetailStatus(s); setDetailPage(1); }}
                      className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                        detailStatus === s
                          ? s === "notmet" ? "bg-red-50 text-red-600 shadow-sm"
                            : s === "met" ? "bg-green-50 text-status-success shadow-sm"
                            : "bg-surface-card text-ink shadow-sm"
                          : "text-ink-muted hover:text-ink"
                      )}>
                      {s === "all" ? `All (${fmt(detailAllStudents.length)})` : s === "met" ? `Met (${fmt(detailMetCount)})` : `Not Met (${fmt(detailNotMetCount)})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setDetailPage(1)} disabled={detailSafePage <= 1} className="px-2 py-1 text-[11px] rounded hover:bg-surface-muted disabled:opacity-30 text-ink-muted">First</button>
                <button onClick={() => setDetailPage((p) => Math.max(1, p - 1))} disabled={detailSafePage <= 1} className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"><ChevronLeft size={14} className="text-ink" /></button>
                <span className="text-xs text-ink font-medium px-2">{detailSafePage} / {detailTotalPages}</span>
                <button onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))} disabled={detailSafePage >= detailTotalPages} className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"><ChevronRight size={14} className="text-ink" /></button>
                <button onClick={() => setDetailPage(detailTotalPages)} disabled={detailSafePage >= detailTotalPages} className="px-2 py-1 text-[11px] rounded hover:bg-surface-muted disabled:opacity-30 text-ink-muted">Last</button>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-muted border-b border-edge text-[10px] font-semibold text-ink-muted uppercase">
                    <Th tip="Full name of the student" className="text-left">Name</Th>
                    <Th tip="Admission number — unique student ID" className="text-left">Adm No</Th>
                    <Th tip="Student or parent mobile number" className="text-left">Mobile</Th>
                    <Th tip="Total course fee before concession" className="text-right">Course Fee</Th>
                    <Th tip="Actual fee paid by the student after concession" className="text-right">Fee Paid</Th>
                    {!ignoreMarks && <Th tip={`Average marks scored — red if ≤ ${marksLte}`} className="text-right">Marks Avg</Th>}
                    {!ignoreJEE && <Th tip={`JEE Mains score — red if ≤ ${jeeLte}`} className="text-right">JEE Mains</Th>}
                    <Th tip="Met = meets all criteria · Not Met = failed one or more" className="text-center">Status</Th>
                    <Th tip="Reason for the concession given" className="text-left">Reason</Th>
                    <Th tip="Detailed description of the concession reason" className="text-left">Description</Th>
                    <Th tip="Who sponsored / approved the concession" className="text-left">Sponsored By</Th>
                  </tr>
                </thead>
                <tbody>
                  {detailPageData.map((s) => {
                    const marksBad = !ignoreMarks && (() => { if (skipZeroMarks && s.MARKS_AVG === 0) return false; return s.MARKS_AVG <= marksLte; })();
                    const jeeBad = !ignoreJEE && (() => { if (skipZeroJEE && s.JEE_MAINS_MARKS === 0) return false; return s.JEE_MAINS_MARKS <= jeeLte; })();
                    const status = getStatus(s);
                    return (
                      <tr key={s.ADM_NO} className="border-b border-edge/30 hover:bg-surface-muted/40">
                        <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">{s.NAME} {s.SURNAME}</td>
                        <td className="px-3 py-2.5 text-ink-muted tabular-nums">{s.ADM_NO}</td>
                        <td className="px-3 py-2.5 text-ink-muted tabular-nums">{s.MOBILE_NO}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink">{fmt(s.COURSE_FEE)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-ink">{fmt(s.FEE_PAID)}</td>
                        {!ignoreMarks && <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", marksBad ? "text-status-danger" : "text-ink")}>{s.MARKS_AVG}</td>}
                        {!ignoreJEE && <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", jeeBad ? "text-status-danger" : "text-ink")}>{s.JEE_MAINS_MARKS}</td>}
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            status === "Not Met" ? "bg-red-50 text-red-600" : "bg-green-50 text-status-success")}>{status}</span>
                        </td>
                        <td className="px-3 py-2.5 text-ink max-w-[100px] truncate" title={s.REASON}>{s.REASON || "—"}</td>
                        <td className="px-3 py-2.5 text-ink max-w-[140px] truncate" title={s.REASON_DESCRIPTION}>{s.REASON_DESCRIPTION || "—"}</td>
                        <td className="px-3 py-2.5 text-ink">{s.SPONSORED_BY || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-edge flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                Showing {detailStudents.length === 0 ? 0 : (detailSafePage - 1) * PAGE_SIZE + 1}–{Math.min(detailSafePage * PAGE_SIZE, detailStudents.length)} of {fmt(detailStudents.length)}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setDetailPage(1)} disabled={detailSafePage <= 1} className="px-2 py-1 text-[11px] rounded hover:bg-surface-muted disabled:opacity-30 text-ink-muted">First</button>
                <button onClick={() => setDetailPage((p) => Math.max(1, p - 1))} disabled={detailSafePage <= 1} className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"><ChevronLeft size={14} className="text-ink" /></button>
                <span className="text-xs text-ink font-medium px-2">{detailSafePage} / {detailTotalPages}</span>
                <button onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))} disabled={detailSafePage >= detailTotalPages} className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"><ChevronRight size={14} className="text-ink" /></button>
                <button onClick={() => setDetailPage(detailTotalPages)} disabled={detailSafePage >= detailTotalPages} className="px-2 py-1 text-[11px] rounded hover:bg-surface-muted disabled:opacity-30 text-ink-muted">Last</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ================================================================ */
  /*  HOME VIEW                                                        */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-card border-b border-edge sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={scLogo} alt="SC" className="w-8 h-8 object-contain" />
            <h1 className="font-display text-base font-bold text-ink leading-none">Year End Concession Review for MPC Students (2025-26)</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onKeyFindings} className="flex items-center gap-1.5 text-xs font-medium text-brand hover:underline transition-colors">
              Key Findings
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-status-danger transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 leading-relaxed space-y-0.5">
              <p className="font-semibold text-blue-900 text-[13px]">Data Criteria</p>
              <p>Class Group = <strong>Inter 2</strong> · Student Status = <strong>Current</strong> · Fee Paid &lt; <strong>10,000</strong></p>
              <p className="text-blue-600 mt-1">Only active Inter-2 students who received high concessions (very low fee paid).</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-surface-card border border-edge rounded-xl px-4 py-3 flex items-center gap-2">
            <Users size={16} className="text-brand" />
            <span className="text-sm text-ink">Total: <strong>{fmt(totalRecords)}</strong></span>
          </div>
          <div className="bg-surface-card border border-edge rounded-xl px-4 py-3 flex items-center gap-2">
            <Users size={16} className="text-status-success" />
            <span className="text-sm text-ink">Filtered: <strong className="text-brand">{fmt(filteredCount)}</strong></span>
          </div>
        </div>

        <section className="bg-surface-card border border-edge rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Filters</h2>
            {hasFilters && <button onClick={clearFilters} className="text-[11px] text-brand hover:underline flex items-center gap-1"><X size={12} /> Reset all</button>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MultiSelect selected={selStates} onChange={(v) => { setSelStates(v); setSelCities([]); setSelCampuses([]); setSelZones([]); }} options={states} placeholder="State" />
            <MultiSelect selected={selCities} onChange={(v) => { setSelCities(v); setSelCampuses([]); setSelZones([]); }} options={cities} placeholder="City" searchable />
            <MultiSelect selected={selCampuses} onChange={(v) => { setSelCampuses(v); setSelZones([]); }} options={campuses} placeholder="Campus" searchable />
            <MultiSelect selected={selZones} onChange={(v) => { setSelZones(v); }} options={zones} placeholder="Zone Incharge" searchable />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Fee Paid</span>
              <select value={feeFilter} onChange={(e) => setFeeFilter(Number(e.target.value))}
                className="bg-surface-card border border-edge rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand cursor-pointer">
                {FEE_OPTIONS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="h-5 w-px bg-edge" />
            <div className={cn("flex items-center gap-2", ignoreMarks && "opacity-40")}>
              <span className="text-xs text-ink-muted whitespace-nowrap">Marks Avg ≤</span>
              <input type="number" value={marksLte} min={0} max={360} disabled={ignoreMarks} onChange={(e) => setMarksLte(Number(e.target.value) || 0)}
                className="w-16 bg-surface-card border border-edge rounded-lg px-2 py-1.5 text-xs text-ink outline-none focus:border-brand tabular-nums text-center disabled:cursor-not-allowed" />
            </div>
            <div className="h-5 w-px bg-edge" />
            <div className={cn("flex items-center gap-2", ignoreJEE && "opacity-40")}>
              <span className="text-xs text-ink-muted whitespace-nowrap">JEE Mains ≤</span>
              <input type="number" value={jeeLte} min={0} max={100} disabled={ignoreJEE} onChange={(e) => setJeeLte(Number(e.target.value) || 0)}
                className="w-16 bg-surface-card border border-edge rounded-lg px-2 py-1.5 text-xs text-ink outline-none focus:border-brand tabular-nums text-center disabled:cursor-not-allowed" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={ignoreMarks} onChange={(e) => setIgnoreMarks(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)]" />
              <span className="text-xs text-ink-muted"><strong className="text-ink">Ignore Marks Avg</strong> completely</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={ignoreJEE} onChange={(e) => setIgnoreJEE(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)]" />
              <span className="text-xs text-ink-muted"><strong className="text-ink">Ignore JEE Mains</strong> completely</span>
            </label>
            <div className="h-5 w-px bg-edge" />
            <label className={cn("flex items-center gap-2 cursor-pointer select-none", ignoreMarks && "opacity-40")}>
              <input type="checkbox" checked={skipZeroMarks} disabled={ignoreMarks} onChange={(e) => setSkipZeroMarks(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)] disabled:cursor-not-allowed" />
              <span className="text-xs text-ink-muted">Skip <strong className="text-ink">0 Marks</strong> (didn't take exam)</span>
            </label>
            <label className={cn("flex items-center gap-2 cursor-pointer select-none", ignoreJEE && "opacity-40")}>
              <input type="checkbox" checked={skipZeroJEE} disabled={ignoreJEE} onChange={(e) => setSkipZeroJEE(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)] disabled:cursor-not-allowed" />
              <span className="text-xs text-ink-muted">Skip <strong className="text-ink">0 JEE</strong> (didn't appear)</span>
            </label>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={filteredCount} icon={Users} color="bg-brand"
            tooltip="Total number of concession students matching your location and fee filters. These are students with very low fee paid relative to course fee." />
          {!ignoreMarks && <StatCard label="Low Marks" value={totalLowMarks} icon={AlertTriangle} color="bg-status-warning"
            tooltip={`Students whose Marks Average is ≤ ${marksLte}. These students received high concession but are performing below the academic threshold.${skipZeroMarks ? " Students with 0 marks (didn't take exam) are excluded." : ""}`} />}
          {!ignoreJEE && <StatCard label="JEE Not Met" value={totalJeeFail} icon={GraduationCap} color="bg-status-danger"
            tooltip={`Students whose JEE Mains score is ≤ ${jeeLte}. These students received concession but did not meet the JEE performance criteria.${skipZeroJEE ? " Students with 0 JEE marks (didn't appear) are excluded." : ""}`} />}
          <StatCard label="Met" value={totalMet} icon={Users} color="bg-status-success"
            tooltip="Students who meet all active academic criteria (marks and/or JEE thresholds). Their concession appears justified by performance." />
          <StatCard label="Not Met" value={totalNotMet} icon={AlertTriangle} color="bg-red-600"
            tooltip="Students who failed to meet one or more academic criteria. These are high-concession students with low academic performance — priority for review." />
        </section>

        <section className="bg-surface-card border border-edge rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-edge">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Breakdown <span className="font-normal normal-case text-ink-light">({groupRows.length} groups · {fmt(filteredCount)} students · click row to view details)</span>
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted border-b border-edge">
                  <th className="w-8 px-2"></th>
                  <Th tip={COL_TIPS.state} className="text-left">State</Th>
                  <Th tip={COL_TIPS.city} className="text-left">City</Th>
                  <Th tip={COL_TIPS.campus} className="text-left">Campus</Th>
                  <Th tip={COL_TIPS.zone} className="text-left">Zone Incharge</Th>
                  <Th tip={COL_TIPS.program} className="text-left">Program</Th>
                  <Th tip={COL_TIPS.total} className="text-center">Total</Th>
                  {!ignoreMarks && <Th tip={COL_TIPS.lowMarks} className="text-center">Low Marks</Th>}
                  {!ignoreJEE && <Th tip={COL_TIPS.jeeFail} className="text-center">JEE Not Met</Th>}
                  <Th tip={COL_TIPS.met} className="text-center">Met</Th>
                  <Th tip={COL_TIPS.notMet} className="text-center">Not Met</Th>
                </tr>
              </thead>
              <tbody>
                {groupRows.length === 0 && (
                  <tr><td colSpan={colCount} className="text-center py-12 text-ink-muted text-sm">No data matches the current filters.</td></tr>
                )}
                {groupRows.map((gr) => (
                  <tr key={gr.key}
                    onClick={() => { setDetailGroup(gr); setDetailPage(1); setDetailStatus("all"); }}
                    className="border-b border-edge/50 cursor-pointer transition-colors hover:bg-surface-muted/50 group">
                    <td className="px-2 text-center"><ChevronRight size={14} className="text-ink-light group-hover:text-brand transition-colors" /></td>
                    <td className="px-3 py-2.5 text-xs text-ink">{gr.state}</td>
                    <td className="px-3 py-2.5 text-xs text-ink font-medium">{gr.city}</td>
                    <td className="px-3 py-2.5 text-xs text-ink max-w-[180px] truncate" title={gr.campus}>{gr.campus}</td>
                    <td className="px-3 py-2.5 text-xs text-ink">{gr.zone}</td>
                    <td className="px-3 py-2.5 text-xs text-ink">{gr.program}</td>
                    <td className="px-3 py-2.5 text-center"><span className="font-bold text-brand">{gr.total}</span></td>
                    {!ignoreMarks && <td className="px-3 py-2.5 text-center"><span className={cn("font-bold", gr.lowMarks > 0 ? "text-status-warning" : "text-ink-light")}>{gr.lowMarks}</span></td>}
                    {!ignoreJEE && <td className="px-3 py-2.5 text-center"><span className={cn("font-bold", gr.jeeFail > 0 ? "text-status-danger" : "text-ink-light")}>{gr.jeeFail}</span></td>}
                    <td className="px-3 py-2.5 text-center"><span className={cn("font-bold", gr.met > 0 ? "text-status-success" : "text-ink-light")}>{gr.met}</span></td>
                    <td className="px-3 py-2.5 text-center"><span className={cn("font-bold", gr.notMet > 0 ? "text-red-600" : "text-ink-light")}>{gr.notMet}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
