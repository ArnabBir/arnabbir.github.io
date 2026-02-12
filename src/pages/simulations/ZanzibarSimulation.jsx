import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  ShieldCheck, Database, Network, Users, FileText, Lock, Play, Pause,
  RefreshCw, Activity, Terminal, Zap, Search, ArrowRight, Layers,
  AlertTriangle, Clock, Server, CheckCircle2, XCircle, BookOpen, Eye,
  GitCommit, ChevronDown, ChevronRight, Globe, Key, ListTree, Share2,
  Cpu, HardDrive, BarChart3, Fingerprint, Workflow, MousePointer2
} from 'lucide-react';

// ================================================================
//  SIMULATION CONFIG
// ================================================================

const INITIAL_TUPLES = [
  { id: 1, object: 'group:engineering', relation: 'member', user: 'user:alice' },
  { id: 2, object: 'group:engineering', relation: 'member', user: 'user:bob' },
  { id: 3, object: 'group:product', relation: 'member', user: 'user:charlie' },
  { id: 4, object: 'doc:design_spec', relation: 'owner', user: 'user:alice' },
  { id: 5, object: 'doc:design_spec', relation: 'viewer', user: 'group:engineering' },
  { id: 6, object: 'group:interns', relation: 'member', user: 'user:dave' },
  { id: 7, object: 'group:engineering', relation: 'member', user: 'group:interns' },
  { id: 8, object: 'doc:roadmap', relation: 'viewer', user: 'group:product' },
];

