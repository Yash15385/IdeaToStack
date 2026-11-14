/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Sparkles, SlidersHorizontal, DollarSign, Activity, CheckCircle2, RotateCcw } from 'lucide-react';
import { StackBlueprint, StackConstraints } from '../utils/stackEngine';

interface PromptRailProps {
  blueprint: StackBlueprint;
  onSynthesize: (prompt: string, constraints: StackConstraints) => void;
  isSynthesizing: boolean;
  onReset: () => void;
}

const PRESET_IDEAS = [
  {
    label: 'Realtime Collaborative Canvas (CRDT + Redis)',
    prompt: 'Real-time collaborative whiteboard app with multi-cursor sync, CRDT conflict resolution, pgvector diagram search, and Redis pub/sub fanout.',
  },
  {
    label: 'AI Agent RAG Pipeline (Qdrant + Celery)',
    prompt: 'Autonomous AI research agent with streaming token response, Qdrant vector memory, Celery background document chunking, and Gemini integration.',
  },
  {
    label: 'High-Throughput Fintech SaaS (Postgres RLS + Temporal)',
    prompt: 'Modern multi-tenant fintech SaaS with row-level security isolation, Stripe idempotent billing, and Temporal.io durable execution workflows.',
  },
  {
    label: 'Edge-First Global E-Commerce (Cloudflare + D1)',
    prompt: 'Global edge-first e-commerce checkout with sub-10ms edge SSR, distributed inventory replication, and asynchronous fraud detection.',
  },
];

