import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { 
  Search, BookOpen, Database, Activity, Info, BarChart3, 
  Layers, RefreshCw, Play, Pause, FileText, Binary, 
  Zap, ArrowRight, CheckCircle2, AlertTriangle, Cpu, Terminal,
  Settings, Sliders, ChevronDown, ChevronUp, Sigma, Calculator, TrendingUp
} from 'lucide-react';

// ================================================================
//  CONFIG & CONSTANTS
// ================================================================
const INITIAL_DOCS = [
  { id: 1, topic: "Nature", text: "the quick brown fox jumps over the hedge", terms: ["the", "quick", "brown", "fox", "jumps", "over", "the", "hedge"] },
  { id: 2, topic: "Nature", text: "fox jumps over lazy dog", terms: ["fox", "jumps", "over", "lazy", "dog"] },
  { id: 3, topic: "Pets", text: "the lazy dog sleeps", terms: ["the", "lazy", "dog", "sleeps"] },
  { id: 4, topic: "Pets", text: "quick dog catches the fox", terms: ["quick", "dog", "catches", "the", "fox"] },
  { id: 5, topic: "Spam", text: "buy cheap watch cheap watch", terms: ["buy", "cheap", "watch", "cheap", "watch"] },
];

const DEFAULT_PARAMS = {
  k1: 1.2, // Term Frequency Saturation
  b: 0.75  // Length Normalization
};

