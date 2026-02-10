'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Clock, Database, ShieldCheck, AlertTriangle, Activity, Zap, Play, Pause,
  RotateCcw, ArrowRight, Layers, CheckCircle2, XCircle, BookOpen, Server,
  Globe, Lock, ArrowDown, Info, Eye, Binary, Search, Monitor, Sun, Moon,
  HardDrive, MemoryStick
} from "lucide-react";

// ================================================================
//  CONFIGURATION
// ================================================================
const PX_PER_MS = 0.05;
const REFRESH_RATE = 16;
const PAXOS_LATENCY_BASE = 1000;
const MAX_HISTORY = 4;

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function SpannerSimulation() {
  const { theme, setTheme } = useTheme();

  // --- Simulation State ---
  const [now, setNow] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [epsilon, setEpsilon] = useState(2000);
  const [mode, setMode] = useState("safe");
  const [clockNoise, setClockNoise] = useState(0);

  // --- Transaction State ---
  const [activeTx, setActiveTx] = useState(null);
  const [history, setHistory] = useState([]);

  // --- Animation Refs ---
  const reqRef = useRef();

  // --- TrueTime Logic ---
  const getTrueTime = useCallback(
    (absTime) => {
      const perceivedTime = absTime + clockNoise;
      return {
        earliest: perceivedTime - epsilon,
        latest: perceivedTime + epsilon,
        reference: perceivedTime,
      };
    },
    [epsilon, clockNoise]
  );

  // --- Animation Loop ---
  const animate = useCallback(() => {
    if (isRunning) {
      setNow((prev) => prev + REFRESH_RATE * 3);

      setActiveTx((currentTx) => {
        if (!currentTx) return null;

        const tt = getTrueTime(now);
        const elapsedTime = now - currentTx.startRealTime;

        let phase = currentTx.phase;
        let logs = [...currentTx.logs];

        if (phase === "paxos") {
          if (elapsedTime > currentTx.paxosLatency) {
            phase = "wait";
            logs.push(`Paxos Consensus achieved at T=${Math.floor(now)}`);
          }
        }

        if (phase === "wait") {
          const isSafe = tt.earliest > currentTx.commitTimestamp;
          if (mode === "unsafe" || isSafe) {
            finalizeCommit(currentTx, now, isSafe);
            return null;
          }
        }

        return { ...currentTx, phase, logs };
      });
    }
    reqRef.current = requestAnimationFrame(animate);
  }, [isRunning, now, getTrueTime, mode]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [animate]);

  // --- Actions ---
  const startTransaction = () => {
    if (activeTx) return;
    const noise = Math.random() * 100 - 50;
    setClockNoise(noise);

    const tt = getTrueTime(now);
    const commitTimestamp = tt.latest;

    const newTx = {
      id: history.length > 0 ? history[history.length - 1].id + 1 : 1,
      startRealTime: now,
      commitTimestamp,
      paxosLatency: PAXOS_LATENCY_BASE + Math.random() * 200,
      phase: "paxos",
      logs: [`Tx Started. Assigned Timestamp S = ${Math.floor(commitTimestamp)}`],
      clockNoise: noise,
    };

    setActiveTx(newTx);
  };

  const finalizeCommit = (tx, endTime, isSafe) => {
    const finishedTx = { ...tx, endRealTime: endTime, isSafe, violation: null };

    if (history.length > 0) {
      const prev = history[history.length - 1];
      if (tx.startRealTime > prev.endRealTime) {
        if (tx.commitTimestamp < prev.commitTimestamp) {
          finishedTx.violation = "LINEARIZABILITY VIOLATION: Timestamp Inversion";
        }
      }
    }

    if (tx.commitTimestamp > endTime) {
      finishedTx.futureTimestamp = true;
      if (!finishedTx.violation) finishedTx.violation = "INVARIANT FAILURE: Timestamp is in the future";
    }

    setHistory((prev) => [...prev, finishedTx].slice(-MAX_HISTORY));
    setActiveTx(null);
  };

  // --- Render Helpers ---
  const timeToX = (t) => 300 + (t - now) * PX_PER_MS;
  const tt = getTrueTime(now);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                Spanner Simulation
              </h1>
              <p className="text-xs text-slate-500">
                Visualizing <span className="text-blue-600 dark:text-blue-300 font-mono">TrueTime</span> and{" "}
                <span className="text-amber-600 dark:text-amber-300 font-mono">Commit Wait</span> mechanics
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Mode</label>
              <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-slate-300 dark:border-slate-700">
                <button
                  onClick={() => setMode("safe")}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mode === "safe" ? "bg-green-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
                >
                  Safe (Wait)
                </button>
                <button
                  onClick={() => setMode("unsafe")}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mode === "unsafe" ? "bg-red-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
                >
                  Unsafe (Skip)
                </button>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

            <div className="flex flex-col gap-1 w-48">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                <span>Uncertainty (ε)</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{epsilon}ms</span>
              </label>
              <input
                type="range" min="1000" max="5000" step="100"
                value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))}
                className="h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

            <div className="flex gap-2">
              <button onClick={() => setIsRunning(!isRunning)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={() => { setHistory([]); setActiveTx(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION AREA
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Visualization */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Timeline */}
            <div className="relative h-64 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
              <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest z-10">
                Absolute Time Continuum
              </div>

              {/* Moving Grid */}
              <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => {
                  const x = i * 200 - (now * PX_PER_MS) % 200;
                  return <div key={i} className="absolute top-0 bottom-0 border-l border-slate-200/50 dark:border-slate-800/50" style={{ left: x }} />;
                })}
              </div>

              {/* NOW Marker */}
              <div className="absolute top-0 bottom-0 left-[300px] w-0.5 bg-slate-900 dark:bg-white z-20 shadow-[0_0_15px_rgba(0,0,0,0.3)] dark:shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                <div className="absolute -top-1 left-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  T<sub>abs</sub> (Real Time)
                </div>
              </div>

              {/* TrueTime Cloud */}
              <div
                className="absolute top-12 h-20 bg-blue-500/10 border-x border-blue-500/30 backdrop-blur-[2px] z-10 flex flex-col justify-between py-2 transition-all duration-75"
                style={{ left: 300 - epsilon * PX_PER_MS, width: epsilon * 2 * PX_PER_MS }}
              >
                <div className="flex justify-between w-full px-2 text-[9px] text-blue-600 dark:text-blue-400 font-mono opacity-80">
                  <span>Earliest</span>
                  <span className="font-bold">TRUE TIME INTERVAL</span>
                  <span>Latest</span>
                </div>
                <div className="flex justify-between w-full px-1 text-[10px] text-blue-700 dark:text-blue-100 font-mono font-bold">
                  <span>{Math.floor(tt.earliest)}</span>
                  <span className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded text-[9px] text-blue-600 dark:text-blue-200">Ref: {Math.floor(tt.reference)}</span>
                  <span>{Math.floor(tt.latest)}</span>
                </div>
                <div className="w-full text-center text-[9px] text-blue-500/70 font-mono">
                  Total Uncertainty: {epsilon * 2}ms
                </div>
              </div>

              {/* Active Transaction Markers */}
              {activeTx && (
                <>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-amber-500 z-10"
                    style={{ left: timeToX(activeTx.commitTimestamp) }}
                  >
                    <div className="absolute top-36 left-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 text-[10px] px-2 py-1 rounded border border-amber-300 dark:border-amber-500/50 whitespace-nowrap">
                      Timestamp S = {Math.floor(activeTx.commitTimestamp)}
                    </div>
                  </div>

                  {activeTx.phase === "paxos" && (
                    <div
                      className="absolute top-40 h-4 bg-purple-500/50 border border-purple-400 rounded z-10 flex items-center justify-center text-[9px] text-white"
                      style={{
                        left: timeToX(activeTx.startRealTime),
                        width: Math.min(now - activeTx.startRealTime, activeTx.paxosLatency) * PX_PER_MS,
                      }}
                    >
                      Paxos Replication
                    </div>
                  )}

                  {activeTx.phase === "wait" && (
                    <div
                      className="absolute top-44 h-4 bg-amber-500/50 border border-amber-400 rounded z-10 flex items-center justify-center text-[9px] text-white animate-pulse"
                      style={{
                        left: timeToX(activeTx.startRealTime + activeTx.paxosLatency),
                        width: (now - (activeTx.startRealTime + activeTx.paxosLatency)) * PX_PER_MS,
                      }}
                    >
                      Commit Wait
                    </div>
                  )}
                </>
              )}

              {/* Past Transactions */}
              {history.map((tx) => (
                <div
                  key={tx.id}
                  className={`absolute top-28 w-3 h-3 rounded-full border-2 z-10 ${tx.violation ? "bg-red-500 border-red-300" : "bg-green-500 border-green-300"}`}
                  style={{ left: timeToX(tx.commitTimestamp) }}
                />
              ))}
            </div>

            {/* Consistency Validator */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="text-green-500 dark:text-green-400" size={18} /> Consistency Validator
                </h3>
                <span className="text-xs text-slate-500">
                  Checking Invariant: S &lt; T<sub>abs</sub>(commit)
                </span>
              </div>

              <div className="space-y-3">
                {history.length === 0 && (
                  <div className="text-center text-slate-400 dark:text-slate-600 text-sm py-4">No transactions committed yet.</div>
                )}
                {[...history].reverse().map((tx) => (
                  <div key={tx.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                    <div className="col-span-1 font-bold text-blue-600 dark:text-blue-400">#{tx.id}</div>
                    <div className="col-span-7 flex flex-col gap-1">
                      <div className="flex items-center text-xs">
                        <span className="w-24 text-slate-500">Assigned TS:</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400">{Math.floor(tx.commitTimestamp)}</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="w-24 text-slate-500">Real Commit:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{Math.floor(tx.endRealTime)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 bg-amber-500 w-1" style={{ left: "40%" }} />
                        <div
                          className={`absolute top-0 bottom-0 w-1 ${tx.violation ? "bg-red-500" : "bg-green-500"}`}
                          style={{ left: tx.violation || tx.futureTimestamp ? "30%" : "60%" }}
                        />
                      </div>
                    </div>
                    <div className="col-span-4 flex justify-end">
                      {tx.violation || tx.futureTimestamp ? (
                        <div className="text-right">
                          <div className="text-red-500 dark:text-red-400 font-bold text-xs flex items-center justify-end gap-1">
                            <XCircle size={14} /> VIOLATION
                          </div>
                          <div className="text-[9px] text-red-400 dark:text-red-500/70">{tx.violation || "Future Timestamp Detected"}</div>
                        </div>
                      ) : (
                        <div className="text-green-600 dark:text-green-500 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 size={14} /> CONSISTENT
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Action & State Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-xl">
              <button
                onClick={startTransaction}
                disabled={activeTx !== null}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
              >
                {activeTx ? <Activity className="animate-spin" /> : <Zap />}
                {activeTx ? "Processing..." : "Start Transaction"}
              </button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                Starts a write operation handled by a Coordinator Leader.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
                <Layers size={16} /> System State
              </h3>
              {!activeTx ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm italic">
                  System Idle. Ready for write requests.
                </div>
              ) : (
                <div className="space-y-6">
                  <SimStep active completed={activeTx.phase !== "start"} title="Timestamp Assignment"
                    desc={`Leader picks S = TT.now().latest (${Math.floor(activeTx.commitTimestamp)}). This puts S in the future relative to local start time.`}
                  />
                  <SimStep active completed={activeTx.phase !== "paxos"} title="Paxos Replication"
                    desc="Log is replicated to majority of replicas. This latency often hides the Commit Wait."
                  />
                  <SimStep active={activeTx.phase === "wait"} completed={false} title="Commit Wait"
                    highlight={activeTx.phase === "wait"}
                    desc={mode === "safe"
                      ? `Ensuring TT.now().earliest > S. Waiting for uncertainty (${Math.floor(activeTx.commitTimestamp - tt.earliest)}ms remaining)...`
                      : "SKIPPING WAIT (Unsafe Mode). Committing immediately."}
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-lg text-xs text-blue-700 dark:text-blue-200">
              <strong className="block mb-1 text-blue-800 dark:text-blue-100">Why does this matter?</strong>
              If we commit before the timestamp is definitely in the past (Unsafe Mode), a client might see the data, tell a friend, and that friend might read from a different replica that thinks the data is &quot;from the future&quot; and invisible. This breaks causality.
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE SECTION
          ============================================================ */}
      <div className="border-t-2 border-blue-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — OSDI 2012
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 dark:from-blue-400 dark:via-cyan-300 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
              Spanner: Google's Globally-Distributed Database
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              The first system to distribute data at global scale and support externally-consistent distributed transactions, powered by a novel TrueTime API that exposes clock uncertainty.
            </p>
          </div>

          {/* ---- What is Spanner ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Globe className="w-5 h-5" />} title="What Is Spanner?" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Spanner is a <strong className="text-blue-600 dark:text-blue-300">scalable, globally-distributed, synchronously-replicated</strong> database built by Google.
                It shards data across many Paxos state machines in datacenters worldwide, automatically resharding and migrating data to balance load.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Scale" value="Millions" sub="of machines across hundreds of DCs" color="blue" />
                <StatCard label="Data" value="Trillions" sub="of database rows, globally distributed" color="emerald" />
                <StatCard label="Uncertainty" value="< 10ms" sub="clock bound via GPS + atomic clocks" color="amber" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-amber-700 dark:text-amber-300">Key insight:</strong> Spanner assigns globally-meaningful commit timestamps to transactions.
                  The serialization order satisfies <strong className="text-slate-900 dark:text-slate-200">external consistency</strong> (linearizability):
                  if T1 commits before T2 starts, then T1's timestamp &lt; T2's timestamp.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Architecture ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Server className="w-5 h-5" />} title="Architecture — Spanserver Stack" />
            <div className="grid md:grid-cols-2 gap-5">
              <HwCard icon={<Globe className="w-6 h-6" />} color="blue" title="Universe & Zones"
                specs={["Zones = unit of deployment", "Data replication across zones"]}
                desc="A Spanner deployment is a 'universe'. Zones (analogous to Bigtable deployments) are units of administrative deployment and physical isolation. Each zone has a zonemaster and hundreds of spanservers."
              />
              <HwCard icon={<Database className="w-6 h-6" />} color="indigo" title="Spanserver"
                specs={["100–1000 tablets each", "Paxos per tablet"]}
                desc="Each spanserver manages tablets (bags of (key, timestamp) → value mappings). Each tablet has its own Paxos state machine for replication, a lock table for 2PL concurrency, and a transaction manager for distributed transactions."
              />
              <HwCard icon={<Layers className="w-6 h-6" />} color="emerald" title="Directories"
                specs={["Unit of data placement", "Same replication config"]}
                desc="Directories are sets of contiguous keys sharing a common prefix. They are the unit of data movement between Paxos groups (via Movedir) and the smallest unit whose geographic placement can be configured."
              />
              <HwCard icon={<Lock className="w-6 h-6" />} color="amber" title="Concurrency Control"
                specs={["2PL for RW transactions", "Lock-free reads"]}
                desc="Read-write transactions use two-phase locking with wound-wait deadlock avoidance. Read-only transactions execute at a system-chosen timestamp without locking, on any sufficiently up-to-date replica."
              />
            </div>
          </section>

          {/* ---- TrueTime ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Clock className="w-5 h-5" />} title="TrueTime — The Key Enabler" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                TrueTime is a novel API that <strong className="text-blue-600 dark:text-blue-300">explicitly exposes clock uncertainty</strong>.
                Unlike standard time interfaces, it returns an interval guaranteed to contain the true time, not a single point.
              </p>

              {/* API Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-3 text-slate-500 font-bold text-xs uppercase">Method</th>
                      <th className="text-left p-3 text-slate-500 font-bold text-xs uppercase">Returns</th>
                      <th className="text-left p-3 text-slate-500 font-bold text-xs uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">TT.now()</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400">TTinterval: [earliest, latest]</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">Returns interval guaranteed to contain absolute time</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">TT.after(t)</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400">boolean</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">True if t has definitely passed</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">TT.before(t)</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400">boolean</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">True if t has definitely not arrived</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">GPS Masters</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Majority of time masters have GPS receivers with dedicated antennas. They advertise uncertainty typically close to <strong className="text-slate-900 dark:text-slate-200">zero</strong>.
                  </p>
                </div>
                <div className="rounded-xl border-2 border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Armageddon Masters</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Equipped with <strong className="text-slate-900 dark:text-slate-200">atomic clocks</strong> for uncorrelated failure modes. They advertise slowly increasing uncertainty derived from worst-case clock drift.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <Info className="w-3.5 h-3.5" /> TrueTime guarantee (formal)
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  For invocation <span className="text-blue-600 dark:text-blue-400">tt = TT.now()</span>:&nbsp;
                  <span className="text-emerald-600 dark:text-emerald-300">tt.earliest</span> ≤ t<sub>abs</sub>(e<sub>now</sub>) ≤{" "}
                  <span className="text-amber-600 dark:text-amber-300">tt.latest</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 font-sans">
                  ε (half the interval width) is typically a sawtooth from ~1 to 7ms, averaging ~4ms. Poll interval = 30s, drift rate = 200μs/sec.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Commit Protocol ---- */}
          <section className="mb-16">
            <SectionTitle icon={<ArrowDown className="w-5 h-5" />} title="Read-Write Transaction — Step by Step" />
            <div className="space-y-4">
              <FlowStep num={1} color="blue" icon={<Database className="w-5 h-5" />} title="Client buffers writes"
                desc="All writes are buffered at the client. Reads acquire locks at the leader replica of the appropriate Paxos group using wound-wait deadlock avoidance."
              />
              <FlowStep num={2} color="indigo" icon={<ArrowRight className="w-5 h-5" />} title="Two-phase commit begins"
                desc="Client chooses a coordinator group and sends commit messages to each participant leader with the coordinator's identity and buffered writes."
              />
              <FlowStep num={3} color="purple" icon={<Lock className="w-5 h-5" />} title="Participants prepare"
                desc="Each non-coordinator participant acquires write locks, picks a prepare timestamp (monotonically increasing), and logs a prepare record through Paxos."
              />
              <FlowStep num={4} color="amber" icon={<Clock className="w-5 h-5" />} title="Coordinator assigns commit timestamp"
                desc="The coordinator picks S ≥ max(all prepare timestamps), S ≥ TT.now().latest at commit receipt, S > any previous timestamp assigned. Logs commit through Paxos."
              />
              <FlowStep num={5} color="red" icon={<AlertTriangle className="w-5 h-5" />} title="Commit Wait"
                desc="Coordinator waits until TT.after(S) is true — ensuring S is definitely in the past. Expected wait ≥ 2ε. This wait overlaps with Paxos communication."
              />
              <FlowStep num={6} color="emerald" icon={<CheckCircle2 className="w-5 h-5" />} title="Commit & release"
                desc="Coordinator sends the commit timestamp to the client and all participants. Each applies at the same timestamp and releases locks."
              />
            </div>
          </section>

          {/* ---- External Consistency Proof ---- */}
          <section className="mb-16">
            <SectionTitle icon={<ShieldCheck className="w-5 h-5" />} title="External Consistency — The Proof" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                The protocol guarantees: if T1 commits before T2 starts, then <strong className="text-blue-600 dark:text-blue-300">s1 &lt; s2</strong>.
                This is enforced by two rules — <strong className="text-emerald-600 dark:text-emerald-300">Start</strong> and <strong className="text-amber-600 dark:text-amber-300">Commit Wait</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 font-mono text-sm space-y-2">
                <ProofLine left="s₁ < t_abs(e₁ᶜᵒᵐᵐⁱᵗ)" right="commit wait" color="amber" />
                <ProofLine left="t_abs(e₁ᶜᵒᵐᵐⁱᵗ) < t_abs(e₂ˢᵗᵃʳᵗ)" right="assumption" color="slate" />
                <ProofLine left="t_abs(e₂ˢᵗᵃʳᵗ) ≤ t_abs(e₂ˢᵉʳᵛᵉʳ)" right="causality" color="slate" />
                <ProofLine left="t_abs(e₂ˢᵉʳᵛᵉʳ) ≤ s₂" right="start rule" color="emerald" />
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <ProofLine left="∴ s₁ < s₂" right="transitivity ✓" color="blue" />
                </div>
              </div>
            </div>
          </section>

          {/* ---- Transaction Types ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Layers className="w-5 h-5" />} title="Transaction Types" />
            <div className="grid md:grid-cols-3 gap-5">
              <TxTypeCard title="Read-Write" concurrency="Pessimistic (2PL)" replica="Leader"
                desc="Full ACID transactions with wound-wait deadlock avoidance. Timestamps assigned at commit via Paxos."
                color="blue"
              />
              <TxTypeCard title="Read-Only" concurrency="Lock-free" replica="Any (up-to-date)"
                desc="Predeclared as no writes. Execute at a system-chosen timestamp. No locking, so they don't block writes."
                color="emerald"
              />
              <TxTypeCard title="Snapshot Read" concurrency="Lock-free" replica="Any (up-to-date)"
                desc="Read at a client-specified timestamp or staleness bound. Proceeds on any sufficiently up-to-date replica."
                color="amber"
              />
            </div>
          </section>

          {/* ---- Performance ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Activity className="w-5 h-5" />} title="Performance & Real-World Impact" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Spanner's first major customer was <strong className="text-blue-600 dark:text-blue-300">F1</strong>, Google's advertising backend (rewritten from MySQL).
                F1 uses 5 replicas across the US — 2 on the west coast, 3 on the east coast — to survive major natural disasters.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard label="Read Latency" value="8.7ms" sub="mean across 21.5B reads" color="green" />
                <MetricCard label="Single-site Commit" value="72.3ms" sub="mean latency" color="blue" />
                <MetricCard label="Multi-site Commit" value="103ms" sub="mean latency" color="amber" />
                <MetricCard label="ε (typical)" value="1–7ms" sub="sawtooth, avg ~4ms" color="indigo" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-emerald-700 dark:text-emerald-300">Automatic failover</strong> has been nearly invisible to F1.
                  Despite unplanned cluster failures, the most intervention required was updating schema to move Paxos leaders closer to shifted frontends.
                </p>
              </div>
            </div>
          </section>

          {/* ---- How to use sim ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Eye className="w-5 h-5" />} title="Using the Simulator Above" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageCard step="1" title="Start Transaction" desc="Click to initiate a write. Watch the Paxos replication bar, then the Commit Wait bar on the timeline." color="blue" />
              <UsageCard step="2" title="Safe vs Unsafe" desc="Toggle mode. Safe waits for TT.after(S). Unsafe skips the wait — watch for consistency violations!" color="emerald" />
              <UsageCard step="3" title="Adjust ε" desc="Increase uncertainty to see longer commit waits. Decrease to see Spanner run faster but with tighter bounds." color="amber" />
              <UsageCard step="4" title="Check Validator" desc="The Consistency Validator checks every committed transaction against Spanner's invariant: S < T_abs(commit)." color="slate" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ================================================================
//  SUB-COMPONENTS
// ================================================================

function SimStep({ active, completed, title, desc, highlight }) {
  return (
    <div className={`relative pl-4 border-l-2 transition-all duration-300 ${completed ? "border-green-500" : active ? "border-blue-500" : "border-slate-300 dark:border-slate-700"}`}>
      <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${completed ? "bg-green-500" : active ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"}`} />
      <h4 className={`text-sm font-bold ${completed ? "text-green-600 dark:text-green-400" : active ? "text-blue-600 dark:text-blue-300" : "text-slate-500"}`}>{title}</h4>
      <p className={`text-xs mt-1 transition-colors ${active ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"}`}>{desc}</p>
      {highlight && <div className="mt-2 h-1 w-full bg-amber-500/50 rounded animate-pulse" />}
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   border: "border-indigo-200 dark:border-indigo-500/30",   text: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
  orange:  { bg: "bg-orange-50 dark:bg-orange-500/10",   border: "border-orange-200 dark:border-orange-500/30",   text: "text-orange-600 dark:text-orange-400" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-500/10",       border: "border-cyan-200 dark:border-cyan-500/30",       text: "text-cyan-600 dark:text-cyan-400" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-500/10",   border: "border-purple-200 dark:border-purple-500/30",   text: "text-purple-600 dark:text-purple-400" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400" },
  slate:   { bg: "bg-slate-100 dark:bg-slate-500/10",    border: "border-slate-300 dark:border-slate-500/30",     text: "text-slate-600 dark:text-slate-400" },
  green:   { bg: "bg-green-50 dark:bg-green-500/10",     border: "border-green-200 dark:border-green-500/30",     text: "text-green-600 dark:text-green-400" },
};

function HwCard({ icon, color, title, specs, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 ${c.text}`}>{icon}</div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {specs.map((s) => <span key={s} className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>{s}</span>)}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FlowStep({ num, color, icon, title, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
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

function StatCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 text-center`}>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{label}</div>
      <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function ProofLine({ left, right, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.slate;
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-700 dark:text-slate-300">{left}</span>
      <span className={`text-xs font-sans ${c.text}`}>({right})</span>
    </div>
  );
}

function TxTypeCard({ title, concurrency, replica, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>{concurrency}</span>
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>{replica}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm dark:shadow-none text-center">
      <div className={`text-xl font-bold font-mono ${c.text}`}>{value}</div>
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{label}</div>
      <div className="text-[10px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function UsageCard({ step, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{step}</div>
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
