import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Globe, Server, Activity, AlertTriangle, Play, Pause, RefreshCw, Power,
  Radio, Zap, MapPin, Network, XCircle, BarChart3, BookOpen, ArrowRight,
  CheckCircle2, Info, Eye, Sun, Moon, Shield, Layers, Clock, Database,
  ArrowDown, Lock, Binary
} from "lucide-react";

// ================================================================
//  SIMULATION CONFIG
// ================================================================
const TICK_RATE = 50;
const PACKET_SPEED = 2;
const PACKET_SPAWN_RATE = 0.3;

const POPS = [
  { id: "us-east", name: "US East (NYC)", x: 28, y: 35, color: "#3b82f6" },
  { id: "us-west", name: "US West (SFO)", x: 10, y: 38, color: "#8b5cf6" },
  { id: "eu-cent", name: "Europe (FRA)", x: 55, y: 30, color: "#10b981" },
  { id: "asia-se", name: "Asia (SIN)", x: 80, y: 65, color: "#f59e0b" },
];

const CLIENTS = [
  { id: "c1", name: "User (Boston)", x: 30, y: 28 },
  { id: "c2", name: "User (Seattle)", x: 10, y: 25 },
  { id: "c3", name: "User (London)", x: 48, y: 25 },
  { id: "c4", name: "User (Moscow)", x: 65, y: 20 },
  { id: "c5", name: "User (Tokyo)", x: 88, y: 35 },
  { id: "c6", name: "User (Sydney)", x: 90, y: 85 },
  { id: "c7", name: "User (Brazil)", x: 32, y: 70 },
];

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function AnycastLoadBalancingSimulation() {
  const { theme, setTheme } = useTheme();

  const [pops, setPops] = useState(POPS.map((p) => ({ ...p, status: "UP", latency: 0, requests: 0, totalDist: 0 })));
  const [packets, setPackets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);

  const popsRef = useRef(pops);
  const packetsRef = useRef(packets);
  useEffect(() => { popsRef.current = pops; }, [pops]);
  useEffect(() => { packetsRef.current = packets; }, [packets]);

  const getDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const calculateRoute = (client, currentPops) => {
    let nearest = null;
    let minDist = Infinity;
    currentPops.forEach((pop) => {
      if (pop.status === "UP") {
        const dist = getDistance(client.x, client.y, pop.x, pop.y);
        if (dist < minDist) { minDist = dist; nearest = pop; }
      }
    });
    return { pop: nearest, dist: minDist };
  };

  const addLog = useCallback((type, msg) => {
    setLogs((prev) => [{ type, msg, time: new Date() }, ...prev].slice(0, 20));
  }, []);

  const togglePop = (id) => {
    const target = popsRef.current.find((p) => p.id === id);
    if (!target) return;
    const newStatus = target.status === "UP" ? "DOWN" : "UP";
    addLog(
      newStatus === "DOWN" ? "alert" : "info",
      newStatus === "DOWN"
        ? `BGP Withdrawal: ${target.name} stopped advertising 10.0.0.1`
        : `BGP Announcement: ${target.name} is now advertising 10.0.0.1`
    );
    setPops((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
  };

  const resetStats = () => {
    setPops((prev) => prev.map((p) => ({ ...p, requests: 0, totalDist: 0, status: "UP" })));
    setPackets([]);
    setLogs([]);
    addLog("system", "Simulation Reset");
  };

  // --- Simulation Loop ---
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const currentPops = popsRef.current;
      const currentPackets = packetsRef.current;

      const newPackets = [];
      CLIENTS.forEach((client) => {
        if (Math.random() < PACKET_SPAWN_RATE) {
          const { pop, dist } = calculateRoute(client, currentPops);
          if (pop) {
            newPackets.push({
              id: Math.random().toString(36).substr(2, 9),
              clientId: client.id, targetId: pop.id,
              startX: client.x, startY: client.y,
              currentX: client.x, currentY: client.y,
              targetX: pop.x, targetY: pop.y,
              progress: 0, color: pop.color, status: "inflight", dist,
            });
          }
        }
      });

      const deliveredTo = {};
      const movedPackets = [...currentPackets, ...newPackets].map((pkt) => {
        if (pkt.status !== "inflight") return pkt;
        const activePop = currentPops.find((p) => p.id === pkt.targetId);
        if (!activePop || activePop.status === "DOWN") return { ...pkt, status: "dropped" };
        const nextProgress = pkt.progress + PACKET_SPEED;
        if (nextProgress >= 100) {
          if (!deliveredTo[pkt.targetId]) deliveredTo[pkt.targetId] = { count: 0, dist: 0 };
          deliveredTo[pkt.targetId].count += 1;
          deliveredTo[pkt.targetId].dist += pkt.dist;
          return { ...pkt, progress: 100, status: "delivered" };
        }
        const dx = pkt.targetX - pkt.startX;
        const dy = pkt.targetY - pkt.startY;
        return { ...pkt, progress: nextProgress, currentX: pkt.startX + dx * (nextProgress / 100), currentY: pkt.startY + dy * (nextProgress / 100) };
      });

      const livingPackets = movedPackets.filter((p) => {
        if (p.status === "delivered") return false;
        if (p.status === "dropped") return Math.random() > 0.1;
        return true;
      });

      setPackets(livingPackets);
      if (Object.keys(deliveredTo).length > 0) {
        setPops((prev) => prev.map((p) => deliveredTo[p.id] ? { ...p, requests: p.requests + deliveredTo[p.id].count, totalDist: p.totalDist + deliveredTo[p.id].dist } : p));
      }
    }, TICK_RATE);
    return () => clearInterval(interval);
  }, [isRunning]);

  const routingTable = useMemo(() => {
    if (!selectedClient) return null;
    const client = CLIENTS.find((c) => c.id === selectedClient);
    if (!client) return null;
    return pops.map((pop) => ({
      name: pop.name, status: pop.status,
      dist: Math.round(getDistance(client.x, client.y, pop.x, pop.y) * 10),
      active: calculateRoute(client, pops).pop?.id === pop.id,
    })).sort((a, b) => a.dist - b.dist);
  }, [selectedClient, pops]);

  const totalRequests = pops.reduce((acc, p) => acc + p.requests, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-purple-500/30">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Anycast Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">Global Load Balancing via BGP</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsRunning(!isRunning)} className={`p-2 rounded-lg border transition-all ${isRunning ? "bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400" : "bg-green-100 dark:bg-green-500/10 border-green-300 dark:border-green-500/50 text-green-600 dark:text-green-400"}`}>
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={resetStats} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <RefreshCw size={18} />
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400" title="Toggle Theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION
          ============================================================ */}
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "620px" }}>
          {/* LEFT: PoP Status + Logs */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Server size={14} /> PoP Status (BGP Announce)
              </h3>
              <div className="space-y-3">
                {pops.map((pop) => (
                  <div key={pop.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${pop.status === "UP" ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 opacity-75"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${pop.status === "UP" ? "animate-pulse" : ""}`} style={{ backgroundColor: pop.status === "UP" ? pop.color : "#ef4444" }} />
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{pop.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{pop.status === "UP" ? "Advertising /32" : "Route Withdrawn"}</div>
                      </div>
                    </div>
                    <button onClick={() => togglePop(pop.id)} className={`p-1.5 rounded transition-colors ${pop.status === "UP" ? "hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400" : "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30"}`} title={pop.status === "UP" ? "Simulate Failure" : "Restore Service"}>
                      <Power size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden shadow-sm dark:shadow-none max-h-[230px]">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                <Activity size={14} /> BGP Event Log
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 pr-1">
                {logs.map((log, i) => (
                  <div key={i} className={`border-l-2 pl-2 py-1 ${log.type === "alert" ? "border-red-500 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/10" : log.type === "system" ? "border-blue-500 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10" : "border-blue-500 text-blue-600 dark:text-blue-300"}`}>
                    <span className="opacity-50 mr-2">[{log.time.toLocaleTimeString([], { hour12: false })}]</span>
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: The World Map */}
          <div className="lg:col-span-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-lg dark:shadow-2xl">
            <div className="absolute inset-0 map-grid opacity-10 dark:opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/50 dark:to-slate-900/80 pointer-events-none" />

            <svg className="absolute inset-0 w-full h-full opacity-5 dark:opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M10,20 Q20,10 30,30 T40,60 T30,80 T10,70 Z" fill="currentColor" className="text-slate-500 dark:text-slate-700" />
              <path d="M45,20 Q55,10 65,25 T60,50 T45,40 Z" fill="currentColor" className="text-slate-500 dark:text-slate-700" />
              <path d="M65,20 Q85,10 95,30 T85,70 T70,50 Z" fill="currentColor" className="text-slate-500 dark:text-slate-700" />
            </svg>

            <div className="absolute inset-0">
              {/* Packets */}
              {packets.map((pkt) => (
                <div
                  key={pkt.id}
                  className={`absolute w-1.5 h-1.5 rounded-full transition-opacity duration-300 ${pkt.status === "dropped" ? "bg-red-500 scale-150 animate-ping" : "shadow-[0_0_8px_currentColor]"}`}
                  style={{ left: `${pkt.currentX}%`, top: `${pkt.currentY}%`, backgroundColor: pkt.status === "dropped" ? "#ef4444" : pkt.color, opacity: pkt.status === "dropped" ? 0 : 1 }}
                />
              ))}

              {/* PoP Nodes */}
              {pops.map((pop) => (
                <div key={pop.id} className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 ${pop.status === "UP" ? "scale-100 opacity-100" : "scale-90 opacity-40 grayscale"}`} style={{ left: `${pop.x}%`, top: `${pop.y}%` }}>
                  <div className={`absolute w-32 h-32 rounded-full border border-dashed opacity-10 pointer-events-none ${pop.status === "UP" ? "animate-spin-slow" : "hidden"}`} style={{ borderColor: pop.color }} />
                  <div className="relative">
                    <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 border-2 shadow-lg z-10 relative ${pop.status === "UP" ? "border-current" : "border-slate-300 dark:border-slate-700"}`} style={{ color: pop.color }}>
                      <Network size={20} />
                    </div>
                    <div className="absolute -top-2 -right-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[9px] px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-mono">{pop.requests}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-bold bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-200 dark:border-slate-800">{pop.name}</div>
                </div>
              ))}

              {/* Clients */}
              {CLIENTS.map((client) => (
                <button key={client.id} onClick={() => setSelectedClient(client.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all ${selectedClient === client.id ? "scale-110 z-20" : "scale-100 z-10"}`} style={{ left: `${client.x}%`, top: `${client.y}%` }}>
                  <div className={`w-3 h-3 rounded-full bg-slate-600 dark:bg-slate-200 shadow-[0_0_10px_rgba(100,116,139,0.5)] dark:shadow-[0_0_10px_white] group-hover:scale-150 transition-transform ${selectedClient === client.id ? "ring-4 ring-purple-500/50" : ""}`} />
                  <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800/80 dark:bg-black/50 text-white px-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${selectedClient === client.id ? "opacity-100" : ""}`}>{client.name}</div>
                </button>
              ))}

              {/* Routing Table Overlay */}
              {selectedClient && routingTable && (
                <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-64 z-30">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Routing Table</h4>
                      <div className="text-[10px] text-slate-500">{CLIENTS.find((c) => c.id === selectedClient)?.name}</div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white"><XCircle size={14} /></button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-4 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <span className="col-span-2">Next Hop</span>
                      <span className="text-right">Metric</span>
                      <span className="text-center">Active</span>
                    </div>
                    {routingTable.map((route) => (
                      <div key={route.name} className={`grid grid-cols-4 text-[10px] items-center p-1 rounded ${route.active ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-200 font-bold" : "text-slate-500 dark:text-slate-400"} ${route.status === "DOWN" ? "opacity-40 line-through" : ""}`}>
                        <span className="col-span-2 truncate">{route.name}</span>
                        <span className="text-right font-mono">{route.dist}</span>
                        <div className="flex justify-center">
                          {route.active && <Zap size={10} className="text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[9px] text-slate-500 leading-tight">
                    * Metric = topological distance. BGP selects shortest AS-PATH.
                  </div>
                </div>
              )}
            </div>

            {/* Live Stats */}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-200 dark:border-slate-800 w-48 shadow-lg z-20">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
                <BarChart3 size={12} /> Live Stats
              </h4>
              <div className="space-y-2">
                {pops.map((p) => {
                  const pct = totalRequests > 0 ? ((p.requests / totalRequests) * 100).toFixed(1) : 0;
                  const avgLat = p.requests > 0 ? (p.totalDist / p.requests).toFixed(1) : 0;
                  return (
                    <div key={p.id} className="text-[9px]">
                      <div className="flex justify-between mb-0.5 text-slate-700 dark:text-slate-300">
                        <span>{p.name}</span>
                        <span className="font-mono">{p.requests.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                      </div>
                      <div className="flex justify-between text-slate-500 font-mono text-[8px]">
                        <span>{pct}% Load</span>
                        <span>~{avgLat}ms RTT</span>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                  <span>Total Requests</span>
                  <span className="font-mono text-slate-800 dark:text-white">{totalRequests.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t-2 border-purple-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — Google SRE / Networking
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent mb-4">
              Anycast as a Load Balancing Feature
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              How Google's IT infrastructure uses <strong className="text-slate-900 dark:text-slate-200">IP Anycast</strong> with BGP to provide automatic, distance-aware failover for global services — DNS, LDAP, HTTP proxy, and more — without changing a single DNS record.
            </p>
          </div>

          {/* ---- The Problem ---- */}
          <section className="mb-16">
            <SectionTitle icon={<AlertTriangle className="w-5 h-5" />} title="The Problem — Why Traditional Failover Fails" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                The paper walks through a progression of failure scenarios. Each one exposes a gap in traditional load balancing:
              </p>
              <div className="space-y-4 mb-6">
                <FailureStep num={1} title="Backend failure" desc="The load balancer is healthy, but all backends behind it are down. The LB can redirect to a remote site via proxy — but this adds latency, loses client IP, and requires complex cross-site configuration." status="partial" />
                <FailureStep num={2} title="Load balancer failure" desc="The LB itself is down. Now there's nothing to redirect traffic. DNS-based failover is the fallback, but DNS TTL propagation takes minutes, and you need a distributed monitoring system across hundreds of sites." status="broken" />
                <FailureStep num={3} title="Site-wide failure" desc="Network or power failure at the entire site. DNS is too slow and too centralized. You need something at the routing layer — something that makes traffic automatically flow somewhere else." status="critical" />
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-500/20 p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-purple-700 dark:text-purple-300">The insight:</strong> Instead of bolting failover onto DNS or application-layer proxies, push it down to the <strong>network routing layer</strong> itself. If the route disappears, traffic automatically goes somewhere else — in under 1 second.
                </p>
              </div>
            </div>
          </section>

          {/* ---- What is Anycast ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Globe className="w-5 h-5" />} title="What Is Anycast?" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Anycast is a networking technique where <strong className="text-purple-600 dark:text-purple-300">multiple hosts share the exact same IP address</strong>. When a client connects, the Internet's routing infrastructure (BGP) delivers the packet to the <strong className="text-purple-600 dark:text-purple-300">topologically nearest</strong> host.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <ConceptCard icon={<Radio className="w-6 h-6" />} title="Same IP, Many Sites" desc="Every PoP announces the same /32 route. Routers everywhere see multiple paths and pick the shortest one." color="purple" />
                <ConceptCard icon={<Network className="w-6 h-6" />} title="Routing = Load Balancing" desc="BGP's shortest-AS-path selection naturally distributes traffic to the nearest site. No application-layer coordination needed." color="blue" />
                <ConceptCard icon={<Shield className="w-6 h-6" />} title="Failure = Route Withdrawal" desc="When a site goes down, its BGP session drops. Routers converge and traffic shifts to the next-nearest site automatically." color="emerald" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-green-200 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2">Advantages</div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Sub-second failover (route propagation &lt;1s)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> No DNS TTL delays</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Client connects directly (no proxy overhead)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Distance-aware by design</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Challenges</div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Blind to application health (needs health checks)</li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> TCP sessions break on route changes</li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Route flaps can cause oscillation</li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> Hot spots from popular prefixes</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ---- Architecture ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Layers className="w-5 h-5" />} title="Architecture — Anycast on Load Balancers" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                The key design decision: <strong className="text-purple-600 dark:text-purple-300">Anycast is deployed at the Load Balancer level, not per-service.</strong> This reduces BGP complexity from hundreds of service instances down to a handful of LB pairs.
              </p>
              <div className="grid md:grid-cols-2 gap-5 mb-6">
                <HwCard icon={<Server className="w-6 h-6" />} color="purple" title="Load Balancer (HA Pair)" specs={["ip_vs (IPVS) kernel module", "Direct Routing (DR) mode"]} desc="Each site runs a high-availability pair of LBs using Heartbeat (Linux-HA). They manage VIPs for all services and handle health checking via ldirectord." />
                <HwCard icon={<Network className="w-6 h-6" />} color="blue" title="Quagga BGP Speaker" specs={["Peers with site routers", "/32 route advertisements"]} desc="Quagga runs on each LB, advertising Anycast VIPs via BGP when backends are healthy. Route withdrawal happens within 1 second when backends fail." />
                <HwCard icon={<Activity className="w-6 h-6" />} color="emerald" title="ldirectord Health Checks" specs={["Service-specific probes", "Fallback command trigger"]} desc="ldirectord monitors backends per-VIP. When the last backend fails, it triggers a 'fallback command' that brings the Anycast IP interface down — causing Quagga to withdraw the route." />
                <HwCard icon={<Lock className="w-6 h-6" />} color="amber" title="Network Protection" specs={["ACL-protected /32 subnet", "Controlled route advertisers"]} desc="Routers accept /32 advertisements only from the designated Anycast subnet. ACLs prevent misconfiguration or accidental IP space takeover." />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-blue-200 dark:border-blue-500/20 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-blue-700 dark:text-blue-300">Adding a new service is trivial:</strong> Configure backends in a VIP on an Anycast-enabled LB. The network configuration is already in place. Expanding to new sites follows the same process — Anycast routing handles the rest.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Failure Modes ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Clock className="w-5 h-5" />} title="Failure Modes & Recovery Times" />
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <MetricCard label="Clean BGP Stop" value="<1 sec" sub="Route update propagation" color="emerald" />
              <MetricCard label="Backend Failure" value="~30 sec" sub="Health check + route propagation" color="amber" />
              <MetricCard label="Site-Wide Failure" value="~31 sec" sub="Dead timer (30s) + propagation" color="red" />
            </div>
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="space-y-4">
                <FlowStep num={1} color="emerald" icon={<CheckCircle2 className="w-5 h-5" />} title="Graceful shutdown" desc="Cleanly stopping the BGP peering service causes immediate route withdrawal. Outage: less than 1 second as routes update." />
                <FlowStep num={2} color="amber" icon={<Activity className="w-5 h-5" />} title="All backends down" desc="ldirectord detects backend failures via health checks. Triggers the fallback command to bring down the Anycast IP. Time: health check interval + <1s route propagation." />
                <FlowStep num={3} color="red" icon={<AlertTriangle className="w-5 h-5" />} title="Sudden network/power failure" desc="The BGP 'dead timer' (30 seconds in this deployment) expires. The router considers the peer dead and withdraws the route. Time: dead timer + small propagation delay." />
              </div>
            </div>
          </section>

          {/* ---- Services Using This ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Database className="w-5 h-5" />} title="Services Deployed on Anycast" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {["DNS", "HTTP Proxy", "RADIUS", "Web SSO", "NTP", "LDAP"].map((svc) => (
                <div key={svc} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm dark:shadow-none">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{svc}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{svc === "LDAP" ? "In testing" : "Production"}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ---- Key Benefits Summary ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Zap className="w-5 h-5" />} title="Key Benefits Summary" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <BenefitCard num="1" title="Reduced Complexity" desc="One BGP peering point per site vs. one per service instance. Network configuration doesn't grow with service count." color="purple" />
              <BenefitCard num="2" title="No Proxy Overhead" desc="Clients connect directly to the failover location. No proxy chain means no lost client identity and lower latency." color="blue" />
              <BenefitCard num="3" title="Fewer Routing Changes" desc="The LB aggregates service health into a single VIP. Route changes only happen on site-level failures, not individual backend flaps." color="emerald" />
              <BenefitCard num="4" title="TCP + UDP Support" desc="By having LBs handle application health checks, Anycast works for TCP services too — not just connectionless UDP like DNS." color="amber" />
            </div>
          </section>

          {/* ---- Using the Simulator ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Eye className="w-5 h-5" />} title="Using the Simulator Above" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageCard step="1" title="Watch Traffic Flow" desc="Colored packets stream from users to the nearest PoP. Each PoP's request counter increments in real-time. Traffic naturally distributes geographically." color="purple" />
              <UsageCard step="2" title="Kill a PoP" desc="Click the power icon on any PoP to simulate a BGP withdrawal. Watch traffic reroute to the next-nearest PoP instantly — this is Anycast failover in action." color="red" />
              <UsageCard step="3" title="Click a User" desc="Click any user dot on the map to see their BGP routing table — which PoPs are reachable, their metrics, and which one is the active best path." color="blue" />
              <UsageCard step="4" title="Watch Load Shift" desc="After killing a PoP, the Live Stats panel shows load redistributing. Restore the PoP and watch traffic rebalance as the route is re-advertised." color="emerald" />
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
        .map-grid {
          background-image: radial-gradient(rgba(100,116,139,0.3) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .dark .map-grid {
          background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
        }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}</style>
    </div>
  );
}

// ================================================================
//  EDUCATIONAL SUB-COMPONENTS
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  purple:  { bg: "bg-purple-50 dark:bg-purple-500/10",   border: "border-purple-200 dark:border-purple-500/30",   text: "text-purple-600 dark:text-purple-400" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400" },
  green:   { bg: "bg-green-50 dark:bg-green-500/10",     border: "border-green-200 dark:border-green-500/30",     text: "text-green-600 dark:text-green-400" },
};

function FailureStep({ num, title, desc, status }) {
  const statusColors = { partial: "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-500/10", broken: "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/10", critical: "border-red-600 dark:border-red-600 bg-red-100 dark:bg-red-500/20" };
  const statusLabels = { partial: "Partially handled", broken: "Unhandled", critical: "Complete outage" };
  const statusTextColors = { partial: "text-amber-600 dark:text-amber-400", broken: "text-red-600 dark:text-red-400", critical: "text-red-700 dark:text-red-300" };
  return (
    <div className={`flex items-start gap-4 rounded-xl border-2 p-4 ${statusColors[status]}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${statusColors[status]} ${statusTextColors[status]}`}>{num}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${statusColors[status]} ${statusTextColors[status]}`}>{statusLabels[status]}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ConceptCard({ icon, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.purple;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 ${c.text}`}>{icon}</div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}</h4>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function HwCard({ icon, color, title, specs, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.purple;
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
  const c = COLOR_MAP[color] || COLOR_MAP.purple;
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

function MetricCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.purple;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm dark:shadow-none text-center">
      <div className={`text-xl font-bold font-mono ${c.text}`}>{value}</div>
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{label}</div>
      <div className="text-[10px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function BenefitCard({ num, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.purple;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{num}</div>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function UsageCard({ step, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.purple;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{step}</div>
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
