import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LogOut, Users, AlertTriangle, GraduationCap,
  ChevronDown, ChevronRight, ChevronLeft, ChevronUp, ArrowUpDown, X, FileText, Search,
} from "lucide-react";
import scLogo from "@/assets/sc-logo.png";
import { cn } from "@/lib/cn";
import type { Student, Stream } from "@/App";

interface GroupRow {
  key: string;
  state: string; city: string; campus: string; zone: string; program: string;
  total: number; lowMarks: number; examFail: number; met: number; notMet: number;
  students: Student[];
}

type SortKey = "state" | "city" | "campus" | "zone" | "program" | "total" | "lowMarks" | "examFail" | "met" | "notMet";
type SortDir = "asc" | "desc";
type DetailSortKey = "NAME" | "PARENT_NAME" | "ADM_NO" | "COURSE_TRACK" | "COURSE_FEE" | "FEE_PAID" | "MARKS_AVG" | "EXAM_MARKS" | "REASON" | "SPONSORED_BY";

const PAGE_SIZE = 20;
const FEE_OPTIONS = [
  { label: "All", value: Infinity },
  { label: "= 0", value: 0 },
  { label: "< 1,000", value: 1000 },
  { label: "< 5,000", value: 5000 },
  { label: "< 10,000", value: 10000 },
];

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
    if (selected.includes(val)) {
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
                <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)}
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

function StreamToggle({ stream, onChange }: { stream: Stream; onChange: (s: Stream) => void }) {
  return (
    <div className="flex items-center bg-surface-muted rounded-lg p-0.5">
      {(["MPC", "BIPC"] as Stream[]).map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
            stream === s ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink")}>
          {s === "BIPC" ? "Bi.P.C" : s}
        </button>
      ))}
    </div>
  );
}