const NAMESPACE_CONFIG = {
  'doc': {
    'owner': [],
    'viewer': ['owner'] 
  }
};

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function ZanzibarSimulation() {
  const { theme, setTheme } = useTheme();

  // --- State ---
  const [tuples, setTuples] = useState(INITIAL_TUPLES);
  const [globalTime, setGlobalTime] = useState(100); 
  const [zookie, setZookie] = useState(100); 
  const [logs, setLogs] = useState([]);
  const [checkResult, setCheckResult] = useState(null);
  const [leopardIndex, setLeopardIndex] = useState({});
  const [isIndexing, setIsIndexing] = useState(false);
  
  // Scenario State
  const [scenarioMode, setScenarioMode] = useState(null);
  const [scenarioStep, setScenarioStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false, clicking: false });

  // Inputs
  const [checkSubject, setCheckSubject] = useState('user:dave');
  const [checkObject, setCheckObject] = useState('doc:design_spec');
  const [checkRelation, setCheckRelation] = useState('viewer');

  // --- Refs for Visual Automation ---
  const logsContainerRef = useRef(null);
  const removeBobBtnRef = useRef(null);
  const checkBtnRef = useRef(null);
  const syncZookieBtnRef = useRef(null);
  const scenarioBtnRef = useRef(null);

  // --- Helpers ---
  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { id: Math.random(), msg, type, time: new Date() }].slice(-50));
  }, []);

  const advanceTime = useCallback(() => {
    setGlobalTime(prev => prev + 1);
  }, []);

  // --- Leopard Indexing Logic ---
  useEffect(() => {
    setIsIndexing(true);
    const timer = setTimeout(() => {
      rebuildLeopardIndex();
      setIsIndexing(false);
    }, 600); 
    return () => clearTimeout(timer);
  }, [tuples]);

  const rebuildLeopardIndex = () => {
    const graph = {};
    tuples.forEach(t => {
      const key = `${t.object}#${t.relation}`;
      if (!graph[key]) graph[key] = [];
      graph[key].push(t.user);
    });

    const flatIndex = {};
    const allUsers = new Set(tuples.map(t => t.user).filter(u => u.startsWith('user:')));
    
    allUsers.forEach(user => {
      const reachable = new Set();
      const queue = [user];
      const visited = new Set();

      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        tuples.forEach(t => {
          if (t.user === current) {
            const relationKey = `${t.object}#${t.relation}`;
            reachable.add(relationKey);
            
            const ns = t.object.split(':')[0];
            const impliedRules = NAMESPACE_CONFIG[ns]?.[t.relation] || [];
            impliedRules.forEach(impliedRel => {
               reachable.add(`${t.object}#${impliedRel}`);
            });

            if (t.object.startsWith('group:')) {
               queue.push(t.object);
            }
          }
        });
      }
      flatIndex[user] = Array.from(reachable);
    });
    setLeopardIndex(flatIndex);
  };

  // --- Core Check Logic ---
  const runCheck = (useLeopard = true) => {
    addLog(`CHECK: Can ${checkSubject} access ${checkObject} as ${checkRelation}?`, 'system');
    
    let zookieWarning = false;
    if (scenarioMode === 'new_enemy' && zookie < globalTime) {
       zookieWarning = true;
       addLog(`ZOOKIE STALENESS DETECTED: Client Token ${zookie} < Server Time ${globalTime}`, 'warning');
    }

    const startTime = performance.now();
    let allowed = false;
    let path = [];

    const userPermissions = leopardIndex[checkSubject] || [];
    const targetKey = `${checkObject}#${checkRelation}`;
    
    allowed = userPermissions.includes(targetKey);
    
    if (!allowed && checkRelation === 'viewer') {
        allowed = userPermissions.includes(`${checkObject}#owner`);
    }

    // Force "Allow" if we are in the specific 'Stale Read' step
    if (scenarioMode === 'new_enemy' && scenarioStep === 3 && zookie === 100) {
        allowed = true; 
        path = ['SNAPSHOT READ @ T=100 (STALE)'];
    } else {
        path = allowed ? ['Leopard Index Hit (Direct Lookup)'] : ['Leopard Index Miss'];
    }

    const duration = (performance.now() - startTime).toFixed(2);
    setCheckResult({ allowed, duration, path, time: globalTime, zookieWarning });
    
    if (allowed) {
        if (zookieWarning && scenarioMode === 'new_enemy' && scenarioStep === 3) {
            addLog(`ACCESS GRANTED (VIOLATION! Old Enemy Problem)`, 'error');
        } else {
            addLog(`ACCESS GRANTED (${duration}ms)`, 'success');
        }
    } else {
        addLog(`ACCESS DENIED (${duration}ms)`, 'success'); 
    }
  };

  // --- Automation Helper: Move Cursor ---
  const moveCursorTo = async (ref, duration = 800) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Calculate position relative to viewport, but we render cursor fixed/absolute.
    // For simplicity in this demo, let's assume we render fixed on top.
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    setCursorPos(prev => ({ ...prev, visible: true, clicking: false }));
    
    // Animate interpolation could go here, but simple timeout updates work for "bot" feel
    setCursorPos({ x: targetX, y: targetY, visible: true, clicking: false });
    
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  const clickCursor = async () => {
    setCursorPos(prev => ({ ...prev, clicking: true }));
    await new Promise(r => setTimeout(r, 200));
    setCursorPos(prev => ({ ...prev, clicking: false }));
    await new Promise(r => setTimeout(r, 200));
  };

  // --- "New Enemy" Scenario ---
  const runNewEnemyScenario = async () => {
    if (scenarioMode === 'new_enemy') {
        setScenarioMode(null);
        setScenarioStep(0);
        setTuples(INITIAL_TUPLES);
        setCursorPos(p => ({ ...p, visible: false }));
        return;
    }

    setScenarioMode('new_enemy');
    setScenarioStep(1);
    addLog('--- STARTING NEW ENEMY SCENARIO ---', 'system');
    
    // Initial Setup
    setCheckSubject('user:bob');
    setCheckObject('doc:secret_plan');
    setCheckRelation('viewer');
    const cleanTuples = [
      { id: 99, object: 'doc:secret_plan', relation: 'viewer', user: 'user:bob' }
    ];
    setTuples(cleanTuples);
    setGlobalTime(100);
    setZookie(100);
    
    // --- STEP 1: REMOVE BOB ---
    await moveCursorTo(removeBobBtnRef);
    await clickCursor();
    
    setScenarioStep(2);
    addLog('STEP 1: Alice removes Bob from ACL...', 'warning');
    setTuples([]); 
    setGlobalTime(101);
    addLog('Server Time advances to 101. Bob removed from DB.', 'system');

    await new Promise(r => setTimeout(r, 1000));

    // --- STEP 2: SAVE CONTENT ---
    // (Abstract step, no UI button for this specific action in simulation)
    setScenarioStep(3);
    addLog('STEP 2: Alice saves Secret Content.', 'warning');
    addLog('System returns Zookie T=101 to Alice.', 'system');
    
    await new Promise(r => setTimeout(r, 1000));

    // --- STEP 3: ATTACK (Stale Read) ---
    setScenarioStep(3); // Keep visuals on step 3
    await moveCursorTo(checkBtnRef);
    await clickCursor();
    addLog('STEP 3: Bob tries read with STALE Zookie (100)...', 'error');
    runCheck(); 

    await new Promise(r => setTimeout(r, 1500));

    // --- STEP 4: ENFORCE FRESHNESS ---
    setScenarioStep(4);
    await moveCursorTo(syncZookieBtnRef);
    await clickCursor();
    addLog('STEP 4: System enforces Zookie >= 101...', 'success');
    setZookie(101);

    await new Promise(r => setTimeout(r, 1000));

    // --- STEP 5: VERIFY DENIAL ---
    setScenarioStep(5);
    await moveCursorTo(checkBtnRef);
    await clickCursor();
    runCheck();
    
    setScenarioMode(null);
    setScenarioStep(0);
    setCursorPos(p => ({ ...p, visible: false }));
    addLog('Scenario Complete. System Secure.', 'success');
  };

  // --- Scroll Fix ---
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const removeTuple = (id) => {
    setTuples(prev => prev.filter(t => t.id !== id));
    advanceTime();
    addLog('Tuple removed. Triggering re-index...', 'warning');
  };

  const addTuple = () => {
    const newTuple = { id: Math.random(), object: 'group:interns', relation: 'member', user: 'user:eve' };
    setTuples(prev => [...prev, newTuple]);
    advanceTime();
    addLog('Tuple added. Triggering re-index...', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* VIRTUAL CURSOR OVERLAY */}
      {cursorPos.visible && (
        <div 
            className="fixed pointer-events-none z-[100] transition-all duration-700 ease-in-out"
            style={{ 
                left: cursorPos.x, 
                top: cursorPos.y,
                transform: `translate(-20%, -20%) scale(${cursorPos.clicking ? 0.8 : 1})`
            }}
        >
            <div className="relative">
                <MousePointer2 
                    className="w-8 h-8 text-black fill-white drop-shadow-xl" 
                    strokeWidth={1.5}
                />
                {cursorPos.clicking && (
                    <div className="absolute -top-2 -left-2 w-12 h-12 bg-yellow-400 rounded-full opacity-50 animate-ping" />
                )}
            </div>
        </div>
      )}

      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Zanzibar Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">Global Consistent Authorization System</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
             <div className="flex flex-col px-4 border-r border-slate-300 dark:border-slate-700">
                 <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Globe size={10} /> Spanner Time</span>
                 <span className="font-mono text-xl text-blue-600 dark:text-blue-400 leading-none">{globalTime}</span>
             </div>
             <div className="flex flex-col px-4">
                 <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><Fingerprint size={10} /> Client Zookie</span>
                 <div className="flex items-center gap-2">
                     <span className={`font-mono text-xl leading-none ${zookie < globalTime ? 'text-amber-500 animate-pulse' : 'text-green-600 dark:text-green-400'}`}>{zookie}</span>
                     <button 
                        ref={syncZookieBtnRef}
                        onClick={() => setZookie(globalTime)} 
                        className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-[9px] font-bold border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
                    >
                        SYNC
                     </button>
                 </div>
             </div>
          </div>

          <div className="flex gap-2">
             <button onClick={() => setTuples(INITIAL_TUPLES)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors" title="Reset">
               <RefreshCw size={18} />
             </button>
             <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors">
               <Eye size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION AREA
          ============================================================ */}
      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: ACL STORE (Tuples) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Database size={16} className="text-blue-500"/> Relation Tuples
                    </h3>
                    <button onClick={addTuple} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                        + Add Tuple
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {tuples.map(t => (
                        <div key={t.id} className="group p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono relative hover:border-blue-400 transition-colors">
                            <div className="flex gap-2 items-center mb-1">
                                <span className="text-purple-600 dark:text-purple-400 font-bold">{t.object}</span>
                                <span className="text-slate-400">#</span>
                                <span className="text-amber-600 dark:text-amber-400">{t.relation}</span>
                            </div>
                            <div className="flex justify-between items-center pl-4">
                                <span className="text-slate-400">@</span>
                                <span className="text-green-600 dark:text-green-400 font-bold">{t.user}</span>
                                <button 
                                    ref={t.user === 'user:bob' && t.object === 'doc:secret_plan' ? removeBobBtnRef : null}
                                    onClick={() => removeTuple(t.id)}
                                    className={`p-1 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900/50 ${scenarioMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <XCircle size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {tuples.length === 0 && <div className="text-slate-400 text-xs italic text-center py-4">No Access Control Lists defined.</div>}
                </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Namespace Config</h3>
                <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2 rounded border border-slate-300 dark:border-slate-800">
                    <span className="text-purple-500">doc</span> {'{'} <br/>
                    &nbsp;&nbsp;<span className="text-amber-500">owner</span>: []<br/>
                    &nbsp;&nbsp;<span className="text-amber-500">viewer</span>: [<span className="text-green-500">'owner'</span>]<br/>
                    {'}'}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                    * Userset Rewrite: Owners are implicitly Viewers.
                </p>
            </div>
        </div>

        {/* COLUMN 2: LEOPARD INDEX (Visualizer) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-[500px] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 z-10">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <ListTree size={16} className="text-emerald-500"/> Leopard Index (Flattened)
                    </h3>
                    {isIndexing ? (
                        <span className="text-[10px] flex items-center gap-1 text-amber-500 font-bold animate-pulse">
                            <Activity size={12} /> RE-INDEXING...
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400">Transitive Closure Calculated</span>
                    )}
                </div>
                
                {/* Visualizer Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
                    <Network size={300} />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar z-10 space-y-3">
                    {Object.entries(leopardIndex).map(([user, permissions]) => (
                        <div key={user} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-3 transition-all hover:shadow-md">
                            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                                <Users size={12} className="text-slate-400"/>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{user}</span>
                                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 rounded-full ml-auto">
                                    {permissions.length} perms
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {permissions.map((p, i) => (
                                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${p === `${checkObject}#${checkRelation}` ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
                                        {p.includes('owner') ? <Key size={8} /> : <Eye size={8} />}
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {Object.keys(leopardIndex).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                            <Activity size={24} className="mb-2 opacity-50"/>
                            <span className="text-xs">Index Empty</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl text-xs text-indigo-800 dark:text-indigo-200">
                <strong className="block mb-1 flex items-center gap-1"><Zap size={12} /> O(1) Check Complexity</strong>
                The Leopard Index effectively denormalizes graph reachability. Instead of traversing graph edges at query time (slow, high tail latency), we look up the pre-computed set of permissions instantly.
            </div>
        </div>

        {/* COLUMN 3: CHECK TERMINAL */}
        <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-xl border border-slate-700 flex flex-col h-[320px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Terminal size={14} /> Authorization Check
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                    <div className="flex gap-2">
                        <input value={checkSubject} onChange={e => setCheckSubject(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs flex-1 text-green-400 font-mono" placeholder="User" />
                        <span className="text-slate-500 self-center">?</span>
                    </div>
                    <div className="flex gap-2">
                        <input value={checkRelation} onChange={e => setCheckRelation(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs w-20 text-amber-400 font-mono" placeholder="Rel" />
                        <span className="text-slate-500 self-center">@</span>
                        <input value={checkObject} onChange={e => setCheckObject(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs flex-1 text-purple-400 font-mono" placeholder="Object" />
                    </div>
                </div>

                <button 
                    ref={checkBtnRef}
                    onClick={() => runCheck(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2 rounded text-sm transition-all shadow-lg shadow-blue-900/20 mb-4 flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={16} /> CHECK PERMISSION
                </button>

                {/* Results */}
                <div className="flex-1 bg-black/30 rounded p-2 overflow-hidden flex flex-col items-center justify-center border border-slate-700/50 relative">
                    {checkResult ? (
                        <>
                            <div className={`text-4xl font-black mb-2 ${checkResult.allowed ? (checkResult.zookieWarning ? 'text-red-500' : 'text-green-500') : 'text-red-500'}`}>
                                {checkResult.allowed ? 'ALLOW' : 'DENY'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mb-2">
                                Latency: {checkResult.duration}ms | Snapshot @ {checkResult.time}
                            </div>
                            {checkResult.zookieWarning && (
                                <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] px-2 py-1 rounded font-bold animate-pulse flex items-center gap-1">
                                    <AlertTriangle size={10} /> STALE READ DETECTED
                                </div>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono">
                                Path: {checkResult.path.join(' -> ')}
                            </div>
                        </>
                    ) : (
                        <span className="text-slate-600 text-xs">Waiting for request...</span>
                    )}
                </div>
            </div>

            {/* Scenarios */}
            <div className={`rounded-xl border p-4 transition-all ${scenarioMode ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Interactive Scenario</h3>
                    {scenarioMode && <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                </div>
                
                <button 
                    ref={scenarioBtnRef}
                    onClick={runNewEnemyScenario}
                    disabled={scenarioMode === 'new_enemy'}
                    className={`w-full text-left p-3 rounded border transition-colors group relative overflow-hidden ${scenarioMode ? 'bg-white dark:bg-slate-900 border-amber-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                >
                    <div className="relative z-10">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-500"/> "New Enemy" Problem
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                            Simulate race condition: Alice removes Bob, adds secret. Bob tries to read with old Zookie.
                        </div>
                        {scenarioMode && (
                             <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                 <div className="h-full bg-amber-500 transition-all duration-500" style={{width: `${(scenarioStep / 5) * 100}%`}}></div>
                             </div>
                        )}
                    </div>
                </button>
            </div>

            {/* Logs */}
            <div 
                ref={logsContainerRef}
                className="flex-1 bg-black text-green-400 font-mono text-[10px] p-2 rounded-xl border border-slate-800 overflow-y-auto custom-scrollbar h-[150px]"
            >
                {logs.map(l => (
                    <div key={l.id} className={`mb-1 ${l.type === 'error' ? 'text-red-400' : l.type === 'warning' ? 'text-amber-400' : l.type === 'system' ? 'text-blue-400' : 'text-green-400'}`}>
                        <span className="opacity-50">[{l.time.toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span> {l.msg}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black py-16">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
               <BookOpen className="w-3.5 h-3.5" /> Technical Deep Dive
             </div>
             <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
               Zanzibar: Google's Global Authorization System
             </h2>
             <p className="text-slate-600 dark:text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">
               Used by Drive, YouTube, and Cloud, Zanzibar is a highly scalable system for storing Access Control Lists (ACLs) and performing authorization checks. It prioritizes <strong className="text-blue-600 dark:text-blue-400">consistency</strong> and <strong className="text-emerald-600 dark:text-emerald-400">low latency</strong>, serving millions of requests per second with &lt;10ms latency.
             </p>
          </div>

          {/* 1. RELATIONAL TUPLES */}
          <section className="mb-20">
            <SectionTitle icon={<Database />} title="1. The Data Model: Relation Tuples" />
            <div className="grid md:grid-cols-2 gap-8 items-start">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Standardized Storage</h4>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    Zanzibar avoids custom JSON structures for permissions. Instead, every permission in the entire company is stored as a standard <strong>Relation Tuple</strong>. This allows the system to be application-agnostic.
                  </p>
                  <div className="font-mono text-sm bg-slate-100 dark:bg-black p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-300 dark:border-slate-700 pb-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">Object</span> 
                        <span className="text-slate-400">#</span> 
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Relation</span> 
                        <span className="text-slate-400">@</span> 
                        <span className="text-green-600 dark:text-green-400 font-bold">User</span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <span className="text-purple-600 dark:text-purple-400">doc:readme</span> 
                            <span className="text-slate-400">#</span> 
                            <span className="text-amber-600 dark:text-amber-400">owner</span> 
                            <span className="text-slate-400">@</span> 
                            <span className="text-green-600 dark:text-green-400">user:alice</span>
                            <div className="text-[10px] text-slate-500 mt-1">// Alice owns the readme</div>
                        </div>
                        <div>
                            <span className="text-purple-600 dark:text-purple-400">group:eng</span> 
                            <span className="text-slate-400">#</span> 
                            <span className="text-amber-600 dark:text-amber-400">member</span> 
                            <span className="text-slate-400">@</span> 
                            <span className="text-green-600 dark:text-green-400">user:bob</span>
                            <div className="text-[10px] text-slate-500 mt-1">// Bob is in engineering</div>
                        </div>
                        <div>
                            <span className="text-purple-600 dark:text-purple-400">doc:readme</span> 
                            <span className="text-slate-400">#</span> 
                            <span className="text-amber-600 dark:text-amber-400">viewer</span> 
                            <span className="text-slate-400">@</span> 
                            <span className="text-green-600 dark:text-green-400">group:eng#member</span>
                            <div className="text-[10px] text-slate-500 mt-1">// Engineering members can view readme (Nested!)</div>
                        </div>
                    </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <HwCard 
                    icon={<Users />} 
                    title="Recursive Groups" 
                    specs={["Userset", "Nested"]}
                    desc="The 'User' field can point to another object#relation (a 'Userset'). This allows for deep group nesting (e.g., interns are inside engineering which is inside employees)."
                    color="blue"
                  />
                  <HwCard 
                    icon={<Layers />} 
                    title="Namespace Rewrites" 
                    specs={["Config", "Implication"]}
                    desc="Client configs define logic like 'Owner implies Editor implies Viewer'. This creates virtual edges in the graph without storing redundant tuples."
                    color="indigo"
                  />
                  <HwCard 
                    icon={<Database />} 
                    title="Sharding Strategy" 
                    specs={["Object ID", "Spanner"]}
                    desc="Tuples are sharded by Object ID. This ensures that all policies for a specific document reside on the same server, optimizing local checks."
                    color="amber"
                  />
               </div>
            </div>
          </section>

          {/* 2. LEOPARD INDEXING */}
          <section className="mb-20">
            <SectionTitle icon={<ListTree />} title="2. Leopard: Optimization via Flattening" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-12">
                   <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">The Nested Group Problem</h4>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        In a naive system, checking if <em>Alice</em> can view a document might require traversing 10 layers of groups. This pointer chasing is slow (high tail latency) and expensive.
                      </p>
                      <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg mb-6">
                         <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-2">Naive Graph Traversal</div>
                         <div className="flex items-center gap-2 text-sm text-slate-500">
                            User <ArrowRight size={12}/> Grp A <ArrowRight size={12}/> Grp B <ArrowRight size={12}/> Grp C <ArrowRight size={12}/> Doc
                         </div>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">The Leopard Solution</h4>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Zanzibar uses a specialized indexing system called <strong>Leopard</strong>. It denormalizes the graph, storing the <em>transitive closure</em> of group memberships. It represents these sets as ordered lists of integers (skip lists), allowing for extremely fast set intersection operations.
                      </p>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
                         <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">Leopard Fast Path (O(1))</div>
                         <div className="flex items-center gap-2 text-sm text-slate-500">
                            Key: <strong>User:Alice</strong> <ArrowRight size={12}/> Value: <strong>[GrpA, GrpB, GrpC, Doc]</strong>
                         </div>
                      </div>
                   </div>
                   <div className="flex-1 border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-12">
                      <MetricCard 
                        label="Check Latency (95th %)" 
                        value="< 10ms" 
                        sub="Even with deep nesting"
                        color="green"
                      />
                      <div className="mt-6"></div>
                      <MetricCard 
                        label="Set Intersections" 
                        value="Skip Lists" 
                        sub="Efficient integer set algos"
                        color="blue"
                      />
                   </div>
                </div>
            </div>
          </section>

          {/* 3. ZOOKIES & NEW ENEMY */}
          <section className="mb-20">
             <SectionTitle icon={<GitCommit />} title="3. Consistency: The 'New Enemy' Problem" />
             <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-xl">What is the "New Enemy" Problem?</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      Imagine Alice removes Bob from a document's ACL. Immediately after, she adds sensitive "Secret Plans" to the document.
                      In an eventually consistent system, the "content update" might propagate to replicas faster than the "ACL update". 
                      Bob could theoretically query a stale replica that has the new content but still thinks he has access. This violates <strong>External Consistency</strong>.
                    </p>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-xl">The Solution: Zookies</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Zanzibar uses <strong>Zookies</strong> (consistency tokens). When Alice saves the document, the storage system asks Zanzibar for a Zookie representing the <em>current</em> timestamp of ACLs.
                      This Zookie is stored alongside the document. When Bob tries to read, the system sees the document's Zookie. It forces Zanzibar to serve the check request from a snapshot <strong>at least as fresh</strong> as that Zookie.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <UsageCard 
                      step="1" 
                      title="ACL Write" 
                      desc="Alice removes Bob. Spanner commits at T=100. System returns Zookie 100."
                      color="blue" 
                    />
                    <UsageCard 
                      step="2" 
                      title="Content Write" 
                      desc="Alice saves content. Client stores Zookie=100 with the data."
                      color="indigo" 
                    />
                    <UsageCard 
                      step="3" 
                      title="Safe Read" 
                      desc="Bob reads. Server checks: Is my local ACL replica >= 100? If no, wait."
                      color="emerald" 
                    />
                </div>
             </div>
          </section>

          {/* 4. ARCHITECTURE & PERFORMANCE */}
          <section className="mb-20">
            <SectionTitle icon={<Server />} title="4. Global Architecture & Optimization" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               <HwCard 
                 icon={<Database />}
                 title="Spanner"
                 specs={["Global Storage", "TrueTime"]}
                 desc="The source of truth. Provides external consistency guarantees via atomic clocks."
                 color="blue"
               />
               <HwCard 
                 icon={<Server />}
                 title="ACL Servers"
                 specs={["Pointer Chasing", "Caching"]}
                 desc="Handle Check() requests. They traverse the graph or query Leopard."
                 color="indigo"
               />
               <HwCard 
                 icon={<Eye />}
                 title="Watch Servers"
                 specs={["Real-time", "Changelog"]}
                 desc="Tail the Spanner changelog and stream updates to Leopard indexers."
                 color="amber"
               />
               <HwCard 
                 icon={<Workflow />}
                 title="Leopard Indexers"
                 specs={["Async", "Denormalization"]}
                 desc="Background workers that constantly re-compute transitive closures."
                 color="emerald"
               />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
               <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Latency Mitigation Strategies</h4>
               <div className="grid md:grid-cols-3 gap-8">
                  <div>
                     <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <Share2 size={16} className="text-blue-500"/> Request Hedging
                     </div>
                     <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Zanzibar sends the same request to multiple replicas simultaneously. It accepts the first response and cancels the others. This drastically reduces tail latency caused by occasional slow servers ("stragglers").
                     </p>
                  </div>
                  <div>
                     <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <BarChart3 size={16} className="text-emerald-500"/> Slicer
                     </div>
                     <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        For popular objects (like a viral video with millions of checks), Zanzibar uses "Slicer" to distribute the load across thousands of servers using consistent hashing, preventing hot-spots.
                     </p>
                  </div>
                  <div>
                     <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <Cpu size={16} className="text-purple-500"/> Deduplication
                     </div>
                     <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        If thousands of users check permissions for the same document simultaneously (cache stampede), Zanzibar dedupes these into a single internal lookup, sharing the result.
                     </p>
                  </div>
               </div>
            </div>
          </section>

          {/* 5. API SURFACE */}
          <section className="mb-8">
            <SectionTitle icon={<CodeIcon />} title="5. The Zanzibar API" />
            <div className="grid md:grid-cols-5 gap-4">
               <ApiCard method="Read" desc="Read ACL tuples directly." />
               <ApiCard method="Write" desc="Modify ACL tuples transactionally." />
               <ApiCard method="Watch" desc="Listen for ACL changes (for indexing)." />
               <ApiCard method="Check" desc="The core API: Can User U do Action A on Object O?" />
               <ApiCard method="Expand" desc="Return the full tree of users who have access." />
            </div>
          </section>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}

// ================================================================
//  STANDARD LIBRARY COMPONENTS
// ================================================================

function CodeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400",       icon: "text-blue-600 dark:text-blue-400" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   border: "border-indigo-200 dark:border-indigo-500/30",   text: "text-indigo-600 dark:text-indigo-400",   icon: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
  green:   { bg: "bg-green-50 dark:bg-green-500/10",     border: "border-green-200 dark:border-green-500/30",     text: "text-green-600 dark:text-green-400",     icon: "text-green-600 dark:text-green-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400",     icon: "text-amber-600 dark:text-amber-400" },
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

function UsageCard({ step, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mb-2 border-2 ${c.border} ${c.text}`}>{step}</div>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm`}>
      <div className={`text-3xl font-bold font-mono ${c.text} mb-1`}>{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </div>
  );
}

function ApiCard({ method, desc }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-center">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">{method}</div>
            <div className="text-[10px] text-slate-500">{desc}</div>
        </div>
    )
}