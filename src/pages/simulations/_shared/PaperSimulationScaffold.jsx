'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Play, Pause, StepForward, RotateCcw, Sun, Moon,
  ArrowRight, BookOpen, Activity, Info, AlertTriangle,
  CheckCircle2, Server, Database, Globe, Lock, ShieldCheck,
  Clock, Cpu, HardDrive, Layers, Zap, Search, Monitor,
  Terminal, Binary, GitBranch, Code, Users, ArrowDown,
  Link as LinkIcon, FileText
} from "lucide-react";

/**
 * PaperSimulationScaffold
 * ------------------------------------------------------------
 * A reusable, polished simulation + deep-dive layout for system
 * design papers. Intended for Next.js + Tailwind + next-themes.
 *
 * Usage:
 *   <PaperSimulationScaffold config={CONFIG} />
 */
const ACCENTS = {
  indigo: {
    selection: "selection:bg-indigo-500/30",
    iconBg: "bg-indigo-600",
    gradientTitle: "from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400",
    chip: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    panel: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-200/80",
    softBorder: "border-indigo-500/30",
  },
  cyan: {
    selection: "selection:bg-cyan-500/30",
    iconBg: "bg-cyan-600",
    gradientTitle: "from-cyan-600 to-blue-500 dark:from-cyan-400 dark:to-blue-400",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200/80",
    panel: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-500/20 text-cyan-900 dark:text-cyan-200/80",
    softBorder: "border-cyan-500/30",
  },
  emerald: {
    selection: "selection:bg-emerald-500/30",
    iconBg: "bg-emerald-600",
    gradientTitle: "from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-green-400",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200/80",
    panel: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-200/80",
    softBorder: "border-emerald-500/30",
  },
  amber: {
    selection: "selection:bg-amber-500/30",
    iconBg: "bg-amber-600",
    gradientTitle: "from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-400",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200/80",
    panel: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200/80",
    softBorder: "border-amber-500/30",
  },
  rose: {
    selection: "selection:bg-rose-500/30",
    iconBg: "bg-rose-600",
    gradientTitle: "from-rose-600 to-pink-500 dark:from-rose-400 dark:to-pink-400",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200/80",
    panel: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-200/80",
    softBorder: "border-rose-500/30",
  },
  violet: {
    selection: "selection:bg-violet-500/30",
    iconBg: "bg-violet-600",
    gradientTitle: "from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-200/80",
    panel: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-500/20 text-violet-900 dark:text-violet-200/80",
    softBorder: "border-violet-500/30",
  },
  slate: {
    selection: "selection:bg-slate-500/30",
    iconBg: "bg-slate-800",
    gradientTitle: "from-slate-800 to-slate-500 dark:from-slate-200 dark:to-slate-400",
    chip: "border-slate-500/30 bg-slate-500/10 text-slate-800 dark:text-slate-200/80",
    panel: "bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200/80",
    softBorder: "border-slate-500/30",
  },
};

const ICONS = {
  Play, Pause, StepForward, RotateCcw, Sun, Moon,
  ArrowRight, BookOpen, Activity, Info, AlertTriangle,
  CheckCircle2, Server, Database, Globe, Lock, ShieldCheck,
  Clock, Cpu, HardDrive, Layers, Zap, Search, Monitor,
  Terminal, Binary, GitBranch, Code, Users, ArrowDown,
  Link: LinkIcon, FileText
};

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Icon({ name, className }) {
  const Cmp = ICONS[name] || Info;
  return <Cmp className={className} />;
}

function Pill({ children, tone = "default" }) {
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border";
  const tones = {
    default: "border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200",
    soft: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200",
  };
  return <span className={classNames(base, tones[tone] || tones.default)}>{children}</span>;
}