// ================================================================
//  HELPER: MATH UTILS
// ================================================================
const factorial = (n) => {
  if (n < 0) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

const poissonPMF = (k, lambda) => (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);

// ================================================================
//  SUB-COMPONENT: SATURATION CHART
// ================================================================
const SaturationChart = ({ k1, tf, maxTf = 10 }) => {
  const width = 120;
  const height = 60;
  const padding = 5;
  
  // BM25 TF Component: (tf * (k1 + 1)) / (tf + k1)
  const getY = (x) => {
    const val = (x * (k1 + 1)) / (x + k1);
    return height - (val / (k1 + 1)) * height + padding; 
  };

  const points = [];
  for (let x = 0; x <= maxTf; x += 0.5) {
    points.push(`${(x / maxTf) * width},${getY(x)}`);
  }

  const currentX = (tf / maxTf) * width;
  const currentY = getY(tf);

  return (
    <svg width={width} height={height + 10} className="overflow-visible">
      <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" strokeOpacity="0.3" />
      <line x1="0" y1={0} x2="0" y2={height} stroke="currentColor" strokeOpacity="0.3" />
      <polyline points={points.join(' ')} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500" />
      <circle cx={currentX} cy={currentY} r="3" fill="currentColor" className="text-amber-500" />
      <text x={width} y={height + 10} fontSize="8" fill="currentColor" textAnchor="end" opacity="0.5">TF</text>
      <text x="0" y="-2" fontSize="8" fill="currentColor" opacity="0.5">Weight</text>
    </svg>
  );
};

// ================================================================
//  SUB-COMPONENT: RSJ VISUALIZER
// ================================================================
const RSJVisualizer = () => {
  const [N, setN] = useState(1000);
  const [n, setN_doc] = useState(50);
  const [useDefaults, setUseDefaults] = useState(true);
  const [p, setP] = useState(0.5); // Prob term in Relevant
  const [q, setQ] = useState(0.05); // Prob term in Non-Relevant

  // If using defaults (Zero Knowledge), q approx n/N, p approx 0.5
  useEffect(() => {
    if (useDefaults) {
      setQ(n / N);
      setP(0.5);
    }
  }, [n, N, useDefaults]);

  // RSJ Formula: log( (p * (1-q)) / (q * (1-p)) )
  const rsjWeight = Math.log10( (p * (1 - q)) / (q * (1 - p)) );
  const standardIDF = Math.log10(N / n);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Calculator size={16} className="text-blue-500" /> RSJ Weight Lab
        </h4>
        <button 
          onClick={() => setUseDefaults(!useDefaults)}
          className={`text-xs px-2 py-1 rounded border ${useDefaults ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
        >
          {useDefaults ? "Mode: Zero Knowledge" : "Mode: Relevance Feedback"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
              <span>Collection Size (N)</span> <span>{N}</span>
            </label>
            <input type="range" min="100" max="10000" step="100" value={N} onChange={(e) => setN(Number(e.target.value))} className="w-full accent-slate-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
              <span>Doc Frequency (n)</span> <span>{n}</span>
            </label>
            <input type="range" min="1" max={N} step="1" value={n} onChange={(e) => setN_doc(Number(e.target.value))} className="w-full accent-slate-500" />
          </div>
          
          <div className={`p-4 rounded-lg border transition-all ${useDefaults ? 'opacity-50 grayscale bg-slate-100' : 'bg-white border-blue-200 shadow-sm'}`}>
            <div className="mb-2 flex justify-between text-xs font-bold text-blue-600">
              <span>Relevance Probabilities</span>
              {!useDefaults && <span>Manual Override</span>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase">P(Term|Relevant) = {p.toFixed(3)}</label>
                <input disabled={useDefaults} type="range" min="0.01" max="0.99" step="0.01" value={p} onChange={(e) => setP(Number(e.target.value))} className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">P(Term|Non-Relevant) = {q.toFixed(3)}</label>
                <input disabled={useDefaults} type="range" min="0.001" max="0.99" step="0.001" value={q} onChange={(e) => setQ(Number(e.target.value))} className="w-full accent-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-400 uppercase mb-1">Standard IDF log(N/n)</div>
            <div className="text-2xl font-mono font-bold text-slate-300">{standardIDF.toFixed(4)}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 relative overflow-hidden">
            <div className="text-xs text-blue-500 uppercase mb-1 font-bold">RSJ Weight</div>
            <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">{rsjWeight.toFixed(4)}</div>
            <div className="text-[10px] text-blue-400 mt-1 font-mono break-all">
              log( ({p.toFixed(2)}*{1-q.toFixed(2)}) / ({q.toFixed(2)}*{1-p.toFixed(2)}) )
            </div>
          </div>
          <div className="text-xs text-slate-500 italic leading-relaxed">
            {useDefaults 
              ? "With zero knowledge assumptions (p=0.5, q≈n/N), RSJ converges to standard IDF." 
              : "With relevance feedback, we can boost terms that appear frequently in relevant docs (High p), even if they are common in the collection."}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
//  SUB-COMPONENT: 2-POISSON EXPLORER
// ================================================================
const TwoPoissonExplorer = () => {
  const [lambda1, setLambda1] = useState(5.0); // Elite
  const [lambda2, setLambda2] = useState(0.5); // Non-Elite
  const [pi, setPi] = useState(0.3); // Mixing proportion

  const maxK = 12;
  const data = useMemo(() => {
    return Array.from({ length: maxK }, (_, k) => {
      const pElite = poissonPMF(k, lambda1);
      const pNon = poissonPMF(k, lambda2);
      const pTotal = pi * pElite + (1 - pi) * pNon;
      return { k, pElite, pNon, pTotal };
    });
  }, [lambda1, lambda2, pi]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-500" /> 2-Poisson Mixture Model
        </h4>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
          P(tf) = π·P(tf|Elite) + (1-π)·P(tf|Non-Elite)
        </span>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="md:col-span-4 space-y-5 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-xs font-bold text-blue-600 mb-1 block">Elite Rate (λ1)</label>
            <input type="range" min="1" max="10" step="0.1" value={lambda1} onChange={(e) => setLambda1(Number(e.target.value))} className="w-full accent-blue-500" />
            <div className="text-[10px] text-slate-400 text-right">{lambda1} terms/doc</div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Non-Elite Rate (λ2)</label>
            <input type="range" min="0.1" max="3" step="0.1" value={lambda2} onChange={(e) => setLambda2(Number(e.target.value))} className="w-full accent-slate-500" />
            <div className="text-[10px] text-slate-400 text-right">{lambda2} terms/doc</div>
          </div>
          <div>
            <label className="text-xs font-bold text-amber-600 mb-1 block">Eliteness Proportion (π)</label>
            <input type="range" min="0.05" max="0.95" step="0.05" value={pi} onChange={(e) => setPi(Number(e.target.value))} className="w-full accent-amber-500" />
            <div className="text-[10px] text-slate-400 text-right">{Math.round(pi * 100)}% Elite Docs</div>
          </div>
        </div>

        {/* Chart */}
        <div className="md:col-span-8 h-48 flex items-end justify-between gap-1 px-2 relative">
          {/* Legend */}
          <div className="absolute top-0 right-0 flex gap-3 text-[9px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/30 rounded" /> Elite</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300/50 rounded" /> Non-Elite</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded" /> Observed</span>
          </div>

          {data.map((d) => (
            <div key={d.k} className="flex-1 flex flex-col justify-end h-full group relative">
              {/* Bars */}
              <div className="w-full relative flex items-end h-full">
                {/* Non-Elite Ghost Bar */}
                <div 
                  className="absolute bottom-0 w-full bg-slate-300/30 dark:bg-slate-700/30 rounded-t-sm transition-all duration-300"
                  style={{ height: `${d.pNon * (1-pi) * 200}%` }}
                />
                {/* Elite Ghost Bar */}
                <div 
                  className="absolute bottom-0 w-full bg-blue-500/20 rounded-t-sm transition-all duration-300 transform translate-x-0.5"
                  style={{ height: `${d.pElite * pi * 200}%` }}
                />
                {/* Total Combined Bar (Main) */}
                <div 
                  className="w-full bg-amber-500 hover:bg-amber-400 rounded-t transition-all duration-300 z-10 mx-auto"
                  style={{ height: `${d.pTotal * 200}%`, width: '60%' }}
                />
              </div>
              
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-20">
                TF={d.k}: {(d.pTotal * 100).toFixed(1)}%
              </div>
              
              {/* X-Axis Label */}
              <div className="text-[9px] text-slate-400 text-center mt-1 font-mono border-t border-slate-200 dark:border-slate-800 pt-1 w-full">
                {d.k}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function IDFSymbolicSim() {
  const { theme, setTheme } = useTheme();

  // --- State ---
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [query, setQuery] = useState("fox dog");
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [expandedDocId, setExpandedDocId] = useState(null);

  // --- Derived Statistics ---
  const vocab = useMemo(() => {
    const stats = {};
    documents.forEach(doc => {
      const uniqueTerms = new Set(doc.terms);
      uniqueTerms.forEach(term => {
        if (!stats[term]) stats[term] = { docCount: 0, totalFreq: 0 };
        stats[term].docCount += 1;
      });
      doc.terms.forEach(term => {
        stats[term].totalFreq += 1;
      });
    });
    return stats;
  }, [documents]);

  const avgDocLength = useMemo(() => {
    if (documents.length === 0) return 1;
    const total = documents.reduce((acc, d) => acc + d.terms.length, 0);
    return total / documents.length;
  }, [documents]);

  const getIDF = useCallback((term) => {
    const N = documents.length;
    const n = vocab[term]?.docCount || 0;
    const val = Math.log10((N - n + 0.5) / (n + 0.5));
    return Math.max(0.01, val); 
  }, [documents.length, vocab]);

  const rankedResults = useMemo(() => {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    return documents.map(doc => {
      let totalScore = 0;
      const termDetails = [];
      const dl = doc.terms.length;

      queryTerms.forEach(qt => {
        const idf = getIDF(qt);
        const tf = doc.terms.filter(t => t === qt).length;
        const K = params.k1 * ((1 - params.b) + params.b * (dl / avgDocLength));
        const saturation = (tf * (params.k1 + 1)) / (tf + K);
        const termScore = idf * saturation;
        
        termDetails.push({ 
          term: qt, tf, idf, saturation, termScore, K 
        });
        
        totalScore += termScore;
      });

      return { ...doc, score: totalScore, termDetails, dl };
    }).sort((a, b) => b.score - a.score);
  }, [documents, query, vocab, avgDocLength, getIDF, params]);

  // --- Actions ---
  const addDocument = (type) => {
    const newId = documents.length + 1;
    let newDoc = { id: newId, topic: "Custom", text: "", terms: [] };
    
    if (type === "spam") {
      newDoc.text = "spam spam spam spam buy now";
      newDoc.terms = ["spam", "spam", "spam", "spam", "buy", "now"];
    } else if (type === "fox") {
      newDoc.text = "the fox is quick and the fox is smart";
      newDoc.terms = ["the", "fox", "is", "quick", "and", "the", "fox", "is", "smart"];
    } else {
      newDoc.text = "new document about generic things";
      newDoc.terms = ["new", "document", "about", "generic", "things"];
    }
    setDocuments([...documents, newDoc]);
  };

  const resetSim = () => {
    setDocuments(INITIAL_DOCS);
    setParams(DEFAULT_PARAMS);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* HEADER */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Robertson's IDF Lab
              </h1>
              <p className="text-xs text-slate-500 font-mono italic">Probabilistic IR & BM25 Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">N (Docs)</span>
                  <span className="text-sm font-mono font-bold">{documents.length}</span>
               </div>
               <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
               <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Avg DL</span>
                  <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{avgDocLength.toFixed(1)}</span>
               </div>
            </div>

            <div className="flex gap-2">
              <button onClick={resetSim} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors">
                <RefreshCw size={14} /> RESET
              </button>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                {theme === 'dark' ? <Zap size={18} className="text-yellow-400" /> : <Zap size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* WORKBENCH AREA */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Parameters */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <Search size={14} /> Search Query
            </h3>
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Sliders size={14} /> BM25 Parameters
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">k1 (Saturation)</label>
                  <span className="text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{params.k1.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="3" step="0.1"
                  value={params.k1}
                  onChange={(e) => setParams({...params, k1: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  Controls how quickly term frequency saturates.
                </p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">b (Length Norm)</label>
                  <span className="text-xs font-mono text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">{params.b.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={params.b}
                  onChange={(e) => setParams({...params, b: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  Controls how much we penalize long documents.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
              <Database size={14} /> Add Documents
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addDocument("fox")} className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                + Fox Doc
              </button>
              <button onClick={() => addDocument("spam")} className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                + Spam Doc
              </button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Ranking Engine */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" /> Global Term Weights (RSJ IDF)
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">RSJ = log( (N - n + 0.5)/(n + 0.5) )</span>
             </div>
             
             <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {query.toLowerCase().split(/\s+/).filter(t=>t).map((term, i) => {
                  const idf = getIDF(term);
                  const n = vocab[term]?.docCount || 0;
                  const maxPossible = Math.log10(documents.length);
                  const percent = Math.min(100, (idf / (maxPossible || 1)) * 100);

                  return (
                    <div key={i} className="flex-shrink-0 w-24 flex flex-col items-center group">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-24 relative flex items-end justify-center overflow-hidden">
                        <div 
                          className="w-full bg-blue-500/80 group-hover:bg-blue-500 transition-all duration-500"
                          style={{ height: `${percent}%` }}
                        />
                        <span className="absolute bottom-1 text-[10px] font-bold text-white shadow-sm">{idf.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-b-lg p-2 text-center">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{term}</div>
                        <div className="text-[9px] text-slate-500">n = {n}</div>
                      </div>
                    </div>
                  )
                })}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase px-1">Ranked Results</h3>
             
             {rankedResults.map((doc, idx) => {
               const isExpanded = expandedDocId === doc.id;
               
               return (
                 <div 
                   key={doc.id}
                   className={`
                     bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all duration-300
                     ${isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}
                   `}
                 >
                   <div 
                      className="p-4 flex items-start gap-4 cursor-pointer"
                      onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                   >
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {idx + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">DOC {doc.id}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">{doc.topic}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{doc.score.toFixed(3)}</span>
                           </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-2">
                           {doc.text}
                        </p>
                        
                        {!isExpanded && (
                          <div className="flex gap-2 mt-2">
                            {doc.termDetails.map((td, i) => (
                               <div key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 flex items-center gap-1">
                                  <span className={td.tf > 0 ? "font-bold text-blue-500" : ""}>{td.term}</span>
                                  <span>×{td.tf}</span>
                               </div>
                            ))}
                            <div className="ml-auto text-[9px] text-slate-400 flex items-center gap-1">
                               <span>Inspect Math</span> <ChevronDown size={10} />
                            </div>
                          </div>
                        )}
                      </div>
                   </div>

                   {isExpanded && (
                     <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 animate-in slide-in-from-top-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                           <Sigma size={12} /> Score Contribution Breakdown
                        </h4>
                        
                        <div className="space-y-6">
                           {doc.termDetails.filter(t => t.tf > 0).map((td, i) => (
                             <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-2">
                                   <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{td.term}</div>
                                   <div className="text-[10px] text-slate-500 font-mono">TF: {td.tf}</div>
                                </div>

                                <div className="md:col-span-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-sm">
                                   
                                   <div className="flex flex-col items-center min-w-[60px]">
                                      <span className="text-[10px] uppercase text-slate-400 font-bold">Global</span>
                                      <div className="h-8 w-1 bg-blue-500 rounded-full my-1 relative group">
                                         <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                            RSJ Weight
                                         </div>
                                      </div>
                                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{td.idf.toFixed(2)}</span>
                                   </div>

                                   <div className="text-slate-300">×</div>

                                   <div className="flex items-center gap-4 flex-1">
                                      <div className="flex flex-col items-center min-w-[60px]">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold">Local</span>
                                        <div className="text-[9px] text-slate-400">TF Saturation</div>
                                        <span className="font-mono text-sm font-bold text-amber-500">{td.saturation.toFixed(2)}</span>
                                      </div>
                                      
                                      <div className="flex-1 h-16 border-l border-slate-200 dark:border-slate-700 pl-4 flex items-center">
                                         <SaturationChart k1={params.k1} tf={td.tf} />
                                      </div>
                                   </div>

                                   <div className="text-slate-300">=</div>

                                   <div className="flex flex-col items-center min-w-[60px] bg-slate-100 dark:bg-slate-800 rounded p-2">
                                      <span className="text-[10px] uppercase text-slate-400 font-bold">Score</span>
                                      <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{td.termScore.toFixed(2)}</span>
                                   </div>

                                </div>
                             </div>
                           ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
                           Doc Length (dl): {doc.dl} | Avg DL: {avgDocLength.toFixed(1)} | Length Penalty Factor (K): {
                             (params.k1 * ((1 - params.b) + params.b * (doc.dl / avgDocLength))).toFixed(2)
                           }
                        </div>
                     </div>
                   )}
                 </div>
               )
             })}
          </div>
        </div>
      </main>

      {/* EDUCATIONAL DEEP DIVE */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 relative">
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
          
          <div className="text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase mb-4">
                <BookOpen size={14} /> Deep Dive Analysis
             </div>
             <SectionTitle icon={<Activity className="text-blue-500" />} title="From Heuristic to Probability" />
             <p className="text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mt-6 leading-relaxed text-lg">
                For years, IDF was considered a "heuristic hack"—something that worked in practice but lacked theory. 
                Stephen Robertson's 2004 paper dismantles this view, proving that IDF is a direct consequence of a 
                rigorous <strong>Probabilistic Model</strong> of retrieval.
             </p>
          </div>

          {/* 1. The Core Problem */}
          <section className="grid md:grid-cols-2 gap-12 items-center">
             <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Why Shannon's Entropy Failed</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                   Many researchers tried to explain IDF using Shannon's Information Theory (-log p). 
                   Robertson argues this is mathematically flawed because of the <strong>Event Space Problem</strong>.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                   <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" /> The Event Space Mismatch
                   </h4>
                   <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex gap-3">
                         <span className="font-mono text-red-500 font-bold">A</span>
                         <span>If the event is "picking a document", probabilities sum to 1. But terms aren't mutually exclusive (a doc can have multiple terms).</span>
                      </li>
                      <li className="flex gap-3">
                         <span className="font-mono text-red-500 font-bold">B</span>
                         <span>If the event is "picking a word token", the probability depends on document length, which breaks the document-level independence assumption.</span>
                      </li>
                   </ul>
                </div>
             </div>
             <div className="grid gap-4">
                <HwCard 
                   icon={<Layers />} 
                   title="Document Space" 
                   specs={["N items", "Binary Vector"]}
                   desc="The correct space for retrieval. We select documents, not words. Probability must be defined over the set of documents."
                />
                <HwCard 
                   icon={<Cpu />} 
                   title="Term Space" 
                   specs={["Stream of tokens", "Zipfian"]}
                   desc="The space used by Language Models. Useful for TF, but confusing when applied to global IDF without care."
                />
             </div>
          </section>

          {/* 2. The Solution: RSJ Weight */}
          <section className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                   <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">The Robertson-Spärck Jones (RSJ) Derivation</h3>
                   <p className="text-slate-600 dark:text-slate-400">
                      Instead of entropy, Robertson starts with the <strong>Probability Ranking Principle</strong>: rank by P(R|D).
                      This leads to the log-odds formula for term weights.
                   </p>
                </div>
                
                {/* INTERACTIVE RSJ SIMULATION */}
                <RSJVisualizer />
                
             </div>
          </section>

          {/* 3. The 2-Poisson Model & Eliteness */}
          <section>
             <SectionTitle icon={<Zap className="text-amber-500" />} title="The 2-Poisson Model & Eliteness" />
             <div className="grid md:grid-cols-2 gap-12 mt-12">
                <div className="order-2 md:order-1">
                   <HwCard 
                      icon={<Info />} 
                      title="The Hidden Variable: Eliteness" 
                      specs={["Binary State", "Hidden"]}
                      desc="A document is either 'about' a concept (Elite) or not. We cannot see Eliteness directly; we only see Term Frequency (TF)."
                      color="indigo"
                   />
                   <div className="mt-6 space-y-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                         Robertson uses the <strong>2-Poisson Model</strong> to explain TF. 
                         If a doc is Elite, terms appear with rate λ1. If not, rate λ2 (where λ1 ≫ λ2).
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                         BM25's saturation curve (visualized in the simulation above) is an <strong>approximation</strong> of this probabilistic mixture. 
                         It prevents the score from growing linearly with TF, reflecting the diminishing returns of "more evidence for Eliteness."
                      </p>
                   </div>
                </div>
                <div className="order-1 md:order-2">
                   {/* INTERACTIVE 2-POISSON SIMULATION */}
                   <TwoPoissonExplorer />
                </div>
             </div>
          </section>

          {/* 4. Metrics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              label="RSJ Weight" 
              formula="log(p(1-q) / q(1-p))" 
              ideal="Probabilistic" 
              desc="The theoretically grounded version of IDF derived from the Probability Ranking Principle."
              color="blue"
            />
            <MetricCard 
              label="Shannon Entropy" 
              formula="- Σ p log p" 
              ideal="Coding Theory" 
              desc="Great for compression, but flawed for retrieval due to the 'Pointwise Information' fallacy."
              color="amber"
            />
            <MetricCard 
              label="TF Saturation" 
              formula="k1 / (k1 + tf)" 
              ideal="Asymptotic" 
              desc="Reflects the probability of Eliteness saturating as we see more term occurrences."
              color="indigo"
            />
            <MetricCard 
              label="Eliteness" 
              formula="Hidden Variable E" 
              ideal="Binary" 
              desc="The bridge between the term-space (TF) and the document-space (Relevance)."
              color="emerald"
            />
          </div>

          {/* 5. User Guide */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <UsageCard num="?" /> Workbench Guide
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageItem num="1" title="Tune Parameters" desc="Adjust k1 to see how TF saturation changes. Higher k1 makes the curve more linear (like raw TF)." />
              <UsageItem num="2" title="Add Spam" desc="Add spam documents to see how 'buy' and 'cheap' lose their IDF value as they become common." />
              <UsageItem num="3" title="Inspect Results" desc="Click on any result card to open the Math Visualizer and see exactly how the score is calculated." />
              <UsageItem num="4" title="Check Saturation" desc="In the inspector, look at the curve. Note how the first occurrence of a term is worth much more than the tenth." />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}

// ================================================================
//  STANDARD LIBRARY COMPONENTS
// ================================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="p-2 bg-blue-500/10 rounded-lg">{icon}</div>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function HwCard({ icon, title, specs, desc, color = "blue" }) {
  const colors = {
    blue: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600",
    amber: "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 text-amber-600",
    indigo: "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600",
  };
  
  return (
    <div className={`p-6 rounded-2xl border transition-transform hover:scale-[1.02] ${colors[color]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {specs.map(s => <span key={s} className="text-[10px] font-mono px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded border border-current opacity-70">{s}</span>)}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FlowStep({ num, icon, title, desc, color = "blue" }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center font-bold text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all`}>
          {num}
        </div>
        <div className="flex-1 w-px bg-slate-200 dark:bg-slate-800 my-2" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
          {icon}
          <h4 className="font-bold">{title}</h4>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, formula, ideal, desc, color = "blue" }) {
  const colorMap = {
    blue: "text-blue-600 border-blue-200",
    amber: "text-amber-600 border-amber-200",
    indigo: "text-indigo-600 border-indigo-200",
    emerald: "text-emerald-600 border-emerald-200",
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className={`text-[10px] font-bold uppercase mb-2 ${colorMap[color]}`}>{label}</div>
      <div className="font-mono text-xs font-bold mb-3 bg-slate-50 dark:bg-slate-950 p-2 rounded">{formula}</div>
      <div className="text-[9px] text-slate-500 mb-1">Ideal: {ideal}</div>
      <p className="text-[11px] text-slate-400 leading-snug">{desc}</p>
    </div>
  );
}

function UsageItem({ num, title, desc }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{num}</span>
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{title}</h4>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-7">{desc}</p>
    </div>
  );
}

function UsageCard({ num }) {
  return <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-[10px] font-bold">{num}</span>;
}