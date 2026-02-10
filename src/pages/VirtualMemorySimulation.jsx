import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Play, StepForward, RotateCcw, Cpu, HardDrive, Layers, ArrowRight, Activity, BookOpen, Zap, Database, Search, AlertTriangle, CheckCircle2, XCircle, ArrowDown, Monitor, MemoryStick, Server, Binary, ChevronRight, Info, Eye, Sun, Moon } from "lucide-react";

const CONFIG = {
  VPN_BITS: 6,
  OFFSET_BITS: 6,
  TLB_SIZE: 4,
  RAM_FRAMES: 8,
  PAGE_TABLE_SIZE: 64,
};

const toBin = (num, len) => num.toString(2).padStart(len, "0"); 
const toHex = (num) => "0x" + num.toString(16).toUpperCase().padStart(2, "0");

function ScrollToActive({ idx }) {
  useEffect(() => {
    if (idx != null) {
      const el = document.getElementById(`pt-row-${idx}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [idx]);
  return null;
}

export default function VirtualMemorySimulation() {
  const [tlb, setTlb] = useState([]);
  const [pageTable, setPageTable] = useState([]);
  const [ram, setRam] = useState([]);
  const [disk, setDisk] = useState({});
  const [currentStep, setCurrentStep] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [lastAddress, setLastAddress] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ tlbHits: 0, tlbMisses: 0, pageFaults: 0, ramAccesses: 0 });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [processingQueue, setProcessingQueue] = useState([]);

  useEffect(() => {
    resetSystem();
  }, []);

  const resetSystem = () => {
    setTlb([]);
    setPageTable(
      Array.from({ length: CONFIG.PAGE_TABLE_SIZE }, (_, i) => ({
        valid: false,
        pfn: null,
        diskAddr: `DISK-${toHex(i)}`,
      }))
    );
    setRam(
      Array.from({ length: CONFIG.RAM_FRAMES }, (_, i) => ({
        id: i,
        data: null,
        vpn: null,
      }))
    );
    setDisk({});
    setLogs(["System initialized. Ready."]);
    setStats({ tlbHits: 0, tlbMisses: 0, pageFaults: 0, ramAccesses: 0 });
    setLastAddress(null);
    setCurrentStep("Idle");
    setActiveHighlight(null);
    setProcessingQueue([]);
    setIsAutoPlaying(false);
  };

  const addLog = (msg) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString().split(" ")[0]}] ${msg}`, ...prev].slice(0, 50)
    );
  };

  const requestMemoryAccess = (vpnOverride = null) => {
    if (processingQueue.length > 0) return;

    const vpn = vpnOverride !== null ? vpnOverride : Math.floor(Math.random() * CONFIG.PAGE_TABLE_SIZE);
    const offset = Math.floor(Math.random() * (1 << CONFIG.OFFSET_BITS));
    const fullAddr = (vpn << CONFIG.OFFSET_BITS) | offset;
    const addressObj = { vpn, offset, full: fullAddr };
    setLastAddress(addressObj);

    let currentTlb = [...tlb];
    let currentPageTable = [...pageTable];
    let currentRam = [...ram];
    const sequence = [];

    sequence.push({
      step: "CPU generates Virtual Address",
      highlight: "cpu",
      action: () => addLog(`CPU requests Virtual Addr: ${toHex(fullAddr)} (VPN: ${vpn}, Offset: ${offset})`),
    });

    sequence.push({ step: "Checking TLB...", highlight: "tlb", action: () => {} });

    const tlbIndex = currentTlb.findIndex((entry) => entry.vpn === vpn);
    let pfn = null;

    if (tlbIndex !== -1) {
      pfn = currentTlb[tlbIndex].pfn;
      const entry = currentTlb.splice(tlbIndex, 1)[0];
      currentTlb.push(entry);
      sequence.push({
        step: "TLB Hit!",
        highlight: "tlb",
        action: () => {
          setStats((s) => ({ ...s, tlbHits: s.tlbHits + 1 }));
          addLog(`TLB Hit for VPN ${vpn} -> PFN ${pfn}`);
          setTlb((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((e) => e.vpn === vpn);
            if (idx === -1) return copy;
            const item = copy.splice(idx, 1)[0];
            copy.push(item);
            return copy;
          });
        },
      });
    } else {
      sequence.push({
        step: "TLB Miss. checking Page Table...",
        highlight: "tlb",
        action: () => {
          setStats((s) => ({ ...s, tlbMisses: s.tlbMisses + 1 }));
          addLog(`TLB Miss for VPN ${vpn}`);
        },
      });
      sequence.push({ step: "Accessing Page Table in Memory", highlight: "pt", action: () => {} });

      const ptEntry = currentPageTable[vpn];

      if (ptEntry.valid) {
        pfn = ptEntry.pfn;
        sequence.push({
          step: "Page Table Hit. Valid translation found.",
          highlight: "pt",
          action: () => addLog(`Page Table: VPN ${vpn} maps to PFN ${pfn}`),
        });
      } else {
        sequence.push({
          step: "Page Fault! Page not in RAM.",
          highlight: "pt",
          action: () => {
            setStats((s) => ({ ...s, pageFaults: s.pageFaults + 1 }));
            addLog(`Page Fault! VPN ${vpn} is invalid/on disk.`);
          },
        });
        sequence.push({
          step: "Retrieving Page from Disk...",
          highlight: "disk",
          action: () => addLog(`Reading Disk: ${ptEntry.diskAddr}`),
        });

        let freeFrameIndex = currentRam.findIndex((f) => f.data === null);
        if (freeFrameIndex === -1) {
          sequence.push({
            step: "RAM Full. Evicting a page...",
            highlight: "ram",
            action: () => addLog("RAM Full. Running eviction algorithm..."),
          });
          freeFrameIndex = Math.floor(Math.random() * CONFIG.RAM_FRAMES);
          const victimFrame = currentRam[freeFrameIndex];
          sequence.push({
            step: `Evicting PFN ${freeFrameIndex} (VPN ${victimFrame.vpn})`,
            highlight: "ram",
            action: () => {
              setPageTable((prev) => {
                const copy = [...prev];
                copy[victimFrame.vpn] = { ...copy[victimFrame.vpn], valid: false, pfn: null };
                return copy;
              });
              setTlb((prev) => prev.filter((e) => e.vpn !== victimFrame.vpn));
              addLog(`Evicted PFN ${freeFrameIndex} to Disk.`);
            },
          });
        }
        pfn = freeFrameIndex;
        sequence.push({
          step: `Loading VPN ${vpn} into PFN ${pfn}`,
          highlight: "ram",
          action: () => {
            setRam((prev) => {
              const copy = [...prev];
              copy[pfn] = { id: pfn, data: `Page-${vpn}`, vpn: vpn };
              return copy;
            });
            addLog(`Loaded VPN ${vpn} into PFN ${pfn}`);
          },
        });
        sequence.push({
          step: "Updating Page Table...",
          highlight: "pt",
          action: () => {
            setPageTable((prev) => {
              const copy = [...prev];
              copy[vpn] = { ...copy[vpn], valid: true, pfn: pfn };
              return copy;
            });
          },
        });
      }

      sequence.push({
        step: "Updating TLB with new translation",
        highlight: "tlb",
        action: () => {
          setTlb((prev) => {
            let copy = [...prev];
            if (copy.length >= CONFIG.TLB_SIZE) copy.shift();
            copy.push({ vpn, pfn });
            return copy;
          });
          addLog(`Updated TLB: VPN ${vpn} -> PFN ${pfn}`);
        },
      });
    }

    sequence.push({
      step: "CPU Accessing Physical Memory",
      highlight: "ram",
      action: () => {
        setStats((s) => ({ ...s, ramAccesses: s.ramAccesses + 1 }));
        addLog(`ACCESS SUCCESS: PAddr ${toHex((pfn << CONFIG.OFFSET_BITS) | offset)}`);
      },
    });
    sequence.push({
      step: "Request Complete",
      highlight: null,
      action: () => setLastAddress(null),
    });

    setProcessingQueue(sequence);
  };

  useEffect(() => {
    let timer;
    if (processingQueue.length > 0) {
      const nextStep = processingQueue[0];
      const execute = () => {
        setCurrentStep(nextStep.step);
        setActiveHighlight(nextStep.highlight);
        if (nextStep.action) nextStep.action();
        setProcessingQueue((prev) => prev.slice(1));
      };
      timer = setTimeout(execute, isAutoPlaying ? 200 : 1000);
    } else {
      setCurrentStep("Idle");
      setActiveHighlight(null);
      if (isAutoPlaying) timer = setTimeout(() => requestMemoryAccess(), 1500);
    }
    return () => clearTimeout(timer);
  }, [processingQueue, isAutoPlaying]);

  const Box = ({ title, highlightKey, children, className = "" }) => (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col
        ${activeHighlight === highlightKey ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-[1.02]" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600"}
        ${className}
      `}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">{title}</h3>
      {children}
    </div>
  );

  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                Virtual Memory Simulator
              </h1>
              <p className="text-xs text-slate-500">TLB + Page Table + RAM + Disk Visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => requestMemoryAccess()}
              disabled={processingQueue.length > 0 || isAutoPlaying}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StepForward className="w-4 h-4" /> Step Once
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border ${isAutoPlaying ? "bg-red-500/10 text-red-400 border-red-500/50" : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-transparent"}`}
            >
              {isAutoPlaying ? "Pause" : <><Play className="w-4 h-4" /> Auto Play</>}
            </button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
            <button
              onClick={resetSystem}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
              title="Reset System"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Box title="CPU / MMU Request" highlightKey="cpu" className="min-h-[160px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Cpu className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">CORE 0</span>
              </div>
              {lastAddress && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-mono border border-blue-300 dark:border-blue-800">active</span>
              )}
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 border border-slate-300 dark:border-slate-700 font-mono text-sm">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>VPN ({CONFIG.VPN_BITS} bits)</span>
                <span>Offset ({CONFIG.OFFSET_BITS} bits)</span>
              </div>
              <div className="flex h-10 rounded border border-slate-300 dark:border-slate-600 overflow-hidden">
                <div className="flex-1 bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border-r border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-300 font-bold">
                  {lastAddress ? toBin(lastAddress.vpn, CONFIG.VPN_BITS) : "000000"}
                </div>
                <div className="flex-1 bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold">
                  {lastAddress ? toBin(lastAddress.offset, CONFIG.OFFSET_BITS) : "000000"}
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                Addr: {lastAddress ? toHex(lastAddress.full) : "--"}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Operation</div>
                <div className="text-slate-800 dark:text-slate-200 truncate">{currentStep}</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Last VPN</div>
                <div className="text-slate-800 dark:text-slate-200 font-mono">{lastAddress ? lastAddress.vpn : "-"}</div>
              </div>
            </div>
          </Box>

          <Box title="TLB (Translation Lookaside Buffer)" highlightKey="tlb" className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-2 px-2">
              <span>VPN (Tag)</span>
              <span>PFN (Data)</span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: CONFIG.TLB_SIZE }).map((_, i) => {
                const entry = tlb[i];
                return (
                  <div
                    key={i}
                    className={`
                      flex items-center justify-between p-3 rounded border font-mono text-sm relative overflow-hidden
                      ${entry ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200" : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-700 dashed-border"}
                      ${activeHighlight === "tlb" && entry && entry.vpn === lastAddress?.vpn ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20" : ""}
                    `}
                  >
                    {entry ? (
                      <>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{toBin(entry.vpn, 6)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                        <span className="font-bold text-amber-600 dark:text-amber-400">{toBin(entry.pfn, 3)}</span>
                        {i === 0 && tlb.length === CONFIG.TLB_SIZE && (
                          <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="LRU Victim" />
                        )}
                      </>
                    ) : (
                      <span className="text-xs mx-auto">-- Empty --</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-xs justify-center text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Hit: {stats.tlbHits}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Miss: {stats.tlbMisses}</span>
            </div>
          </Box>
        </div>

        <div className="lg:col-span-4 h-[600px] flex flex-col">
          <Box title="Page Table (Main Memory)" highlightKey="pt" className="h-full flex flex-col">
            <div className="flex text-xs font-bold text-slate-500 border-b border-slate-300 dark:border-slate-700 pb-2 mb-2 px-2">
              <span className="w-12">VPN</span>
              <span className="w-12 text-center">Valid</span>
              <span className="w-16 text-center">PFN</span>
              <span className="flex-1 text-right">Disk Addr</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-1">
              {pageTable.map((entry, idx) => {
                const isTarget = lastAddress && lastAddress.vpn === idx;
                return (
                  <div
                    key={idx}
                    id={`pt-row-${idx}`}
                    className={`
                      flex items-center text-xs p-2 rounded border font-mono transition-colors
                      ${isTarget ? (activeHighlight === "pt" ? "bg-blue-600 text-white border-blue-400 shadow-lg scale-105 z-10" : "bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500") : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"}
                    `}
                  >
                    <span className="w-12 text-slate-500 opacity-70">{idx}</span>
                    <div className="w-12 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.valid ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-500/10 text-red-500"}`}>
                        {entry.valid ? "1" : "0"}
                      </span>
                    </div>
                    <span className={`w-16 text-center ${entry.valid ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-400 dark:text-slate-700"}`}>
                      {entry.valid ? entry.pfn : "-"}
                    </span>
                    <span className="flex-1 text-right text-[10px] text-slate-400 dark:text-slate-600 truncate">{entry.diskAddr}</span>
                  </div>
                );
              })}
            </div>
            <ScrollToActive idx={lastAddress?.vpn} />
          </Box>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Box title="Physical Memory (RAM)" highlightKey="ram" className="flex-1">
            <div className="grid grid-cols-2 gap-3">
              {ram.map((frame, i) => {
                const isActive = activeHighlight === "ram" && lastAddress && frame.data?.includes(`Page-${lastAddress.vpn}`);
                return (
                  <div
                    key={i}
                    className={`
                      relative h-20 rounded border-2 flex flex-col items-center justify-center p-2 transition-all
                      ${frame.data ? (isActive ? "bg-green-600 border-green-400 shadow-green-500/50 shadow-lg scale-105 text-white" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600") : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 border-dashed"}
                    `}
                  >
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-slate-500">PFN: {i}</span>
                    {frame.data ? (
                      <>
                        <span className={`text-lg font-bold ${isActive ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>{frame.data}</span>
                        <span className={`text-[10px] ${isActive ? "text-green-100" : "text-indigo-600 dark:text-indigo-400"}`}>VPN: {frame.vpn}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-600">Free</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-center text-slate-500">
              Total Accesses: {stats.ramAccesses} | Page Faults: {stats.pageFaults}
            </div>
          </Box>

          <Box title="Disk Storage (Swap)" highlightKey="disk" className="h-[180px]">
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-600">
              <div
                className={`
                  w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500
                  ${activeHighlight === "disk" ? "border-orange-500 bg-orange-100 dark:bg-orange-900/20 animate-spin-slow" : "border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"}
                `}
              >
                <HardDrive className={`w-10 h-10 ${activeHighlight === "disk" ? "text-orange-500" : "text-slate-400 dark:text-slate-700"}`} />
              </div>
              <div className="ml-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeHighlight === "disk" ? "bg-orange-500 animate-ping" : "bg-slate-300 dark:bg-slate-800"}`} />
                  <span className="text-xs">I/O Status</span>
                </div>
                <div className="text-xs text-slate-500">
                  Latency: High<br />Capacity: Huge
                </div>
              </div>
            </div>
          </Box>
        </div>
      </main>

      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-4 h-48 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" /> System Log
          </h4>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-2 font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes("error") || log.includes("Fault")
                    ? "text-red-600 dark:text-red-400"
                    : log.includes("success") || log.includes("Hit")
                    ? "text-green-600 dark:text-green-400"
                    : log.includes("warning")
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-600 dark:text-slate-400"
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          EDUCATIONAL DEEP-DIVE SECTION
          ================================================================ */}
      <div className="border-t-2 border-blue-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">

          {/* Section hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 dark:from-blue-400 dark:via-cyan-300 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
              How Virtual Memory Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Every modern operating system uses virtual memory to give each process its own private address space.
              Below is a detailed walkthrough of every component in the simulator above.
            </p>
          </div>

          {/* ---- Address anatomy ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Binary className="w-5 h-5" />} title="Address Anatomy" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                The CPU generates <strong className="text-blue-600 dark:text-blue-300">12-bit virtual addresses</strong>. The MMU splits every address into two fields:
              </p>
              <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
                <div className="flex-1 rounded-xl border-2 border-indigo-400/40 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Virtual Page Number (VPN)</div>
                  <div className="font-mono text-2xl text-indigo-500 dark:text-indigo-300 font-bold mb-2">6 bits</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Indexes into the page table. Supports 2<sup>6</sup> = <strong className="text-slate-900 dark:text-slate-200">64 virtual pages</strong>.</p>
                </div>
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
                </div>
                <div className="flex-1 rounded-xl border-2 border-emerald-400/40 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Offset</div>
                  <div className="font-mono text-2xl text-emerald-500 dark:text-emerald-300 font-bold mb-2">6 bits</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Byte position within the page. Each page holds 2<sup>6</sup> = <strong className="text-slate-900 dark:text-slate-200">64 bytes</strong>.</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <Info className="w-3.5 h-3.5" /> Example address breakdown
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-slate-500">Addr&nbsp;</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">0x3A</span>
                  <span className="text-slate-400 dark:text-slate-600 mx-2">=</span>
                  <span className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">000011</span>
                  <span className="text-slate-400 dark:text-slate-600 mx-1">|</span>
                  <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">101010</span>
                  <span className="text-slate-400 dark:text-slate-600 mx-2">&rarr;</span>
                  <span className="text-slate-600 dark:text-slate-400">VPN&nbsp;<strong className="text-indigo-600 dark:text-indigo-300">3</strong>,&nbsp;Offset&nbsp;<strong className="text-emerald-600 dark:text-emerald-300">42</strong></span>
                </div>
              </div>
            </div>
          </section>

          {/* ---- Hardware components ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Server className="w-5 h-5" />} title="Hardware Components" />
            <div className="grid md:grid-cols-2 gap-5">
              <HwCard
                icon={<Cpu className="w-6 h-6" />}
                color="blue"
                title="CPU / MMU"
                specs={["Generates 12-bit virtual addresses", "6-bit VPN + 6-bit Offset"]}
                desc="The Memory Management Unit sits between the CPU and memory, translating every virtual address to a physical one before the bus sees it."
              />
              <HwCard
                icon={<Zap className="w-6 h-6" />}
                color="amber"
                title="TLB"
                specs={["4 entries", "Fully associative", "LRU replacement"]}
                desc="A tiny, blazing-fast cache inside the MMU. If the VPN is found here (a hit), no page-table walk is needed — saving hundreds of cycles."
              />
              <HwCard
                icon={<Database className="w-6 h-6" />}
                color="indigo"
                title="Page Table"
                specs={["64 entries (one per virtual page)", "Valid bit + PFN mapping"]}
                desc="Stored in main memory. Each entry records whether a page is resident in RAM and, if so, which physical frame it occupies."
              />
              <HwCard
                icon={<MemoryStick className="w-6 h-6" />}
                color="emerald"
                title="Physical RAM"
                specs={["8 physical frames", "Each frame = 64 bytes"]}
                desc="The actual DRAM. With only 8 frames and 64 virtual pages, page faults and evictions are inevitable — exactly what makes the simulation interesting."
              />
              <HwCard
                icon={<HardDrive className="w-6 h-6" />}
                color="orange"
                title="Disk (Swap)"
                specs={["Unlimited capacity (conceptual)", "~10 ms latency"]}
                desc="Acts as the backing store. When a page isn't in RAM the OS reads it from disk — the single most expensive operation in the memory hierarchy."
              />
              <HwCard
                icon={<Monitor className="w-6 h-6" />}
                color="cyan"
                title="System Log"
                specs={["Last 50 events", "Color-coded severity"]}
                desc="The console at the bottom records every operation — hits (green), misses (amber), faults (red), and disk I/O (orange) — so you can trace the full story."
              />
            </div>
          </section>

          {/* ---- Translation flow ---- */}
          <section className="mb-16">
            <SectionTitle icon={<ArrowDown className="w-5 h-5" />} title="Translation Flow — Step by Step" />
            <div className="space-y-4">
              <FlowStep
                num={1}
                color="blue"
                icon={<Cpu className="w-5 h-5" />}
                title="CPU generates virtual address"
                desc="The processor issues a load or store to a 12-bit virtual address. The MMU splits it into VPN and Offset."
              />
              <FlowStep
                num={2}
                color="amber"
                icon={<Search className="w-5 h-5" />}
                title="TLB lookup"
                desc="The MMU checks the TLB for a matching VPN. This is a parallel, content-addressable search — effectively O(1)."
              />
              <div className="grid md:grid-cols-2 gap-4 pl-8 md:pl-14">
                <FlowOutcome
                  variant="success"
                  title="TLB Hit"
                  desc="PFN is read directly from the TLB entry. The physical address is formed immediately — no memory access needed for the translation itself."
                />
                <FlowOutcome
                  variant="error"
                  title="TLB Miss"
                  desc="The MMU must walk the page table in main memory to find the translation. This costs one extra memory access."
                />
              </div>
              <FlowStep
                num={3}
                color="indigo"
                icon={<Database className="w-5 h-5" />}
                title="Page table walk"
                desc="Using the VPN as an index, the MMU reads the corresponding page-table entry. It checks the Valid bit."
              />
              <div className="grid md:grid-cols-2 gap-4 pl-8 md:pl-14">
                <FlowOutcome
                  variant="success"
                  title="Valid = 1"
                  desc="Page is resident in RAM. The PFN is extracted, the TLB is updated with the new mapping, and the access proceeds."
                />
                <FlowOutcome
                  variant="error"
                  title="Valid = 0 — Page Fault!"
                  desc="The page is on disk. The OS takes over: it suspends the process, issues a disk read, finds (or evicts) a free frame, updates the page table, and retries."
                />
              </div>
              <FlowStep
                num={4}
                color="orange"
                icon={<HardDrive className="w-5 h-5" />}
                title="Page fault handling (if needed)"
                desc="The OS reads the faulted page from disk into a free RAM frame. If RAM is full, a victim frame is selected (random policy in this sim), written back to disk if dirty, and its page-table entry is invalidated."
              />
              <FlowStep
                num={5}
                color="emerald"
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="Physical memory access"
                desc="With a valid PFN in hand, the physical address is formed as (PFN << 6) | Offset and sent to the memory bus. The data is returned to the CPU."
              />
            </div>
          </section>

          {/* ---- Eviction detail ---- */}
          <section className="mb-16">
            <SectionTitle icon={<AlertTriangle className="w-5 h-5" />} title="Eviction — When RAM Is Full" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                With only <strong className="text-emerald-600 dark:text-emerald-300">8 physical frames</strong> and <strong className="text-indigo-600 dark:text-indigo-300">64 virtual pages</strong>,
                RAM fills up quickly. When a page fault occurs and no free frame exists, the OS must <strong className="text-red-600 dark:text-red-400">evict</strong> an existing page.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <EvictStep num="1" title="Pick victim" desc="This simulator uses random selection for simplicity. Real OSes use LRU, Clock, or FIFO." />
                <EvictStep num="2" title="Invalidate" desc="The victim's page-table entry is set to Valid = 0 and its TLB entry (if any) is flushed." />
                <EvictStep num="3" title="Load new page" desc="The faulted page is read from disk into the now-free frame. Page table and TLB are updated." />
              </div>
              <div className="bg-amber-50 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-amber-700 dark:text-amber-300">Performance impact:</strong> A single page fault can cost <strong className="text-slate-900 dark:text-slate-200">~10 ms</strong> of disk I/O —
                  roughly <strong className="text-slate-900 dark:text-slate-200">10 million</strong> times slower than a TLB hit (~1 ns). This is why the TLB hit rate is the single most
                  important metric in virtual memory performance.
                </p>
              </div>
            </div>
          </section>

          {/* ---- How to use ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Eye className="w-5 h-5" />} title="How to Use This Simulator" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageCard step="1" title="Step Once" desc="Click to generate a single random virtual address request and watch the translation flow." color="blue" />
              <UsageCard step="2" title="Watch highlights" desc="Blue glow = active component. Green = hit/success. Red = miss/fault. Orange = disk I/O." color="emerald" />
              <UsageCard step="3" title="Auto Play" desc="Toggle to run continuous requests and observe how the TLB and RAM fill up over time." color="amber" />
              <UsageCard step="4" title="Reset" desc="Clear everything — TLB, page table, RAM, stats, and logs — to start a fresh experiment." color="slate" />
            </div>
          </section>

          {/* ---- Key metrics ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Activity className="w-5 h-5" />} title="Key Metrics to Watch" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="TLB Hit Rate" formula="Hits / (Hits + Misses)" ideal="≥ 95%" desc="Higher is better — avoids page table walks." color="green" />
              <MetricCard label="Page Fault Rate" formula="Faults / Total Accesses" ideal="< 1%" desc="Each fault triggers expensive disk I/O." color="red" />
              <MetricCard label="Effective Access Time" formula="TLB×1ns + Miss×100ns + Fault×10ms" ideal="As low as possible" desc="Weighted average latency per access." color="blue" />
              <MetricCard label="Working Set Fit" formula="Active pages ≤ RAM frames?" ideal="Ideally yes" desc="If the working set exceeds RAM, thrashing occurs." color="amber" />
            </div>
          </section>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .dashed-border { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%23cbd5e1' stroke-width='1' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e"); }
        .dark .dashed-border { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%23334155FF' stroke-width='1' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e"); }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
}

/* ================================================================
   Sub-components for the educational section
   ================================================================ */

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
  orange:  { bg: "bg-orange-50 dark:bg-orange-500/10",   border: "border-orange-200 dark:border-orange-500/30",   text: "text-orange-600 dark:text-orange-400",   icon: "text-orange-600 dark:text-orange-400" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-500/10",       border: "border-cyan-200 dark:border-cyan-500/30",       text: "text-cyan-600 dark:text-cyan-400",       icon: "text-cyan-600 dark:text-cyan-400" },
  slate:   { bg: "bg-slate-100 dark:bg-slate-500/10",    border: "border-slate-300 dark:border-slate-500/30",     text: "text-slate-600 dark:text-slate-400",     icon: "text-slate-600 dark:text-slate-400" },
  green:   { bg: "bg-green-50 dark:bg-green-500/10",     border: "border-green-200 dark:border-green-500/30",     text: "text-green-600 dark:text-green-400",     icon: "text-green-600 dark:text-green-400" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400",         icon: "text-red-600 dark:text-red-400" },
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

function FlowOutcome({ variant, title, desc }) {
  const isOk = variant === "success";
  return (
    <div className={`rounded-xl border p-4 ${isOk ? "border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5" : "border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5"}`}>
      <div className="flex items-center gap-2 mb-2">
        {isOk ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /> : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
        <span className={`font-semibold text-sm ${isOk ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>{title}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function EvictStep({ num, title, desc }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/15 border border-red-300 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm mb-3">{num}</div>
      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{title}</h4>
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