export const PromptRail: React.FC<PromptRailProps> = ({
  blueprint,
  onSynthesize,
  isSynthesizing,
  onReset,
}) => {
  const [promptText, setPromptText] = useState(blueprint.ideaPrompt);
  const [constraints, setConstraints] = useState<StackConstraints>(blueprint.constraints);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync internal state when blueprint changes externally
  React.useEffect(() => {
    setPromptText(blueprint.ideaPrompt);
    setConstraints(blueprint.constraints);
  }, [blueprint.ideaPrompt, blueprint.constraints]);

  const activePresetIndex = PRESET_IDEAS.findIndex(
    (p) => p.prompt.trim().toLowerCase() === blueprint.ideaPrompt.trim().toLowerCase()
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;
    onSynthesize(promptText, constraints);
    setIsMobileOpen(false);
  };

  const handleSelectPreset = (presetPrompt: string) => {
    setPromptText(presetPrompt);
    onSynthesize(presetPrompt, constraints);
    setIsMobileOpen(false);
  };

  return (
    <aside className="w-full lg:w-[380px] shrink-0 border-r border-zinc-800/80 bg-[#090d16]/80 flex flex-col lg:h-[calc(100vh-4rem)]">
      {/* Rail Header / Mobile Collapsible Trigger */}
      <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center gap-2 text-left"
        >
          <span className="font-mono text-sm text-indigo-400 font-bold">&gt;_</span>
          <span className="font-semibold text-xs tracking-tight text-zinc-100 uppercase font-['Geist']">
            Architecture Synthesizer
          </span>
          <span className="lg:hidden text-[11px] text-indigo-400 font-mono ml-1">
            [{isMobileOpen ? 'Hide Panel' : 'Show Panel'}]
          </span>
        </button>
        <button
          onClick={onReset}
          title="Reset blueprint to baseline"
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className={`p-4 space-y-5 flex-1 overflow-y-auto ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
        {/* CLI Prompt Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="idea-prompt-input" className="block text-xs font-medium text-zinc-300">
            Natural Language Project Idea
          </label>
          <div className="relative rounded-lg bg-[#060a12] border border-zinc-800/90 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <div className="absolute top-3 left-3 text-indigo-400 font-mono text-sm select-none pointer-events-none">
              &gt;
            </div>
            <textarea
              id="idea-prompt-input"
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe your architecture requirements (e.g., realtime sync, microservices, vector DB, auth)..."
              className="w-full bg-transparent pl-8 pr-3 pt-2.5 pb-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none font-['Inter'] leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSynthesizing || !promptText.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-all shadow-[0_0_16px_rgba(99,102,241,0.3)] border-t border-white/20 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Generating Topology...' : 'Synthesize Stack Blueprint'}</span>
          </button>
        </form>

        {/* Quick Idea Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            Architecture Presets
          </span>
          <div className="flex flex-col gap-1.5">
            {PRESET_IDEAS.map((preset, idx) => {
              const isSelected = idx === activePresetIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset.prompt)}
                  className={`text-left text-xs p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-indigo-500/70 bg-[#161a2e]/60 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/40 text-white'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800/80 text-zinc-300 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className={`block text-[12px] ${isSelected ? 'font-semibold text-white' : 'font-medium text-zinc-200'}`}>
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Constraints Selector */}
        <div className="border border-zinc-800/80 rounded-lg bg-zinc-900/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsConstraintsOpen(!isConstraintsOpen)}
            className="w-full px-3 py-2 text-xs font-medium text-zinc-300 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Infrastructure Constraints</span>
            </div>
            <span className="font-mono text-[11px] text-indigo-400">
              {isConstraintsOpen ? 'Close' : 'Configure'}
            </span>
          </button>

          {isConstraintsOpen && (
            <div className="p-3 border-t border-zinc-800/80 space-y-3 bg-[#0a0e17]">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Target Hosting</label>
                <select
                  value={constraints.hosting}
                  onChange={(e) => setConstraints({ ...constraints, hosting: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Cloud Run / GCP">Cloud Run / GCP</option>
                  <option value="AWS ECS">AWS ECS (Fargate)</option>
                  <option value="Cloudflare + Edge">Cloudflare Workers + Edge</option>
                  <option value="Self-Hosted / Kubernetes">Kubernetes / Self-Hosted</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Primary Backend Language</label>
                <select
                  value={constraints.language}
                  onChange={(e) => setConstraints({ ...constraints, language: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TypeScript">TypeScript (Node / Bun)</option>
                  <option value="Go">Go (Fiber / Gin)</option>
                  <option value="Python">Python (FastAPI)</option>
                  <option value="Rust">Rust (Axum)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Target Budget Profile</label>
                <select
                  value={constraints.budgetTier}
                  onChange={(e) => setConstraints({ ...constraints, budgetTier: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Free Tier">Free Tier (Hobbyist)</option>
                  <option value="Cost-Optimized (<$50/mo)">Cost-Optimized (&lt;$50/mo)</option>
                  <option value="Scale-Ready (<$250/mo)">Scale-Ready (&lt;$250/mo)</option>
                  <option value="Enterprise">Enterprise Cloud</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Scalability Horizon</label>
                <select
                  value={constraints.scalability}
                  onChange={(e) => setConstraints({ ...constraints, scalability: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="MVP (0-1k users)">MVP (0-1k users)</option>
                  <option value="Growth (1k-100k users)">Growth (1k-100k users)</option>
                  <option value="High Scale (100k+ users)">High Scale (100k+ users)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Live Architecture Status Card */}
        <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Stack Health & Cohesion
            </span>
            {/* Emerald validation chip with live heartbeat */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span>{blueprint.validationStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 block">Est. Cloud Cost</span>
              <span className="font-mono text-sm font-bold text-zinc-100 tabular-nums">
                ${blueprint.totalMonthlyCost}
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">/mo</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 block">Roundtrip Latency</span>
              <span className="font-mono text-sm font-bold text-[#38bdf8] tabular-nums">
                {blueprint.estimatedLatencyMs}ms
              </span>
              <span className="text-[10px] text-zinc-500 font-normal"> p95</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 block">Active Services</span>
              <span className="font-mono text-sm font-bold text-zinc-100 tabular-nums">
                {blueprint.services.length}
              </span>
              <span className="text-[10px] text-zinc-500 font-normal"> nodes</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 block">Mesh Wires</span>
              <span className="font-mono text-sm font-bold text-zinc-100 tabular-nums">
                {blueprint.connections.length}
              </span>
              <span className="text-[10px] text-zinc-500 font-normal"> links</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
