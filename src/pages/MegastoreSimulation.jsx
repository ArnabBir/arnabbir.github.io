import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Server, Activity, ShieldCheck, Play, Pause, RefreshCw, 
  Layers, Globe, ArrowRight, HardDrive, FileText, Lock, Users, 
  Clock, Zap, Terminal, CheckCircle2, AlertTriangle, LayoutGrid, Network 
} from 'lucide-react';

// ================================================================
//  SIMULATION CONFIG
// ================================================================
const TICK_RATE = 800; // ms
const REPLICA_COUNT = 3; 
const ENTITY_GROUPS = [
  { id: 'User:Alice', shard: 0, version: 100, lastCommit: null },
  { id: 'User:Bob', shard: 1, version: 55, lastCommit: null },
  { id: 'Product:101', shard: 2, version: 12, lastCommit: null },
  { id: 'Order:999', shard: 0, version: 5, lastCommit: null }
];

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function MegastoreSimulation() {
  // --- Simulation State ---
  const [isRunning, setIsRunning] = useState(false);
  const [replicas, setReplicas] = useState([]);
  const [entityGroups, setEntityGroups] = useState(ENTITY_GROUPS);
  const [transactions, setTransactions] = useState([]); 
  const [logEntries, setLogEntries] = useState([]); 
  const [logs, setLogs] = useState([]);
  const [packets, setPackets] = useState([]); 
  const [stats, setStats] = useState({ latency: 0, commits: 0, failures: 0 });

  // Refs for Sim
  const replicasRef = useRef([]);
  const entityGroupsRef = useRef(ENTITY_GROUPS);
  const logContainerRef = useRef(null);
  const systemEventsContainerRef = useRef(null);

  // --- Initialization ---
  useEffect(() => {
    resetSim();
  }, []);

  // Auto-scroll Logs
  useEffect(() => {
    if (logContainerRef.current) logContainerRef.current.scrollTop = 0;
  }, [logEntries]);

  useEffect(() => {
    if (systemEventsContainerRef.current) systemEventsContainerRef.current.scrollTop = 0;
  }, [logs]);

  const resetSim = () => {
    const initialReplicas = Array.from({ length: REPLICA_COUNT }).map((_, i) => ({
      id: i,
      name: `Replica ${i} (${i === 0 ? 'US-West' : i === 1 ? 'US-East' : 'EU-West'})`,
      status: 'ONLINE',
      log: [],
      appliedIndex: 0,
      isLeader: i === 0 
    }));
    
    setReplicas(initialReplicas);
    replicasRef.current = initialReplicas;
    setEntityGroups(ENTITY_GROUPS);
    entityGroupsRef.current = ENTITY_GROUPS;
    setTransactions([]);
    setLogEntries([]);
    setPackets([]);
    setLogs([]);
    setStats({ latency: 0, commits: 0, failures: 0 });
    setIsRunning(false);
    addLog('System', 'Megastore initialized. Paxos group ready.');
  };

  // --- Core Simulation Loop ---
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1. Auto-Generate Traffic
      if (Math.random() < 0.4) {
          const count = Math.random() < 0.2 ? 3 : 1; 
          for(let k=0; k<count; k++) {
            const randomGroup = entityGroupsRef.current[Math.floor(Math.random() * entityGroupsRef.current.length)];
            addTransaction(randomGroup.id, true);
          }
      }

      // 2. Process Transactions
      if (transactions.length > 0) {
        const tx = transactions[0];
        const leader = replicasRef.current.find(r => r.isLeader);
        
        if (leader && leader.status === 'ONLINE') {
           runPaxos(tx, leader);
           setTransactions(prev => prev.slice(1));
        } else {
            if (Math.random() < 0.1) {
                addLog('Coordinator', `No leader for ${tx.entityGroup}. Retrying...`, 'warning');
            }
        }
      }

      // 3. Move Packets
      setPackets(prev => {
        return prev.map(p => ({
           ...p,
           progress: p.progress + 10 
        })).filter(p => p.progress < 100);
      });

    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [isRunning, transactions]);

  // --- Logic Helpers ---
  const runPaxos = (tx, leader) => {
      const newPackets = replicasRef.current
        .filter(r => r.id !== leader.id && r.status === 'ONLINE')
        .map(r => ({
            id: Math.random(),
            from: leader.id,
            to: r.id,
            type: 'PROPOSE',
            payload: tx,
            progress: 0
        }));
      
      setPackets(prev => [...prev, ...newPackets]);

      const startTime = Date.now();
      setTimeout(() => {
          const onlineCount = replicasRef.current.filter(r => r.status === 'ONLINE').length;
          const majority = Math.floor(REPLICA_COUNT / 2) + 1;
          
          if (onlineCount >= majority) { 
              commitTransaction(tx);
              const latency = Date.now() - startTime;
              setStats(s => ({ ...s, latency, commits: s.commits + 1 }));
          } else {
              addLog('Paxos', `Write failed for ${tx.entityGroup}. Quorum (${majority}/${REPLICA_COUNT}) not reached.`, 'error');
              setStats(s => ({ ...s, failures: s.failures + 1 }));
          }
      }, 1500);
  };

  const commitTransaction = (tx) => {
      const now = new Date();
      setLogEntries(prev => [{ ...tx, timestamp: now }, ...prev].slice(0, 50)); 
      
      setEntityGroups(prev => {
          const next = prev.map(eg => eg.id === tx.entityGroup ? { ...eg, version: eg.version + 1, lastCommit: now } : eg);
          entityGroupsRef.current = next;
          return next;
      });

      setReplicas(prev => prev.map(r => {
          if (r.status === 'ONLINE') {
              return { ...r, log: [...r.log, tx], appliedIndex: r.appliedIndex + 1 };
          }
          return r;
      }));
      
      addLog('Commit', `Transaction committed to ${tx.entityGroup}. Version updated.`);
  };

  const addTransaction = (entityGroup, isAuto = false) => {
      const tx = {
          id: Math.random().toString(36).substr(2, 6).toUpperCase(),
          entityGroup,
          operation: 'PUT',
          data: `RowKey: ${Math.floor(Math.random() * 1000)}`
      };
      setTransactions(prev => [...prev, tx]);
      if (!isAuto) addLog('Client', `New Write Request: ${entityGroup}`);
  };

  const toggleReplica = (id) => {
      setReplicas(prev => {
          const next = prev.map(r => r.id === id ? { ...r, status: r.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' } : r);
          replicasRef.current = next;
          
          const activeLeader = next.find(r => r.isLeader && r.status === 'ONLINE');
          if (!activeLeader) {
              const newLeader = next.find(r => r.status === 'ONLINE');
              if (newLeader) {
                  addLog('System', `Leader ${id} failed. Electing Replica ${newLeader.id}.`, 'warning');
                  return next.map(r => ({ ...r, isLeader: r.id === newLeader.id }));
              } else {
                  addLog('System', `CRITICAL: All replicas offline.`, 'error');
              }
          }
          return next;
      });
  };

  const addLog = (source, msg, type = 'info') => {
      setLogs(prev => [{ source, msg, type, time: new Date() }, ...prev].slice(0, 50));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* ============================================================
          SECTION 1: SIMULATION
          ============================================================ */}
      <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-700 shadow-xl sticky top-4 z-50">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
              <Database size={24} className="text-blue-400" /> Megastore Simulator
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">Wide-Area Replication & Consistency</p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-8 items-center border-l border-slate-700 pl-8 hidden md:flex">
              <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Clock size={10} /> Avg Write Latency</div>
                  <div className="text-lg font-mono text-white">{stats.latency} ms</div>
              </div>
              <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><CheckCircle2 size={10} /> Committed Txs</div>
                  <div className="text-lg font-mono text-green-400">{stats.commits}</div>
              </div>
              <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><AlertTriangle size={10} /> Failures</div>
                  <div className={`text-lg font-mono ${stats.failures > 0 ? 'text-red-400' : 'text-slate-600'}`}>{stats.failures}</div>
              </div>
          </div>

          <div className="flex gap-3">
              <button onClick={() => setIsRunning(!isRunning)} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isRunning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}>
                  {isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> AUTO SIM</>}
              </button>
              <button onClick={resetSim} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 border border-slate-700">
                  <RefreshCw size={18} />
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Entity Groups & Controls */}
          <div className="lg:col-span-3 flex flex-col gap-4">
              
              {/* Entity Groups Panel */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg flex-col h-[400px] flex">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Layers size={14} className="text-blue-400"/> Entity Groups
                      </h3>
                      <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-500">Partition Unit</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {entityGroups.map((eg, i) => (
                          <div key={i} className="p-3 bg-slate-950/50 rounded border border-slate-800 hover:border-slate-600 transition-colors group">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <div className="text-xs font-mono font-bold text-slate-200">{eg.id}</div>
                                      <div className="text-[9px] text-slate-500">Shard #{eg.shard}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[10px] font-mono text-cyan-400">v{eg.version}</div>
                                      <div className="text-[8px] text-slate-600">{eg.lastCommit ? eg.lastCommit.toLocaleTimeString() : 'No activity'}</div>
                                  </div>
                              </div>
                              
                              {/* Action Area */}
                              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                  <div className="flex items-center gap-1 text-[8px] text-slate-500">
                                      <Lock size={8} /> ACID Scope
                                  </div>
                                  <button 
                                      onClick={() => addTransaction(eg.id)} 
                                      className="text-[9px] bg-blue-600/20 text-blue-300 border border-blue-500/50 px-2 py-1 rounded hover:bg-blue-600/40 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                      WRITE TX
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Transaction Log */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg h-[200px] flex flex-col">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Activity size={14} className="text-green-400"/> Replication Log
                  </h3>
                  <div 
                      ref={logContainerRef}
                      className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 font-mono text-[10px]"
                  >
                      {logEntries.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">No Commits Yet</div>}
                      {logEntries.map((l) => (
                          <div key={l.id} className="border-l-2 border-green-500 pl-2 py-1.5 bg-slate-950/30 rounded flex justify-between items-center animate-in fade-in slide-in-from-right-1">
                              <div className="flex-1 min-w-0 mr-2">
                                  <div className="text-green-300 font-bold truncate">{l.entityGroup}</div>
                                  <div className="text-slate-500">{l.timestamp.toLocaleTimeString([], {fractionalSecondDigits: 2})}</div>
                              </div>
                              <div className="flex flex-col items-end">
                                  <div className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[9px]">ID: {l.id}</div>
                                  <div className="text-[8px] text-slate-600 mt-0.5">{l.operation}</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

          </div>

          {/* CENTER: Replicas & Paxos */}
          <div className="lg:col-span-6 bg-slate-950 rounded-xl border border-slate-800 relative shadow-inner overflow-hidden flex flex-col min-h-[600px]">
              
              {/* Top Bar: Network Status */}
              <div className="absolute top-4 left-0 right-0 flex justify-center z-20">
                  <div className="bg-slate-900/80 backdrop-blur px-4 py-1.5 rounded-full border border-slate-700 flex items-center gap-4 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Paxos Traffic
                      </div>
                      <div className="w-px h-3 bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" /> Pending Writes: {transactions.length}
                      </div>
                  </div>
              </div>

              {/* Map Background */}
              <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
                  <Globe size={400} className="text-slate-500" />
              </div>

              {/* Replicas Container */}
              <div className="flex-1 flex items-center justify-around px-4 relative z-10">
                  {replicas.map(r => (
                      <div key={r.id} className={`relative w-40 md:w-44 p-4 rounded-xl border-2 transition-all duration-500 flex flex-col gap-3 group ${r.status === 'ONLINE' ? (r.isLeader ? 'bg-blue-900/10 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-105' : 'bg-slate-900 border-slate-700') : 'bg-red-950/20 border-red-900 grayscale opacity-60'}`}>
                          
                          {/* Leader Badge */}
                          {r.isLeader && r.status === 'ONLINE' && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-blue-400">
                                  <Zap size={10} fill="currentColor" /> LEADER
                              </div>
                          )}

                          {/* Header */}
                          <div className="flex justify-between items-start">
                              <div>
                                  <div className={`text-xs font-bold ${r.status === 'ONLINE' ? 'text-slate-200' : 'text-red-400'}`}>{r.name}</div>
                                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">{r.status === 'ONLINE' ? '12ms RTT' : 'Unreachable'}</div>
                              </div>
                              <Server size={20} className={r.status === 'ONLINE' ? (r.isLeader ? "text-blue-400" : "text-slate-500") : "text-red-500"} />
                          </div>
                          
                          {/* Write-Ahead Log Visual */}
                          <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold">
                                  <span>Write-Ahead Log</span>
                                  <span>idx: {r.appliedIndex}</span>
                              </div>
                              <div className="h-24 bg-black/40 rounded border border-slate-800 p-1 overflow-hidden relative shadow-inner">
                                  <div className="absolute inset-x-1 bottom-1 flex flex-col-reverse gap-1 transition-all">
                                      {r.log.slice(-6).map((l, idx) => (
                                          <div key={idx} className="h-3 bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/40 rounded-sm w-full flex items-center px-1">
                                              <div className="w-1 h-1 bg-green-400 rounded-full mr-1"></div>
                                              <span className="text-[6px] text-green-200/70 font-mono truncate">{l.id}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {/* Controls */}
                          <button 
                              onClick={() => toggleReplica(r.id)} 
                              className={`mt-1 text-[9px] py-1.5 rounded border w-full font-bold transition-all ${r.status === 'ONLINE' ? 'text-red-400 border-red-900/30 hover:bg-red-900/20' : 'text-green-400 border-green-900/30 hover:bg-green-900/20'}`}
                          >
                              {r.status === 'ONLINE' ? 'SIMULATE FAILURE' : 'RECOVER NODE'}
                          </button>
                      </div>
                  ))}
              </div>

              {/* Packets Animation Layer */}
              {packets.map(p => {
                  const startX = p.from === 0 ? 16 : p.from === 1 ? 50 : 84;
                  const endX = p.to === 0 ? 16 : p.to === 1 ? 50 : 84;
                  const currentX = startX + (endX - startX) * (p.progress / 100);
                  const arcHeight = 20; 
                  const arcY = 50 - Math.sin((p.progress / 100) * Math.PI) * arcHeight;

                  return (
                      <div 
                          key={p.id}
                          className="absolute z-50 pointer-events-none"
                          style={{ left: `${currentX}%`, top: `${arcY}%` }}
                      >
                          <div className="relative">
                              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_15px_orange] animate-pulse" />
                              <div className="absolute top-0 right-0 w-8 h-0.5 bg-gradient-to-l from-yellow-500/0 to-yellow-500/50 transform -translate-x-full rotate-45 opacity-50" />
                          </div>
                      </div>
                  );
              })}

          </div>

          {/* RIGHT: Architecture Info & Logs */}
          <div className="lg:col-span-3 flex flex-col gap-4">
              
              {/* Components */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Key Concepts</h3>
                  <div className="space-y-3">
                      <ConceptItem icon={<Users size={14} className="text-purple-400"/>} title="Paxos Consensus" desc="Synchronous replication ensures zero data loss if a majority of replicas survive." />
                      <ConceptItem icon={<HardDrive size={14} className="text-green-400"/>} title="Bigtable Backend" desc="Megastore logs are persisted in Bigtable, providing massive scalability." />
                      <ConceptItem icon={<Lock size={14} className="text-orange-400"/>} title="Entity Groups" desc="The unit of partitioning. Cross-group transactions are async (2PC)." />
                  </div>
              </div>

              {/* Logs */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg flex-1 flex flex-col overflow-hidden min-h-[300px]">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Terminal size={12} /> System Events
                  </h3>
                  <div 
                      ref={systemEventsContainerRef}
                      className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 pr-1"
                  >
                      {logs.map((l, i) => (
                          <div key={i} className={`border-l-2 pl-2 py-1 rounded bg-slate-950/30 ${l.type === 'error' ? 'border-red-500 text-red-400' : l.type === 'warning' ? 'border-amber-500 text-amber-400' : 'border-slate-600 text-slate-400'}`}>
                              <span className="opacity-50 text-[9px] block mb-0.5">[{l.time.toLocaleTimeString([], {hour12:false, minute:'2-digit', second:'2-digit', fractionalSecondDigits: 2})}]</span> 
                              {l.msg}
                          </div>
                      ))}
                  </div>
              </div>

          </div>

        </div>
      </div>

      {/* ============================================================
          SECTION 2: EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t border-slate-800 bg-[#0b1120] relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
          
          {/* 1. Introduction Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Database className="w-3.5 h-3.5" /> Technical Deep Dive
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6">
              Megastore: Architecture & Design
            </h1>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Megastore blends the scalability of a NoSQL datastore (Bigtable) with the convenience of a traditional RDBMS. 
              Its key innovation is providing <strong>ACID semantics</strong> across wide-area networks by partitioning data into 
              <strong>Entity Groups</strong> and using <strong>Paxos</strong> for synchronous replication.
            </p>
          </div>

          {/* 2. Core Concepts Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TechCard 
              icon={<Layers className="text-blue-400" />}
              title="Entity Groups"
              desc="Data is partitioned into Entity Groups. Within a group, transactions are strictly serializable (ACID). Across groups, operations are asynchronous (2PC or Queues)."
            />
            <TechCard 
              icon={<Globe className="text-green-400" />}
              title="Wide-Area Replication"
              desc="Each Entity Group is replicated synchronously across datacenters using Paxos. This ensures zero data loss (RPO=0) even if a whole datacenter fails."
            />
            <TechCard 
              icon={<Server className="text-purple-400" />}
              title="Bigtable Backend"
              desc="Megastore does not manage its own storage files. Instead, it layers a transactional protocol on top of Bigtable, using it as a scalable Write-Ahead Log."
            />
          </section>

          {/* 3. The Data Model */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-teal-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-100">Data Model & Partitioning</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-200">Entity Groups</h3>
                <p className="leading-relaxed text-slate-400">
                  Scalability in Megastore is achieved by partitioning. A user specifies distinct 
                  <strong>Entity Groups</strong> (e.g., `User:Alice`). All data for Alice (profile, photos, logs) 
                  is stored in the same Bigtable row range.
                </p>
                <ul className="space-y-3 mt-4">
                  <ListItem text="ACID guarantees apply ONLY within a single Entity Group." />
                  <ListItem text="Cross-group transactions use Two-Phase Commit (2PC), which is heavier." />
                  <ListItem text="This aligns with web apps where most updates affect a single user." />
                </ul>
              </div>
              
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 px-2 py-1 rounded-bl text-xs">LOGICAL LAYOUT</div>
                
                <div className="text-blue-400 mb-2">// Entity Group: User 101</div>
                <div className="pl-4 border-l-2 border-slate-800 space-y-2">
                  <div className="text-green-400">UserTable:</div>
                  <div className="text-slate-500 pl-4">{`{ ID: 101, Name: "Alice" }`}</div>
                  
                  <div className="text-green-400 mt-2">PhotoTable:</div>
                  <div className="text-slate-500 pl-4">{`{ ID: 500, UserID: 101, URL: "..." }`}</div>
                  <div className="text-slate-500 pl-4">{`{ ID: 501, UserID: 101, URL: "..." }`}</div>
                </div>
                
                <div className="text-blue-400 mt-6 mb-2">// Entity Group: User 102</div>
                <div className="pl-4 border-l-2 border-slate-800">
                  <div className="text-slate-500">...</div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Replication & Consensus */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-amber-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-100">Paxos & Failover</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Zap className="text-yellow-400 w-4 h-4" /> The Write Path
                </h3>
                <ol className="space-y-4 text-sm text-slate-400 list-decimal pl-4 marker:text-slate-600">
                  <li>
                    <strong className="text-slate-200">Leader Election:</strong> For each Entity Group, one replica acts as the Paxos Leader.
                  </li>
                  <li>
                    <strong className="text-slate-200">Proposal:</strong> The application sends a write to the Leader. The Leader appends it to its write-ahead log.
                  </li>
                  <li>
                    <strong className="text-slate-200">Accept:</strong> The Leader forwards the log entry to all replicas.
                  </li>
                  <li>
                    <strong className="text-slate-200">Commit:</strong> Once a <strong>Majority</strong> (e.g., 2/3) acknowledge receipt, the write is committed.
                  </li>
                  <li>
                    <strong className="text-slate-200">Apply:</strong> The data is written to Bigtable and the index is updated.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Clock className="text-blue-400 w-4 h-4" /> The Read Path
                </h3>
                <div className="space-y-4 text-sm text-slate-400">
                  <p>
                    Reading from a distributed system usually requires a quorum check (slow). 
                    Megastore optimizes this with the <strong>Coordinator</strong>.
                  </p>
                  <div className="p-3 bg-slate-950/50 rounded border border-slate-800">
                    <strong className="text-blue-300 block mb-1">Current Read (Fast):</strong>
                    If the local replica is up-to-date (verified by the Coordinator), read locally. No networking needed.
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded border border-slate-800">
                    <strong className="text-purple-300 block mb-1">Snapshot Read:</strong>
                    Read the last known committed state. Always fast, but might be slightly stale.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Key Innovations Table */}
          <section className="overflow-hidden rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Feature</th>
                  <th className="p-4 hidden sm:table-cell">Traditional RDBMS</th>
                  <th className="p-4 hidden sm:table-cell">Standard NoSQL</th>
                  <th className="p-4 text-blue-400">Megastore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                <tr>
                  <td className="p-4 font-bold text-slate-300">Scalability</td>
                  <td className="p-4 hidden sm:table-cell">Limited (Scale-up)</td>
                  <td className="p-4 hidden sm:table-cell">High (Scale-out)</td>
                  <td className="p-4 text-blue-300 font-bold">High (Partitioned)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-300">Consistency</td>
                  <td className="p-4 hidden sm:table-cell">Strong (ACID)</td>
                  <td className="p-4 hidden sm:table-cell">Eventual</td>
                  <td className="p-4 text-blue-300 font-bold">Strong (Within Group)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-300">Replication</td>
                  <td className="p-4 hidden sm:table-cell">Async / Master-Slave</td>
                  <td className="p-4 hidden sm:table-cell">Async / Quorum</td>
                  <td className="p-4 text-blue-300 font-bold">Sync Paxos (Wide-Area)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-300">Failover</td>
                  <td className="p-4 hidden sm:table-cell">Manual / Scripts</td>
                  <td className="p-4 hidden sm:table-cell">Automatic</td>
                  <td className="p-4 text-blue-300 font-bold">Automatic (Transparent)</td>
                </tr>
              </tbody>
            </table>
          </section>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ================================================================
//  SUB-COMPONENTS
// ================================================================

function ConceptItem({ icon, title, desc }) {
    return (
        <div className="flex gap-3 items-start group">
            <div className="bg-slate-800 p-1.5 rounded mt-0.5 group-hover:bg-slate-700 transition-colors border border-slate-700 group-hover:border-slate-600">{icon}</div>
            <div>
                <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{title}</div>
                <div className="text-[10px] text-slate-500 leading-tight group-hover:text-slate-400 transition-colors mt-0.5">{desc}</div>
            </div>
        </div>
    );
}

function TechCard({ icon, title, desc }) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors group">
      <div className="mb-4 p-3 bg-slate-950 rounded-lg inline-block border border-slate-800 group-hover:border-slate-600 group-hover:bg-slate-900 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function ListItem({ text }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-400">
      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
      <span>{text}</span>
    </li>
  );
}