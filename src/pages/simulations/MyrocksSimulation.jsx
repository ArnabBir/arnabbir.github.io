import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Database,
  Server,
  Save,
  RefreshCw,
  Search,
  Filter as FilterIcon,
  ArrowDown,
  Layers,
  HardDrive,
  FileText,
  Activity,
  Play,
  Pause,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  BookOpen,
  Eye,
  Zap,
  Cpu,
  ArrowRight,
  Sun,
  Moon,
  Lock,
} from "lucide-react";

// ================================================================
//  CONFIGURATION
// ================================================================
const MEMTABLE_CAPACITY = 4;
const L0_CAPACITY = 3;
const TICK_RATE = 1000;

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function MyRocksSimulation() {
  // --- Theme State (Local Management for Reliability) ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // --- Simulation State ---
  const [isRunning, setIsRunning] = useState(false);
  const [memTable, setMemTable] = useState([]);
  const [immutableMemTable, setImmutableMemTable] = useState(null); // The one being flushed
  const [l0, setL0] = useState([]); // Level 0 (Unsorted, overlapping)
  const [l1, setL1] = useState([]); // Level 1 (Sorted, non-overlapping)
  const [logs, setLogs] = useState([]);
  const [readProbe, setReadProbe] = useState(null); // For visualizing read path
  const [compactionActive, setCompactionActive] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    writes: 0,
    flushes: 0,
    compactions: 0,
    bloomHits: 0,
    bytesWritten: 0,
  });

  const scrollRef = useRef(null);

  // --- Helpers ---
  const addLog = (msg, type = "info") => {
    // Ensure msg is always a string to prevent object rendering errors
    const safeMsg = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
    setLogs((prev) => [{ msg: safeMsg, type, time: new Date() }, ...prev].slice(0, 50));
  };

  const generateKey = () => Math.floor(Math.random() * 100);

  // --- Core Mechanics ---

  // 1. Write to MemTable
  const handleWrite = useCallback(() => {
    if (memTable.length >= MEMTABLE_CAPACITY) {
      if (!immutableMemTable) {
        // Trigger Flush
        setImmutableMemTable([...memTable]);
        setMemTable([]);
        addLog("MemTable full. Switched to Immutable MemTable.", "warning");
        setTimeout(flushToL0, 1000);
      } else {
        addLog("Write Stall! Flushing in progress.", "error");
      }
      return;
    }

    const key = generateKey();
    const val = `v${Math.floor(Math.random() * 1000)}`;
    setMemTable((prev) => [...prev, { key, val, type: "PUT" }].sort((a, b) => a.key - b.key));
    setStats((s) => ({ ...s, writes: s.writes + 1, bytesWritten: s.bytesWritten + 128 }));
    addLog(`Write: PUT ${key} = ${val}`);
  }, [memTable, immutableMemTable]);

  // 2. Flush to L0
  const flushToL0 = () => {
    setImmutableMemTable((prevImmut) => {
      if (!prevImmut) return null;
      
      const newSST = {
        id: Date.now(),
        data: prevImmut,
        min: prevImmut[0].key,
        max: prevImmut[prevImmut.length - 1].key,
        bloom: new Set(prevImmut.map(k => k.key)) // Simplified Bloom Filter
      };

      setL0((prevL0) => {
        const nextL0 = [newSST, ...prevL0];
        addLog(`Flushed to L0. SST Created [${newSST.min}-${newSST.max}]`, "success");
        setStats(s => ({...s, flushes: s.flushes + 1}));
        return nextL0;
      });
      return null;
    });
  };

  // 3. Auto-Trigger Compaction
  useEffect(() => {
    if (l0.length > L0_CAPACITY && !compactionActive) {
      triggerCompaction();
    }
  }, [l0, compactionActive]);

  // 4. Compaction Logic (L0 -> L1)
  const triggerCompaction = () => {
    setCompactionActive(true);
    addLog("Compaction Triggered: Merging L0 -> L1...", "warning");

    setTimeout(() => {
      setL0([]); // Clear L0
      setL1((prevL1) => {
        // Collect all data from L0 and L1
        let allData = [];
        l0.forEach(sst => allData.push(...sst.data));
        prevL1.forEach(sst => allData.push(...sst.data));

        // Sort and Deduplicate (LSM Logic: Keep latest)
        // We simulate "latest" by keeping the last occurrence in our raw array since we append new writes
        const uniqueMap = new Map();
        allData.forEach(item => uniqueMap.set(item.key, item));
        const sortedData = Array.from(uniqueMap.values()).sort((a, b) => a.key - b.key);

        // Split into chunks (SSTs) for L1
        const newL1 = [];
        const CHUNK_SIZE = 6;
        for (let i = 0; i < sortedData.length; i += CHUNK_SIZE) {
          const chunk = sortedData.slice(i, i + CHUNK_SIZE);
          newL1.push({
            id: Date.now() + i,
            data: chunk,
            min: chunk[0].key,
            max: chunk[chunk.length - 1].key,
            bloom: new Set(chunk.map(k => k.key))
          });
        }
        
        return newL1;
      });
      setCompactionActive(false);
      setStats(s => ({...s, compactions: s.compactions + 1}));
      addLog("Compaction Complete. L1 Organized.", "success");
    }, 2000);
  };

  // 5. Read Path Simulation
  const handleRead = () => {
    const key = generateKey();
    addLog(`Read Request: Get(${key})`);
    
    // Animate Probe
    const sequence = [];
    
    // Step 1: MemTable
    sequence.push({ target: 'mem', msg: `Checking MemTable for ${key}...` });
    const inMem = memTable.find(x => x.key === key);
    if (inMem) {
       runProbeSequence([...sequence, { target: 'mem', found: true, val: inMem.val }]);
       return;
    }

    // Step 2: Immutable Mem
    if (immutableMemTable) {
        sequence.push({ target: 'immut', msg: `Checking Immutable Mem for ${key}...` });
        const inImmut = immutableMemTable.find(x => x.key === key);
        if (inImmut) {
            runProbeSequence([...sequence, { target: 'immut', found: true, val: inImmut.val }]);
            return;
        }
    }

    // Step 3: L0 (Check Bloom -> Check SST)
    l0.forEach((sst, idx) => {
        sequence.push({ target: `l0-${idx}`, msg: `L0 SST[${idx}]: Checking Bloom Filter...` });
        // Bloom Filter Check
        if (sst.bloom.has(key)) {
            // "True Positive" in this sim (or false positive, but we check data next)
            setStats(s => ({...s, bloomHits: s.bloomHits + 1}));
            const found = sst.data.find(x => x.key === key);
            if (found) {
                sequence.push({ target: `l0-${idx}`, found: true, val: found.val, msg: "Bloom Passed. Key Found in SST." });
                return; // Logic breaks here, but visual sequence continues. We handle early exit in runner.
            } else {
                sequence.push({ target: `l0-${idx}`, msg: "Bloom False Positive. Key not in block." });
            }
        } else {
            sequence.push({ target: `l0-${idx}`, msg: "Bloom Negative. Skipping SST." });
        }
    });

    // Step 4: L1 (Binary Search on ranges)
    // In L1, files are sorted and non-overlapping. We only check files where key is in [min, max]
    const candidates = l1.filter(sst => key >= sst.min && key <= sst.max);
    if (candidates.length === 0) {
         sequence.push({ target: 'l1', msg: `L1: Key ${key} not in any SST range.` });
    } else {
        candidates.forEach(sst => {
             sequence.push({ target: `l1-${sst.id}`, msg: `L1 SST: Checking Bloom...` });
             if (sst.bloom.has(key)) {
                 const found = sst.data.find(x => x.key === key);
                 if (found) sequence.push({ target: `l1-${sst.id}`, found: true, val: found.val });
                 else sequence.push({ target: `l1-${sst.id}`, msg: "Bloom False Positive." });
             } else {
                 sequence.push({ target: `l1-${sst.id}`, msg: "Bloom Negative." });
             }
        });
    }

    sequence.push({ target: 'end', msg: `Result: ${key} not found.` });
    runProbeSequence(sequence);
  };

  const runProbeSequence = (seq) => {
      let i = 0;
      const next = () => {
          if (i >= seq.length) {
              setReadProbe(null);
              return;
          }
          const step = seq[i];
          setReadProbe(step);
          
          if (step.found) {
              addLog(`FOUND: ${step.val}`, "success");
              setTimeout(() => setReadProbe(null), 1500);
              return;
          }
          
          // If we found it in a previous iteration (handled by logic above but passed to visualizer), stop
          if (i > 0 && seq[i-1].found) return;

          i++;
          setTimeout(next, 800);
      };
      next();
  };

  // --- Auto-Run Loop ---
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        if (Math.random() > 0.3) handleWrite();
        else handleRead();
      }, TICK_RATE);
    }
    return () => clearInterval(interval);
  }, [isRunning, handleWrite]);

  const reset = () => {
      setMemTable([]);
      setImmutableMemTable(null);
      setL0([]);
      setL1([]);
      setLogs([]);
      setStats({ writes: 0, flushes: 0, compactions: 0, bloomHits: 0, bytesWritten: 0 });
      setCompactionActive(false);
      setIsRunning(false);
      addLog("System Reset.");
  };

  // --- Wrap Component in Theme Provider Logic ---
  return (
    <div className={isDarkMode ? "dark" : ""}>
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                MyRocks Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">LSM-Tree Storage Engine (Facebook)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${isRunning ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30" : "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30"}`}
            >
              {isRunning ? <><Pause size={16} /> Pause Traffic</> : <><Play size={16} /> Auto Traffic</>}
            </button>
            
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />
            
            <button
              onClick={handleWrite}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} /> Write
            </button>

            <button
              onClick={handleRead}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={14} /> Read
            </button>

            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

            <button onClick={reset} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors" title="Reset">
              <RefreshCw size={16} />
            </button>
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors" title="Toggle Theme">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION AREA
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Stats & Logs */}
        <div className="lg:col-span-3 flex flex-col gap-4">
             {/* Stats Panel */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                  <Activity size={14} /> Engine Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Writes</span>
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{stats.writes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Flushes (Mem→L0)</span>
                    <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.flushes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Compactions</span>
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{stats.compactions}</span>
                  </div>
                   <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Bloom Filter Hits</span>
                    <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.bloomHits}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                     <span className="text-xs text-slate-400">Total Data Written: {stats.bytesWritten} bytes</span>
                  </div>
                </div>
             </div>

             {/* Log Panel */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[350px] flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Engine Log</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 text-[10px] font-mono">
                    {logs.map((l, i) => (
                        <div key={i} className={`p-2 rounded border-l-2 ${
                            l.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400' :
                            l.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                            l.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 dark:text-amber-400' :
                            'bg-slate-50 dark:bg-slate-800/50 border-blue-400 text-slate-600 dark:text-slate-300'
                        }`}>
                            <span className="opacity-50 block mb-1">[{l.time.toLocaleTimeString([], {hour12: false, fractionalSecondDigits: 2})}]</span>
                            {l.msg}
                        </div>
                    ))}
                </div>
             </div>
        </div>

        {/* CENTER: LSM Tree Visualization */}
        <div className="lg:col-span-9 flex flex-col gap-6 relative">
            
            {/* Read Probe Overlay */}
            {readProbe && (
                <div className="absolute top-4 right-4 z-50 bg-slate-900/90 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Search size={16} className="text-blue-400 animate-pulse" />
                    <span className="text-xs font-mono">{readProbe.msg || (readProbe.found ? "Found!" : "Probing...")}</span>
                </div>
            )}

            {/* RAM SECTION */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-br font-bold">RAM (Memory)</div>
                <div className="flex flex-col md:flex-row gap-8 mt-4">
                    
                    {/* Active MemTable */}
                    <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${readProbe?.target === 'mem' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Cpu size={16} className="text-blue-500" /> MemTable
                            </h4>
                            <span className="text-[10px] text-slate-400">{memTable.length}/{MEMTABLE_CAPACITY}</span>
                        </div>
                        <div className="space-y-1 min-h-[100px]">
                            {memTable.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 animate-in slide-in-from-left-2">
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.key}</span>
                                    <span className="text-slate-500">{item.val}</span>
                                </div>
                            ))}
                            {memTable.length === 0 && <div className="text-xs text-slate-400 text-center py-8 italic">Empty</div>}
                        </div>
                    </div>

                    {/* Immutable MemTable */}
                    <div className={`flex-1 p-4 rounded-xl border-2 border-dashed transition-all ${readProbe?.target === 'immut' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-105' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Lock size={16} /> Immutable Mem
                            </h4>
                            {immutableMemTable && <span className="text-[10px] text-amber-500 animate-pulse font-bold">FLUSHING...</span>}
                        </div>
                        <div className="space-y-1 min-h-[100px] opacity-70">
                            {immutableMemTable ? immutableMemTable.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs bg-slate-100 dark:bg-slate-800 p-1.5 rounded">
                                    <span className="font-mono">{item.key}</span>
                                    <span>{item.val}</span>
                                </div>
                            )) : <div className="text-xs text-slate-400 text-center py-8 italic">Ready</div>}
                        </div>
                    </div>

                </div>
                
                {/* Arrow Down */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-300 dark:text-slate-600">
                    <ArrowDown size={24} className="animate-bounce" />
                </div>
            </div>

            {/* DISK SECTION */}
            <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-inner relative">
                 <div className="absolute top-0 left-0 bg-slate-600 text-white text-[10px] px-2 py-1 rounded-br font-bold">Flash Storage (SSD)</div>
                 
                 {/* Level 0 */}
                 <div className="mt-6 mb-8">
                     <div className="flex justify-between items-center mb-2">
                         <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                             <Layers size={16} className="text-indigo-500" /> Level 0 (L0)
                             <span className="text-[10px] font-normal text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 rounded">Unsorted / Overlapping</span>
                         </h4>
                         {compactionActive && <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Compacting...</span>}
                     </div>
                     
                     <div className="flex gap-2 overflow-x-auto pb-2 min-h-[80px]">
                         {l0.length === 0 && <div className="w-full text-center text-xs text-slate-400 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">Empty</div>}
                         {l0.map((sst, i) => (
                             <div key={sst.id} className={`min-w-[120px] bg-white dark:bg-slate-900 border-2 rounded-lg p-2 flex flex-col gap-1 shadow-sm transition-all ${readProbe?.target === `l0-${i}` ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105 z-10' : 'border-slate-300 dark:border-slate-700'}`}>
                                 <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                                     <span className="text-[10px] font-bold text-slate-500">SST #{sst.id % 1000}</span>
                                     <FilterIcon size={10} className={readProbe?.target === `l0-${i}` ? "text-indigo-500" : "text-slate-300"} />
                                 </div>
                                 <div className="flex justify-between text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                     <span>{sst.min}</span>
                                     <ArrowRight size={10} className="text-slate-300" />
                                     <span>{sst.max}</span>
                                 </div>
                                 <div className="text-[9px] text-slate-400 text-center mt-1">{sst.data.length} keys</div>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Level 1 */}
                 <div>
                     <div className="flex justify-between items-center mb-2">
                         <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                             <Layers size={16} className="text-emerald-500" /> Level 1 (L1)
                             <span className="text-[10px] font-normal text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 rounded">Sorted / Non-Overlapping</span>
                         </h4>
                     </div>
                     
                     <div className="flex gap-2 overflow-x-auto pb-2 min-h-[80px]">
                         {l1.length === 0 && <div className="w-full text-center text-xs text-slate-400 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">Empty</div>}
                         {l1.map((sst, i) => (
                             <div key={sst.id} className={`min-w-[120px] bg-white dark:bg-slate-900 border-2 rounded-lg p-2 flex flex-col gap-1 shadow-sm transition-all ${readProbe?.target === `l1-${sst.id}` ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 z-10' : 'border-slate-300 dark:border-slate-700'}`}>
                                 <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                                     <span className="text-[10px] font-bold text-slate-500">SST #{sst.id % 1000}</span>
                                     <FilterIcon size={10} className={readProbe?.target === `l1-${sst.id}` ? "text-emerald-500" : "text-slate-300"} />
                                 </div>
                                 <div className="flex justify-between text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                     <span>{sst.min}</span>
                                     <ArrowRight size={10} className="text-slate-300" />
                                     <span>{sst.max}</span>
                                 </div>
                                 <div className="text-[9px] text-slate-400 text-center mt-1">{sst.data.length} keys</div>
                             </div>
                         ))}
                     </div>
                 </div>

            </div>
        </div>

      </div>

      {/* ============================================================
          DEEP DIVE SECTION
          ============================================================ */}
      <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-16">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              MyRocks: The Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Based on Facebook's migration from InnoDB to RocksDB, MyRocks leverages the Log-Structured Merge (LSM) Tree to optimize for Flash storage, reducing space amplification and write amplification.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
             <MetricCard label="Instance Size" formula="62.3% Reduction" ideal="Vs InnoDB" desc="Compression + Removal of fragmentation." color="emerald" />
             <MetricCard label="Write Amp" formula="Reduced" ideal="Sequential" desc="Append-only writes are flash-friendly." color="blue" />
             <MetricCard label="Read CPU" formula="Comparable" ideal="Optimized" desc="Bloom filters mitigate scan overhead." color="indigo" />
             <MetricCard label="Compaction" formula="Leveled" ideal="Auto" desc="Merges & sorts background files." color="amber" />
          </div>

          <SectionTitle icon={<Server className="w-5 h-5" />} title="Core Components" />
          <div className="grid md:grid-cols-2 gap-6 mb-16">
             <HwCard 
                icon={<Cpu className="w-6 h-6" />}
                title="MemTable"
                specs={["In-Memory", "Sorted", "SkipList"]}
                desc="All writes go here first. It's fast (RAM) and sorted. When full, it becomes immutable and flushes to disk as an SST."
                color="blue"
             />
             <HwCard 
                icon={<HardDrive className="w-6 h-6" />}
                title="SST (Sorted String Table)"
                specs={["Immutable", "Disk-Based", "Compressed"]}
                desc="The basic unit of storage on disk. Once written, it is never modified. Updates are handled by writing new versions of keys with higher sequence numbers."
                color="emerald"
             />
             <HwCard 
                icon={<FilterIcon className="w-6 h-6" />}
                title="Bloom Filter"
                specs={["Probabilistic", "Space-Efficient"]}
                desc="A bit-array stored in each SST header. It quickly tells us if a key is DEFINITELY NOT in the file, saving an expensive disk read."
                color="indigo"
             />
             <HwCard 
                icon={<RefreshCw className="w-6 h-6" />}
                title="Compaction"
                specs={["Background Process", "Merge Sort"]}
                desc="To prevent read performance degradation, background threads constantly merge overlapping SSTs from L0 to L1, removing deleted/overwritten keys."
                color="amber"
             />
          </div>

          <SectionTitle icon={<ArrowDown className="w-5 h-5" />} title="The Write Path" />
          <div className="space-y-4 mb-16">
             <FlowStep num="1" icon={<Zap size={18} />} title="Write to WAL & MemTable" desc="Data is appended to a Write-Ahead Log (for durability) and inserted into the sorted MemTable (RAM)." color="blue" />
             <FlowStep num="2" icon={<HardDrive size={18} />} title="Flush to L0" desc="When MemTable fills, it's flushed to Level 0 on disk. L0 files can overlap in key ranges." color="indigo" />
             <FlowStep num="3" icon={<RefreshCw size={18} />} title="Compaction to L1+" desc="When L0 fills, files are merged into L1. L1 files are strictly sorted and non-overlapping." color="amber" />
          </div>

          <SectionTitle icon={<Eye className="w-5 h-5" />} title="Simulation Guide" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             <UsageCard step="1" title="Write Data" desc="Click 'Write' to add keys to MemTable. Watch it fill up." color="blue" />
             <UsageCard step="2" title="Trigger Flush" desc="Fill the MemTable to force a flush to L0. Note the new SST." color="indigo" />
             <UsageCard step="3" title="Compaction" desc="Fill L0 with 3+ files. Watch them merge into a sorted L1 level." color="amber" />
             <UsageCard step="4" title="Read Probe" desc="Click 'Read' to see the search path: Mem -> L0 (Bloom) -> L1." color="emerald" />
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </div>
    </div>
  );
}

// ================================================================
//  STANDARD LIBRARY COMPONENTS
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

function FlowStep({ num, color, icon, title, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${c.border} ${c.bg} ${c.text}`}>
        {num}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={c.icon}>{icon}</span>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, formula, ideal, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm dark:shadow-none">
      <div className={`text-xs font-bold uppercase tracking-wider ${c.text} mb-2`}>{label}</div>
      <div className="font-mono text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-700 mb-3">{formula}</div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Ideal</span>
        <span className={`text-xs font-bold ${c.text}`}>{ideal}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
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