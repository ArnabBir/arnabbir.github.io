'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Database, Search, Layers, Code, FileText, Server, Zap, Hash,
  Link as LinkIcon, Globe, BookOpen, ArrowRight, CheckCircle2,
  AlertTriangle, Info, Eye, Sun, Moon, Binary, Clock, BarChart3,
  GitBranch, ArrowDown, Cpu, Columns3, Table2, TreePine
} from "lucide-react";

// ================================================================
//  DATA & CONSTANTS (from the Dremel paper, Figure 2 & 3)
// ================================================================
const RECORD_1 = {
  DocId: 10,
  Links: { Forward: [20, 40, 60] },
  Name: [
    { Language: [{ Code: "en-us", Country: "us" }, { Code: "en" }], Url: "http://A" },
    { Url: "http://B" },
    { Language: [{ Code: "en-gb", Country: "gb" }] },
  ],
};

const RECORD_2 = {
  DocId: 20,
  Links: { Backward: [10, 30], Forward: [80] },
  Name: [{ Url: "http://C" }],
};

const COLUMN_STORE = {
  DocId: [
    { v: 10, r: 0, d: 0, rec: 1 },
    { v: 20, r: 0, d: 0, rec: 2 },
  ],
  "Name.Url": [
    { v: "http://A", r: 0, d: 2, rec: 1 },
    { v: "http://B", r: 1, d: 2, rec: 1 },
    { v: "NULL", r: 1, d: 1, rec: 1 },
    { v: "http://C", r: 0, d: 2, rec: 2 },
  ],
  "Name.Language.Code": [
    { v: "en-us", r: 0, d: 2, rec: 1 },
    { v: "en", r: 2, d: 2, rec: 1 },
    { v: "NULL", r: 1, d: 1, rec: 1 },
    { v: "en-gb", r: 1, d: 2, rec: 1 },
    { v: "NULL", r: 0, d: 1, rec: 2 },
  ],
  "Links.Forward": [
    { v: 20, r: 0, d: 2, rec: 1 },
    { v: 40, r: 1, d: 2, rec: 1 },
    { v: 60, r: 1, d: 2, rec: 1 },
    { v: 80, r: 0, d: 2, rec: 2 },
  ],
};

