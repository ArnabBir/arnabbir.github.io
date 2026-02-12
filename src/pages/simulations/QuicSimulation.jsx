import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Zap,
  Shield,
  Activity,
  Server,
  Smartphone,
  Globe,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Wifi,
  WifiOff,
  Layers,
  FileText,
  Clock,
  BookOpen,
  Info,
  Sun,
  Moon,
  Network,
  Cpu,
  Radio,
  XCircle,
  Terminal,
  Database
} from "lucide-react";

// ================================================================
//  CONFIG & CONSTANTS
// ================================================================
const TICK_RATE = 100; // ms per tick
const TOTAL_DATA_SIZE = 100; // units
const TCP_HANDSHAKE_TICKS = 20; // Simulated latency for TCP 3-way + TLS
const QUIC_HANDSHAKE_TICKS = 5; // Simulated latency for QUIC 0-RTT/1-RTT
const PACKET_LOSS_PENALTY = 15; // Ticks lost during retransmission

// Simulation States
const PHASES = {
  IDLE: 'IDLE',
  HANDSHAKE: 'HANDSHAKE',
  TRANSFER: 'TRANSFER',
  COMPLETE: 'COMPLETE'
};

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function QuicSimulation() {
  const { theme, setTheme } = useTheme();
  
  // --- Simulation State ---
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [packetLossRate, setPacketLossRate] = useState(0.05); // 5% default
  const [elapsedTicks, setElapsedTicks] = useState(0);
  const [logs, setLogs] = useState([]);

  // TCP State
  const [tcpProgress, setTcpProgress] = useState(0);
  const [tcpState, setTcpState] = useState('IDLE'); // IDLE, SYN, SYN-ACK, ACK, TRANSFER, BLOCKED
  const [tcpBlockedTimer, setTcpBlockedTimer] = useState(0);

  // QUIC State
  const [quicState, setQuicState] = useState('IDLE');
  // 4 streams representing typical HTTP/2 multiplexing (HTML, CSS, JS, IMG)
  const [quicStreams, setQuicStreams] = useState([
    { id: 1, name: "index.html", progress: 0, blockedTimer: 0, color: "bg-blue-500" },
    { id: 2, name: "style.css", progress: 0, blockedTimer: 0, color: "bg-purple-500" },
    { id: 3, name: "app.js", progress: 0, blockedTimer: 0, color: "bg-amber-500" },
    { id: 4, name: "hero.jpg", progress: 0, blockedTimer: 0, color: "bg-emerald-500" },
  ]);

  // Refs for animation
  const loopRef = useRef();

  // --- Reset Logic ---
  const resetSim = () => {
    setIsRunning(false);
    setPhase(PHASES.IDLE);
    setElapsedTicks(0);
    setTcpProgress(0);
    setTcpState('IDLE');
    setTcpBlockedTimer(0);
    setQuicState('IDLE');
    setQuicStreams(prev => prev.map(s => ({ ...s, progress: 0, blockedTimer: 0 })));
    setLogs(["Ready to simulate. Click Play."]);
  };

  const addLog = (msg, type = "info") => {
    setLogs(prev => [`[${type.toUpperCase()}] ${msg}`, ...prev].slice(0, 50));
  };

  // --- Core Loop ---
  const tick = useCallback(() => {
    if (!isRunning || phase === PHASES.COMPLETE) return;

    setElapsedTicks(t => t + 1);

    // 1. HANDSHAKE PHASE
    if (phase === PHASES.HANDSHAKE || phase === PHASES.IDLE) {
      if (elapsedTicks < QUIC_HANDSHAKE_TICKS) {
        setQuicState('HANDSHAKE');
        if (elapsedTicks === 1) addLog("QUIC: Sending 0-RTT CHLO (Client Hello)...", "quic");
      } else if (elapsedTicks === QUIC_HANDSHAKE_TICKS) {
        setQuicState('TRANSFER');
        addLog("QUIC: Handshake Complete (0-RTT). Sending Encrypted Data.", "success");
      }

      if (elapsedTicks < TCP_HANDSHAKE_TICKS) {
        setTcpState('HANDSHAKE');
        if (elapsedTicks === 1) addLog("TCP: Sending SYN...", "tcp");
        if (elapsedTicks === 6) addLog("TCP: Received SYN-ACK. Sending ACK...", "tcp");
        if (elapsedTicks === 12) addLog("TLS: Client Hello (Key Exchange)...", "tcp");
        if (elapsedTicks === 18) addLog("TLS: Server Hello (Cipher Spec)...", "tcp");
      } else if (elapsedTicks === TCP_HANDSHAKE_TICKS) {
        setTcpState('TRANSFER');
        setPhase(PHASES.TRANSFER);
        addLog("TCP+TLS: Handshake Complete. Establishing secure tunnel.", "success");
      }
    }

    // 2. TRANSFER PHASE
    if (phase === PHASES.TRANSFER) {
      // --- TCP LOGIC (Single Stream / HOL Blocking) ---
      if (tcpProgress < TOTAL_DATA_SIZE) {
        if (tcpBlockedTimer > 0) {
          // HOL Blocking: The entire connection waits
          setTcpBlockedTimer(t => t - 1);
          setTcpState('BLOCKED');
          if (tcpBlockedTimer === 1) addLog("TCP: Recovered lost packet. Resuming...", "tcp");
        } else {
          // Random Packet Loss Check
          if (Math.random() < packetLossRate) {
            setTcpBlockedTimer(PACKET_LOSS_PENALTY);
            setTcpState('BLOCKED');
            addLog("TCP: Packet Loss! Head-of-Line Blocking active. Queue halted.", "error");
          } else {
            setTcpProgress(p => Math.min(p + 1, TOTAL_DATA_SIZE));
            setTcpState('TRANSFER');
          }
        }
      } else {
        setTcpState('COMPLETE');
      }

      // --- QUIC LOGIC (Multiplexed Streams) ---
      let allComplete = true;
      setQuicStreams(prevStreams => {
        return prevStreams.map(stream => {
          if (stream.progress >= TOTAL_DATA_SIZE) return stream;
          allComplete = false;

          if (stream.blockedTimer > 0) {
            // Only this stream waits
            return { ...stream, blockedTimer: stream.blockedTimer - 1 };
          } else {
            // Random Loss (Independent per stream)
            if (Math.random() < packetLossRate) {
              addLog(`QUIC: Loss on Stream ${stream.id}. Other streams continue.`, "warning");
              return { ...stream, blockedTimer: PACKET_LOSS_PENALTY };
            } else {
              return { ...stream, progress: Math.min(stream.progress + 1, TOTAL_DATA_SIZE) };
            }
          }
        });
      });
      
      if (allComplete) setQuicState('COMPLETE');
      if (allComplete && tcpState === 'COMPLETE') setPhase(PHASES.COMPLETE);
    }

  }, [isRunning, phase, elapsedTicks, tcpProgress, tcpBlockedTimer, packetLossRate, tcpState]);

  useEffect(() => {
    loopRef.current = setInterval(tick, TICK_RATE);
    return () => clearInterval(loopRef.current);
  }, [tick]);

  // --- Handlers ---
  const startSim = () => {
    if (phase === PHASES.COMPLETE) resetSim();
    setIsRunning(true);
    if (phase === PHASES.IDLE) setPhase(PHASES.HANDSHAKE);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                QUIC Protocol Simulator
              </h1>
              <p className="text-xs text-slate-500">Based on Google SIGCOMM '17 Paper</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700">
             <div className="flex flex-col px-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Loss Rate</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="range" min="0" max="0.2" step="0.01" 
                        value={packetLossRate} 
                        onChange={(e) => setPacketLossRate(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-mono w-8">{(packetLossRate * 100).toFixed(0)}%</span>
                </div>
             </div>
             <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />
             <button onClick={() => setIsRunning(!isRunning)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
             </button>
             <button onClick={resetSim} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                <RotateCcw size={18} />
             </button>
             <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION AREA
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Simulation Visuals */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TCP LANE */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Server className="text-slate-400" size={20} />
                        <span className="font-bold text-slate-700 dark:text-slate-200">TCP + TLS 1.2</span>
                    </div>
                    <StatusBadge state={tcpState} type="TCP" />
                </div>
                
                {/* Visual Representation */}
                <div className="relative h-16 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center px-4">
                    {/* Handshake Phase Visual */}
                    {tcpState === 'HANDSHAKE' && (
                        <div className="w-full flex flex-col items-center justify-center text-xs font-mono text-slate-500 animate-pulse gap-1">
                            <div className="flex gap-1">
                                <span className={`w-2 h-2 rounded-full ${elapsedTicks > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                <span className={`w-2 h-2 rounded-full ${elapsedTicks > 6 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                <span className={`w-2 h-2 rounded-full ${elapsedTicks > 12 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                <span className={`w-2 h-2 rounded-full ${elapsedTicks > 18 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                            </div>
                            <span>3-Way Handshake + TLS Exchange</span>
                        </div>
                    )}
                    
                    {/* Data Transfer Visual - Single Stream */}
                    {(tcpState === 'TRANSFER' || tcpState === 'BLOCKED' || tcpState === 'COMPLETE') && (
                        <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                             <div 
                                className={`h-full transition-all duration-300 ${tcpState === 'BLOCKED' ? 'bg-red-500 pattern-diagonal' : tcpState === 'COMPLETE' ? 'bg-green-500' : 'bg-blue-600'}`}
                                style={{ width: `${tcpProgress}%` }}
                             />
                             {tcpState === 'BLOCKED' && (
                                 <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">
                                     <AlertTriangle size={14} className="mr-1" /> Head-of-Line Blocked
                                 </div>
                             )}
                        </div>
                    )}
                </div>
                <div className="mt-2 text-xs text-slate-500 flex justify-between">
                    <span>Protocol: TCP (Reliable, Ordered)</span>
                    <span className="flex items-center gap-1"><Lock size={10}/> TLS Layered On Top</span>
                </div>
            </div>

            {/* QUIC LANE */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Zap size={140} />
                </div>
                
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <Globe className="text-blue-500" size={20} />
                        <span className="font-bold text-slate-700 dark:text-slate-200">QUIC (UDP)</span>
                    </div>
                    <StatusBadge state={quicState} type="QUIC" />
                </div>

                {/* Visual Representation */}
                <div className="relative bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 z-10">
                     {quicState === 'HANDSHAKE' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 z-20 backdrop-blur-[1px]">
                             <div className="flex flex-col items-center gap-2">
                                <Zap size={24} className="text-amber-500 animate-bounce" />
                                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                                    0-RTT Handshake (Cached Config)
                                </div>
                             </div>
                        </div>
                    )}

                    {quicStreams.map(stream => (
                        <div key={stream.id} className="flex items-center gap-3">
                            <div className="w-20 text-[10px] font-mono text-slate-500 truncate flex items-center gap-1">
                                <FileText size={10} /> {stream.name}
                            </div>
                            <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-300 ${stream.blockedTimer > 0 ? 'bg-red-500 pattern-diagonal' : stream.progress >= 100 ? 'bg-green-500' : stream.color}`}
                                    style={{ width: `${stream.progress}%` }}
                                />
                            </div>
                            <div className="w-6 flex justify-center">
                                {stream.blockedTimer > 0 ? (
                                    <WifiOff size={12} className="text-red-500 animate-pulse" />
                                ) : (
                                    <Activity size={12} className="text-slate-300" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="mt-2 text-xs text-slate-500 flex justify-between relative z-10">
                    <span>Protocol: UDP (Multiplexed)</span>
                    <span className="flex items-center gap-1"><Shield size={10}/> Built-in Encryption</span>
                </div>
            </div>
        </div>

        {/* RIGHT: Logs & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 h-[240px] flex flex-col shadow-inner">
                <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase border-b border-slate-700 pb-2">
                    <Terminal size={14} /> Network Event Log
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 p-1">
                    {logs.map((log, i) => (
                        <div key={i} className={`
                            border-l-2 pl-2 
                            ${log.includes("[ERROR]") ? "border-red-500 text-red-400" : 
                              log.includes("[WARNING]") ? "border-amber-500 text-amber-400" : 
                              log.includes("[SUCCESS]") ? "border-green-500 text-green-400" : 
                              log.includes("[TCP]") ? "border-slate-500 text-slate-300" : 
                              log.includes("[QUIC]") ? "border-blue-500 text-blue-300" : "border-slate-700 text-slate-500"}
                        `}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Ticks</div>
                     <div className="text-2xl font-mono text-slate-700 dark:text-slate-200">{elapsedTicks}</div>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Loss Probability</div>
                     <div className="text-2xl font-mono text-slate-700 dark:text-slate-200">{(packetLossRate * 100).toFixed(0)}%</div>
                 </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-xs text-blue-800 dark:text-blue-200">
                <strong className="block mb-1 flex items-center gap-2"><Info size={14}/> Simulation Insight</strong>
                Notice how a single packet loss in TCP (Red Bar) stops the <em>entire</em> download, whereas in QUIC, only one color strip stops, while others continue loading. This is the solution to <strong>Head-of-Line Blocking</strong>.
            </div>
        </div>

      </div>

      {/* ============================================================
          DEEP DIVE SECTION (Expanded)
          ============================================================ */}
      <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 mt-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — SIGCOMM '17
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent mb-6">
              The QUIC Transport Protocol
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed text-lg">
              A comprehensive analysis of Google's design for an encrypted, multiplexed, and low-latency transport protocol. 
              QUIC was built to overcome the fundamental ossification of the Internet's transport layer.
            </p>
          </div>

          {/* 1. THE PROBLEM: OSSIFICATION & LATENCY */}
          <section className="mb-20">
            <SectionTitle icon={<AlertTriangle className="w-5 h-5" />} title="The Problem: Why Replace TCP?" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
                <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                    By 2013, improving web latency had hit a wall. The existing TCP/TLS stack suffered from two critical issues that could not be fixed incrementally: <strong>Protocol Entrenchment</strong> (Ossification) and <strong>Implementation Entrenchment</strong>.
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-red-500" /> Protocol Entrenchment
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Middleboxes (Firewalls, NATs, Load Balancers) inspect TCP headers. If a new TCP extension changes the wire format, middleboxes drop the packets. This "ossified" TCP, making it impossible to deploy improvements like TFO (TCP Fast Open) or Multipath TCP at internet scale.
                        </p>
                        <div className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-2 rounded">
                            <strong>QUIC's Fix:</strong> Encrypt the transport headers. Middleboxes can only see UDP packets; they cannot inspect or reject the inner workings of the transport.
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-orange-500" /> Implementation Entrenchment
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            TCP is implemented in the OS kernel. Updating the kernel on billions of mobile devices and servers takes years. This creates a "lowest common denominator" problem where innovation is stifled by slow OS update cycles.
                        </p>
                        <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 p-2 rounded">
                            <strong>QUIC's Fix:</strong> Move transport logic to User-Space (on top of UDP). Google could update QUIC in Chrome and YouTube apps weekly, iterating rapidly.
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* 2. THE ARCHITECTURE */}
          <section className="mb-20">
            <SectionTitle icon={<Layers className="w-5 h-5" />} title="Protocol Architecture" />
            <div className="grid md:grid-cols-12 gap-8">
                {/* Visual Stack */}
                <div className="md:col-span-5 flex flex-col justify-center">
                    <div className="space-y-2 font-mono text-sm font-bold text-center text-white">
                        <div className="bg-slate-400 p-3 rounded">HTTP/2 API</div>
                        <div className="bg-blue-600 p-6 rounded flex items-center justify-center relative shadow-xl">
                            <span className="z-10 text-xl">QUIC</span>
                            <span className="absolute text-[10px] bottom-1 right-2 opacity-70">Stream Mux + Crypto + Congestion</span>
                        </div>
                        <div className="bg-slate-500 p-3 rounded">UDP</div>
                        <div className="bg-slate-600 p-3 rounded">IP</div>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">QUIC subsumes TLS, TCP, and parts of HTTP/2.</p>
                </div>
                
                {/* Descriptions */}
                <div className="md:col-span-7 space-y-4">
                    <HwCard 
                        icon={<Lock className="w-5 h-5" />}
                        color="blue"
                        title="Integrated Encryption"
                        specs={["Authenticated Headers", "No Middlebox Tampering"]}
                        desc="QUIC does not strictly layer transport and crypto. The handshake combines connection setup with key exchange. Most of the QUIC packet header is encrypted, preventing ossification."
                    />
                    <HwCard 
                        icon={<Database className="w-5 h-5" />}
                        color="indigo"
                        title="Monotonic Packet Numbers"
                        specs={["Loss Recovery", "No Ambiguity"]}
                        desc="In TCP, a retransmitted segment carries the same Sequence Number, causing ambiguity (did the ACK acknowledge the original or the retry?). QUIC assigns a new Packet Number to every packet, even retransmissions, solving this ambiguity."
                    />
                    <HwCard 
                        icon={<Radio className="w-5 h-5" />}
                        color="emerald"
                        title="UDP Substrate"
                        specs={["Traversal", "User-Space"]}
                        desc="UDP is used merely as a header for internet traversal. All reliability, ordering, and congestion logic is handled by QUIC in user-space."
                    />
                </div>
            </div>
          </section>

          {/* 3. KEY MECHANISMS */}
          <section className="mb-20">
            <SectionTitle icon={<Zap className="w-5 h-5" />} title="Mechanisms: 0-RTT & Multiplexing" />
            
            {/* 0-RTT Flow */}
            <div className="mb-10">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">The 0-RTT Handshake</h4>
                <div className="space-y-3">
                    <FlowStep 
                        num="1" 
                        color="blue" 
                        icon={<Globe className="w-4 h-4" />} 
                        title="Initial Connection (1-RTT)" 
                        desc="On the very first connection, the client sends an inchoate Client Hello (CHLO). The server responds with a Server Config (SCFG) containing a Diffie-Hellman public value and a Source Address Token." 
                    />
                    <FlowStep 
                        num="2" 
                        color="indigo" 
                        icon={<Database className="w-4 h-4" />} 
                        title="Caching Credentials" 
                        desc="The client caches the SCFG and the Source Address Token. This is effectively a 'ticket' to reconnect quickly later." 
                    />
                    <FlowStep 
                        num="3" 
                        color="green" 
                        icon={<Zap className="w-4 h-4" />} 
                        title="Repeat Connection (0-RTT)" 
                        desc="The client sends a complete CHLO including the cached token AND encrypted application data (HTTP request) in the very first packet. No round trips are wasted waiting for the server." 
                    />
                </div>
            </div>

            {/* HOL Blocking Detail */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded-xl">
                    <h4 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2"><XCircle className="w-4 h-4"/> TCP Head-of-Line Blocking</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        TCP provides a single, ordered bytestream abstraction. If Packet #5 is lost, the TCP stack buffers Packet #6, #7, and #8 until #5 is retransmitted. 
                        The application cannot read #6, #7, or #8, even if they contain data for totally unrelated resources (e.g., a CSS file waiting on a blocked JS file).
                    </p>
                    <div className="h-2 w-full bg-slate-200 rounded overflow-hidden flex">
                        <div className="flex-1 bg-green-500"></div>
                        <div className="w-4 bg-red-500 animate-pulse"></div>
                        <div className="flex-1 bg-slate-400 opacity-50"></div>
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-6 rounded-xl">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> QUIC Stream Independence</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        QUIC supports multiple independent streams within a connection. A lost UDP packet only impacts the stream(s) whose data was inside that packet.
                        Stream 2 can continue to be processed by the application while Stream 1 waits for retransmission.
                    </p>
                    <div className="space-y-1">
                        <div className="h-1.5 w-full bg-emerald-500 rounded"></div>
                        <div className="h-1.5 w-3/4 bg-red-500 rounded animate-pulse"></div>
                        <div className="h-1.5 w-full bg-emerald-500 rounded"></div>
                    </div>
                </div>
            </div>
          </section>

          {/* 4. CONNECTION MIGRATION */}
          <section className="mb-20">
            <SectionTitle icon={<Smartphone className="w-5 h-5" />} title="Connection Migration" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                    In TCP, a connection is defined by a 5-tuple: <code>(SrcIP, SrcPort, DstIP, DstPort, Protocol)</code>. If a user switches from Wi-Fi to LTE, their SrcIP changes, breaking the 5-tuple and the connection.
                </p>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <HwCard 
                            icon={<Smartphone className="w-5 h-5" />}
                            color="amber"
                            title="Connection ID (CID)"
                            specs={["64-bit ID", "IP-Agnostic"]}
                            desc="QUIC identifies connections using a randomly generated 64-bit Connection ID. The IP address is merely a routing label."
                        />
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-mono">
                            CID: 0x38472910... <br/>
                            <span className="text-red-500 line-through">IP: 192.168.1.5</span> &rarr; <span className="text-green-500">IP: 10.0.0.1</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Real-World Impact</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Mobile clients (like the YouTube app) often experience NAT rebinding or network switching. With QUIC, the client simply continues sending packets with the same Connection ID from the new IP. The server sees the known ID, updates its mapping, and the stream continues uninterrupted.
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* 5. PERFORMANCE & LESSONS */}
          <section className="mb-8">
            <SectionTitle icon={<Activity className="w-5 h-5" />} title="Performance Data & Failed Experiments" />
            
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
                 <MetricCard 
                    label="Search Latency (Desktop)" 
                    formula="Reduction" 
                    ideal="8.0%" 
                    desc="High bandwidth, reliable connections benefit from 0-RTT."
                    color="blue"
                />
                 <MetricCard 
                    label="Search Latency (Mobile)" 
                    formula="Reduction" 
                    ideal="3.6%" 
                    desc="Mobile gains are lower due to radio wake-up latencies dominating."
                    color="indigo"
                />
                 <MetricCard 
                    label="Video Rebuffer (Desktop)" 
                    formula="Reduction" 
                    ideal="18.0%" 
                    desc="QUIC's improved loss recovery prevents stalls."
                    color="emerald"
                />
                 <MetricCard 
                    label="Video Rebuffer (Mobile)" 
                    formula="Reduction" 
                    ideal="15.3%" 
                    desc="Significant improvement in user experience on lossy networks."
                    color="green"
                />
            </div>

            {/* Failed Experiments (FEC) */}
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-slate-500" /> Lesson Learned: Why FEC (Forward Error Correction) Failed
                </h4>
                <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-400 max-w-none">
                    <p>
                        Google initially hypothesized that <strong>Forward Error Correction (FEC)</strong>—sending redundant XOR packets to recover lost data without retransmission—would significantly lower latency. 
                        However, the SIGCOMM '17 paper reports that <strong>FEC was removed</strong> from QUIC in early 2016.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Bandwidth Overhead:</strong> FEC packets consume bandwidth. In congestion-limited networks, sending FEC often caused <em>more</em> congestion and packet loss.</li>
                        <li><strong>Efficiency:</strong> XOR-based FEC only recovers a single packet loss. Burst losses (common on the internet) overwhelmed the simple FEC.</li>
                        <li><strong>Conclusion:</strong> A highly optimized retransmission scheme (Tail Loss Probes, Early Retransmit) proved more effective than FEC for general web traffic.</li>
                    </ul>
                </div>
            </div>
          </section>

        </div>
      </div>

       <style>{`
        .pattern-diagonal {
            background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ================================================================
//  SUB-COMPONENTS (Standard Library)
// ================================================================

function StatusBadge({ state, type }) {
    const isError = state === 'BLOCKED';
    const isSuccess = state === 'COMPLETE' || state === 'TRANSFER';
    
    let colorClass = "bg-slate-100 text-slate-500";
    if (state === 'HANDSHAKE') colorClass = "bg-amber-100 text-amber-700 border-amber-200 animate-pulse";
    if (state === 'TRANSFER') colorClass = type === 'TCP' ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (state === 'BLOCKED') colorClass = "bg-red-100 text-red-700 border-red-200";
    if (state === 'COMPLETE') colorClass = "bg-green-100 text-green-700 border-green-200";

    return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${colorClass} uppercase tracking-wider`}>
            {state}
        </span>
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
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400",       icon: "text-blue-600 dark:text-blue-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400",     icon: "text-amber-600 dark:text-amber-400" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   border: "border-indigo-200 dark:border-indigo-500/30",   text: "text-indigo-600 dark:text-indigo-400",   icon: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400",         icon: "text-red-600 dark:text-red-400" },
  green:   { bg: "bg-green-50 dark:bg-green-500/10",     border: "border-green-200 dark:border-green-500/30",     text: "text-green-600 dark:text-green-400",     icon: "text-green-600 dark:text-green-400" },
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
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-slate-500">{formula}</span>
        <span className={`text-xl font-bold font-mono ${c.text}`}>{ideal}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}