/* Sortable header */
function SortTh({ children, tip, sortKey: k, currentKey, dir, onSort, className: cls }: {
  children: React.ReactNode; tip: string; sortKey: string; currentKey: string; dir: SortDir;
  onSort: (k: string) => void; className?: string;
}) {
  const active = k === currentKey;
  return (
    <th title={tip} onClick={() => onSort(k)}
      className={cn("px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-ink select-none whitespace-nowrap", cls)}>
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (dir === "asc" ? <ChevronUp size={11} className="text-brand" /> : <ChevronDown size={11} className="text-brand" />) : <ArrowUpDown size={11} className="text-ink-light" />}
      </span>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
interface DashProps {
  students: Student[]; stream: Stream; examLabel: string;
  onLogout: () => void; onKeyFindings: () => void; onStreamChange: (s: Stream) => void;
}

export default function Dashboard({ students, stream, examLabel, onLogout, onKeyFindings, onStreamChange }: DashProps) {
  const [selStates, setSelStates] = useState<string[]>([]);
  const [selCities, setSelCities] = useState<string[]>([]);
  const [selZones, setSelZones] = useState<string[]>([]);
  const [selCampuses, setSelCampuses] = useState<string[]>([]);
  const [feeFilter, setFeeFilter] = useState<number>(1000);
  const [marksLte, setMarksLte] = useState<number>(100);
  const [examLte, setExamLte] = useState<number>(95);
  const [skipZeroMarks, setSkipZeroMarks] = useState(false);
  const [skipZeroExam, setSkipZeroExam] = useState(true);
  const [ignoreMarks, setIgnoreMarks] = useState(false);
  const [ignoreExam, setIgnoreExam] = useState(false);

  const [detailGroup, setDetailGroup] = useState<GroupRow | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailStatus, setDetailStatus] = useState<"all" | "met" | "notmet">("all");
  const [sortKey, setSortKey] = useState<SortKey>("notMet");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dSortKey, setDSortKey] = useState<DetailSortKey>("FEE_PAID");
  const [dSortDir, setDSortDir] = useState<SortDir>("asc");

  const fmt = (n: number) => n.toLocaleString("en-IN");
  const isBIPC = stream === "BIPC";
  const examNotReady = isBIPC;

  useEffect(() => {
    setSelStates([]); setSelCities([]); setSelZones([]); setSelCampuses([]);
    setDetailGroup(null); setDetailStatus("all"); setDetailPage(1);
    if (isBIPC) { setIgnoreExam(true); setSkipZeroExam(true); } else { setIgnoreExam(false); }
  }, [stream]);

  const resetAll = () => {
    setSelStates([]); setSelCities([]); setSelZones([]); setSelCampuses([]);
    setFeeFilter(1000); setMarksLte(100); setExamLte(95);
    setSkipZeroMarks(false); setSkipZeroExam(true); setIgnoreMarks(false); setIgnoreExam(isBIPC);
    setDetailGroup(null); setDetailStatus("all");
  };

  // Options
  const states = useMemo(() => [...new Set(students.map((s) => s.STATE))].sort(), [students]);
  const cities = useMemo(() => {
    const pool = selStates.length > 0 ? students.filter((s) => selStates.includes(s.STATE)) : students;
    return [...new Set(pool.map((s) => s.CITY_NAME))].sort();
  }, [students, selStates]);
  const campuses = useMemo(() => {
    let pool = students as Student[];
    if (selStates.length > 0) pool = pool.filter((s) => selStates.includes(s.STATE));
    if (selCities.length > 0) pool = pool.filter((s) => selCities.includes(s.CITY_NAME));
    return [...new Set(pool.map((s) => s.CAMPUS_NAME))].sort();
  }, [students, selStates, selCities]);
  const zones = useMemo(() => {
    let pool = students as Student[];
    if (selStates.length > 0) pool = pool.filter((s) => selStates.includes(s.STATE));
    if (selCities.length > 0) pool = pool.filter((s) => selCities.includes(s.CITY_NAME));
    if (selCampuses.length > 0) pool = pool.filter((s) => selCampuses.includes(s.CAMPUS_NAME));
    return [...new Set(pool.map((s) => s.ZONE_INCHARGE))].sort();
  }, [students, selStates, selCities, selCampuses]);

  const isLowMarks = (s: Student) => { if (ignoreMarks) return false; if (skipZeroMarks && s.MARKS_AVG === 0) return false; return s.MARKS_AVG <= marksLte; };
  const isExamFail = (s: Student) => { if (ignoreExam) return false; if (skipZeroExam && s.EXAM_MARKS === 0) return false; return s.EXAM_MARKS <= examLte; };
  const getStatus = (s: Student) => (isLowMarks(s) || isExamFail(s)) ? "Not Met" : "Met";

  const filtered = useMemo(() => {
    let pool = students as Student[];
    if (selStates.length > 0) pool = pool.filter((s) => selStates.includes(s.STATE));
    if (selCities.length > 0) pool = pool.filter((s) => selCities.includes(s.CITY_NAME));
    if (selZones.length > 0) pool = pool.filter((s) => selZones.includes(s.ZONE_INCHARGE));
    if (selCampuses.length > 0) pool = pool.filter((s) => selCampuses.includes(s.CAMPUS_NAME));
    if (feeFilter !== Infinity) pool = feeFilter === 0 ? pool.filter((s) => s.FEE_PAID === 0) : pool.filter((s) => s.FEE_PAID < feeFilter);
    return pool;
  }, [students, selStates, selCities, selZones, selCampuses, feeFilter]);

  const groupRows = useMemo((): GroupRow[] => {
    const map = new Map<string, Student[]>();
    for (const s of filtered) {
      const key = `${s.STATE}||${s.CITY_NAME}||${s.CAMPUS_NAME}||${s.ZONE_INCHARGE}||${s.PROGRAM_NAME}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    const rows = [...map.entries()].map(([key, list]) => {
      const f = list[0];
      return {
        key, state: f.STATE, city: f.CITY_NAME, campus: f.CAMPUS_NAME, zone: f.ZONE_INCHARGE, program: f.PROGRAM_NAME,
        total: list.length, lowMarks: list.filter(isLowMarks).length, examFail: list.filter(isExamFail).length,
        met: list.filter((s) => getStatus(s) === "Met").length, notMet: list.filter((s) => getStatus(s) === "Not Met").length,
        students: list.sort((a, b) => a.FEE_PAID - b.FEE_PAID),
      };
    });
    rows.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [filtered, marksLte, examLte, skipZeroMarks, skipZeroExam, ignoreMarks, ignoreExam, sortKey, sortDir]);

  const filteredCount = filtered.length;
  const totalLowMarks = groupRows.reduce((a, g) => a + g.lowMarks, 0);
  const totalExamFail = groupRows.reduce((a, g) => a + g.examFail, 0);
  const totalMet = groupRows.reduce((a, g) => a + g.met, 0);
  const totalNotMet = groupRows.reduce((a, g) => a + g.notMet, 0);
  const colCount = 9 + (ignoreMarks ? 0 : 1) + (ignoreExam ? 0 : 1);
  const hasFilters = selStates.length > 0 || selCities.length > 0 || selZones.length > 0 || selCampuses.length > 0 || feeFilter !== 1000 || marksLte !== 100 || examLte !== 95;

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k as SortKey); setSortDir("desc"); }
  };
  const toggleDSort = (k: string) => {
    if (dSortKey === k) setDSortDir(d => d === "asc" ? "desc" : "asc");
    else { setDSortKey(k as DetailSortKey); setDSortDir("asc"); }
    setDetailPage(1);
  };

  // Detail
  const detailAll = detailGroup?.students || [];
  const detailFiltered = detailStatus === "all" ? detailAll : detailStatus === "met" ? detailAll.filter((s) => getStatus(s) === "Met") : detailAll.filter((s) => getStatus(s) === "Not Met");
  const detailSorted = useMemo(() => {
    return [...detailFiltered].sort((a, b) => {
      let av: any = a[dSortKey], bv: any = b[dSortKey];
      if (typeof av === "string") { av = av.toLowerCase(); bv = (bv as string).toLowerCase(); }
      if (av < bv) return dSortDir === "asc" ? -1 : 1;
      if (av > bv) return dSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [detailFiltered, dSortKey, dSortDir]);
  const metC = detailAll.filter((s) => getStatus(s) === "Met").length;
  const notMetC = detailAll.filter((s) => getStatus(s) === "Not Met").length;
  const dPages = Math.max(1, Math.ceil(detailSorted.length / PAGE_SIZE));
  const dPage = Math.min(detailPage, dPages);
  const dData = detailSorted.slice((dPage - 1) * PAGE_SIZE, dPage * PAGE_SIZE);

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
              <img src={scLogo} alt="SC" className="w-7 h-7 object-contain cursor-pointer" onClick={resetAll} />
              <div>
                <p className="text-sm font-semibold text-ink">{detailGroup.campus}</p>
                <p className="text-[11px] text-ink-muted">{detailGroup.state} · {detailGroup.city} · {detailGroup.program} · <strong className="text-ink">{detailGroup.zone}</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-muted rounded-lg p-0.5">
                {(["all", "met", "notmet"] as const).map((s) => (
                  <button key={s} onClick={() => { setDetailStatus(s); setDetailPage(1); }}
                    className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                      detailStatus === s
                        ? s === "notmet" ? "bg-red-50 text-red-600 shadow-sm" : s === "met" ? "bg-green-50 text-status-success shadow-sm" : "bg-surface-card text-ink shadow-sm"
                        : "text-ink-muted hover:text-ink")}>
                    {s === "all" ? `All (${fmt(detailAll.length)})` : s === "met" ? `Met (${fmt(metC)})` : `Not Met (${fmt(notMetC)})`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
          <section className="bg-surface-card border border-edge rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-edge flex items-center justify-between">
              <span className="text-xs text-ink-muted">{fmt(detailSorted.length)} students</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setDetailPage(1)} disabled={dPage <= 1} className="px-2 py-1 text-[11px] rounded hover:bg-surface-muted disabled:opacity-30 text-ink-muted">First</button>
                <button onClick={() => setDetailPage(p => Math.max(1, p - 1))} disabled={dPage <= 1} className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"><ChevronLeft size={14} /></button>
                <span className="text-xs text-ink font-medium px-2">{dPage} / {dPages}</span>
                <button onClick={() => setDetailPage(p => Math.min(dPages, p + 1))} disabled={dPage >= dPages} className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"><ChevronRight size={14} /></button>
                <button onClick={() => setDetailPage(dPages)} disabled={dPage >= dPages} className="px-2 py-1 text-[11px] rounded hover:bg-surface-muted disabled:opacity-30 text-ink-muted">Last</button>
              </div>
            </div>
            <div className="overflow-auto scrollbar-thin" style={{ maxHeight: "calc(100vh - 160px)" }}>
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface-muted border-b border-edge">
                    <SortTh tip="Student name" sortKey="NAME" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-left">Name</SortTh>
                    <SortTh tip="Parent / Guardian" sortKey="PARENT_NAME" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-left">Parent</SortTh>
                    <SortTh tip="Admission number" sortKey="ADM_NO" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-left">Adm No</SortTh>
                    <th title="Mobile number" className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Mobile</th>
                    <SortTh tip="Course track" sortKey="COURSE_TRACK" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-left">Track</SortTh>
                    <SortTh tip="Course fee before concession" sortKey="COURSE_FEE" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-right">Course Fee</SortTh>
                    <SortTh tip="Fee paid after concession" sortKey="FEE_PAID" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-right">Fee Paid</SortTh>
                    {!ignoreMarks && <SortTh tip={`Avg Marks — red if ≤ ${marksLte}`} sortKey="MARKS_AVG" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-right">Avg Marks</SortTh>}
                    {!ignoreExam && <SortTh tip={`${examLabel} — red if ≤ ${examLte}`} sortKey="EXAM_MARKS" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-right">{examLabel}</SortTh>}
                    <SortTh tip="Concession reason" sortKey="REASON" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-left">Reason</SortTh>
                    <th title="Description" className="px-3 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Description</th>
                    <SortTh tip="Sponsored by" sortKey="SPONSORED_BY" currentKey={dSortKey} dir={dSortDir} onSort={toggleDSort} className="text-left">Sponsored</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {dData.map((s) => {
                    const mBad = !ignoreMarks && (() => { if (skipZeroMarks && s.MARKS_AVG === 0) return false; return s.MARKS_AVG <= marksLte; })();
                    const eBad = !ignoreExam && (() => { if (skipZeroExam && s.EXAM_MARKS === 0) return false; return s.EXAM_MARKS <= examLte; })();
                    return (
                      <tr key={s.ADM_NO} className="border-b border-edge/30 hover:bg-surface-muted/40">
                        <td className="px-3 py-2 font-medium text-ink whitespace-nowrap">{s.NAME} {s.SURNAME}</td>
                        <td className="px-3 py-2 text-ink whitespace-nowrap">{s.PARENT_NAME || "—"}</td>
                        <td className="px-3 py-2 text-ink-muted tabular-nums">{s.ADM_NO}</td>
                        <td className="px-3 py-2 text-ink-muted tabular-nums">{s.MOBILE_NO}</td>
                        <td className="px-3 py-2 text-ink">{s.COURSE_TRACK || "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-ink">{fmt(s.COURSE_FEE)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-ink">{fmt(s.FEE_PAID)}</td>
                        {!ignoreMarks && <td className={cn("px-3 py-2 text-right tabular-nums font-medium", mBad ? "text-status-danger" : "text-ink")}>{s.MARKS_AVG}</td>}
                        {!ignoreExam && <td className={cn("px-3 py-2 text-right tabular-nums font-medium", eBad ? "text-status-danger" : "text-ink")}>{s.EXAM_MARKS}</td>}
                        <td className="px-3 py-2 text-ink max-w-[120px] truncate" title={s.REASON}>{s.REASON || "—"}</td>
                        <td className="px-3 py-2 text-ink max-w-[150px] truncate" title={s.REASON_DESCRIPTION}>{s.REASON_DESCRIPTION || "—"}</td>
                        <td className="px-3 py-2 text-ink">{s.SPONSORED_BY || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
            <img src={scLogo} alt="SC" className="w-8 h-8 object-contain cursor-pointer" onClick={resetAll} />
            <h1 className="font-display text-base font-bold text-ink leading-none">Year End Concession Review (2025-26)</h1>
            <StreamToggle stream={stream} onChange={onStreamChange} />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onKeyFindings} className="text-xs font-medium text-brand hover:underline">Key Findings</button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-status-danger transition-colors"><LogOut size={14} /> Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-semibold text-blue-900 text-[13px]">{stream === "MPC" ? "MPC" : "Bi.P.C"} Students</p>
              <p>Inter 2 · Current · Fee Paid &lt; 10,000
                {examNotReady && <span className="ml-2 text-amber-700">· NEET marks will be populated after results</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-surface-card border border-edge rounded-xl px-4 py-3 flex items-center gap-2">
            <Users size={16} className="text-brand" />
            <span className="text-sm text-ink">Total: <strong>{fmt(students.length)}</strong></span>
          </div>
          <div className="bg-surface-card border border-edge rounded-xl px-4 py-3 flex items-center gap-2">
            <Users size={16} className="text-status-success" />
            <span className="text-sm text-ink">Filtered: <strong className="text-brand">{fmt(filteredCount)}</strong></span>
          </div>
        </div>

        <section className="bg-surface-card border border-edge rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Filters</h2>
            {hasFilters && <button onClick={resetAll} className="text-[11px] text-brand hover:underline flex items-center gap-1"><X size={12} /> Reset all</button>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MultiSelect selected={selStates} onChange={(v) => { setSelStates(v); setSelCities([]); setSelCampuses([]); setSelZones([]); }} options={states} placeholder="State" />
            <MultiSelect selected={selCities} onChange={(v) => { setSelCities(v); setSelCampuses([]); setSelZones([]); }} options={cities} placeholder="City" searchable />
            <MultiSelect selected={selCampuses} onChange={(v) => { setSelCampuses(v); setSelZones([]); }} options={campuses} placeholder="Campus" searchable />
            <MultiSelect selected={selZones} onChange={setSelZones} options={zones} placeholder="Zone Incharge" searchable />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Fee Paid</span>
              <select value={feeFilter} onChange={(e) => setFeeFilter(Number(e.target.value))} className="bg-surface-card border border-edge rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand cursor-pointer">
                {FEE_OPTIONS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="h-5 w-px bg-edge" />
            <div className={cn("flex items-center gap-2", ignoreMarks && "opacity-40")}>
              <span className="text-xs text-ink-muted whitespace-nowrap">Avg Marks ≤</span>
              <input type="number" value={marksLte} min={0} max={360} disabled={ignoreMarks} onChange={(e) => setMarksLte(Number(e.target.value) || 0)}
                className="w-16 bg-surface-card border border-edge rounded-lg px-2 py-1.5 text-xs text-ink outline-none focus:border-brand tabular-nums text-center disabled:cursor-not-allowed" />
            </div>
            <div className="h-5 w-px bg-edge" />
            <div className={cn("flex items-center gap-2", (ignoreExam || examNotReady) && "opacity-40")}>
              <span className="text-xs text-ink-muted whitespace-nowrap">{examLabel} ≤</span>
              <input type="number" value={examLte} min={0} max={stream === "MPC" ? 300 : 720} disabled={ignoreExam || examNotReady} onChange={(e) => setExamLte(Number(e.target.value) || 0)}
                className="w-16 bg-surface-card border border-edge rounded-lg px-2 py-1.5 text-xs text-ink outline-none focus:border-brand tabular-nums text-center disabled:cursor-not-allowed" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={ignoreMarks} onChange={(e) => setIgnoreMarks(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)]" />
              <span className="text-xs text-ink-muted"><strong className="text-ink">Ignore Avg Marks</strong></span>
            </label>
            {!examNotReady && <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={ignoreExam} onChange={(e) => setIgnoreExam(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)]" />
              <span className="text-xs text-ink-muted"><strong className="text-ink">Ignore {examLabel}</strong></span>
            </label>}
            <div className="h-5 w-px bg-edge" />
            <label className={cn("flex items-center gap-2 cursor-pointer select-none", ignoreMarks && "opacity-40")}>
              <input type="checkbox" checked={skipZeroMarks} disabled={ignoreMarks} onChange={(e) => setSkipZeroMarks(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)] disabled:cursor-not-allowed" />
              <span className="text-xs text-ink-muted">Skip <strong className="text-ink">0 Marks</strong></span>
            </label>
            {!examNotReady && <label className={cn("flex items-center gap-2 cursor-pointer select-none", ignoreExam && "opacity-40")}>
              <input type="checkbox" checked={skipZeroExam} disabled={ignoreExam} onChange={(e) => setSkipZeroExam(e.target.checked)} className="w-4 h-4 rounded accent-[hsl(14,80%,42%)] disabled:cursor-not-allowed" />
              <span className="text-xs text-ink-muted">Skip <strong className="text-ink">0 {examLabel}</strong></span>
            </label>}
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={filteredCount} icon={Users} color="bg-brand" tooltip="Total concession students matching filters" />
          {!ignoreMarks && <StatCard label="Avg Marks ≤ cutoff" value={totalLowMarks} icon={AlertTriangle} color="bg-status-warning" tooltip={`Students with Avg Marks ≤ ${marksLte}`} />}
          {!ignoreExam && <StatCard label={`${examLabel} ≤ cutoff`} value={totalExamFail} icon={GraduationCap} color="bg-status-danger" tooltip={`Students with ${examLabel} ≤ ${examLte}`} />}
          <StatCard label="Met" value={totalMet} icon={Users} color="bg-status-success" tooltip="Students meeting all criteria" />
          <StatCard label="Not Met" value={totalNotMet} icon={AlertTriangle} color="bg-red-600" tooltip="Students failing criteria" />
        </section>

        <section className="bg-surface-card border border-edge rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-edge">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Breakdown <span className="font-normal normal-case text-ink-light">({groupRows.length} groups · {fmt(filteredCount)} students · click to view)</span>
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-surface-muted border-b border-edge">
                  <th className="w-7 px-2"></th>
                  <SortTh tip="State" sortKey="state" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-left">State</SortTh>
                  <SortTh tip="City" sortKey="city" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-left">City</SortTh>
                  <SortTh tip="Campus" sortKey="campus" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-left">Campus</SortTh>
                  <SortTh tip="Zone Incharge" sortKey="zone" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-left">Zone Incharge</SortTh>
                  <SortTh tip="Program" sortKey="program" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-left">Program</SortTh>
                  <SortTh tip="Total students" sortKey="total" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-center">Total</SortTh>
                  {!ignoreMarks && <SortTh tip="Avg Marks below cutoff" sortKey="lowMarks" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-center">Avg Marks</SortTh>}
                  {!ignoreExam && <SortTh tip={`${examLabel} below cutoff`} sortKey="examFail" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-center">{examLabel}</SortTh>}
                  <SortTh tip="Met criteria" sortKey="met" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-center">Met</SortTh>
                  <SortTh tip="Failed criteria" sortKey="notMet" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="text-center">Not Met</SortTh>
                </tr>
              </thead>
              <tbody>
                {groupRows.length === 0 && <tr><td colSpan={colCount} className="text-center py-12 text-ink-muted">No data matches the current filters.</td></tr>}
                {groupRows.map((gr) => (
                  <tr key={gr.key} onClick={() => { setDetailGroup(gr); setDetailPage(1); setDetailStatus("all"); setDSortKey("FEE_PAID"); setDSortDir("asc"); }}
                    className="border-b border-edge/50 cursor-pointer transition-colors hover:bg-surface-muted/50 group">
                    <td className="px-2 text-center"><ChevronRight size={14} className="text-ink-light group-hover:text-brand" /></td>
                    <td className="px-3 py-2.5 text-ink">{gr.state}</td>
                    <td className="px-3 py-2.5 text-ink font-medium">{gr.city}</td>
                    <td className="px-3 py-2.5 text-ink max-w-[180px] truncate" title={gr.campus}>{gr.campus}</td>
                    <td className="px-3 py-2.5 text-ink">{gr.zone}</td>
                    <td className="px-3 py-2.5 text-ink">{gr.program}</td>
                    <td className="px-3 py-2.5 text-center"><span className="font-bold text-brand">{gr.total}</span></td>
                    {!ignoreMarks && <td className="px-3 py-2.5 text-center"><span className={cn("font-bold", gr.lowMarks > 0 ? "text-status-warning" : "text-ink-light")}>{gr.lowMarks}</span></td>}
                    {!ignoreExam && <td className="px-3 py-2.5 text-center"><span className={cn("font-bold", gr.examFail > 0 ? "text-status-danger" : "text-ink-light")}>{gr.examFail}</span></td>}
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
