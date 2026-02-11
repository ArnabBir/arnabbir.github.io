import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Clock,
  Zap,
  Activity,
  Server,
  Network,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  GitGraph,
  Share2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Anchor,
  Cpu,
  Timer,
  Sun,
  Moon,
  Info,
  Layers,
  Sigma,
  Workflow
} from "lucide-react";

// ================================================================
//  SIMULATION CONFIGURATION
// ================================================================
const SYNC_INTERVAL = 1500; // ms between sync pulses from Root
const PACKET_SPEED = 1.5; // % movement per tick (60fps)
const DRIFT_RATE = 0.8; // ns per tick
const RECOVERY_TIMEOUT_LEGACY = 2000; // ms (Legacy Mode)
const RECOVERY_TIMEOUT_SUNDIAL = 400; // ms (Sundial Mode)

// Topology Coordinates (0-100%)
const NODES_CONFIG = [
  { id: 0, label: "Root (GM)", x: 50, y: 10, role: "grandmaster", depth: 0 },
  { id: 1, label: "Agg 1", x: 30, y: 40, role: "switch", primaryParent: 0, backupParent: 2, depth: 1 },
  { id: 2, label: "Agg 2", x: 70, y: 40, role: "switch", primaryParent: 0, backupParent: 1, depth: 1 },
  { id: 3, label: "ToR A", x: 15, y: 80, role: "switch", primaryParent: 1, backupParent: 4, depth: 2 },
  { id: 4, label: "ToR B", x: 45, y: 80, role: "switch", primaryParent: 1, backupParent: 3, depth: 2 },
  { id: 5, label: "ToR C", x: 85, y: 80, role: "switch", primaryParent: 2, backupParent: 4, depth: 2 },
];

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function SundialSimulation() {
  const { theme, setTheme } = useTheme();

  // --- State ---
  const [isRunning, setIsRunning] = useState(false);
  const [useSundial, setUseSundial] = useState(true);
  const [showBackupGraph, setShowBackupGraph] = useState(false);
  
  const [nodes, setNodes] = useState(
    NODES_CONFIG.map((n) => ({
      ...n,
      uncertainty: 0,
      lastSyncTime: 0, // Reset on mount
      status: "synced", // synced, drifting, recovering
      activeParent: n.primaryParent,
    }))
  );
  
  const [packets, setPackets] = useState([]);
  const [failedLinks, setFailedLinks] = useState([]); 
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ maxUncertainty: 0, recoveryEvents: 0 });

  // Refs for Animation Loop Stability
  const requestRef = useRef();
  const lastTimeRef = useRef();
  const lastSyncPulseRef = useRef(0);
  
  // Ref for mutable state access inside animation loop without dependencies
  const stateRef = useRef({
    nodes: [],
    packets: [],
    failedLinks: [],
    stats: { maxUncertainty: 0, recoveryEvents: 0 },
    isRunning: false,
    useSundial: true
  });

  // Sync Refs with State
  useEffect(() => {
    stateRef.current.nodes = nodes;
    stateRef.current.packets = packets;
    stateRef.current.failedLinks = failedLinks;
    stateRef.current.stats = stats;
    stateRef.current.isRunning = isRunning;
    stateRef.current.useSundial = useSundial;
  }, [nodes, packets, failedLinks, stats, isRunning, useSundial]);

  // --- Helpers ---
  const addLog = (msg, type = "info") => {
    setLogs((prev) => [{ msg, type, time: new Date() }, ...prev].slice(0, 50));
  };

  const getLinkKey = (from, to) => `${from}-${to}`;

  const resetSim = () => {
    setIsRunning(false);
    const initialNodes = NODES_CONFIG.map((n) => ({
      ...n,
      uncertainty: 0,
      lastSyncTime: Date.now(),
      status: "synced",
      activeParent: n.primaryParent,
    }));
    setNodes(initialNodes);
    setPackets([]);
    setFailedLinks([]);
    setLogs([{ msg: "Simulation ready.", type: "info", time: new Date() }]);
    setStats({ maxUncertainty: 0, recoveryEvents: 0 });
    lastSyncPulseRef.current = 0;
  };

  const toggleLinkFailure = (from, to) => {
    const key = getLinkKey(from, to);
    setFailedLinks((prev) => {
      const isFailed = prev.includes(key);
      if (isFailed) {
        addLog(`Link ${key} restored`, "success");
        return prev.filter((k) => k !== key);
      } else {
        addLog(`Link ${key} FAILED`, "error");
        return [...prev, key];
      }
    });
  };

  // --- THE GAME LOOP ---
  const animate = (time) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const { isRunning, useSundial, nodes: currentNodes, packets: currentPackets, failedLinks, stats } = stateRef.current;

    if (isRunning) {
      let nextPackets = [];
      let nextNodes = [...currentNodes];
      let nextStats = { ...stats };
      let newLog = null;

      // 1. Packet Spawning (Root Pulse)
      if (time - lastSyncPulseRef.current > SYNC_INTERVAL) {
        lastSyncPulseRef.current = time;
        // Root sends to children
        const root = NODES_CONFIG[0];
        // Find valid targets for Root
        const targets = NODES_CONFIG.filter(n => n.primaryParent === 0 || n.backupParent === 0);
        targets.forEach(t => {
            const linkKey = getLinkKey(0, t.id);
            if (!failedLinks.includes(linkKey)) {
                nextPackets.push({
                    id: Math.random(),
                    source: 0,
                    target: t.id,
                    progress: 0,
                    hopCount: 0
                });
            }
        });
      }

      // 2. Packet Movement & Arrival
      currentPackets.forEach(p => {
        const newProgress = p.progress + PACKET_SPEED;
        
        if (newProgress >= 100) {
            // ARRIVAL LOGIC
            const targetNodeIdx = nextNodes.findIndex(n => n.id === p.target);
            if (targetNodeIdx !== -1) {
                const targetNode = nextNodes[targetNodeIdx];
                
                // Only accept packet if it comes from the ACTIVE parent
                // OR if we are drifting/recovering and it comes from a valid backup
                const isFromActive = targetNode.activeParent === p.source;
                const isRecoveryCandidate = targetNode.status !== 'synced' && (targetNode.backupParent === p.source || targetNode.primaryParent === p.source);

                if (isFromActive || isRecoveryCandidate) {
                    // Sync Successful
                    const newUncertainty = 5 + (p.hopCount * 5); // Base noise + hop penalty
                    
                    nextNodes[targetNodeIdx] = {
                        ...targetNode,
                        uncertainty: newUncertainty,
                        lastSyncTime: Date.now(),
                        status: 'synced',
                        activeParent: p.source // Latch onto this parent
                    };

                    // Propagate: Switch acts as transparent clock, immediately forwards
                    // Find children
                    const children = NODES_CONFIG.filter(n => 
                        n.primaryParent === targetNode.id || n.backupParent === targetNode.id
                    );
                    
                    children.forEach(child => {
                        const linkKey = getLinkKey(targetNode.id, child.id);
                        if (!failedLinks.includes(linkKey)) {
                            nextPackets.push({
                                id: Math.random(),
                                source: targetNode.id,
                                target: child.id,
                                progress: 0,
                                hopCount: p.hopCount + 1
                            });
                        }
                    });
                }
            }
        } else {
            // Keep moving
            nextPackets.push({ ...p, progress: newProgress });
        }
      });

      // 3. Node Physics (Drift & Timeout)
      nextNodes = nextNodes.map(n => {
          if (n.role === 'grandmaster') return n;

          // Linear Drift
          let newUncertainty = n.uncertainty + DRIFT_RATE;
          let newStatus = n.status;
          let newActiveParent = n.activeParent;

          // Timeout Check
          const timeSinceSync = Date.now() - n.lastSyncTime;
          const timeoutThreshold = useSundial ? RECOVERY_TIMEOUT_SUNDIAL : RECOVERY_TIMEOUT_LEGACY;

          if (timeSinceSync > timeoutThreshold) {
              if (n.status === 'synced') {
                  // Trigger Failure Handling
                  if (useSundial) {
                      // SUNDIAL: Fast Failover
                      if (n.backupParent !== undefined) {
                          // Check if backup link is alive (simulated local knowledge)
                          const backupKey = getLinkKey(n.backupParent, n.id); 
                          // Note: In real Sundial, we just switch Rx. 
                          // Here we switch assumption.
                          newActiveParent = n.backupParent;
                          newStatus = 'recovering';
                          if (n.status !== 'recovering') {
                              // We can't log easily inside loop without spam, 
                              // but strict mode helps. 
                              // We'll rely on visual feedback.
                              nextStats.recoveryEvents++;
                          }
                      } else {
                           newStatus = 'drifting';
                      }
                  } else {
                      // LEGACY: Wait and Drift
                      newStatus = 'drifting';
                  }
              } else if (n.status === 'recovering' && timeSinceSync > timeoutThreshold * 2) {
                  // Backup failed too?
                  newStatus = 'drifting';
              }
          }

          if (newUncertainty > nextStats.maxUncertainty) {
              nextStats.maxUncertainty = newUncertainty;
          }

          return {
              ...n,
              uncertainty: newUncertainty,
              status: newStatus,
              activeParent: newActiveParent
          };
      });

      // Update State
      setNodes(nextNodes);
      setPackets(nextPackets);
      setStats(nextStats);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // --- Visual Helpers ---
  const getNodeColor = (n) => {
      if (n.role === 'grandmaster') return 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      if (n.status === 'drifting' || n.uncertainty > 500) return 'bg-red-500 border-red-700 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]';
      if (n.status === 'recovering') return 'bg-amber-500 border-amber-600 text-white';
      if (n.uncertainty > 200) return 'bg-yellow-400 border-yellow-600 text-slate-900';
      return 'bg-blue-500 border-blue-600 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Sundial Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">Fault-Tolerant Clock Synchronization</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${isRunning ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200"}`}
                >
                {isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> START</>}
                </button>
                <button onClick={resetSim} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors" title="Reset">
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

            {/* Mode Toggle */}
            <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Architecture</span>
                <div className="flex bg-slate-200 dark:bg-slate-800 rounded p-0.5">
                    <button 
                        onClick={() => { setUseSundial(false); resetSim(); }}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${!useSundial ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
                    >
                        PTP (Legacy)
                    </button>
                    <button 
                        onClick={() => { setUseSundial(true); resetSim(); }}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${useSundial ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'}`}
                    >
                        Sundial
                    </button>
                </div>
            </div>

            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION AREA
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: VISUALIZATION */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden h-[600px] select-none">
            
            {/* Legend / Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-slate-50/90 dark:bg-slate-900/90 p-3 rounded-lg border border-slate-200 dark:border-slate-700 backdrop-blur shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                    <Network size={14} /> Datacenter Topology
                </h3>
                <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Synced (Active)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Recovered (Backup)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Unsynced (Drifting)</div>
                    <hr className="border-slate-300 dark:border-slate-700 my-1"/>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={showBackupGraph} onChange={(e) => setShowBackupGraph(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-400">Show Backup Graph</span>
                    </label>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="w-full h-full relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                         <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-800"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Render Links */}
                    {NODES_CONFIG.map(node => {
                        const connections = [];
                        if (node.primaryParent !== undefined) connections.push({ to: node.id, from: node.primaryParent, type: 'primary' });
                        if (node.backupParent !== undefined) connections.push({ to: node.id, from: node.backupParent, type: 'backup' });
                        
                        return connections.map((conn, idx) => {
                            if (conn.type === 'backup' && !showBackupGraph) return null;

                            const source = NODES_CONFIG.find(n => n.id === conn.from);
                            const target = NODES_CONFIG.find(n => n.id === conn.to);
                            if (!source || !target) return null;

                            const linkKey = getLinkKey(source.id, target.id);
                            const isFailed = failedLinks.includes(linkKey);
                            const isActive = nodes[target.id].activeParent === source.id;

                            // Line Style Logic
                            let stroke = isActive ? "#3b82f6" : "#cbd5e1"; // Blue if active, Gray if idle
                            let strokeWidth = isActive ? 3 : 1.5;
                            let opacity = 1;
                            
                            // Dark mode adjustments for idle
                            if (!isActive) stroke = theme === 'dark' ? '#334155' : '#cbd5e1';

                            if (conn.type === 'backup') {
                                stroke = isActive ? "#f59e0b" : (theme === 'dark' ? '#475569' : '#94a3b8'); 
                                strokeWidth = isActive ? 3 : 1;
                                if (!isActive) opacity = 0.5;
                            }
                            
                            if (isFailed) {
                                stroke = "#ef4444"; 
                                opacity = 0.3;
                            }
                            
                            const strokeDasharray = conn.type === 'backup' && !isActive ? "4,4" : "none";

                            return (
                                <g key={`${conn.from}-${conn.to}-${conn.type}`}>
                                    {/* Main Line */}
                                    <line 
                                        x1={`${source.x}%`} y1={`${source.y}%`}
                                        x2={`${target.x}%`} y2={`${target.y}%`}
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={strokeDasharray}
                                        opacity={opacity}
                                        className="transition-all duration-300"
                                    />
                                    {/* Active Flow Indicator */}
                                    {isActive && !isFailed && isRunning && (
                                        <circle r="2" fill={stroke}>
                                            <animateMotion 
                                                dur={`${SYNC_INTERVAL}ms`} 
                                                repeatCount="indefinite"
                                                path={`M${source.x * 10},${source.y * 6} L${target.x * 10},${target.y * 6}`} // Simplified path logic for demo
                                            />
                                        </circle>
                                    )}
                                </g>
                            );
                        });
                    })}

                    {/* Render Packets */}
                    {packets.map(p => {
                        const source = NODES_CONFIG.find(n => n.id === p.source);
                        const target = NODES_CONFIG.find(n => n.id === p.target);
                        if (!source || !target) return null;
                        
                        const curX = source.x + (target.x - source.x) * (p.progress / 100);
                        const curY = source.y + (target.y - source.y) * (p.progress / 100);

                        return (
                            <circle 
                                key={p.id}
                                cx={`${curX}%`} cy={`${curY}%`}
                                r="4"
                                fill="#fff"
                                stroke="#10b981"
                                strokeWidth="2"
                                className="drop-shadow-md z-50"
                            />
                        );
                    })}
                </svg>

                {/* Render Nodes (Interactive Divs) */}
                {nodes.map(node => (
                    <div 
                        key={node.id}
                        className={`absolute w-32 -ml-16 -mt-8 flex flex-col items-center transition-all duration-300 z-20`}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        {/* The Node Circle */}
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg border-4 ${getNodeColor(node)} transition-colors duration-300 relative bg-slate-900`}>
                            {node.role === 'grandmaster' ? <Zap size={20} /> : <Server size={18} />}
                            
                            {/* Recovery Badge */}
                            {node.status === 'recovering' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 text-[10px] font-bold">
                                    <RotateCcw size={10} />
                                </div>
                            )}
                        </div>
                        
                        {/* Label & Metrics */}
                        <div className="mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded px-2 py-1.5 text-center shadow-sm border border-slate-200 dark:border-slate-700 min-w-[90px]">
                            <div className="text-[9px] font-bold uppercase text-slate-500 tracking-wider mb-0.5">{node.label}</div>
                            <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                                <span className="text-slate-400">ε:</span>
                                <span className={`${node.uncertainty > 200 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {Math.floor(node.uncertainty)}ns
                                </span>
                            </div>
                            {/* Visual Uncertainty Bar */}
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 mt-1 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-100 ${node.uncertainty > 200 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(node.uncertainty/5, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Clickable Hitboxes for Link Breaking */}
                {NODES_CONFIG.map(node => {
                    const connections = [];
                    if (node.primaryParent !== undefined) connections.push({ to: node.id, from: node.primaryParent });
                    if (node.backupParent !== undefined && showBackupGraph) connections.push({ to: node.id, from: node.backupParent });
                    
                    return connections.map(conn => {
                        const source = NODES_CONFIG.find(n => n.id === conn.from);
                        const target = NODES_CONFIG.find(n => n.id === conn.to);
                        const midX = (source.x + target.x) / 2;
                        const midY = (source.y + target.y) / 2;
                        const linkKey = getLinkKey(conn.from, conn.to);
                        const isBroken = failedLinks.includes(linkKey);

                        return (
                            <button
                                key={`btn-${linkKey}`}
                                onClick={() => toggleLinkFailure(conn.from, conn.to)}
                                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center border transition-all z-30 shadow-sm
                                    ${isBroken 
                                        ? 'bg-red-500 border-red-600 text-white scale-110' 
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:text-red-500 hover:border-red-400 hover:scale-110'}
                                `}
                                style={{ left: `${midX}%`, top: `${midY}%` }}
                                title={isBroken ? "Repair Link" : "Cut Link"}
                            >
                                {isBroken ? <RotateCcw size={12} /> : <XCircle size={14} />}
                            </button>
                        );
                    });
                })}

            </div>
        </div>

        {/* RIGHT: LOGS & STATS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Stats Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                    <Activity size={14} /> Real-Time Telemetry
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">Max Uncertainty</div>
                        <div className={`text-2xl font-mono font-bold ${stats.maxUncertainty > 500 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {Math.floor(stats.maxUncertainty)}
                            <span className="text-sm font-normal text-slate-400 ml-1">ns</span>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">Failover Events</div>
                        <div className="text-2xl font-mono font-bold text-blue-500">
                            {stats.recoveryEvents}
                        </div>
                    </div>
                </div>
                <div className={`mt-4 text-xs leading-relaxed p-3 rounded border ${useSundial ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800'}`}>
                    <strong className={`block mb-1 ${useSundial ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {useSundial ? "Sundial Protection Active" : "Legacy Mode Active"}
                    </strong>
                    {useSundial 
                        ? "Nodes will instantly switch to their pre-configured backup parent upon sync timeout (300ms simulated)." 
                        : "Nodes will drift significantly upon failure, waiting for a centralized controller to intervene (2000ms simulated)."}
                </div>
            </div>

            {/* Event Log */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col overflow-hidden max-h-[340px]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Anchor size={14} /> System Events
                    </h3>
                    <div className="flex gap-2">
                         <button onClick={() => setLogs([])} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Clear</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className={`text-[10px] p-2 rounded border-l-2 font-mono break-words
                            ${log.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-600 dark:text-red-400' : 
                              log.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 text-amber-600 dark:text-amber-400' :
                              log.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                              'bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-600 dark:text-slate-400'}
                        `}>
                            <span className="opacity-50 mr-2">[{log.time.toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
                            {log.msg}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-center text-slate-400 italic text-xs mt-10">Waiting for events...</div>}
                </div>
            </div>
        </div>

      </div>

      {/* ============================================================
          EDUCATIONAL DEEP DIVE
          ============================================================ */}
      <div className="border-t-2 border-emerald-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Technical Deep Dive
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4">
              Sundial: Fault-Tolerant Clock Synchronization
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Based on the <a href="#" className="text-blue-500 hover:underline">OSDI 2020 paper</a> by Google. 
              Sundial achieves ~100ns time-uncertainty bound even under frequent datacenter failures (link cuts, device resets).
            </p>
          </div>

          {/* 1. THE MATH OF UNCERTAINTY */}
          <section className="mb-16">
            <SectionTitle icon={<Sigma className="w-5 h-5" />} title="The Mathematics of Uncertainty" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm">
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    In distributed systems like Spanner, we cannot just ask "what time is it?". We must ask "what is the interval [earliest, latest] that contains the true time?". 
                    This interval's width is the uncertainty, $\epsilon$.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-sm">
                            <div className="text-slate-500 dark:text-slate-500 mb-2">// The Master Equation</div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                ε(t) = ε<sub>base</sub> + ρ × (t - t<sub>last_sync</sub>)
                            </div>
                        </div>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2"><span className="font-bold text-blue-500">ε<sub>base</sub></span>: Baseline error (network asymmetry + hardware timestamp noise). Typical: 50ns.</li>
                            <li className="flex gap-2"><span className="font-bold text-emerald-500">ρ (rho)</span>: Oscillator drift rate. Crystal clocks drift ~50µs/sec (200ppm) under heat.</li>
                            <li className="flex gap-2"><span className="font-bold text-amber-500">t - t<sub>last</sub></span>: Time since last successful sync packet. This is what kills you during a failure.</li>
                        </ul>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">Why Sundial Wins</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Legacy (PTP) Recovery</span>
                                <span className="font-mono text-red-500 font-bold">~2s delay</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-full animate-pulse"></div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Sundial Recovery</span>
                                <span className="font-mono text-emerald-500 font-bold">~100µs delay</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[5%]"></div>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-2">
                                By minimizing the time since last sync (t - t<sub>last</sub>) during a failure, Sundial keeps ε small.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* 2. THE BACKUP GRAPH ALGORITHM */}
          <section className="mb-16">
            <SectionTitle icon={<GitGraph className="w-5 h-5" />} title="Precomputed Backup Plans" />
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4">The Challenge</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        In a datacenter, if a link fails, standard routing protocols (like BGP or STP) can take seconds to converge. 
                        For clock sync, this is fatal. We need a recovery path <strong>immediately</strong>.
                        However, picking a random neighbor as a parent might create a <strong>sync loop</strong> (A syncs to B, B syncs to A), destroying time accuracy.
                    </p>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Key Innovation</div>
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            Sundial uses a centralized controller to pre-compute a <strong>Backup Parent</strong> for every node such that no matter which link fails, the resulting graph is still a valid tree (Loop-Free).
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4">Algorithm Details</h4>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                            <div>
                                <strong className="text-slate-800 dark:text-slate-200 text-sm">Edge-Disjoint Trees</strong>
                                <p className="text-xs text-slate-500 mt-1">The controller calculates a primary spanning tree and a backup spanning tree that share no edges where possible.</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                            <div>
                                <strong className="text-slate-800 dark:text-slate-200 text-sm">Depth Constraint</strong>
                                <p className="text-xs text-slate-500 mt-1">Backup paths are chosen to minimize tree depth, as every hop adds hardware timestamp noise (ε<sub>base</sub> increases by ~50ns per hop).</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                            <div>
                                <strong className="text-slate-800 dark:text-slate-200 text-sm">Root Failure</strong>
                                <p className="text-xs text-slate-500 mt-1">If the Grandmaster fails, a pre-elected backup root takes over. The graph is designed so the backup root is reachable by all nodes.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
          </section>

          {/* 3. HARDWARE IMPLEMENTATION */}
          <section className="mb-16">
            <SectionTitle icon={<Cpu className="w-5 h-5" />} title="Hardware-Software Codesign" />
            <div className="grid md:grid-cols-3 gap-5">
                <HwCard 
                    icon={<Zap className="w-6 h-6" />}
                    color="emerald"
                    title="Frequent Messaging"
                    specs={["Interval: 100µs", "Overhead: <0.1%"]}
                    desc="Sundial sends sync messages 10,000x more often than PTP. This is only possible because the messages are generated by the Switch ASIC/FPGA, not the CPU."
                />
                <HwCard 
                    icon={<ShieldCheck className="w-6 h-6" />}
                    color="amber"
                    title="Hardware Failure Detection"
                    specs={["Timeout: 500µs", "Logic: Missing 5 packets"]}
                    desc="The hardware expects a pulse every 100µs. If 5 are missed, it fires an interrupt. The local OS immediately switches the mux to the Backup Port."
                />
                <HwCard 
                    icon={<Workflow className="w-6 h-6" />}
                    color="blue"
                    title="Synchronous Messaging"
                    specs={["Input-Triggered", "Zero Queuing"]}
                    desc="A switch only sends a sync packet down when it receives one from up. This ensures the whole tree stays phase-locked and reduces queuing jitter."
                />
            </div>
          </section>

          {/* 4. USAGE GUIDE */}
          <section>
            <SectionTitle icon={<Info className="w-5 h-5" />} title="Simulation Controls" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <UsageCard step="1" title="Start" desc="Initialize the pulse. Watch blue packets flow from Root to leaves." color="emerald" />
                <UsageCard step="2" title="Break Link" desc="Click the 'X' on a link. In Sundial mode, notice the instant amber switchover. In Legacy, notice the red drift." color="red" />
                <UsageCard step="3" title="Show Backups" desc="Toggle 'Show Backup Graph' in the overlay to see the hidden safety net edges." color="blue" />
                <UsageCard step="4" title="Compare" desc="Switch between PTP (Legacy) and Sundial to see the difference in uncertainty accumulation." color="slate" />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ================================================================
//  SUB-COMPONENTS (Standard Library)
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/30", text: "text-blue-600 dark:text-blue-400", icon: "text-blue-600 dark:text-blue-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30", text: "text-amber-600 dark:text-amber-400", icon: "text-amber-600 dark:text-amber-400" },
  red: { bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/30", text: "text-red-600 dark:text-red-400", icon: "text-red-600 dark:text-red-400" },
  slate: { bg: "bg-slate-100 dark:bg-slate-500/10", border: "border-slate-300 dark:border-slate-500/30", text: "text-slate-600 dark:text-slate-400", icon: "text-slate-600 dark:text-slate-400" },
};

function HwCard({ icon, color, title, specs, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 ${c.icon}`}>{icon}</div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {specs.map((s) => (
          <span key={s} className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>{s}</span>
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
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