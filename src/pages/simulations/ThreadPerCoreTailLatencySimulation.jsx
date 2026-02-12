import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Cpu, Database, Lock, Unlock, Zap, Activity, Play, Pause, RefreshCw,
  Server, Network, ShieldCheck, ArrowRight, Layers, LayoutGrid, CheckCircle2,
  AlertTriangle, Info, BookOpen, Clock, Settings, FileText, Share2, SplitSquareHorizontal,
  Moon, Sun, Gauge
} from "lucide-react";

// ================================================================
//  SIMULATION CONFIG
// ================================================================
const TICK_RATE = 400; // ms per tick
const NUM_CORES = 4;
const REQ_SPAWN_RATE = 1.8; // average requests per tick
const IRQ_PROBABILITY = 0.15; // 15% chance of IRQ per core per tick (when not isolated)

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function ThreadPerCoreTailLatencySimulation() {
  const { theme, setTheme } = useTheme();

  // --- Simulation State ---
  const [isRunning, setIsRunning] = useState(false);
  const [irqIsolated, setIrqIsolated] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  // Traditional (Shared-Everything) State
  const [tradQueue, setTradQueue] = useState([]);
  const [tradCores, setTradCores] = useState(
    Array.from({ length: NUM_CORES }).map((_, i) => ({ id: i, state: "idle", req: null, irqTimer: 0 }))
  );
  const [tradDbLock, setTradDbLock] = useState(null); // null or coreId
  const [tradStats, setTradStats] = useState({ completed: 0, latencies: [] });

  // TPC (Shared-Nothing/Sphinx) State
  const [tpcIncoming, setTpcIncoming] = useState([]); // Network queue before steering
  const [tpcCores, setTpcCores] = useState(
    Array.from({ length: NUM_CORES }).map((_, i) => ({
      id: i,
      state: "idle",
      req: null,
      mailbox: [], // Local queue for this shard
      irqTimer: 0
    }))
  );
  const [tpcStats, setTpcStats] = useState({ completed: 0, latencies: [] });

  // Logs
  const [logs, setLogs] = useState([]);

  // Refs for loop
  const stateRef = useRef({ tradCores, tradDbLock, tradQueue, tpcCores, tpcIncoming });

  // --- Initialization / Reset ---
  useEffect(() => {
    resetSim();
  }, []);

  const resetSim = () => {
    setTradQueue([]);
    setTradCores(Array.from({ length: NUM_CORES }).map((_, i) => ({ id: i, state: "idle", req: null, irqTimer: 0 })));
    setTradDbLock(null);
    setTradStats({ completed: 0, latencies: [] });

    setTpcIncoming([]);
    setTpcCores(Array.from({ length: NUM_CORES }).map((_, i) => ({ id: i, state: "idle", req: null, mailbox: [], irqTimer: 0 })));
    setTpcStats({ completed: 0, latencies: [] });

    setLogs([]);
    setTickCount(0);
    setIsRunning(false);
    addLog("System", "Simulation initialized. Waiting to start.");
  };

  const addLog = (source, msg, type = "info") => {
    setLogs((prev) => [{ source, msg, type, time: new Date() }, ...prev].slice(0, 40));
  };

  // --- Core Simulation Loop ---
  const runTick = useCallback(() => {
    if (!isRunning) return;

    setTickCount((c) => c + 1);

    // 1. Generate Traffic
    const newReqs = [];
    const numReqs = Math.random() < (REQ_SPAWN_RATE % 1) ? Math.ceil(REQ_SPAWN_RATE) : Math.floor(REQ_SPAWN_RATE);
    for (let i = 0; i < numReqs; i++) {
      newReqs.push({
        id: Math.random().toString(36).substr(2, 4).toUpperCase(),
        shard: Math.floor(Math.random() * NUM_CORES), // Which data partition it needs
        spawnTick: tickCount,
      });
    }

    if (newReqs.length > 0) {
        addLog("Network", `Received ${newReqs.length} new requests.`);
    }

    // --- PROCESS TRADITIONAL (Shared-Everything) ---
    setTradCores((prevCores) => {
      let nextCores = [...prevCores];
      let nextQueue = [...stateRef.current.tradQueue, ...newReqs];
      let currentLock = stateRef.current.tradDbLock;
      let newCompleted = 0;
      let newLatencies = [];

      for (let i = 0; i < NUM_CORES; i++) {
        let core = { ...nextCores[i] };

        // Handle IRQ
        if (core.irqTimer > 0) {
          core.irqTimer--;
          if (core.irqTimer === 0) {
              core.state = core.req ? (currentLock === core.id ? "processing" : "waiting") : "idle";
          } else {
              core.state = "irq";
          }
        } else if (!irqIsolated && Math.random() < IRQ_PROBABILITY) {
          core.irqTimer = 1; // Block for 1 tick
          core.state = "irq";
          addLog("IRQ", `Traditional Core ${core.id} interrupted!`, "warning");
        } 
        
        // If not IRQ blocked, do work
        if (core.state !== "irq") {
            if (core.state === "processing") {
                // Finished processing
                newCompleted++;
                newLatencies.push(tickCount - core.req.spawnTick);
                currentLock = null; // Release lock
                core.req = null;
                core.state = "idle";
            }

            if (core.state === "idle" && nextQueue.length > 0) {
                // Pick up new request
                core.req = nextQueue.shift();
                core.state = "waiting"; // Must wait for lock
            }

            if (core.state === "waiting") {
                // Try to acquire lock
                if (currentLock === null) {
                    currentLock = core.id;
                    core.state = "processing";
                }
            }
        }
        nextCores[i] = core;
      }

      stateRef.current.tradDbLock = currentLock;
      stateRef.current.tradQueue = nextQueue;
      setTradQueue(nextQueue);
      setTradDbLock(currentLock);
      if (newCompleted > 0) {
          setTradStats(s => ({ 
              completed: s.completed + newCompleted, 
              latencies: [...s.latencies, ...newLatencies].slice(-50) 
          }));
      }
      return nextCores;
    });

    // --- PROCESS TPC (Shared-Nothing/Sphinx) ---
    setTpcCores((prevCores) => {
      let nextCores = [...prevCores];
      let incoming = [...stateRef.current.tpcIncoming, ...newReqs];
      let newCompleted = 0;
      let newLatencies = [];

      // 1. Distribute incoming network packets to core mailboxes (OS Network Stack steering)
      // In a real system, the NIC steers. Here we simulate random initial landing.
      while (incoming.length > 0) {
          const req = incoming.shift();
          const landingCore = Math.floor(Math.random() * NUM_CORES);
          nextCores[landingCore].mailbox.push({ ...req, routed: false });
      }

      // 2. Process Cores
      for (let i = 0; i < NUM_CORES; i++) {
        let core = { ...nextCores[i], mailbox: [...nextCores[i].mailbox] };

        // Handle IRQ
        if (core.irqTimer > 0) {
          core.irqTimer--;
          if (core.irqTimer === 0) {
              core.state = "idle";
          } else {
              core.state = "irq";
          }
        } else if (!irqIsolated && Math.random() < IRQ_PROBABILITY) {
          core.irqTimer = 1; 
          core.state = "irq";
          addLog("IRQ", `TPC Core ${core.id} interrupted!`, "warning");
        }

        // Work phase
        if (core.state !== "irq") {
            if (core.state === "processing") {
                // Finish local processing
                newCompleted++;
                newLatencies.push(tickCount - core.req.spawnTick);
                core.req = null;
                core.state = "idle";
            } else if (core.state === "forwarding") {
                // Finished sending message, ready for next
                core.req = null;
                core.state = "idle";
            }

            if (core.state === "idle" && core.mailbox.length > 0) {
                const req = core.mailbox.shift();
                core.req = req;
                
                if (req.shard === core.id) {
                    // Belongs to this core. Process it!
                    core.state = "processing";
                } else {
                    // Belongs to another core. Forward via message passing.
                    core.state = "forwarding";
                    nextCores[req.shard].mailbox.push({ ...req, routed: true });
                    // addLog("TPC", `Core ${core.id} forwarding req to Core ${req.shard}`);
                }
            }
        }
        nextCores[i] = core;
      }

      setTpcIncoming([]);
      if (newCompleted > 0) {
          setTpcStats(s => ({ 
              completed: s.completed + newCompleted, 
              latencies: [...s.latencies, ...newLatencies].slice(-50) 
          }));
      }
      return nextCores;
    });

  }, [isRunning, irqIsolated, tickCount]);

  useEffect(() => {
    stateRef.current = { tradCores, tradDbLock, tradQueue, tpcCores, tpcIncoming };
  }, [tradCores, tradDbLock, tradQueue, tpcCores, tpcIncoming]);

  useEffect(() => {
    const interval = setInterval(runTick, TICK_RATE);
    return () => clearInterval(interval);
  }, [runTick]);

  // --- Helpers ---
  const calculateP99 = (latencies) => {
      if (latencies.length === 0) return 0;
      const sorted = [...latencies].sort((a, b) => a - b);
      const index = Math.max(0, Math.floor(sorted.length * 0.99) - 1);
      return sorted[index];
  };

  const getLatencyColor = (val) => {
      if (val === 0) return "text-slate-500";
      if (val < 5) return "text-green-400";
      if (val < 10) return "text-amber-400";
      return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl sticky top-4 z-50">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <LayoutGrid size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
                Thread-Per-Core Architecture
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Application Tail Latency Sim (EuroSys '19)</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
              
              {/* IRQ Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase px-2">IRQ Affinity</span>
                  <button 
                      onClick={() => setIrqIsolated(false)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!irqIsolated ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      title="Interrupts hit all cores randomly (irqbalance enabled)"
                  >
                      Shared (Off)
                  </button>
                  <button 
                      onClick={() => setIrqIsolated(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${irqIsolated ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      title="Interrupts isolated to dedicated NIC cores"
                  >
                      Isolated (On)
                  </button>
              </div>

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block" />

              {/* Play / Reset */}
              <div className="flex gap-2">
                  <button onClick={() => setIsRunning(!isRunning)} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isRunning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/50' : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/50'}`}>
                      {isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> RUN SIM</>}
                  </button>
                  <button onClick={resetSim} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors">
                      <RefreshCw size={18} />
                  </button>
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors hidden md:block">
                      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
              </div>
          </div>
        </div>

        {/* ============================================================
            SIMULATION COMPARISON GRID
            ============================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* 1. TRADITIONAL (Shared-Everything) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Share2 size={18} className="text-amber-500" /> Traditional (Shared-Everything)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">e.g., standard Memcached</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-end gap-1 mb-1"><Gauge size={12} /> P99 Tail Latency</div>
                        <div className={`text-2xl font-mono font-black ${getLatencyColor(calculateP99(tradStats.latencies))}`}>
                            {calculateP99(tradStats.latencies) > 0 ? `${calculateP99(tradStats.latencies)}t` : '--'}
                        </div>
                    </div>
                </div>

                {/* Network Queue */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Global Incoming Queue (epoll)</div>
                    <div className="h-10 w-full max-w-sm bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center px-2 gap-1 overflow-hidden">
                        {tradQueue.slice(0, 15).map((q, i) => (
                            <div key={i} className="w-4 h-6 bg-amber-200 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 rounded-sm shrink-0" />
                        ))}
                        {tradQueue.length === 0 && <span className="text-xs text-slate-400 italic mx-auto">Empty</span>}
                    </div>
                </div>

                {/* Cores & Shared DB */}
                <div className="relative flex-1 min-h-[300px] flex flex-col items-center justify-center">
                    
                    {/* The Cores */}
                    <div className="flex gap-4 justify-center w-full relative z-10 mb-16">
                        {tradCores.map(core => (
                            <div key={core.id} className={`w-20 h-24 rounded-xl border-2 flex flex-col items-center p-2 relative transition-all duration-300
                                ${core.state === 'irq' ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                                  core.state === 'processing' ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-500/50' : 
                                  core.state === 'waiting' ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/20 dark:border-amber-500/50' : 
                                  'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Core {core.id}</div>
                                <Cpu size={24} className={core.state === 'irq' ? 'text-red-500 animate-pulse' : core.state === 'idle' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'} />
                                
                                {/* Status Badge */}
                                <div className="mt-auto text-[9px] font-bold uppercase rounded px-1.5 py-0.5 w-full text-center truncate
                                    ${core.state === 'irq' ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 
                                      core.state === 'processing' ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                      core.state === 'waiting' ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' :
                                      'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}">
                                    {core.state === 'waiting' ? 'WAIT LOCK' : core.state}
                                </div>

                                {/* Active Request Indicator */}
                                {core.req && core.state !== 'irq' && (
                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    </div>
                                )}
                                
                                {/* IRQ Lightning */}
                                {core.state === 'irq' && (
                                    <Zap size={24} className="absolute -top-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] z-20" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Connecting Lines to Shared DB */}
                    <div className="absolute top-[100px] left-0 right-0 h-16 pointer-events-none flex justify-center opacity-30">
                        {tradCores.map(core => (
                            <div key={core.id} className={`absolute w-0.5 h-full ${tradDbLock === core.id ? 'bg-green-500 opacity-100 shadow-[0_0_8px_#22c55e]' : 'bg-slate-400 dark:bg-slate-600'} transition-all`} 
                                 style={{ left: `${(core.id * 25) + 12.5}%`, transform: `skewX(${core.id < 2 ? '20deg' : '-20deg'})` }} />
                        ))}
                    </div>

                    {/* Shared Memory / Database */}
                    <div className={`relative w-64 h-24 rounded-2xl border-4 flex flex-col items-center justify-center transition-all duration-300 z-10 bg-slate-100 dark:bg-slate-800
                        ${tradDbLock !== null ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-slate-300 dark:border-slate-600'}`}>
                        
                        <div className="absolute -top-5 bg-white dark:bg-slate-900 px-3 flex items-center gap-2">
                            {tradDbLock !== null ? (
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-600">
                                    <Lock size={10} /> LOCKED BY C{tradDbLock}
                                </span>
                            ) : (
                                <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-300 dark:border-green-600">
                                    <Unlock size={10} /> UNLOCKED
                                </span>
                            )}
                        </div>

                        <Database size={32} className={tradDbLock !== null ? "text-amber-500" : "text-slate-400"} />
                        <span className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Shared Memory</span>
                    </div>

                </div>
            </div>

            {/* 2. THREAD-PER-CORE (Shared-Nothing) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <SplitSquareHorizontal size={18} className="text-blue-500" /> Thread-Per-Core (Shared-Nothing)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">e.g., Sphinx / Seastar architecture</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-end gap-1 mb-1"><Gauge size={12} /> P99 Tail Latency</div>
                        <div className={`text-2xl font-mono font-black ${getLatencyColor(calculateP99(tpcStats.latencies))}`}>
                            {calculateP99(tpcStats.latencies) > 0 ? `${calculateP99(tpcStats.latencies)}t` : '--'}
                        </div>
                    </div>
                </div>

                {/* Cores with internal Memory & Local Queues */}
                <div className="flex-1 min-h-[400px] flex flex-col justify-center gap-6 relative">
                    
                    <div className="flex gap-4 justify-center w-full relative z-10">
                        {tpcCores.map(core => (
                            <div key={core.id} className="flex flex-col items-center gap-2 w-1/4">
                                
                                {/* Local Mailbox / Queue */}
                                <div className="text-[9px] uppercase font-bold text-slate-400">Queue</div>
                                <div className="w-10 h-16 bg-slate-100 dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 p-1 flex flex-col-reverse items-center gap-0.5 overflow-hidden shadow-inner">
                                    {core.mailbox.map((m, i) => (
                                        <div key={i} className={`w-full h-2 rounded-sm shrink-0 border ${m.routed ? 'bg-purple-400/50 border-purple-500' : 'bg-blue-200 dark:bg-blue-900/50 border-blue-400'}`} title={m.routed ? 'Forwarded msg' : 'Direct packet'} />
                                    ))}
                                </div>

                                {/* Core Unit */}
                                <div className={`w-full max-w-[80px] rounded-xl border-2 flex flex-col items-center p-2 relative transition-all duration-300
                                    ${core.state === 'irq' ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                                      core.state === 'processing' ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 
                                      core.state === 'forwarding' ? 'bg-purple-50 border-purple-400 dark:bg-purple-900/20 dark:border-purple-500/50' : 
                                      'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                    
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Core {core.id}</div>
                                    <Cpu size={24} className={core.state === 'irq' ? 'text-red-500 animate-pulse' : core.state === 'idle' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'} />
                                    
                                    {/* Partitioned Memory */}
                                    <div className="w-full mt-3 pt-2 border-t border-slate-200 dark:border-slate-600 flex flex-col items-center">
                                        <Database size={14} className="text-blue-500 dark:text-blue-400 mb-1" />
                                        <div className="text-[8px] font-bold text-slate-400 uppercase">Shard {core.id}</div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`mt-2 text-[8px] font-bold uppercase rounded px-1 w-full text-center truncate
                                        ${core.state === 'irq' ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 
                                          core.state === 'processing' ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                          core.state === 'forwarding' ? 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                                          'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        {core.state === 'forwarding' ? 'MESSAGE' : core.state}
                                    </div>

                                    {/* IRQ Lightning */}
                                    {core.state === 'irq' && (
                                        <Zap size={24} className="absolute -top-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] z-20" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Inter-core Messaging Visualization */}
                    <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-dashed border-purple-300 dark:border-purple-800 opacity-50 z-0 hidden md:block" />
                    <div className="absolute top-[48%] left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-2 text-[9px] font-bold text-purple-500 uppercase tracking-widest hidden md:block">
                        Inter-Thread Message Bus
                    </div>

                </div>
            </div>
            
            {/* Logs Area spanning full width */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-inner flex flex-col h-40 overflow-hidden">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-blue-400"/> System Events
                </h3>
                <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-2 custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className={`border-l-2 pl-2 py-0.5 rounded ${
                            log.type === 'warning' ? 'border-amber-500 text-amber-400 bg-amber-950/30' : 
                            log.source === 'Network' ? 'border-blue-500 text-blue-300' :
                            'border-slate-600 text-slate-400'}`}>
                            <span className="opacity-50 mr-2">[{log.time.toLocaleTimeString([], {hour12:false, minute:'2-digit', second:'2-digit'})}]</span> 
                            {log.msg}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-600 italic">No events recorded.</div>}
                </div>
            </div>

        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0b1120] relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
          
          {/* 1. Introduction Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> EuroSys 2019 Paper Context
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              The Impact of Thread-Per-Core Architecture on Application Tail Latency
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Online services rely on parallel requests to multiple microservices. The slowest response (<strong>tail latency</strong>) dictates the overall user experience. This paper investigates how moving from traditional multi-threading to a <strong>thread-per-core (TPC) architecture</strong> eliminates locks, reduces context switching, and drastically cuts tail latency.
            </p>
          </div>

          {/* 2. Core Concepts Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TechCard 
              icon={<Share2 className="text-amber-500" />}
              title="Shared-Everything (Legacy)"
              desc="Threads share access to global memory (e.g., standard Memcached). This requires heavy locking (mutexes) to prevent race conditions. As core count increases, lock contention paralyzes the system."
            />
            <TechCard 
              icon={<SplitSquareHorizontal className="text-blue-400" />}
              title="Shared-Nothing (TPC)"
              desc="Data is partitioned (sharded) so each CPU core strictly owns a slice of memory. Locks are eliminated because only one thread ever accesses its local shard."
            />
            <TechCard 
              icon={<ShieldCheck className="text-emerald-400" />}
              title="Message Passing"
              desc="If Core 0 receives a request for a key owned by Core 1, it doesn't grab a lock. Instead, it passes a message to Core 1 via lock-free SPSC queues to do the work."
            />
          </section>

          {/* 3. The Problem: Locks & Interrupts */}
          <section className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">The Culprits of Tail Latency</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">1. Thread Synchronization</h3>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  In a shared-memory model, thread synchronization has two massive problems: the actual overhead of acquiring a lock increases processing time, and it severely limits scalability on large multicore systems because threads spend most of their time waiting in queues.
                </p>
                
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 pt-4 border-t border-slate-200 dark:border-slate-800">2. CPU Interference (IRQs)</h3>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  When a packet arrives on the NIC, an interrupt request (IRQ) is generated. By default on Linux (<code>irqbalance</code>), these interrupts bounce across all CPU cores. If an interrupt hits a core that is holding a database lock, <strong>the entire system halts</strong> until the interrupt is handled and the lock is released.
                </p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Interrupt Handling Strategies</h3>
                  <div className="space-y-4">
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900/50">
                          <strong className="text-red-700 dark:text-red-400 block mb-1">IRQ Balance Enabled (Default)</strong>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Interrupts are spread across all CPU cores. Causes cache thrashing and pauses application threads unpredictably.</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-900/50">
                          <strong className="text-green-700 dark:text-green-400 block mb-1">IRQ Affinity / Isolation (Optimized)</strong>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Specific cores are dedicated solely to handling NIC interrupts (SoftIRQs). Application threads are pinned to the remaining undisturbed cores.</p>
                      </div>
                  </div>
              </div>
            </div>
          </section>

          {/* 4. Experimental Results */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Gauge className="text-blue-500 w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Key Results (Sphinx vs Memcached)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard 
                label="Tail Latency Reduction" 
                value="Up to 71%" 
                desc="Sphinx's thread-per-core approach reduced update tail latency significantly compared to Memcached on modern hardware." 
                color="green" 
              />
              <MetricCard 
                label="Best Configuration" 
                value="IRQ Affinity ON" 
                desc="Isolating IRQs and disabling irqbalance yielded the lowest latency for both read and update operations." 
                color="blue" 
              />
              <MetricCard 
                label="Weakness" 
                value="Low Concurrency" 
                desc="For small connection counts that don't saturate all cores, TPC can have slightly higher latency due to message passing." 
                color="amber" 
              />
            </div>
          </section>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
      `}} />
    </div>
  );
}

// ================================================================
//  SUB-COMPONENTS (Standard Library)
// ================================================================

function TechCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors group shadow-sm">
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg inline-block border border-slate-200 dark:border-slate-800 group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:bg-white dark:group-hover:bg-slate-900 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

const COLOR_MAP = {
  blue:   { text: "text-blue-600 dark:text-blue-400" },
  green:  { text: "text-emerald-600 dark:text-emerald-400" },
  amber:  { text: "text-amber-600 dark:text-amber-400" },
};

function MetricCard({ label, value, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className={`text-3xl font-black font-mono mb-3 ${c.text}`}>{value}</div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}