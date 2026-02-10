import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Server, Cpu, HardDrive, Zap, Activity, Terminal, Play, Pause, RefreshCw,
  XOctagon, X, Trash2, Box, Power, BookOpen, Globe, Layers, ArrowDown,
  CheckCircle2, AlertTriangle, Info, Eye, Lock, Database, Shield, Sun, Moon,
  Monitor, Search, Clock, ArrowRight, Binary
} from "lucide-react";

// ================================================================
//  SIMULATION CONFIG
// ================================================================
const CLUSTER_SIZE = 6;
const MACHINE_CPU = 100;
const MACHINE_RAM = 100;
const TICK_RATE = 800;

const TASK_TEMPLATES = {
  prod_web:        { name: "Prod: Web Server",  type: "prod",  cpu: 20, ram: 15, priority: 100, color: "bg-blue-500",    border: "border-blue-400" },
  prod_db:         { name: "Prod: Database",     type: "prod",  cpu: 40, ram: 50, priority: 110, color: "bg-indigo-600",  border: "border-indigo-400" },
  batch_analytics: { name: "Batch: Analytics",   type: "batch", cpu: 15, ram: 20, priority: 10,  color: "bg-emerald-500", border: "border-emerald-400" },
  batch_encoding:  { name: "Batch: Video Enc",   type: "batch", cpu: 30, ram: 10, priority: 10,  color: "bg-lime-500",    border: "border-lime-400" },
};

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function BorgSimulation() {
  const { theme, setTheme } = useTheme();

  const [machines, setMachines] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [logs, setLogs] = useState([]);
  const [utilizationHistory, setUtilizationHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [taskIdCounter, setTaskIdCounter] = useState(1);

  useEffect(() => { resetCluster(); }, []);

  const resetCluster = () => {
    const initialMachines = Array.from({ length: CLUSTER_SIZE }).map((_, i) => ({
      id: i, name: `borg-worker-${100 + i}`, status: "UP", tasks: [], ghostTasks: [], cpuUsed: 0, ramUsed: 0,
    }));
    setMachines(initialMachines);
    setPendingQueue([]);
    setLogs([]);
    setUtilizationHistory([]);
    setTaskIdCounter(1);
    setIsRunning(false);
    addLog("system", "Cluster Reset. Ready for Simulation.");
  };

  // --- Core Loop ---
  const runAtomicTick = useCallback(() => {
    if (!isRunning) return;
    let newLogs = [];
    const newTasks = [];
    const spawnChance = pendingQueue.length < 8 ? 0.6 : 0.1;
    if (Math.random() < spawnChance) {
      const keys = Object.keys(TASK_TEMPLATES);
      const key = keys[Math.floor(Math.random() * keys.length)];
      const finalKey = Math.random() > 0.4 ? (Math.random() > 0.5 ? "batch_analytics" : "batch_encoding") : key;
      const newTask = { ...TASK_TEMPLATES[finalKey], id: taskIdCounter };
      newTasks.push(newTask);
      newLogs.push(`Job Arrived: ${newTask.name} (CPU:${newTask.cpu})`);
    }

    setMachines((prevMachines) => {
      const nextMachines = prevMachines.map((m) => ({
        ...m, tasks: [...m.tasks], ghostTasks: (m.ghostTasks || []).filter((g) => g.expiresAt > Date.now()),
      }));

      // Departures
      nextMachines.forEach((m) => {
        if (m.status !== "UP") return;
        for (let i = m.tasks.length - 1; i >= 0; i--) {
          if (Math.random() < 0.03) {
            const t = m.tasks[i];
            m.cpuUsed -= t.cpu;
            m.ramUsed -= t.ram;
            m.tasks.splice(i, 1);
            newLogs.push(`Job Finished: ${t.name} on ${m.name}`);
          }
        }
      });

      // Scheduling
      const combinedQueue = [...pendingQueue, ...newTasks].sort((a, b) => b.priority - a.priority);
      const nextQueue = [];

      combinedQueue.forEach((task) => {
        let assigned = false;
        let bestIdx = -1;
        let bestScore = -1;
        const startOffset = Math.floor(Math.random() * nextMachines.length);

        for (let i = 0; i < nextMachines.length; i++) {
          const idx = (startOffset + i) % nextMachines.length;
          const m = nextMachines[idx];
          if (m.status !== "UP") continue;
          if (m.cpuUsed + task.cpu <= MACHINE_CPU && m.ramUsed + task.ram <= MACHINE_RAM) {
            const score = m.cpuUsed + m.ramUsed;
            if (score > bestScore) { bestScore = score; bestIdx = idx; }
          }
        }

        if (bestIdx !== -1) {
          const m = nextMachines[bestIdx];
          m.tasks.push(task); m.cpuUsed += task.cpu; m.ramUsed += task.ram;
          assigned = true;
          newLogs.push(`Scheduler: Assigned ${task.name} -> ${m.name}`);
        } else if (task.type === "prod") {
          const victimIdx = nextMachines.findIndex((m) =>
            m.status === "UP" && m.tasks.some((t) => t.type === "batch") &&
            m.cpuUsed - m.tasks.filter((t) => t.type === "batch").reduce((a, b) => a + b.cpu, 0) + task.cpu <= MACHINE_CPU
          );
          if (victimIdx !== -1) {
            const m = nextMachines[victimIdx];
            let evictedCount = 0;
            for (let i = m.tasks.length - 1; i >= 0; i--) {
              const t = m.tasks[i];
              if (t.type === "batch") {
                m.ghostTasks.push({ ...t, expiresAt: Date.now() + 1500 });
                m.tasks.splice(i, 1); m.cpuUsed -= t.cpu; m.ramUsed -= t.ram; evictedCount++;
                if (m.cpuUsed + task.cpu <= MACHINE_CPU && m.ramUsed + task.ram <= MACHINE_RAM) break;
              }
            }
            newLogs.push(`Scheduler: PREEMPTED ${evictedCount} batch task(s) on ${m.name} for Prod`);
            m.tasks.push(task); m.cpuUsed += task.cpu; m.ramUsed += task.ram; assigned = true;
          }
        }
        if (!assigned) nextQueue.push(task);
      });

      if (newTasks.length > 0) setTaskIdCounter((c) => c + newTasks.length);
      setPendingQueue(nextQueue);
      if (newLogs.length > 0) setLogs((l) => [...newLogs.map((msg) => ({ msg, time: new Date() })), ...l].slice(0, 50));

      const totalCpu = nextMachines.reduce((acc, m) => acc + (m.status === "UP" ? m.cpuUsed : 0), 0);
      const cap = nextMachines.filter((m) => m.status === "UP").length * MACHINE_CPU;
      setUtilizationHistory((h) => [...h, cap > 0 ? (totalCpu / cap) * 100 : 0].slice(-40));

      return nextMachines;
    });
  }, [isRunning, pendingQueue, taskIdCounter]);

  useEffect(() => {
    const interval = setInterval(runAtomicTick, TICK_RATE);
    return () => clearInterval(interval);
  }, [runAtomicTick]);

  // --- User Actions ---
  const stopTask = (machineId, taskIndex) => {
    setMachines((prev) => {
      const next = prev.map((m) => ({ ...m, tasks: [...m.tasks] }));
      const m = next[machineId]; const t = m.tasks[taskIndex];
      if (t) { m.cpuUsed -= t.cpu; m.ramUsed -= t.ram; m.tasks.splice(taskIndex, 1); addLog("system", `Manually stopped ${t.name}`); }
      return next;
    });
  };

  const killMachine = (id) => {
    setMachines((prev) => {
      const next = prev.map((m) => ({ ...m }));
      const m = next[id]; if (m.status === "DOWN") return next;
      m.status = "DOWN";
      const prodTasks = m.tasks.filter((t) => t.type === "prod");
      if (prodTasks.length > 0) { setPendingQueue((q) => [...q, ...prodTasks]); addLog("alert", `Machine ${m.name} FAILED! Rescheduling ${prodTasks.length} Prod tasks.`); }
      m.tasks = []; m.cpuUsed = 0; m.ramUsed = 0;
      return next;
    });
  };

  const recoverMachine = (id) => {
    setMachines((prev) => {
      const next = prev.map((m) => ({ ...m }));
      const m = next[id]; if (m.status === "UP") return next;
      m.status = "UP"; addLog("system", `Machine ${m.name} brought back ONLINE.`);
      return next;
    });
  };

  const addLog = (type, msg) => {
    setLogs((prev) => [{ type, msg, time: new Date() }, ...prev].slice(0, 50));
  };

  const manualAdd = (key) => {
    setTaskIdCounter((c) => c + 1);
    const newTask = { ...TASK_TEMPLATES[key], id: taskIdCounter };
    setPendingQueue((q) => [...q, newTask]);
    addLog("system", `Manual: Added ${newTask.name}`);
  };

  const getUtilizationColor = (pct) => {
    if (pct < 50) return "bg-blue-500";
    if (pct < 80) return "bg-green-500";
    return "bg-amber-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Borg Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">Automated Cluster Scheduler</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${isRunning ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30" : "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30"}`}
            >
              {isRunning ? <><Pause size={16} /> Pause Sim</> : <><Play size={16} /> Run Sim</>}
            </button>
            <button onClick={resetCluster} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors" title="Reset">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors" title="Toggle Theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-500">Utilization</span>
              <div className="flex items-end gap-0.5 h-8 w-32 bg-slate-200 dark:bg-slate-950 rounded p-1 border border-slate-300 dark:border-slate-800">
                {utilizationHistory.map((u, i) => (
                  <div key={i} className={`flex-1 rounded-t ${getUtilizationColor(u)}`} style={{ height: `${u}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION AREA
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT: Queue & Manual */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Terminal size={14} /> Manual Burst
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => manualAdd("prod_db")} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-500/30 rounded text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors">
                  + Prod DB
                </button>
                <button onClick={() => manualAdd("batch_analytics")} className="p-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-500/30 rounded text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors">
                  + Batch Job
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 overflow-hidden flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pending Queue</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-mono">{pendingQueue.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {pendingQueue.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 text-xs italic gap-2">
                    <Box size={24} /> <span>Queue Empty</span>
                  </div>
                )}
                {pendingQueue.map((task, i) => (
                  <div key={i} className={`p-2 rounded border-l-2 bg-slate-50 dark:bg-slate-950 ${task.type === "prod" ? "border-blue-500" : "border-emerald-500"}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{task.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">#{task.id}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                      <span>CPU: {task.cpu}</span> <span>RAM: {task.ram}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE: Cluster View */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 h-full content-start">
              {machines.map((m) => (
                <MachineView key={m.id} machine={m} onKill={() => killMachine(m.id)} onRecover={() => recoverMachine(m.id)} onStopTask={(taskIdx) => stopTask(m.id, taskIdx)} />
              ))}
            </div>
          </div>

          {/* RIGHT: Logs */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Activity size={14} /> System Logs
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 pr-2">
                {logs.map((log, i) => (
                  <div key={i} className={`break-words border-l-2 pl-2 py-1 mb-1 rounded ${
                    log.type === "alert" ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20" :
                    log.type === "system" ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20" :
                    log.msg?.includes("PREEMPTED") ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20" :
                    log.msg?.includes("Scheduler:") ? "border-purple-500 text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20" :
                    "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  }`}>
                    <div className="opacity-50 text-[8px] mb-0.5">[{log.time?.toLocaleTimeString([], { hour12: false })}]</div>
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-lg text-xs text-indigo-700 dark:text-indigo-200/80">
              <strong className="block mb-2 text-indigo-800 dark:text-indigo-200 flex items-center gap-2"><Zap size={14} /> Simulation Mode</strong>
              <p className="leading-relaxed">
                Jobs arrive and finish randomly. Prod tasks get priority and can <strong>preempt</strong> batch tasks.
                Click the <XOctagon size={10} className="inline" /> on any machine to simulate a hardware failure — watch Borg reschedule prod tasks automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t-2 border-indigo-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — EuroSys 2015
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
              Large-Scale Cluster Management at Google with Borg
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Borg runs hundreds of thousands of jobs from thousands of applications across clusters of up to tens of thousands of machines — the system that inspired Kubernetes.
            </p>
          </div>

          {/* ---- What is Borg ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Server className="w-5 h-5" />} title="What Is Borg?" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Borg is Google's internal cluster manager that <strong className="text-indigo-600 dark:text-indigo-300">admits, schedules, starts, restarts, and monitors</strong> the full range of applications Google runs. It provides three main benefits:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <BenefitCard num="1" title="Resource Abstraction" desc="Hides details of resource management and failure handling so users focus on application development." color="blue" />
                <BenefitCard num="2" title="High Availability" desc="Operates with very high reliability and supports applications that need the same guarantees." color="emerald" />
                <BenefitCard num="3" title="Efficient Utilization" desc="Runs workloads across tens of thousands of machines effectively via bin-packing and over-commitment." color="amber" />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <StatCard label="Median Cell" value="~10,000" sub="machines per cell" color="blue" />
                <StatCard label="Prod CPU" value="70%" sub="of total CPU allocated to prod" color="emerald" />
                <StatCard label="Prod Memory" value="85%" sub="of total memory used by prod" color="indigo" />
              </div>
            </div>
          </section>

          {/* ---- Architecture ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Layers className="w-5 h-5" />} title="Architecture" />
            <div className="grid md:grid-cols-2 gap-5">
              <HwCard icon={<Database className="w-6 h-6" />} color="indigo" title="BorgMaster"
                specs={["5 replicas per cell", "Paxos-based leader election"]}
                desc="The logically centralized controller with replicas for high availability. Handles all client RPCs (create job, look up status). State stored in Paxos-based store. Contains the scheduler as a separate process."
              />
              <HwCard icon={<Monitor className="w-6 h-6" />} color="blue" title="Borglet"
                specs={["One per machine", "Local task manager"]}
                desc="Agent running on every machine. Starts/stops tasks, manages local resources, reports state to BorgMaster. If a Borglet stops responding, the machine is marked as down and tasks are rescheduled."
              />
              <HwCard icon={<Search className="w-6 h-6" />} color="emerald" title="Scheduler"
                specs={["Feasibility checking", "Scoring (worst-fit / hybrid)"]}
                desc="Operates on the pending queue. Scans machines by feasibility (enough resources?), then scores them. E-PVM scoring spreads tasks across machines for failure tolerance; best-fit packs them for utilization."
              />
              <HwCard icon={<Globe className="w-6 h-6" />} color="amber" title="Cells & Clusters"
                specs={["Heterogeneous hardware", "Single DC network fabric"]}
                desc="A cell is a set of machines managed as a unit within a single cluster (datacenter). Machines vary in CPU, RAM, disk, and capabilities. Borg isolates users from these differences."
              />
            </div>
          </section>

          {/* ---- Workload ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Activity className="w-5 h-5" />} title="The Workload — Prod vs Batch" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl border-2 border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Production (Prod)</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Long-running services that should "never" go down. Handle latency-sensitive requests (μs to hundreds of ms).</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">Gmail</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">Web Search</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">BigTable</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">Higher priority</span>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Batch (Non-Prod)</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Jobs that take seconds to days. Less sensitive to short-term performance fluctuations. Can be preempted.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">MapReduce</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">FlumeJava</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Pregel</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Lower priority</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-amber-700 dark:text-amber-300">Key insight:</strong> Prod jobs are allocated ~70% of CPU but use ~60%. Batch jobs fill the gap — this <strong className="text-slate-900 dark:text-slate-200">over-commitment</strong> strategy achieves significantly higher utilization than segregating workloads.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Scheduling Flow ---- */}
          <section className="mb-16">
            <SectionTitle icon={<ArrowDown className="w-5 h-5" />} title="Scheduling — How Tasks Get Placed" />
            <div className="space-y-4">
              <FlowStep num={1} color="blue" icon={<Terminal className="w-5 h-5" />} title="Job submission"
                desc="User submits a job via borgcfg (BCL config) or RPC. The BorgMaster records it in the Paxos store and adds tasks to the pending queue."
              />
              <FlowStep num={2} color="indigo" icon={<Search className="w-5 h-5" />} title="Feasibility checking"
                desc="The scheduler scans machines to find ones that meet hard and soft constraints (enough CPU, RAM, disk, correct architecture, etc.)."
              />
              <FlowStep num={3} color="purple" icon={<Database className="w-5 h-5" />} title="Scoring"
                desc="Feasible machines are scored. E-PVM (Enhanced Paxos Virtual Machine) scoring spreads tasks for failure tolerance. Hybrid scoring packs tightly for utilization. The best-scoring machine wins."
              />
              <FlowStep num={4} color="amber" icon={<AlertTriangle className="w-5 h-5" />} title="Preemption (if needed)"
                desc="If no machine has enough resources, the scheduler may preempt lower-priority (batch) tasks to make room for higher-priority (prod) tasks. Preempted tasks go back to the pending queue."
              />
              <FlowStep num={5} color="emerald" icon={<CheckCircle2 className="w-5 h-5" />} title="Task placement"
                desc="The Borglet on the chosen machine installs the task's packages, starts the binary in a Linux container (cgroup), and reports status back to BorgMaster."
              />
            </div>
          </section>

          {/* ---- High Availability ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Shield className="w-5 h-5" />} title="High Availability & Fault Tolerance" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Borg minimizes the impact of failures through multiple techniques applied at both the <strong className="text-indigo-600 dark:text-indigo-300">BorgMaster</strong> and <strong className="text-blue-600 dark:text-blue-300">task</strong> level.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <FeatureCard title="BorgMaster Replication" desc="5 replicas with Paxos-based leader election. Handles master failures in ~10 seconds. State persisted in Paxos-based store and periodic checkpoints." color="indigo" />
                <FeatureCard title="Automatic Rescheduling" desc="When a machine fails, prod tasks are automatically rescheduled on healthy machines. Batch tasks may be rescheduled or simply re-queued." color="blue" />
                <FeatureCard title="Spreading Tasks" desc="Tasks of a job are spread across failure domains — racks, power domains, machines — to reduce correlated failures." color="emerald" />
                <FeatureCard title="Rate-Limited Updates" desc="Rolling updates ensure that only a small fraction of tasks in a job are disrupted at any time, limiting the blast radius of bad pushes." color="amber" />
              </div>
            </div>
          </section>

          {/* ---- Utilization ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Zap className="w-5 h-5" />} title="Utilization — Lessons from a Decade" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Cell Compaction" value="~20-30%" sub="fewer machines needed vs segregated" color="indigo" />
              <MetricCard label="Shared Cells" value="Better" sub="than separating prod/non-prod" color="emerald" />
              <MetricCard label="Fine Granularity" value="No buckets" sub="CPU/RAM specified independently" color="blue" />
              <MetricCard label="Overcommit" value="~20%" sub="more work than with no sharing" color="amber" />
            </div>
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-emerald-700 dark:text-emerald-300">The shared-cell advantage:</strong> Segregating prod and non-prod work into separate cells would require 20-30% more machines. Sharing cells lets batch work fill the gaps left by over-provisioned prod jobs — the single biggest driver of Borg's efficiency.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Legacy ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Globe className="w-5 h-5" />} title="Legacy — From Borg to Kubernetes" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Borg directly inspired <strong className="text-blue-600 dark:text-blue-300">Kubernetes</strong>, the open-source container orchestration system. Several lessons were applied:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <LessonCard title="Jobs → Pods" desc="Borg's concept of a job with multiple tasks became Kubernetes pods and deployments." color="blue" />
                <LessonCard title="Allocs → Namespaces" desc="Borg allocs (resource reservations) influenced Kubernetes resource quotas and namespaces." color="indigo" />
                <LessonCard title="Labels, not IPs" desc="Instead of relying on machine IPs, Kubernetes adopted labels and selectors — a lesson from Borg's name service evolution." color="emerald" />
              </div>
            </div>
          </section>

          {/* ---- How to use sim ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Eye className="w-5 h-5" />} title="Using the Simulator Above" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageCard step="1" title="Run Sim" desc="Start the simulation. Jobs arrive randomly. Watch the scheduler assign them (purple log lines) and bin-pack them onto machines." color="blue" />
              <UsageCard step="2" title="Kill a Machine" desc="Click the ⛔ icon on any machine to simulate a hardware failure. Watch prod tasks get rescheduled automatically." color="red" />
              <UsageCard step="3" title="Trigger Preemption" desc="Add prod jobs manually when machines are full. Watch the scheduler evict batch tasks (amber log lines) to make room." color="amber" />
              <UsageCard step="4" title="Watch Utilization" desc="The sparkline in the header shows real-time cluster CPU utilization. Try to keep it above 80% by tuning the workload mix." color="emerald" />
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
        @keyframes glitch {
          0% { opacity: 1; transform: translate(0); }
          20% { opacity: 0.8; transform: translate(-1px, 1px); }
          40% { opacity: 0.8; transform: translate(-1px, -1px); }
          60% { opacity: 0.8; transform: translate(1px, 1px); }
          80% { opacity: 0.8; transform: translate(1px, -1px); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        .animate-glitch { animation: glitch 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ================================================================
//  SIMULATION SUB-COMPONENTS
// ================================================================

function MachineView({ machine, onKill, onRecover, onStopTask }) {
  const isDown = machine.status === "DOWN";
  return (
    <div className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all duration-300 overflow-hidden ${isDown ? "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/20 opacity-70" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Server size={14} className={isDown ? "text-red-500 dark:text-red-600" : "text-slate-400 dark:text-slate-500"} />
          <div>
            <div className={`text-xs font-bold ${isDown ? "text-red-600 dark:text-red-500" : "text-slate-700 dark:text-slate-300"}`}>{machine.name}</div>
            <div className="text-[9px] text-slate-500 dark:text-slate-600 font-mono">{machine.tasks.length} Tasks</div>
          </div>
        </div>
        {isDown ? (
          <button onClick={onRecover} className="text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 hover:bg-green-50 dark:hover:bg-green-950/50 rounded flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700" title="Restart Machine">
            <Power size={12} /> <span className="text-[9px] font-bold">RESTART</span>
          </button>
        ) : (
          <button onClick={onKill} className="text-slate-400 dark:text-slate-600 hover:text-red-500 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded" title="Simulate Hardware Failure">
            <XOctagon size={14} />
          </button>
        )}
      </div>

      {!isDown && (
        <div className="space-y-1 mt-1">
          <ResourceBar label="CPU" used={machine.cpuUsed} total={MACHINE_CPU} color="bg-blue-500" />
          <ResourceBar label="RAM" used={machine.ramUsed} total={MACHINE_RAM} color="bg-purple-500" />
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-800/50 p-1 flex content-start flex-wrap gap-1 h-32 overflow-y-auto custom-scrollbar relative">
        {isDown && (
          <div className="absolute inset-0 flex items-center justify-center text-red-200 dark:text-red-900/50 font-black text-3xl select-none z-10">OFFLINE</div>
        )}
        {machine.tasks.map((t, idx) => (
          <div key={t.id} className={`group relative h-6 ${t.color} rounded-sm cursor-pointer overflow-hidden border border-white/5 hover:border-white/50 transition-colors`} style={{ width: `${(t.cpu / MACHINE_CPU) * 100}%` }} title={`${t.name} | CPU:${t.cpu} RAM:${t.ram}`}>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/90 opacity-0 group-hover:opacity-100 select-none">{t.type === "prod" ? "P" : "B"}</div>
            <div onClick={(e) => { e.stopPropagation(); onStopTask(idx); }} className="absolute inset-0 bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Trash2 size={10} className="text-white" />
            </div>
          </div>
        ))}
        {(machine.ghostTasks || []).map((t) => (
          <div key={`ghost-${t.id}`} className="h-6 bg-red-600/20 border border-red-500/50 rounded-sm animate-glitch flex items-center justify-center overflow-hidden" style={{ width: `${(t.cpu / MACHINE_CPU) * 100}%` }}>
            <X size={10} className="text-red-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceBar({ label, used, total, color }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className="flex items-center gap-2 text-[9px]">
      <span className="text-slate-500 w-6">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ================================================================
//  EDUCATIONAL SUB-COMPONENTS
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10",   border: "border-indigo-200 dark:border-indigo-500/30",   text: "text-indigo-600 dark:text-indigo-400" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10",   border: "border-purple-200 dark:border-purple-500/30",   text: "text-purple-600 dark:text-purple-400" },
  red:    { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400" },
  slate:  { bg: "bg-slate-100 dark:bg-slate-500/10",    border: "border-slate-300 dark:border-slate-500/30",     text: "text-slate-600 dark:text-slate-400" },
  green:  { bg: "bg-green-50 dark:bg-green-500/10",     border: "border-green-200 dark:border-green-500/30",     text: "text-green-600 dark:text-green-400" },
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

function FeatureCard({ title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function LessonCard({ title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <ArrowRight className={`w-4 h-4 ${c.text}`} />
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}</h4>
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
