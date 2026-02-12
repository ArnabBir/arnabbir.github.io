import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  Server, Database, Activity, Play, Pause, RefreshCw, Layers, Globe, 
  ArrowRight, HardDrive, Lock, ShieldCheck, Clock, Zap, Terminal, 
  CheckCircle2, AlertTriangle, Network, Search, ArrowDown, BookOpen, 
  Box, Eye, Sun, Moon, Info, Shield, Binary, Cpu, MemoryStick
} from 'lucide-react';

// ================================================================
//  SIMULATION CONFIG & CONSTANTS
// ================================================================
const TICK_RATE = 1000;
const REPLICATION_DELAY = 1500; 
const LOAD_DECAY = 2;
const SPLIT_THRESHOLD = 30;

const INITIAL_SERVERS = [
  { id: 'PS-1', name: 'Partition Server 1', status: 'ONLINE', load: 0 },
  { id: 'PS-2', name: 'Partition Server 2', status: 'ONLINE', load: 0 },
  { id: 'PS-3', name: 'Partition Server 3', status: 'ONLINE', load: 0 },
];

const INITIAL_EXTENT_NODES = [
  { id: 'EN-1', rack: 1 }, { id: 'EN-2', rack: 1 },
  { id: 'EN-3', rack: 2 }, { id: 'EN-4', rack: 2 },
  { id: 'EN-5', rack: 3 }, { id: 'EN-6', rack: 3 },
];

