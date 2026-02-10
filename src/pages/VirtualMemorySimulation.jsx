import React, { useState, useEffect, useRef } from "react";
import { Play, StepForward, RotateCcw, Cpu, HardDrive, Layers, ArrowRight, Activity } from "lucide-react";

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
        ${activeHighlight === highlightKey ? "border-blue-500 bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-[1.02]" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"}
        ${className}
      `}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Virtual Memory Simulator
              </h1>
              <p className="text-xs text-slate-500">TLB + Page Table + RAM + Disk Visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
            <button
              onClick={() => requestMemoryAccess()}
              disabled={processingQueue.length > 0 || isAutoPlaying}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StepForward className="w-4 h-4" /> Step Once
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border ${isAutoPlaying ? "bg-red-500/10 text-red-400 border-red-500/50" : "bg-slate-800 hover:bg-slate-700 border-transparent"}`}
            >
              {isAutoPlaying ? "Pause" : <><Play className="w-4 h-4" /> Auto Play</>}
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1" />
            <button
              onClick={resetSystem}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
              title="Reset System"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Box title="CPU / MMU Request" highlightKey="cpu" className="min-h-[160px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Cpu className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">CORE 0</span>
              </div>
              {lastAddress && (
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded font-mono border border-blue-800">active</span>
              )}
            </div>
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 font-mono text-sm">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>VPN ({CONFIG.VPN_BITS} bits)</span>
                <span>Offset ({CONFIG.OFFSET_BITS} bits)</span>
              </div>
              <div className="flex h-10 rounded border border-slate-600 overflow-hidden">
                <div className="flex-1 bg-indigo-500/20 flex items-center justify-center border-r border-slate-600 text-indigo-300 font-bold">
                  {lastAddress ? toBin(lastAddress.vpn, CONFIG.VPN_BITS) : "000000"}
                </div>
                <div className="flex-1 bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold">
                  {lastAddress ? toBin(lastAddress.offset, CONFIG.OFFSET_BITS) : "000000"}
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-slate-400">
                Addr: {lastAddress ? toHex(lastAddress.full) : "--"}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500">Operation</div>
                <div className="text-slate-200 truncate">{currentStep}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500">Last VPN</div>
                <div className="text-slate-200 font-mono">{lastAddress ? lastAddress.vpn : "-"}</div>
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
                      ${entry ? "bg-slate-800 border-slate-600 text-slate-200" : "bg-slate-900/50 border-slate-800 text-slate-700 dashed-border"}
                      ${activeHighlight === "tlb" && entry && entry.vpn === lastAddress?.vpn ? "ring-2 ring-green-500 bg-green-900/20" : ""}
                    `}
                  >
                    {entry ? (
                      <>
                        <span className="font-bold text-indigo-400">{toBin(entry.vpn, 6)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="font-bold text-amber-400">{toBin(entry.pfn, 3)}</span>
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
            <div className="mt-4 flex gap-4 text-xs justify-center text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Hit: {stats.tlbHits}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Miss: {stats.tlbMisses}</span>
            </div>
          </Box>
        </div>

        <div className="lg:col-span-4 h-[600px] flex flex-col">
          <Box title="Page Table (Main Memory)" highlightKey="pt" className="h-full flex flex-col">
            <div className="flex text-xs font-bold text-slate-500 border-b border-slate-700 pb-2 mb-2 px-2">
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
                      ${isTarget ? (activeHighlight === "pt" ? "bg-blue-600 text-white border-blue-400 shadow-lg scale-105 z-10" : "bg-slate-700 border-slate-500") : "bg-slate-900 border-slate-800 text-slate-400"}
                    `}
                  >
                    <span className="w-12 text-slate-500 opacity-70">{idx}</span>
                    <div className="w-12 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.valid ? "bg-green-500/20 text-green-400" : "bg-red-500/10 text-red-500"}`}>
                        {entry.valid ? "1" : "0"}
                      </span>
                    </div>
                    <span className={`w-16 text-center ${entry.valid ? "text-amber-400 font-bold" : "text-slate-700"}`}>
                      {entry.valid ? entry.pfn : "-"}
                    </span>
                    <span className="flex-1 text-right text-[10px] text-slate-600 truncate">{entry.diskAddr}</span>
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
                      ${frame.data ? (isActive ? "bg-green-600 border-green-400 shadow-green-500/50 shadow-lg scale-105" : "bg-slate-800 border-slate-600") : "bg-slate-900/30 border-slate-800 border-dashed"}
                    `}
                  >
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-slate-500">PFN: {i}</span>
                    {frame.data ? (
                      <>
                        <span className="text-lg font-bold text-slate-200">{frame.data}</span>
                        <span className="text-[10px] text-indigo-400">VPN: {frame.vpn}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-600">Free</span>
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
            <div className="flex items-center justify-center h-full text-slate-600">
              <div
                className={`
                  w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500
                  ${activeHighlight === "disk" ? "border-orange-500 bg-orange-900/20 animate-spin-slow" : "border-slate-800 bg-slate-900"}
                `}
              >
                <HardDrive className={`w-10 h-10 ${activeHighlight === "disk" ? "text-orange-500" : "text-slate-700"}`} />
              </div>
              <div className="ml-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeHighlight === "disk" ? "bg-orange-500 animate-ping" : "bg-slate-800"}`} />
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

      <div className="border-t border-slate-800 bg-slate-950 p-4 h-48 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" /> System Log
          </h4>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 rounded border border-slate-800 p-2 font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes("error") || log.includes("Fault")
                    ? "text-red-400"
                    : log.includes("success") || log.includes("Hit")
                    ? "text-green-400"
                    : log.includes("warning")
                    ? "text-amber-400"
                    : "text-slate-400"
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .dashed-border { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%23334155FF' stroke-width='1' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e"); }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
}