const QUERIES = [
  {
    sql: "SELECT DocId FROM T",
    desc: 'The "Lazy" Scan — reads only the top-level ID. Ignores all nested data.',
    cols: ["DocId"],
  },
  {
    sql: "SELECT COUNT(Name.Language.Code) FROM T",
    desc: 'The "Deep Dive" — drills 3 levels deep. Reads ONLY Code. Skips URLs & Links.',
    cols: ["Name.Language.Code"],
  },
  {
    sql: "SELECT Name.Url, Links.Forward FROM T",
    desc: 'The "Zipper" — reads two separate branches and stitches them back.',
    cols: ["Name.Url", "Links.Forward"],
  },
];

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function DremelSimulation() {
  const { theme, setTheme } = useTheme();

  const [activeQuery, setActiveQuery] = useState(null);
  const [executionStep, setExecutionStep] = useState(0);
  const [scannedCols, setScannedCols] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    if (!activeQuery) return;
    let timer;
    if (executionStep === 0) {
      setExecutionStep(1);
      setScannedCols([]);
    } else if (executionStep === 1) {
      timer = setTimeout(() => { setExecutionStep(2); setScannedCols(activeQuery.cols); }, 1000);
    } else if (executionStep === 2) {
      timer = setTimeout(() => setExecutionStep(3), 1500);
    } else if (executionStep === 3) {
      timer = setTimeout(() => { setActiveQuery(null); setExecutionStep(0); }, 2500);
    }
    return () => clearTimeout(timer);
  }, [activeQuery, executionStep]);

  const handleRunQuery = (q) => {
    if (executionStep !== 0) return;
    setActiveQuery(q);
  };

  const stepLabel = executionStep === 0 ? "READY" : executionStep === 1 ? "DISPATCHING" : executionStep === 2 ? "SCANNING COLUMNS" : "ASSEMBLING RESULTS";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 rounded-lg shadow-lg shadow-cyan-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                Dremel Explorer
              </h1>
              <p className="text-xs text-slate-500 font-mono">Nested Data Shredding & Assembly</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors duration-300 ${executionStep > 0 ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/50 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"}`}>
              {stepLabel}
            </div>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors" title="Toggle Theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION
          ============================================================ */}
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Logical Record Tree */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:max-h-[620px]">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                <FileText size={14} /> Logical Records
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                <RecordTreeView data={RECORD_1} id={1} />
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <RecordTreeView data={RECORD_2} id={2} />
              </div>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 p-3 rounded-lg text-[11px] text-cyan-700 dark:text-cyan-200/80 leading-relaxed">
              <strong>Why is this hard?</strong> In a standard DB, this nested structure would be a blob or split into 5+ tables with JOINs. Dremel stores it <em>flattened</em> in columns but preserves all nesting structure via repetition & definition levels.
            </div>
          </div>

          {/* MIDDLE: Column Store + Queries */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Query Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Search size={14} /> Interactive Queries
              </h3>
              <div className="flex gap-2 flex-wrap">
                {QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleRunQuery(q)}
                    disabled={executionStep !== 0}
                    className={`flex-1 min-w-[180px] p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${
                      activeQuery === q
                        ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-400 dark:border-cyan-500 ring-1 ring-cyan-400 dark:ring-cyan-500"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                    } ${executionStep !== 0 && activeQuery !== q ? "opacity-30 grayscale" : ""}`}
                  >
                    <div className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 mb-1">{q.sql}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{q.desc}</div>
                    {activeQuery === q && executionStep === 2 && (
                      <div className="absolute bottom-0 left-0 h-1 bg-cyan-500 w-full animate-progress" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Store Visualizer */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 overflow-hidden relative shadow-sm dark:shadow-none">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex justify-between items-center">
                <span className="flex items-center gap-2"><Database size={14} /> Physical Storage (The Shredder)</span>
                <div className="flex gap-3 text-[9px] font-mono bg-slate-100 dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-600" /> r: Repetition</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" /> d: Definition</span>
                </div>
              </h3>

              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {Object.entries(COLUMN_STORE).map(([colName, data]) => {
                  const isScanned = scannedCols.includes(colName);
                  const isDimmed = executionStep === 2 && !isScanned;

                  return (
                    <div key={colName} className={`transition-all duration-500 ${isDimmed ? "opacity-10 blur-[1px] scale-95" : "opacity-100 scale-100"}`}>
                      <div className={`text-[10px] font-mono font-bold mb-2 px-2 py-1.5 rounded border text-center whitespace-nowrap transition-colors duration-300 ${
                        isScanned
                          ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-200 border-cyan-400 dark:border-cyan-500 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}>
                        {colName}
                      </div>

                      <div className="flex flex-col gap-1">
                        {data.map((cell, idx) => (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredCell({ col: colName, idx, ...cell })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`relative flex items-center justify-between gap-3 p-1.5 rounded border cursor-help transition-all duration-300 ${
                              isScanned
                                ? "bg-slate-50 dark:bg-slate-800 border-cyan-300 dark:border-cyan-500/50 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            } ${isScanned && executionStep === 2 ? "animate-scan-flash" : ""}`}
                            style={{ animationDelay: `${idx * 150}ms` }}
                          >
                            <span className={`font-mono text-xs ${cell.v === "NULL" ? "text-slate-400 dark:text-slate-600 italic text-[10px]" : "text-slate-800 dark:text-slate-200"}`}>
                              {cell.v}
                            </span>
                            <div className="flex gap-1 text-[8px] font-mono opacity-70">
                              <span className="bg-slate-100 dark:bg-slate-950 px-1 rounded text-cyan-700 dark:text-cyan-200 border border-slate-200 dark:border-slate-800">r{cell.r}</span>
                              <span className="bg-slate-100 dark:bg-slate-950 px-1 rounded text-purple-700 dark:text-purple-200 border border-slate-200 dark:border-slate-800">d{cell.d}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover Tooltip */}
              {hoveredCell && (
                <div className="absolute bottom-4 right-4 w-64 bg-white dark:bg-slate-800/95 backdrop-blur border border-slate-300 dark:border-slate-600 p-3 rounded-lg shadow-2xl z-20 text-xs">
                  <div className="font-bold text-cyan-600 dark:text-cyan-400 mb-1 border-b border-slate-200 dark:border-slate-600 pb-1">{hoveredCell.col}</div>
                  <div className="grid grid-cols-2 gap-2 mb-2 mt-2">
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Value</span>
                      <span className="font-mono text-slate-900 dark:text-white">{hoveredCell.v}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Record</span>
                      <span className="font-mono text-slate-900 dark:text-white">#{hoveredCell.rec}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                    <div className="flex gap-2 items-center">
                      <span className="bg-cyan-50 dark:bg-cyan-900/50 px-1.5 py-0.5 rounded text-cyan-700 dark:text-cyan-200 font-mono border border-cyan-200 dark:border-cyan-800">r:{hoveredCell.r}</span>
                      <span>{hoveredCell.r === 0 ? "New record starts here." : "Repeated inside nested list."}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="bg-purple-50 dark:bg-purple-900/50 px-1.5 py-0.5 rounded text-purple-700 dark:text-purple-200 font-mono border border-purple-200 dark:border-purple-800">d:{hoveredCell.d}</span>
                      <span>{hoveredCell.d >= 2 ? "Fully defined (value present)." : "Value is missing / NULL."}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Execution Tree */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:max-h-[620px]">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 h-full flex flex-col relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-6 flex items-center gap-2">
                <Server size={14} /> Execution Tree
              </h3>

              <div className="flex-1 flex flex-col items-center justify-between relative z-10">
                {/* Root */}
                <div className={`p-3 rounded-lg border-2 transition-all duration-300 w-32 text-center ${executionStep === 1 || executionStep === 3 ? "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-400 dark:border-cyan-500 text-cyan-700 dark:text-cyan-200 shadow-lg" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"}`}>
                  <div className="text-xs font-bold">Root Server</div>
                  <div className="text-[9px] opacity-70">{executionStep === 3 ? "Aggregating..." : "Ready"}</div>
                </div>

                {/* Connector */}
                <div className="absolute inset-0 pointer-events-none flex justify-center">
                  <div className={`w-0.5 h-1/2 absolute top-12 transition-colors duration-500 ${executionStep > 0 ? "bg-cyan-400/50 dark:bg-cyan-500/50" : "bg-slate-300 dark:bg-slate-700"}`} />
                </div>

                {/* Mixers */}
                <div className="flex justify-around w-full mt-8">
                  {["Mixer A", "Mixer B"].map((name) => (
                    <div key={name} className={`p-2 rounded border transition-all duration-300 w-24 text-center ${executionStep === 1 || executionStep === 3 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-200" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"}`}>
                      <div className="text-[10px] font-bold">{name}</div>
                    </div>
                  ))}
                </div>

                {/* Leaf Servers */}
                <div className="grid grid-cols-4 gap-2 w-full mt-auto pt-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`p-2 rounded border transition-all duration-300 text-center relative ${executionStep === 2 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-200 scale-105 shadow-lg" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-600"}`}>
                      <Database size={16} className="mx-auto mb-1" />
                      <div className="text-[8px] font-bold">Leaf {i}</div>
                      {executionStep === 2 && (
                        <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded border border-emerald-500/30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Packet Animation */}
              {executionStep === 1 && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan] animate-drop-packet" />
              )}
              {executionStep === 3 && (
                <div className="absolute bottom-12 left-1/4 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_emerald] animate-rise-packet" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t-2 border-cyan-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — VLDB 2010
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
              Dremel: Interactive Analysis of Web-Scale Datasets
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A scalable, interactive ad-hoc query system for nested data. Combines columnar storage with multi-level execution trees to run aggregation queries over <strong className="text-slate-900 dark:text-slate-200">trillion-row tables in seconds</strong> — the system behind BigQuery.
            </p>
          </div>

          {/* ---- What is Dremel ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Layers className="w-5 h-5" />} title="What Is Dremel?" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Dremel is Google's internal interactive query engine, in production since <strong className="text-cyan-600 dark:text-cyan-300">2006</strong>. It processes <strong className="text-cyan-600 dark:text-cyan-300">quadrillions of records per month</strong> and is the foundation of Google BigQuery. Its two key innovations:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <InnovationCard
                  num="1"
                  title="Columnar Storage for Nested Data"
                  desc="A novel encoding using repetition and definition levels that losslessly flattens arbitrarily nested Protocol Buffer records into column stripes — enabling reads of only the fields you need."
                  color="cyan"
                />
                <InnovationCard
                  num="2"
                  title="Multi-Level Serving Tree"
                  desc="Borrowed from web search architecture, queries are pushed down a tree. Leaf servers scan in parallel. Intermediate servers aggregate partial results. The tree reduces network bottleneck and provides fault tolerance."
                  color="blue"
                />
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <StatCard label="In Production" value="Since 2006" sub="at Google" color="cyan" />
                <StatCard label="Scale" value="1T+ rows" sub="queried in seconds" color="blue" />
                <StatCard label="Speedup" value="100×" sub="vs MapReduce on same data" color="indigo" />
                <StatCard label="Public Product" value="BigQuery" sub="Google Cloud" color="emerald" />
              </div>
            </div>
          </section>

          {/* ---- Repetition & Definition Levels ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Binary className="w-5 h-5" />} title="The Core Innovation — Repetition & Definition Levels" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                When you flatten nested data into columns, you lose structural information. Two values of a repeated field — are they from the same record or different records? From the same list or a sibling list? Dremel solves this with two small integers per value:
              </p>
              <div className="grid md:grid-cols-2 gap-5 mb-6">
                <LevelCard
                  title="Repetition Level (r)"
                  color="cyan"
                  examples={[
                    { val: "r = 0", meaning: "Start of a new record" },
                    { val: "r = 1", meaning: "The field at nesting level 1 repeated (e.g., Name repeated)" },
                    { val: "r = 2", meaning: "The field at nesting level 2 repeated (e.g., Language repeated within same Name)" },
                  ]}
                  desc="Tells you at what repeated field in the path the value has repeated. Enables the system to know exactly where to 'break' when reconstructing nesting."
                />
                <LevelCard
                  title="Definition Level (d)"
                  color="purple"
                  examples={[
                    { val: "d = max", meaning: "Value is fully present (not NULL)" },
                    { val: "d < max", meaning: "Value is missing — NULL at some ancestor level" },
                    { val: "d = 0", meaning: "The topmost optional/repeated ancestor is absent" },
                  ]}
                  desc="Tells you how many optional/repeated fields in the path are actually defined. This disambiguates different levels of 'missingness' — a crucial detail for lossless reconstruction."
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-amber-700 dark:text-amber-300">Key proof:</strong> The paper proves this encoding is <strong className="text-slate-900 dark:text-slate-200">lossless</strong> — given any subset of columns with their r/d levels, you can reconstruct the exact original nested records (with only the selected fields). This is what makes Dremel's columnar format fundamentally different from traditional column stores.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Architecture ---- */}
          <section className="mb-16">
            <SectionTitle icon={<TreePine className="w-5 h-5" />} title="Architecture — The Serving Tree" />
            <div className="space-y-4 mb-6">
              <FlowStep num={1} color="cyan" icon={<Globe className="w-5 h-5" />} title="Client sends query"
                desc="A SQL-like query arrives at the root server. The query may reference nested fields using dotted notation (e.g., Name.Language.Code)."
              />
              <FlowStep num={2} color="blue" icon={<GitBranch className="w-5 h-5" />} title="Root rewrites & dispatches"
                desc="The root server reads table metadata, identifies all tablets (horizontal partitions), and rewrites the query for each subtree. For example, a COUNT becomes a SUM of partial COUNTs."
              />
              <FlowStep num={3} color="indigo" icon={<Server className="w-5 h-5" />} title="Intermediate servers aggregate"
                desc="Mixer-level servers further split the work and aggregate partial results from below. Multi-level trees are critical when queries produce many groups — a single root can't aggregate thousands of leaf results."
              />
              <FlowStep num={4} color="emerald" icon={<Database className="w-5 h-5" />} title="Leaf servers scan columns"
                desc="Each leaf reads ONLY the columns needed from its tablets (stored on GFS/Colossus). Column blocks are prefetched asynchronously with 95% cache hit rate. NULLs are inferred from definition levels — never stored."
              />
              <FlowStep num={5} color="purple" icon={<Zap className="w-5 h-5" />} title="Results assembled & returned"
                desc="Using the FSM-based record assembly algorithm, partial results flow back up the tree. The query dispatcher handles stragglers by re-dispatching slow tablets to other servers."
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FeatureCard title="Query Dispatcher" desc="Schedules queries by priority, load-balances across the tree, and monitors per-tablet histograms. If a tablet takes too long, it's re-dispatched to another leaf — multiple times if needed." color="cyan" />
              <FeatureCard title="Approximate Results" desc="A parameter controls the minimum percentage of tablets scanned before returning. Setting it to 98% instead of 100% can dramatically speed up queries by skipping a few slow stragglers." color="amber" />
            </div>
          </section>

          {/* ---- The Shredding Algorithm ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Columns3 className="w-5 h-5" />} title="Shredding & Assembly — How It Works" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl border-2 border-cyan-200 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
                    <ArrowDown className="w-4 h-4" /> Shredding (Record → Columns)
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    A tree of <strong>field writers</strong> mirrors the schema hierarchy. The algorithm recurses through each record, computing r and d levels. Writers only activate when they have data — sparse records (1000 fields, 100 populated) are cheap.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                    <div>1. Walk the record tree top-down</div>
                    <div>2. At each repeated field, increment r level</div>
                    <div>3. At each defined optional field, increment d level</div>
                    <div>4. Emit (value, r, d) to the column writer</div>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 rotate-180" /> Assembly (Columns → Record)
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    A <strong>finite state machine (FSM)</strong> reads selected columns. Each state = a column reader. Transitions are labeled with repetition levels. When r=0, a new record starts. The FSM is traversed once per record.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                    <div>1. Construct FSM from selected fields</div>
                    <div>2. Read next value + peek at next r level</div>
                    <div>3. Transition to next column reader</div>
                    <div>4. Append value to output record at correct nesting</div>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-emerald-700 dark:text-emerald-300">The magic:</strong> If you only need 3 fields out of 1200, you read 3 column stripes — not 1200. The FSM reconstructs records as if the other 1197 fields never existed. This is why Dremel achieves <strong>10× speedup</strong> on local disk when reading few columns.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Performance ---- */}
          <section className="mb-16">
            <SectionTitle icon={<BarChart3 className="w-5 h-5" />} title="Performance — Experimental Results" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Table T1" value="85B rows" sub="87 TB compressed" color="cyan" />
              <MetricCard label="Table T4" value="1T+ rows" sub="105 TB compressed" color="blue" />
              <MetricCard label="MR vs Dremel" value="~100×" sub="speedup (hours → seconds)" color="indigo" />
              <MetricCard label="Monthly" value="Quadrillions" sub="of records scanned" color="emerald" />
            </div>
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm dark:shadow-none space-y-4">
              <ResultCard title="Columnar vs Record-Oriented (Local Disk)" desc="Reading 1-2 columns from columnar storage is 10× faster than record-oriented. The advantage scales linearly — crossover happens at dozens of fields." color="cyan" />
              <ResultCard title="Columnar MR vs Record MR" desc="MapReduce on columnar data: minutes. MapReduce on record data: hours. Same query, same 3000 nodes. Columnar storage benefits all tools." color="blue" />
              <ResultCard title="Serving Tree Depth" desc="For queries with many groups (e.g., 1.1M distinct domains), going from 2 levels to 3 levels halves execution time. The root can't aggregate thousands of leaf results alone." color="indigo" />
              <ResultCard title="Near-Linear Scalability" desc="Scaling from 1000 to 4000 nodes on a trillion-row table: CPU time stays constant (~300K sec), wall-clock time drops proportionally. No efficiency loss at scale." color="emerald" />
              <ResultCard title="Stragglers & Fault Tolerance" desc="99% of tablets process in <5 seconds. A tiny fraction take much longer. Re-dispatching and partial-scan thresholds (98% instead of 100%) mitigate this." color="amber" />
            </div>
          </section>

          {/* ---- Dremel vs MapReduce ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Table2 className="w-5 h-5" />} title="Dremel vs MapReduce — Complementary Tools" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Dremel is <strong className="text-cyan-600 dark:text-cyan-300">not a replacement for MapReduce</strong>. They are complementary. Dremel is used for interactive exploration (seconds), while MR handles complex multi-pass computations (minutes to hours).
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-cyan-200 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">Dremel</div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /> Interactive, ad-hoc SQL queries</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /> Seconds-scale response</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /> Read-only, scan-heavy aggregation</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /> Operates on nested data in-situ</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">MapReduce</div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Complex multi-pass transformations</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Minutes-to-hours execution</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Arbitrary UDFs and computations</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Write output for Dremel to explore</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ---- How to use the sim ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Eye className="w-5 h-5" />} title="Using the Simulator Above" />
            <div className="grid md:grid-cols-3 gap-4">
              <UsageCard step="1" title="Pick a Query" desc="Click one of the three SQL queries. Watch the execution status transition: DISPATCHING → SCANNING COLUMNS → ASSEMBLING RESULTS." color="cyan" />
              <UsageCard step="2" title="Watch Column Selection" desc="Only the columns needed for the query light up. Unused columns dim and blur — this IS Dremel's key advantage: reading only what you need." color="blue" />
              <UsageCard step="3" title="Hover for Details" desc="Hover over any cell in the column store to see its value, record number, repetition level, and definition level — the building blocks of nested columnar storage." color="emerald" />
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        @keyframes progress { from { width: 0; } to { width: 100%; } }
        .animate-progress { animation: progress 1.5s linear; }
        @keyframes scan-flash { 0%,100% { opacity: 1; } 50% { opacity: 0.7; background: rgba(6,182,212,0.15); } }
        .animate-scan-flash { animation: scan-flash 0.4s ease; }
        @keyframes drop-packet { 0% { top: 3rem; opacity: 1; } 100% { top: 60%; opacity: 0; } }
        .animate-drop-packet { animation: drop-packet 0.8s ease-in forwards; }
        @keyframes rise-packet { 0% { bottom: 3rem; opacity: 1; } 100% { bottom: 60%; opacity: 0; } }
        .animate-rise-packet { animation: rise-packet 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ================================================================
//  RECORD TREE VIEW (Simulation sub-component)
// ================================================================

function RecordTreeView({ data, id }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1 font-mono flex items-center gap-2">
        <Hash size={12} /> Record r{id}
      </div>
      <div className="pl-1">
        {Object.entries(data).map(([k, v]) => (
          <RecursiveField key={k} fieldName={k} value={v} />
        ))}
      </div>
    </div>
  );
}

function RecursiveField({ fieldName, value }) {
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && value !== null && !isArray;
  const Icon = fieldName === "Links" ? LinkIcon : fieldName === "Url" ? Globe : isArray ? Layers : Code;
  const color = fieldName === "Links" ? "text-purple-500 dark:text-purple-400" : fieldName === "Name" ? "text-blue-500 dark:text-blue-400" : "text-slate-500 dark:text-slate-400";

  if (isArray) {
    return (
      <div className="mb-2">
        <div className={`text-[10px] font-bold ${color} flex items-center gap-1.5`}>
          <Icon size={10} /> {fieldName} <span className="text-slate-400 dark:text-slate-600 font-normal">[{value.length}]</span>
        </div>
        <div className="pl-2 border-l border-slate-300 dark:border-slate-800 ml-1 space-y-1 mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-2.5 top-1.5 w-1.5 h-px bg-slate-300 dark:bg-slate-700" />
              {typeof item === "object" ? (
                Object.entries(item).map(([k, v]) => <RecursiveField key={k} fieldName={k} value={v} />)
              ) : (
                <div className="text-slate-700 dark:text-slate-300 text-[10px] pl-1 font-mono">{String(item)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isObject) {
    return (
      <div className="mb-2">
        <div className={`text-[10px] font-bold ${color} flex items-center gap-1.5`}>
          <Icon size={10} /> {fieldName}
        </div>
        <div className="pl-2 border-l border-slate-300 dark:border-slate-800 ml-1 mt-1">
          {Object.entries(value).map(([k, v]) => <RecursiveField key={k} fieldName={k} value={v} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-[10px] mb-1 items-center">
      <span className="text-slate-500 font-semibold flex items-center gap-1 w-16">
        {fieldName === "Url" ? <Globe size={8} /> : fieldName === "DocId" ? <Hash size={8} /> : ""}
        {fieldName}:
      </span>
      <span className="text-cyan-700 dark:text-cyan-100 bg-slate-100 dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-800/50 font-mono truncate max-w-[120px]">
        {String(value)}
      </span>
    </div>
  );
}

// ================================================================
//  EDUCATIONAL SUB-COMPONENTS
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-500/10",       border: "border-cyan-200 dark:border-cyan-500/30",       text: "text-cyan-600 dark:text-cyan-400" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   border: "border-indigo-200 dark:border-indigo-500/30",   text: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-500/10",   border: "border-purple-200 dark:border-purple-500/30",   text: "text-purple-600 dark:text-purple-400" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400" },
};

function InnovationCard({ num, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{num}</div>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 text-center`}>
      <div className={`text-xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{label}</div>
      <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm dark:shadow-none text-center">
      <div className={`text-xl font-bold font-mono ${c.text}`}>{value}</div>
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{label}</div>
      <div className="text-[10px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function FlowStep({ num, color, icon, title, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${c.border} ${c.bg} ${c.text}`}>{num}</div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={c.text}>{icon}</span>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function LevelCard({ title, color, examples, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className={`rounded-xl border-2 ${c.border} ${c.bg} p-5`}>
      <div className={`text-sm font-bold ${c.text} mb-3`}>{title}</div>
      <div className="space-y-2 mb-4">
        {examples.map((ex) => (
          <div key={ex.val} className="flex items-start gap-2 text-xs">
            <span className={`font-mono px-1.5 py-0.5 rounded border ${c.border} ${c.text} whitespace-nowrap`}>{ex.val}</span>
            <span className="text-slate-600 dark:text-slate-400">{ex.meaning}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-3">{desc}</p>
    </div>
  );
}

function ResultCard({ title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className={`flex items-start gap-3 rounded-xl border ${c.border} ${c.bg} p-4`}>
      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.text}`} />
      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function UsageCard({ step, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{step}</div>
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