function NodeCard({ node, active, accent }) {
  return (
    <div
      className={classNames(
        "w-[210px] rounded-xl border p-3 transition-all",
        active
          ? classNames("bg-white dark:bg-slate-900 shadow-sm", accent.softBorder)
          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={classNames("p-2 rounded-lg", active ? accent.iconBg : "bg-slate-200 dark:bg-slate-800")}>
          <Icon name={node.icon} className={classNames("w-5 h-5", active ? "text-white" : "text-slate-600 dark:text-slate-300")} />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{node.label}</div>
          {node.hint ? (
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug mt-0.5">{node.hint}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, accent }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={classNames("p-2 rounded-lg", accent.iconBg)}>
        <Icon name={icon} className="w-4 h-4 text-white" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
  );
}

export default function PaperSimulationScaffold({ config }) {
  const { theme, setTheme } = useTheme();
  const accent = ACCENTS[config?.accent] || ACCENTS.indigo;

  const steps = config?.steps || [];
  const nodes = config?.diagram?.nodes || [];
  const flow = config?.diagram?.flow || nodes.map((n) => n.id);

  const [stepIdx, setStepIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const currentStep = steps[stepIdx] || null;
  const activeSet = useMemo(() => new Set(currentStep?.active || []), [currentStep]);

  // Reset when config changes
  useEffect(() => {
    setStepIdx(0);
    setIsRunning(false);
    setLogs([]);
  }, [config?.id]);

  // Autoplay loop
  useEffect(() => {
    if (!isRunning || steps.length === 0) return;
    const interval = setInterval(() => {
      setStepIdx((i) => (i + 1) % steps.length);
    }, config?.autoPlayMs || 1400);
    return () => clearInterval(interval);
  }, [isRunning, steps.length, config?.autoPlayMs]);

  // Log step transitions
  useEffect(() => {
    if (!currentStep) return;
    const msg = currentStep.log || currentStep.title;
    setLogs((prev) => [{ time: new Date(), msg }, ...prev].slice(0, 40));
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setIsRunning(false);
    setStepIdx(0);
    setLogs([]);
  };

  const stepForward = () => {
    setIsRunning(false);
    if (steps.length === 0) return;
    setStepIdx((i) => (i + 1) % steps.length);
  };

  const heroIcon = config?.heroIcon || "BookOpen";
  const abstract = config?.abstract || "";
  const abstractShort = abstract.length > 450 ? abstract.slice(0, 450).trim() + "…" : abstract;

  return (
    <div className={classNames("min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans", accent.selection)}>
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={classNames("p-2 rounded-lg shadow-lg", accent.iconBg)}>
              <Icon name={heroIcon} className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className={classNames("text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent truncate", accent.gradientTitle)}>
                {config?.title || "Paper Simulation"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {config?.subtitle || config?.badge || "Interactive demo + deep dive"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setIsRunning((v) => !v)}
              className={classNames(
                "flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all",
                isRunning
                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30"
                  : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
              )}
              title={isRunning ? "Pause" : "Play"}
            >
              {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Play</>}
            </button>

            <button
              onClick={stepForward}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-950 transition-colors text-sm font-semibold"
              title="Step"
            >
              <StepForward size={16} /> Step
            </button>

            <button
              onClick={reset}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          BODY
          ============================================================ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Steps */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <Pill>
                  <Icon name="Activity" className="w-4 h-4" />
                  Simulation Steps
                </Pill>
                {config?.badge ? (
                  <span className={classNames("text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border", accent.chip)}>
                    {config.badge}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                {steps.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setIsRunning(false); setStepIdx(idx); }}
                    className={classNames(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      idx === stepIdx
                        ? classNames("bg-slate-50 dark:bg-slate-950", accent.softBorder)
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        <span className="text-slate-400 dark:text-slate-600 mr-2 font-mono">{String(idx + 1).padStart(2, "0")}.</span>
                        {s.title}
                      </div>
                      {idx === stepIdx ? (
                        <span className="text-[10px] font-mono text-slate-500">ACTIVE</span>
                      ) : null}
                    </div>
                    {s.description ? <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">{s.description}</div> : null}
                    {s.message ? (
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {s.message.from} <ArrowRight className="inline w-3 h-3 mx-1" /> {s.message.to}
                        </span>
                        {s.message.label ? <span className="opacity-80">{s.message.label}</span> : null}
                      </div>
                    ) : null}
                  </button>
                ))}
                {steps.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400 italic">No steps configured.</div>
                ) : null}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden">
              <Pill><Icon name="Terminal" className="w-4 h-4" /> Event Log</Pill>
              <div className="mt-3 max-h-[240px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {logs.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400 italic">No events yet.</div>
                ) : null}
                {logs.map((l, i) => (
                  <div key={i} className="text-[11px] font-mono border-l-2 border-slate-300 dark:border-slate-700 pl-2">
                    <div className="opacity-60 text-[9px]">
                      [{l.time?.toLocaleTimeString([], { hour12: false })}]
                    </div>
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Diagram + Explanation */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Pill><Icon name="Layers" className="w-4 h-4" /> System Diagram</Pill>
                <Pill tone="soft">
                  <span className="font-mono text-[10px]">Step</span>
                  <span className="font-mono text-xs font-bold">{steps.length ? `${stepIdx + 1}/${steps.length}` : "—"}</span>
                </Pill>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {flow.map((id, i) => {
                  const node = nodes.find((n) => n.id === id) || nodes[i];
                  if (!node) return null;
                  return (
                    <React.Fragment key={id}>
                      <NodeCard node={node} active={activeSet.has(node.id)} accent={accent} />
                      {i < flow.length - 1 ? (
                        <div className="hidden sm:flex items-center opacity-60">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>

              {currentStep ? (
                <div className={classNames("mt-5 rounded-xl border p-4", accent.panel)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-widest font-bold opacity-80">Now happening</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{currentStep.title}</div>
                      {currentStep.description ? (
                        <div className="text-sm text-slate-700 dark:text-slate-200/80 mt-2 leading-relaxed">{currentStep.description}</div>
                      ) : null}
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-2">
                      <Pill tone="default">
                        <Icon name="CheckCircle2" className="w-4 h-4" />
                        Active nodes: {currentStep.active?.length || 0}
                      </Pill>
                    </div>
                  </div>

                  {currentStep.active?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentStep.active.map((nid) => {
                        const n = nodes.find((x) => x.id === nid);
                        return (
                          <span key={nid} className="px-2 py-1 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950/30">
                            {n?.label || nid}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Deep Dive */}
            <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-center mb-8">
                <div className={classNames("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-widest mb-4", accent.chip)}>
                  <BookOpen className="w-3.5 h-3.5" /> Deep Dive
                </div>
                <h2 className={classNames("text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent", accent.gradientTitle)}>
                  Technical Breakdown
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mt-3">
                  {abstractShort || "A structured explanation mapped to the interactive steps above."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {(config?.deepDive?.sections || []).map((sec, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <SectionTitle icon={sec.icon || "Info"} title={sec.title} accent={accent} />
                    <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {(sec.bullets || []).map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {(config?.deepDive?.glossary || []).length ? (
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <SectionTitle icon="FileText" title="Glossary" accent={accent} />
                  <div className="grid md:grid-cols-2 gap-4">
                    {config.deepDive.glossary.map((g, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{g.term}</div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{g.def}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <footer className="py-10 text-center text-xs text-slate-500 dark:text-slate-600">
        Built with <span className="font-mono">next-themes</span>, <span className="font-mono">lucide-react</span>, and Tailwind utility classes.
      </footer>
    </div>
  );
}
