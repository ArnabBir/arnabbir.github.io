import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Box, Server, Hash, Link as LinkIcon, Activity, Zap, Cpu, ArrowRight,
  ShieldCheck, AlertTriangle, Play, Pause, RefreshCw, PlusCircle, GitBranch,
  Search, X, Info, Clock, Target, Pickaxe, Gauge, Settings, BookOpen, Eye,
  Sun, Moon, CheckCircle2, Lock, Globe, Layers, ArrowDown, Binary, Shield,
  Database
} from "lucide-react";

// ================================================================
//  SIMULATION CONFIG
// ================================================================
const DEFAULT_SPEED = 800;
const BLOCK_REWARD = 50;

const sha256 = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).repeat(16).substring(0, 64);
};

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function BitcoinSimulation() {
  const { theme, setTheme } = useTheme();

  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(DEFAULT_SPEED);
  const [blockchain, setBlockchain] = useState([]);
  const [mempool, setMempool] = useState([]);
  const [nodes, setNodes] = useState([
    { id: "Miner A", hashrate: 15, color: "#f59e0b", status: "MINING", currentNonce: 0, lastHash: "" },
    { id: "Miner B", hashrate: 15, color: "#3b82f6", status: "MINING", currentNonce: 0, lastHash: "" },
    { id: "Miner C", hashrate: 10, color: "#10b981", status: "MINING", currentNonce: 0, lastHash: "" },
    { id: "Miner D", hashrate: 20, color: "#8b5cf6", status: "MINING", currentNonce: 0, lastHash: "" },
  ]);
  const [logs, setLogs] = useState([]);
  const [difficulty, setDifficulty] = useState(3);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockTime, setBlockTime] = useState([]);
  const [propagatingBlock, setPropagatingBlock] = useState(null);

  const chainRef = useRef([]);
  const scrollContainerRef = useRef(null);
  const lastBlockTimeRef = useRef(Date.now());

  useEffect(() => { resetSim(); }, []);
  useEffect(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth; }, [blockchain.length]);

  const resetSim = () => {
    const genesisBlock = {
      height: 0,
      hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      merkleRoot: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
      nonce: 2083236893, miner: "Satoshi",
      txs: [{ id: "coinbase", val: "50 BTC", createdAt: Date.now() }],
      isOrphan: false, timestamp: Date.now(), difficulty: 3,
    };
    const initialChain = [genesisBlock];
    setBlockchain(initialChain); chainRef.current = initialChain;
    setMempool([]); setLogs([]); setBlockTime([]); setIsRunning(false);
    setSelectedBlock(genesisBlock); lastBlockTimeRef.current = Date.now();
    addLog("System", "Genesis Block created. Network Ready.");
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setNodes((currentNodes) => currentNodes.map((node) => {
        const speedFactor = simulationSpeed / 200;
        const luck = Math.random() * 1000;
        const successThreshold = 985 - (node.hashrate * 1.5 * speedFactor) + (difficulty * 2);
        const nextNonce = Math.floor(Math.random() * 0xFFFFFFFF);
        const nextHash = sha256(nextNonce.toString());
        if (luck > successThreshold) mineBlock(node);
        return { ...node, currentNonce: nextNonce, lastHash: nextHash };
      }));
    }, simulationSpeed);
    return () => clearInterval(interval);
  }, [isRunning, difficulty, simulationSpeed]);

  const mineBlock = (miner) => {
    const currentChain = chainRef.current;
    const tip = getLongestChainTip(currentChain);
    const txs = mempool.slice(0, 4);
    const merkleRoot = txs.length === 0 ? sha256("coinbase") : sha256(txs.map((t) => t.id).join(""));
    const now = Date.now();
    const timeSinceLast = (now - lastBlockTimeRef.current) / 1000;
    lastBlockTimeRef.current = now;
    setBlockTime((prev) => [...prev, timeSinceLast].slice(-10));

    const newBlock = {
      height: tip.height + 1, prevHash: tip.hash, merkleRoot,
      nonce: Math.floor(Math.random() * 4000000000), miner: miner.id,
      txs: [{ id: "coinbase", val: "50 BTC", createdAt: now }, ...txs],
      timestamp: now, isOrphan: false, hash: "", difficulty,
    };
    const rawHash = sha256(JSON.stringify(newBlock));
    newBlock.hash = "0".repeat(difficulty) + rawHash.substring(difficulty);

    setPropagatingBlock({ ...newBlock, fromNode: miner.id });
    setTimeout(() => setPropagatingBlock(null), 1000);
    handleBlockPropagation(newBlock);
  };

  const handleBlockPropagation = (newBlock) => {
    const currentChain = chainRef.current;
    const existingBlockAtHeight = currentChain.find((b) => b.height === newBlock.height && !b.isOrphan);
    let updatedChain = [...currentChain, newBlock];

    if (existingBlockAtHeight) {
      addLog("Network", `FORK! ${newBlock.miner} found block #${newBlock.height} simultaneously with ${existingBlockAtHeight.miner}`, "alert");
    } else {
      addLog("Network", `${newBlock.miner} mined Block #${newBlock.height}`, "success");
      const includedIds = new Set(newBlock.txs.map((t) => t.id));
      setMempool((prev) => prev.filter((tx) => !includedIds.has(tx.id)));
    }

    updatedChain = resolveChains(updatedChain);
    chainRef.current = updatedChain;
    setBlockchain(updatedChain);
  };

  const resolveChains = (chain) => {
    const blockMap = {};
    chain.forEach((b) => (blockMap[b.hash] = b));
    const parentHashes = new Set(chain.map((b) => b.prevHash));
    const tips = chain.filter((b) => !parentHashes.has(b.hash));
    tips.sort((a, b) => b.height - a.height);
    const winner = tips[0];
    const mainChain = new Set();
    let curr = winner;
    while (curr) { mainChain.add(curr.hash); curr = blockMap[curr.prevHash]; }
    return chain.map((b) => ({ ...b, isOrphan: !mainChain.has(b.hash) }));
  };

  const getLongestChainTip = (chain) => {
    const validBlocks = chain.filter((b) => !b.isOrphan);
    return validBlocks.reduce((prev, current) => (prev.height > current.height ? prev : current));
  };

  const addTransaction = () => {
    const id = Math.random().toString(36).substr(2, 8);
    const val = (Math.random() * 5).toFixed(2);
    setMempool((prev) => [...prev, { id, val: `${val} BTC`, createdAt: Date.now() }]);
    addLog("Mempool", `New Tx: ${id} broadcasted`);
  };

  const addLog = (source, msg, type = "info") => {
    setLogs((prev) => [{ source, msg, type, time: new Date() }, ...prev].slice(0, 12));
  };

  const renderChain = () => {
    const blocksByHeight = {};
    blockchain.forEach((b) => { if (!blocksByHeight[b.height]) blocksByHeight[b.height] = []; blocksByHeight[b.height].push(b); });
    const maxH = Math.max(...blockchain.map((b) => b.height));
    const cols = [];
    for (let i = 0; i <= maxH; i++) cols.push(blocksByHeight[i] || []);

    return (
      <div className="flex items-center gap-8 min-w-full px-10 py-6">
        {cols.map((levelBlocks, h) => (
          <div key={h} className="relative flex flex-col gap-6">
            {levelBlocks.map((block) => (
              <div key={block.hash} onClick={() => setSelectedBlock(block)} className={`relative w-48 p-3 rounded-lg border-2 transition-all cursor-pointer group ${selectedBlock?.hash === block.hash ? "ring-2 ring-yellow-500 dark:ring-white scale-105 z-10" : "hover:scale-105"} ${block.isOrphan ? "bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-700 opacity-60 grayscale" : "bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-yellow-400/40 dark:border-yellow-500/40 shadow-lg"} ${propagatingBlock?.hash === block.hash ? "animate-pulse ring-2 ring-green-400" : ""}`}>
                {h > 0 && !block.isOrphan && (
                  <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-yellow-400/30 dark:bg-yellow-500/30 -z-10 group-hover:bg-yellow-500 transition-colors" />
                )}
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">BLOCK #{block.height}</span>
                  {block.isOrphan && <span className="text-[8px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-1.5 rounded border border-red-200 dark:border-red-800">ORPHAN</span>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500">Miner</span>
                    <span className="text-blue-600 dark:text-blue-300">{block.miner}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500">Nonce</span>
                    <span className="font-mono text-yellow-600 dark:text-yellow-500">{block.nonce}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-black/30 p-1.5 rounded text-[8px] font-mono text-slate-500 dark:text-slate-400 break-all border border-slate-200 dark:border-slate-800">
                    {block.hash.substring(0, 24)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const avgBlockTime = blockTime.length > 0 ? (blockTime.reduce((a, b) => a + b, 0) / blockTime.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-200 font-sans selection:bg-yellow-500/30">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg shadow-lg shadow-yellow-500/20">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-500 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                Bitcoin Network Simulator
              </h1>
              <p className="text-xs text-slate-500 font-mono">PoW Consensus Engine</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Cpu size={10} /> Hashrate</div>
                <div className="text-lg font-mono text-slate-900 dark:text-white">{(nodes.reduce((a, b) => a + b.hashrate, 0) * 1.5).toFixed(1)} <span className="text-xs text-slate-500">TH/s</span></div>
              </div>
              <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Clock size={10} /> Avg Block</div>
                <div className="text-lg font-mono text-slate-900 dark:text-white">{avgBlockTime} <span className="text-xs text-slate-500">sec</span></div>
              </div>
              <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Target size={10} /> Difficulty</div>
                <div className="text-lg font-mono text-yellow-600 dark:text-yellow-400">{"0".repeat(difficulty)}...</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 px-1">SPEED</span>
              <input type="range" min="100" max="1500" step="100" value={1600 - simulationSpeed} onChange={(e) => setSimulationSpeed(1600 - parseInt(e.target.value))} className="w-20 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-yellow-500" />
              <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-all ${isRunning ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/50" : "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/50"}`}>
                {isRunning ? <><Pause size={12} /> PAUSE</> : <><Play size={12} /> START</>}
              </button>
              <button onClick={resetSim} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400"><RefreshCw size={14} /></button>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400" title="Toggle Theme">
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          SIMULATION
          ============================================================ */}
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: Miners + Mempool */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:max-h-[600px]">
            {/* Miners */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm dark:shadow-none flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><Zap size={12} className="text-yellow-500" /> Active Miners</h3>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[8px] text-slate-500 font-bold">DIFFICULTY:</span>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <div key={d} onClick={() => setDifficulty(d)} className={`w-1.5 h-3 rounded-sm cursor-pointer transition-all ${d <= difficulty ? "bg-yellow-500" : "bg-slate-300 dark:bg-slate-700"}`} title={`Level ${d}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {nodes.map((node) => (
                  <div key={node.id} className={`bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded border flex flex-col gap-2 transition-all duration-300 ${propagatingBlock?.fromNode === node.id ? "border-green-400 dark:border-green-500 shadow-md" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" style={{ color: node.color, backgroundColor: node.color }} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{node.id}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{node.hashrate} TH/s</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-black p-2 rounded font-mono text-[9px] relative overflow-hidden border border-slate-200 dark:border-slate-800/50">
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>Trying Nonce:</span>
                        <span className="text-slate-800 dark:text-white font-bold">{node.currentNonce}</span>
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                      <div className="text-slate-500">Hash Result:</div>
                      <div className={`truncate transition-colors ${propagatingBlock?.fromNode === node.id ? "text-green-600 dark:text-green-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                        {isRunning ? node.lastHash.substring(0, 20) + "..." : "WAITING"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mempool */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm dark:shadow-none max-h-[200px] flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><Activity size={12} /> Mempool ({mempool.length})</h3>
                <button onClick={addTransaction} className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"><PlusCircle size={10} /> Add Tx</button>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-800 p-2 overflow-y-auto custom-scrollbar space-y-1">
                {mempool.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-[10px] italic">No Pending Txs</div>}
                {mempool.map((tx, i) => (
                  <div key={i} className="text-[9px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/50 p-1.5 rounded border border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                    <span>{tx.id}</span>
                    <div className="text-right">
                      <div className="text-green-600 dark:text-green-400">{tx.val}</div>
                      <div className="text-[8px] text-slate-400 dark:text-slate-600">{Math.floor((Date.now() - tx.createdAt) / 1000)}s ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER + RIGHT: Blockchain Ledger, Inspector, Logs */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
            {/* Chain */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 relative shadow-sm dark:shadow-inner flex flex-col overflow-hidden min-h-[280px]">
              <div className="absolute top-4 left-4 z-20 flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_orange]" /><span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Main Chain</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" /><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Orphaned</span></div>
              </div>
              <div ref={scrollContainerRef} className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center">
                {renderChain()}
              </div>
            </div>

            {/* Bottom: Inspector + Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[260px]">
              {/* Inspector */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-sm dark:shadow-none">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase flex items-center gap-2"><Search size={12} /> Block Inspector</h3>
                  {selectedBlock && <span className="text-[9px] font-mono bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-500/30">BLOCK #{selectedBlock.height}</span>}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  {!selectedBlock ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs text-center px-4"><Info size={32} className="mb-2 opacity-50" />Click any block to inspect its headers.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow label="Block Hash" value={selectedBlock.hash} tooltip="Double-SHA256 hash. Must be lower than Target." />
                        <DetailRow label="Previous Hash" value={selectedBlock.prevHash} tooltip="Hash of the parent block. Links the chain." />
                        <DetailRow label="Merkle Root" value={selectedBlock.merkleRoot} tooltip="Root hash of the transaction Merkle tree." />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                            <div className="text-[8px] text-slate-500 uppercase font-bold">Nonce</div>
                            <div className="text-xs font-mono text-yellow-600 dark:text-yellow-400">{selectedBlock.nonce}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                            <div className="text-[8px] text-slate-500 uppercase font-bold">Difficulty</div>
                            <div className="text-xs font-mono text-slate-800 dark:text-white">{selectedBlock.difficulty} <span className="text-[8px] text-slate-500">ZEROS</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-slate-800" />
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between"><span>Transactions</span><span>{selectedBlock.txs.length} TXs</span></div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedBlock.txs.map((tx, i) => (
                            <div key={i} className="flex justify-between items-center text-[9px] font-mono p-1.5 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-800/50">
                              <span className={tx.id === "coinbase" ? "text-yellow-600 dark:text-yellow-500 font-bold" : "text-slate-500 dark:text-slate-400"}>{tx.id.toUpperCase()}</span>
                              <span className="text-slate-800 dark:text-slate-200">{tx.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Logs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 overflow-hidden flex flex-col shadow-sm dark:shadow-none">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Activity size={12} /> Network Log</h3>
                <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1 custom-scrollbar">
                  {logs.map((l, i) => (
                    <div key={i} className={`border-l-2 pl-2 py-0.5 ${l.type === "alert" ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10" : l.type === "success" ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10" : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                      <span className="opacity-50 mr-2">[{l.time.toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" })}]</span> {l.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EDUCATIONAL DEEP-DIVE
          ============================================================ */}
      <div className="border-t-2 border-yellow-500/30 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Deep Dive — Satoshi Nakamoto, 2008
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent mb-4">
              Bitcoin: A Peer-to-Peer Electronic Cash System
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A purely peer-to-peer electronic cash system allowing online payments to be sent directly from one party to another <strong className="text-slate-900 dark:text-slate-200">without going through a financial institution</strong>.
            </p>
          </div>

          {/* ---- The Problem ---- */}
          <section className="mb-16">
            <SectionTitle icon={<AlertTriangle className="w-5 h-5" />} title="The Double-Spending Problem" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Digital signatures let us prove ownership, but they don't prevent someone from <strong className="text-yellow-600 dark:text-yellow-300">spending the same coin twice</strong>. Traditionally, a trusted central authority (a bank or "mint") checks every transaction. Satoshi's insight: replace the trusted third party with a <strong className="text-yellow-600 dark:text-yellow-300">peer-to-peer network and proof-of-work</strong>.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <ProblemCard num="1" title="Trust-Based Commerce" desc="Online payments require financial institutions as intermediaries. Mediation increases costs and makes non-reversible transactions impossible." color="red" />
                <ProblemCard num="2" title="Double-Spend Without Trust" desc="Without a central authority, a payee can't verify that an owner hasn't already spent their coins. Need: a way for everyone to agree on transaction order." color="amber" />
                <ProblemCard num="3" title="The Satoshi Solution" desc="A peer-to-peer distributed timestamp server using proof-of-work to generate computational proof of the chronological order of transactions." color="emerald" />
              </div>
            </div>
          </section>

          {/* ---- Transactions ---- */}
          <section className="mb-16">
            <SectionTitle icon={<ArrowRight className="w-5 h-5" />} title="Transactions — Chain of Digital Signatures" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                An electronic coin is defined as a <strong className="text-yellow-600 dark:text-yellow-300">chain of digital signatures</strong>. Each owner transfers the coin by signing a hash of the previous transaction and the next owner's public key. The payee can verify the chain of ownership.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                <ConceptCard icon={<Hash className="w-6 h-6" />} title="Hashing" desc="SHA-256 creates a unique fingerprint of any data. Changing even one bit produces a completely different hash. This is the foundation of immutability." color="yellow" />
                <ConceptCard icon={<Lock className="w-6 h-6" />} title="Digital Signatures" desc="Each owner signs with their private key. Anyone can verify with the public key. This proves ownership without revealing the private key." color="blue" />
              </div>
            </div>
          </section>

          {/* ---- Proof of Work ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Cpu className="w-5 h-5" />} title="Proof-of-Work — One CPU, One Vote" />
            <div className="space-y-4 mb-6">
              <FlowStep num={1} color="yellow" icon={<Activity className="w-5 h-5" />} title="New transactions are broadcast to all nodes" desc="When someone sends BTC, the transaction is announced to the entire network on a best-effort basis." />
              <FlowStep num={2} color="amber" icon={<Database className="w-5 h-5" />} title="Each node collects transactions into a block" desc="Miners gather pending transactions from the mempool and package them into a candidate block." />
              <FlowStep num={3} color="orange" icon={<Cpu className="w-5 h-5" />} title="Each node works on finding a proof-of-work" desc="Miners increment a nonce until the block's SHA-256 hash starts with the required number of zero bits. The average work is exponential in the zeros required." />
              <FlowStep num={4} color="emerald" icon={<Globe className="w-5 h-5" />} title="Winner broadcasts the block" desc="When a miner finds a valid nonce, they broadcast the block. Other nodes verify it and express acceptance by working on the next block." />
              <FlowStep num={5} color="blue" icon={<GitBranch className="w-5 h-5" />} title="Longest chain wins" desc="If two miners find blocks simultaneously (fork), the tie breaks when the next block is found. The longest chain — with the most cumulative PoW — is the truth." />
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-500/20 p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-yellow-700 dark:text-yellow-300">Key insight:</strong> PoW is essentially <strong>one-CPU-one-vote</strong>. The majority decision is the longest chain. An attacker would need to redo the work of the target block <em>and all blocks after it</em>, then outpace the honest network — probability drops exponentially with each confirmation.
              </p>
            </div>
          </section>

          {/* ---- Incentive ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Zap className="w-5 h-5" />} title="Incentive — Mining Rewards & Game Theory" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <div className="grid md:grid-cols-2 gap-5 mb-6">
                <div className="rounded-xl border-2 border-yellow-200 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-2">Block Reward (Coinbase)</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">The first transaction in every block creates new coins owned by the miner. Started at 50 BTC, halves every 210,000 blocks (~4 years). This is the only way new coins enter circulation.</p>
                  <div className="flex flex-wrap gap-2">
                    {["50→25→12.5→6.25→3.125 BTC"].map((s) => <span key={s} className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400">{s}</span>)}
                  </div>
                </div>
                <div className="rounded-xl border-2 border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Transaction Fees</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">If a transaction's input exceeds its output, the difference is a fee claimed by the miner. As block rewards halve toward zero, fees become the primary incentive — making Bitcoin completely inflation-free.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">input − output = fee</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-emerald-700 dark:text-emerald-300">Game theory:</strong> A greedy attacker with majority CPU power would find it more profitable to <strong>play by the rules</strong> (earning more new coins than everyone else combined) than to undermine the system and destroy the value of their own wealth.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Merkle Trees + SPV ---- */}
          <section className="mb-16">
            <SectionTitle icon={<GitBranch className="w-5 h-5" />} title="Merkle Trees & Simplified Payment Verification" />
            <div className="grid md:grid-cols-2 gap-5">
              <HwCard icon={<Layers className="w-6 h-6" />} color="yellow" title="Merkle Trees" specs={["Binary hash tree", "80-byte block headers"]} desc="Transactions are hashed into a Merkle Tree. Only the root hash is in the block header. Old transactions can be pruned (stubbed branches) without breaking the block hash. Block headers alone: ~4.2 MB/year." />
              <HwCard icon={<Search className="w-6 h-6" />} color="blue" title="SPV (Light Clients)" specs={["No full node needed", "Merkle branch proof"]} desc="A user only needs block headers + a Merkle branch linking their transaction to a block. They can verify the transaction was accepted without downloading the full blockchain. Secure as long as honest nodes control the network." />
            </div>
          </section>

          {/* ---- Privacy ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Shield className="w-5 h-5" />} title="Privacy — New Model" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
                  <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Traditional Model</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Identities → Transactions → Trusted Third Party → Counterparty → Public (limited info)</p>
                </div>
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Bitcoin Model</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Identities (anonymous) → Transactions → Public (everyone sees amounts, but not who)</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">All transactions are public, but privacy is maintained by keeping <strong className="text-slate-900 dark:text-slate-200">public keys anonymous</strong>. A new key pair should be used for each transaction to prevent linking.</p>
            </div>
          </section>

          {/* ---- Attack Probability ---- */}
          <section className="mb-16">
            <SectionTitle icon={<Target className="w-5 h-5" />} title="Security — Attacker Success Probability" />
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                The race between the honest chain and an attacker is a <strong className="text-yellow-600 dark:text-yellow-300">Binomial Random Walk</strong> (analogous to the Gambler's Ruin problem). The probability of catching up drops <strong>exponentially</strong> with each confirmation:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <MetricCard label="q = 10% power" value="5 blocks" sub="to reach P < 0.1%" color="emerald" />
                <MetricCard label="q = 30% power" value="24 blocks" sub="to reach P < 0.1%" color="amber" />
                <MetricCard label="q = 45% power" value="340 blocks" sub="to reach P < 0.1%" color="red" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-blue-200 dark:border-blue-500/20 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-blue-700 dark:text-blue-300">Why 6 confirmations?</strong> With 6 blocks (z=6), even an attacker with 10% of network hash power has only a 0.024% chance of reversing a transaction. This is the standard "safe" threshold used by most Bitcoin clients.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Simulator Guide ---- */}
          <section className="mb-8">
            <SectionTitle icon={<Eye className="w-5 h-5" />} title="Using the Simulator Above" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageCard step="1" title="Start Mining" desc="Press START and watch 4 miners race to find valid nonces. Each miner shows their current hash attempt in real-time. When one succeeds, the block pulses green." color="yellow" />
              <UsageCard step="2" title="Add Transactions" desc="Click 'Add Tx' to broadcast transactions to the mempool. Miners will include them in the next block they mine. Watch them move from mempool → block." color="blue" />
              <UsageCard step="3" title="Watch Forks" desc="If two miners find blocks at the same height, a fork appears. The chain resolves when the next block is found — the losing branch gets marked ORPHAN." color="amber" />
              <UsageCard step="4" title="Adjust Difficulty" desc="Use the difficulty dots to change the number of leading zeros required. Higher = longer to find blocks. Watch average block time change in the header stats." color="emerald" />
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}

// ================================================================
//  SIMULATION SUB-COMPONENTS
// ================================================================

function DetailRow({ label, value, tooltip }) {
  return (
    <div className="group relative">
      <div className="text-[8px] uppercase text-slate-500 font-bold mb-0.5 flex items-center gap-1 cursor-help">{label} <Info size={8} /></div>
      <div className="font-mono text-[9px] bg-slate-50 dark:bg-black/20 p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 truncate" title={value}>{value}</div>
      <div className="absolute bottom-full left-0 mb-1 w-48 bg-slate-800 dark:bg-slate-700 text-white text-[9px] p-2 rounded shadow-xl border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">{tooltip}</div>
    </div>
  );
}

// ================================================================
//  EDUCATIONAL SUB-COMPONENTS
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-yellow-600 dark:text-yellow-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    </div>
  );
}

const COLOR_MAP = {
  yellow:  { bg: "bg-yellow-50 dark:bg-yellow-500/10",   border: "border-yellow-200 dark:border-yellow-500/30",   text: "text-yellow-600 dark:text-yellow-400" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     border: "border-amber-200 dark:border-amber-500/30",     text: "text-amber-600 dark:text-amber-400" },
  orange:  { bg: "bg-orange-50 dark:bg-orange-500/10",   border: "border-orange-200 dark:border-orange-500/30",   text: "text-orange-600 dark:text-orange-400" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       border: "border-blue-200 dark:border-blue-500/30",       text: "text-blue-600 dark:text-blue-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         border: "border-red-200 dark:border-red-500/30",         text: "text-red-600 dark:text-red-400" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-500/10",   border: "border-purple-200 dark:border-purple-500/30",   text: "text-purple-600 dark:text-purple-400" },
};

function ProblemCard({ num, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{num}</div>
      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function ConceptCard({ icon, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;
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

function FlowStep({ num, color, icon, title, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;
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

function HwCard({ icon, color, title, specs, desc }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;
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

function MetricCard({ label, value, sub, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm dark:shadow-none text-center">
      <div className={`text-xl font-bold font-mono ${c.text}`}>{value}</div>
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{label}</div>
      <div className="text-[10px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function UsageCard({ step, title, desc, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 ${c.border} ${c.text}`}>{step}</div>
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