const INITIAL_PARTITIONS = [
  { id: 'P-root', range: [0, 99], serverId: 'PS-1', load: 0, accesses: 0 }
];

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function WindowsAzureStorageSimulation() {
  const { theme, setTheme } = useTheme();

  // --- State ---
  const [isRunning, setIsRunning] = useState(false);
  const [servers, setServers] = useState(INITIAL_SERVERS);
  const [extentNodes, setExtentNodes] = useState(INITIAL_EXTENT_NODES);
  const [partitions, setPartitions] = useState(INITIAL_PARTITIONS);
  const [activeRequests, setActiveRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ transactions: 0, splits: 0, loadBalances: 0 });
  const [txCounter, setTxCounter] = useState(1);

  // --- Initialization ---
  useEffect(() => {
    resetSim();
  }, []);

  const resetSim = () => {
    setServers(INITIAL_SERVERS);
    setExtentNodes(INITIAL_EXTENT_NODES);
    setPartitions(INITIAL_PARTITIONS);
    setActiveRequests([]);
    setLogs([]);
    setStats({ transactions: 0, splits: 0, loadBalances: 0 });
    setIsRunning(false);
    addLog('System', 'WAS Stamp Initialized. Location: US North.', 'system');
  };

  const addLog = (source, msg, type = 'info') => {
    setLogs(prev => [{ source, msg, type, time: new Date() }, ...prev].slice(0, 50));
  };

  // --- Core Simulation Logic ---
  const runTick = useCallback(() => {
    if (!isRunning) return;

    // 1. Generate random incoming traffic
    if (Math.random() < 0.7) {
      const isBatch = Math.random() < 0.2;
      const key = Math.floor(Math.random() * 100);
      handleNewRequest(key, isBatch ? 5 : 1);
    }

    // 2. Decay load on partitions
    setPartitions(prev => prev.map(p => ({
      ...p,
      load: Math.max(0, p.load - LOAD_DECAY)
    })));

    // 3. Check for Splits & Load Balancing
    checkLoadBalancing();

  }, [isRunning, partitions, servers]);

  useEffect(() => {
    const interval = setInterval(runTick, TICK_RATE);
    return () => clearInterval(interval);
  }, [runTick]);

  // --- Request Handling ---
  const handleNewRequest = (key, weight = 1) => {
    setPartitions(prevParts => {
      const parts = [...prevParts];
      // Find which partition handles this key
      const targetPart = parts.find(p => key >= p.range[0] && key <= p.range[1]);
      
      if (targetPart) {
        targetPart.load += (10 * weight);
        targetPart.accesses += weight;

        // Pick 3 random Extent Nodes across different racks for Stream Layer Replication
        const shuffledENs = [...extentNodes].sort(() => 0.5 - Math.random());
        // Simple distinct rack selection (simulated)
        const primaryEN = shuffledENs[0];
        const sec1EN = shuffledENs.find(en => en.rack !== primaryEN.rack) || shuffledENs[1];
        const sec2EN = shuffledENs.find(en => en.rack !== primaryEN.rack && en.rack !== sec1EN.rack) || shuffledENs[2];

        const reqId = `TX-${txCounter + Math.floor(Math.random()*1000)}`;
        setTxCounter(c => c + 1);

        const newReq = {
          id: reqId,
          key,
          partitionId: targetPart.id,
          serverId: targetPart.serverId,
          primaryEN: primaryEN.id,
          secondaryENs: [sec1EN.id, sec2EN.id],
          progress: 0,
          status: 'replicating'
        };

        setActiveRequests(prev => [...prev, newReq]);
        addLog('Front-End', `Routed Key [${key}] to ${targetPart.serverId}`, 'info');

        // Simulate replication completion
        setTimeout(() => {
          setActiveRequests(currentReqs => {
            return currentReqs.filter(r => r.id !== reqId);
          });
          setStats(s => ({ ...s, transactions: s.transactions + weight }));
        }, REPLICATION_DELAY);
      }
      return parts;
    });
  };

  const manualRequest = () => {
    const key = Math.floor(Math.random() * 100);
    handleNewRequest(key, 3); // Manual is a bit heavier
  };

  // --- Load Balancing & Splitting ---
  const checkLoadBalancing = () => {
    setPartitions(prevParts => {
      let parts = [...prevParts];
      let splitsOccurred = false;

      // 1. Check for overloaded partitions (SPLIT)
      const hotPartIdx = parts.findIndex(p => p.load > SPLIT_THRESHOLD && p.range[1] > p.range[0]);
      
      if (hotPartIdx !== -1) {
        const hotPart = parts[hotPartIdx];
        const midPoint = Math.floor((hotPart.range[0] + hotPart.range[1]) / 2);
        
        // Find least loaded server to offload the new partition
        setServers(prevServers => {
            const serverLoads = prevServers.map(s => {
                const sParts = parts.filter(p => p.serverId === s.id);
                return { id: s.id, totalLoad: sParts.reduce((acc, p) => acc + p.load, 0) };
            });
            serverLoads.sort((a, b) => a.totalLoad - b.totalLoad);
            const targetServerId = serverLoads[0].id;

            const partA = { 
                id: `${hotPart.id}A-${Math.random().toString(36).substr(2,2)}`, 
                range: [hotPart.range[0], midPoint], 
                serverId: hotPart.serverId, 
                load: hotPart.load / 2, accesses: hotPart.accesses / 2 
            };
            const partB = { 
                id: `${hotPart.id}B-${Math.random().toString(36).substr(2,2)}`, 
                range: [midPoint + 1, hotPart.range[1]], 
                serverId: targetServerId, 
                load: hotPart.load / 2, accesses: hotPart.accesses / 2 
            };

            parts.splice(hotPartIdx, 1, partA, partB);
            
            addLog('PartitionManager', `SPLIT triggered for Range [${hotPart.range[0]}-${hotPart.range[1]}]. Moved new partition to ${targetServerId}.`, 'warning');
            setStats(s => ({ ...s, splits: s.splits + 1, loadBalances: s.loadBalances + 1 }));
            
            return prevServers;
        });
        splitsOccurred = true;
      }

      return splitsOccurred ? parts : prevParts;
    });
  };

  // Helpers
  const getServerLoadPct = (serverId) => {
      const serverParts = partitions.filter(p => p.serverId === serverId);
      const totalLoad = serverParts.reduce((acc, p) => acc + p.load, 0);
      return Math.min(100, (totalLoad / SPLIT_THRESHOLD) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Windows Azure Storage Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">Partitioning & Intra-Stamp Replication</p>
            </div>
          </div>
          
          <div className="flex gap-6 items-center border-l border-slate-300 dark:border-slate-700 pl-6 hidden md:flex">
              <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><CheckCircle2 size={10} /> TXs Committed</div>
                  <div className="text-lg font-mono text-green-600 dark:text-green-400">{stats.transactions.toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Layers size={10} /> Partitions</div>
                  <div className="text-lg font-mono text-blue-600 dark:text-blue-400">{partitions.length}</div>
              </div>
              <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Network size={10} /> Split & Rebalance</div>
                  <div className={`text-lg font-mono ${stats.splits > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600'}`}>{stats.splits}</div>
              </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${isRunning ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200' : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200'}`}>
                {isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> START TRAFFIC</>}
            </button>
            <button onClick={manualRequest} className="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-md font-bold text-sm transition-all flex items-center gap-1">
                <Zap size={16} /> Burst
            </button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
            <button onClick={resetSim} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <RefreshCw size={16} />
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION VIEW
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT & CENTER: Architecture Flow */}
        <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* FRONT-END LAYER */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <Globe className="text-blue-500" size={24} />
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Front-End (VIP)</h3>
                        <p className="text-[10px] text-slate-500 font-mono">Routing Traffic to Partition Layer</p>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    {activeRequests.map(r => (
                        <div key={r.id} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" title={`Request Key: ${r.key}`} />
                    ))}
                </div>
            </div>

            {/* PARTITION LAYER */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white/50 dark:bg-slate-900/30 flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><Layers size={14} /> Partition Layer</h3>
                    <div className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-600 dark:text-slate-400">Maintains Namespace & Load Balancing</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
                    {servers.map(server => {
                        const sParts = partitions.filter(p => p.serverId === server.id);
                        const loadPct = getServerLoadPct(server.id);
                        const isHot = loadPct > 80;
                        
                        return (
                        <div key={server.id} className={`bg-white dark:bg-slate-900 border ${isHot ? 'border-amber-400 dark:border-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-3 transition-all duration-300 flex flex-col h-full overflow-hidden`}>
                            <div className="flex justify-between items-start mb-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Server size={14} className={isHot ? 'text-amber-500' : 'text-blue-500'} />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{server.id}</span>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isHot ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    Load: {Math.floor(loadPct)}%
                                </span>
                            </div>
                            
                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                                {sParts.length === 0 && <div className="text-[10px] text-slate-400 italic text-center py-4">No Partitions Assigned</div>}
                                {sParts.map(p => {
                                    const partLoadPct = Math.min(100, (p.load / SPLIT_THRESHOLD) * 100);
                                    const isActive = activeRequests.some(r => r.partitionId === p.id);
                                    
                                    return (
                                    <div key={p.id} className={`text-[10px] border rounded p-1.5 relative overflow-hidden ${isActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'}`}>
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-amber-400" style={{ width: `${partLoadPct}%`, transition: 'width 0.5s ease' }} />
                                        <div className="flex justify-between items-center relative z-10">
                                            <span className="font-mono text-slate-600 dark:text-slate-400">Keys: [{p.range[0]}-{p.range[1]}]</span>
                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {/* STREAM LAYER (Intra-Stamp Replication) */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><HardDrive size={14} /> Stream Layer (Extent Nodes)</h3>
                    <div className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-600 dark:text-slate-400">Synchronous 3-Way Intra-Stamp Replication</div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {extentNodes.map(en => {
                        const isPrimary = activeRequests.some(r => r.primaryEN === en.id);
                        const isSecondary = activeRequests.some(r => r.secondaryENs.includes(en.id));
                        
                        return (
                        <div key={en.id} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                            ${isPrimary ? 'bg-indigo-100 border-indigo-500 dark:bg-indigo-900/30' : 
                              isSecondary ? 'bg-cyan-100 border-cyan-500 dark:bg-cyan-900/30' : 
                              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                            <HardDrive size={20} className={isPrimary ? 'text-indigo-600 dark:text-indigo-400' : isSecondary ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'} />
                            <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300">{en.id}</span>
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5">Rack {en.rack}</span>
                            
                            {/* Replication Indicator */}
                            {(isPrimary || isSecondary) && (
                                <div className={`text-[8px] font-bold px-1 rounded mt-1 ${isPrimary ? 'bg-indigo-500 text-white' : 'bg-cyan-500 text-white'}`}>
                                    {isPrimary ? 'PRIMARY' : 'REPLICA'}
                                </div>
                            )}
                        </div>
                    )})}
                </div>
                {/* Visualizing the network mesh active requests */}
                <div className="mt-4 text-[10px] text-center text-slate-500 italic">
                    All writes hit a Primary Extent Node and synchronously replicate to 2 Secondaries before acking.
                </div>
            </div>

        </div>

        {/* RIGHT: System Events & Visual Logs */}
        <div className="lg:col-span-3 flex flex-col gap-4 max-h-[800px]">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full overflow-hidden">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Terminal size={14} /> Live System Logs
                </h3>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 pr-2">
                    {logs.length === 0 && <div className="text-slate-400 text-center mt-10">Waiting for traffic...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className={`border-l-2 pl-2 py-1.5 rounded 
                            ${log.type === 'warning' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 
                              log.type === 'system' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400' : 
                              'border-blue-400 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400'}`}>
                            <div className="opacity-60 text-[8px] mb-0.5 font-sans">[{log.time.toLocaleTimeString([], {fractionalSecondDigits: 1})}] {log.source}</div>
                            {log.msg}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1 mb-2">
                    <Info size={14} /> Simulation Key
                </h4>
                <ul className="text-[10px] text-blue-700 dark:text-blue-400 space-y-2">
                    <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Incoming Request</li>
                    <li className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-indigo-500" /> Primary Extent Node</li>
                    <li className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-cyan-500" /> Secondary Extent Node</li>
                    <li className="flex items-center gap-2"><div className="w-2 h-2 border border-amber-500 bg-amber-100 dark:bg-amber-900" /> Hot Partition (Approaching Split)</li>
                </ul>
            </div>
        </div>

      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — SOSP 2011
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
              Windows Azure Storage (WAS) Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              WAS achieves the elusive trifecta defined by the CAP theorem in practice: strong consistency, high availability, and partition tolerance. It does this by separating metadata management (Partition Layer) from file storage (Stream Layer).
            </p>
          </div>

          {/* ---- Core Concepts ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Globe className="w-5 h-5" />} title="The Global Namespace" />
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                All data in WAS is accessed via a global, highly scalable URI namespace: <br/>
                <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-sm block mt-2">
                  http(s)://AccountName.&lt;service&gt;.core.windows.net/PartitionName/ObjectName
                </code>
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-2">
                <BenefitCard num="1" title="AccountName" desc="Located via DNS. Directs traffic to the primary Storage Stamp in a specific geographical data center." color="blue" />
                <BenefitCard num="2" title="PartitionName" desc="Used by the Partition Layer to locate the data within the cluster. Groups related data to allow atomic batch transactions." color="indigo" />
                <BenefitCard num="3" title="ObjectName" desc="Identifies the individual entity (a Blob, a row in a Table, or a Message in a Queue)." color="emerald" />
              </div>
            </div>
          </section>

          {/* ---- Architecture Layers ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Layers className="w-5 h-5" />} title="The Three Layers of a Storage Stamp" />
            <div className="grid md:grid-cols-3 gap-5">
              <HwCard icon={<Network className="w-6 h-6" />} color="blue" title="Front-End (FE) Layer"
                specs={["Stateless", "Authentication", "Routing"]}
                desc="Takes incoming HTTP requests, authenticates them, looks up the AccountName and PartitionName in the Partition Map, and routes the request to the correct Partition Server. Also streams large Blobs directly from the Stream layer."
              />
              <HwCard icon={<Database className="w-6 h-6" />} color="amber" title="Partition Layer"
                specs={["RangePartitions", "Strong Consistency", "Object Semantics"]}
                desc="Manages high-level data abstractions (Blobs, Tables, Queues). Provides transaction ordering and automatic load balancing. Uses a Log-Structured Merge-Tree (LSM) approach to store object metadata efficiently."
              />
              <HwCard icon={<HardDrive className="w-6 h-6" />} color="emerald" title="Stream Layer"
                specs={["Append-Only", "Extent Nodes", "3x Replication"]}
                desc="The distributed file system layer. Understands 'streams' (large files) made of 'extents' (1GB chunks). Responsible for synchronously replicating bits to disk to ensure durability across hardware failures."
              />
            </div>
          </section>

          {/* ---- Load Balancing ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Activity className="w-5 h-5" />} title="Dynamic Load Balancing (The Partition Layer)" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                WAS utilizes <strong>Range-based partitioning</strong> instead of hashing. This allows related objects to stay together for efficient enumeration and isolation. To handle hotspots, the <strong>Partition Manager (PM)</strong> continuously monitors load and executes three actions:
              </p>
              <div className="space-y-4">
                <FlowStep num="S" color="amber" icon={<Layers className="w-5 h-5" />} title="Split Operation (Seen in simulation)"
                  desc="If a single RangePartition receives too much traffic (or grows too large), the PM tells the server to split it at a specific key boundary. The two new partitions are then separated onto different servers."
                />
                <FlowStep num="M" color="emerald" icon={<Binary className="w-5 h-5" />} title="Merge Operation"
                  desc="Conversely, if the number of partitions grows too high and traffic is low, adjacent cold partitions are merged to keep the partition count manageable."
                />
                <FlowStep num="L" color="blue" icon={<Server className="w-5 h-5" />} title="Load Balance (Offload)"
                  desc="If a Partition Server is overloaded but no single partition is responsible, the PM simply moves (offloads) an entire partition to a less loaded server."
                />
              </div>
            </div>
          </section>

          {/* ---- Two Replication Engines ---- */}
          <section className="mb-16">
            <SectionTitle icon={<ShieldCheck className="w-5 h-5" />} title="Two Distinct Replication Engines" />
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 p-6 rounded-xl">
                <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                  <Cpu size={20} /> Intra-Stamp (Stream Layer)
                </h4>
                <ul className="space-y-3 text-sm text-indigo-700 dark:text-indigo-400">
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <strong>Synchronous:</strong> On the critical path of the user's write request.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <strong>Goal:</strong> Durability against hardware (disk/node/rack) failures.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <strong>Mechanism:</strong> The Primary Extent Node coordinates writes to two Secondary Nodes. Success is returned only when all 3 commit to disk (via a Journal drive).</li>
                </ul>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 p-6 rounded-xl">
                <h4 className="text-lg font-bold text-cyan-800 dark:text-cyan-300 mb-2 flex items-center gap-2">
                  <Globe size={20} /> Inter-Stamp (Partition Layer)
                </h4>
                <ul className="space-y-3 text-sm text-cyan-700 dark:text-cyan-400">
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <strong>Asynchronous:</strong> Happens in the background, off the critical path.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <strong>Goal:</strong> Geo-redundancy against catastrophic disasters (earthquakes, power grids).</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> <strong>Mechanism:</strong> Replicates entire objects or delta changes between a Primary Datacenter (e.g., US North) and a Secondary (e.g., US South).</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Why separate them?</strong> By scoping synchronous replication to a single stamp, the Stream Manager can keep all state in memory for blazing fast coordination. Geo-replication is handled by the Partition layer which natively understands object boundaries and delta-updates.
              </p>
            </div>
          </section>

          {/* ---- Sealing & Append-Only ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Shield className="w-5 h-5" />} title="The Power of Append-Only & Sealing" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                The Stream layer operates strictly as an <strong>append-only system</strong>. Data is never overwritten. When writing fails (e.g., a node crashes), the Stream Manager forces a <strong>Seal</strong> operation on the current Extent. 
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Immutability" formula="Sealed = Read-Only" ideal="Always" desc="Once sealed, reads from any replica guarantee identical data." color="blue" />
                <MetricCard label="Fast Recovery" formula="No Rollbacks" ideal="Milliseconds" desc="If a node fails, seal the extent, create a new one, and resume writing instantly." color="green" />
                <MetricCard label="Erasure Coding" formula="RS(N, M)" ideal="1.3x - 1.5x cost" desc="Cold, sealed extents are erasure-coded to reduce storage cost massively." color="amber" />
                <MetricCard label="Diagnostics" formula="History Preserved" ideal="Perfect Audit" desc="Append-only means old states naturally persist, aiding in bug recovery." color="slate" />
              </div>
            </div>
          </section>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}

// ================================================================
//  SUB-COMPONENTS (Standard Library)
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400",       icon: "text-blue-600 dark:text-blue-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400",     icon: "text-amber-600 dark:text-amber-400" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   border: "border-indigo-200 dark:border-indigo-500/30",   text: "text-indigo-600 dark:text-indigo-400",   icon: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
  slate:   { bg: "bg-slate-100 dark:bg-slate-500/10",    border: "border-slate-300 dark:border-slate-500/30",     text: "text-slate-600 dark:text-slate-400",     icon: "text-slate-600 dark:text-slate-400" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-500/10",       border: "border-cyan-200 dark:border-cyan-500/30",       text: "text-cyan-600 dark:text-cyan-400",       icon: "text-cyan-600 dark:text-cyan-400" },
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
          <span key={s} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>{s}</span>
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FlowStep({ num, color, icon, title, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${c.border} ${c.bg} ${c.text}`}>
        {num}
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className={c.icon}>{icon}</span>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function BenefitCard({ num, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{num}</div>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function MetricCard({ label, formula, ideal, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className={`text-xs font-bold uppercase tracking-wider ${c.text} mb-2`}>{label}</div>
      <div className="font-mono text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-700 mb-3">{formula}</div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Result</span>
        <span className={`text-xs font-bold ${c.text}`}>{ideal}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}