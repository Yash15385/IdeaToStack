/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';

export type ActiveTab = 'canvas' | 'matrix' | 'decisions' | 'deploy';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSynthesizeClick: () => void;
  isSynthesizing: boolean;
  validationScore: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onSynthesizeClick,
  isSynthesizing,
  validationScore,
}) => {
  return (
    <header className="h-16 px-6 border-b border-zinc-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-8">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base tracking-tight text-zinc-50 font-['Geist'] whitespace-nowrap">
            IdeaToStack
          </span>
          <span className="font-mono text-[11px] text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/50">
            v2.4
          </span>
        </div>
      </div>

      {/* Zone 2: 4 concise single-line nav links / tabs */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-zinc-950/60 border border-zinc-800/80 rounded-full" aria-label="Main Navigation">
        <button
          onClick={() => onSelectTab('canvas')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'canvas'
              ? 'bg-zinc-800 text-white shadow-sm border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Topology Canvas</span>
        </button>

        <button
          onClick={() => onSelectTab('matrix')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-zinc-800 text-white shadow-sm border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Service Matrix</span>
        </button>

        <button
          onClick={() => onSelectTab('decisions')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeTab === 'decisions'
              ? 'bg-zinc-800 text-white shadow-sm border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Decisions & ADRs</span>
        </button>

        <button
          onClick={() => onSelectTab('deploy')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'deploy'
              ? 'bg-zinc-800 text-white shadow-sm border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="font-mono text-xs text-indigo-400">&gt;_</span>
          <span>Deploy & Boilerplate</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="font-mono text-xs text-emerald-400 font-medium">100% Validated</span>
        </div>

        <button
          onClick={onSynthesizeClick}
          disabled={isSynthesizing}
          className="relative px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-all shadow-[0_0_16px_rgba(99,102,241,0.35)] border-t border-white/25 active:translate-y-0.5 disabled:opacity-50 whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSynthesizing ? 'Synthesizing...' : 'Synthesize Architecture'}</span>
          <span className="sm:hidden">{isSynthesizing ? '...' : 'Synthesize'}</span>
        </button>
      </div>
    </header>
  );
};
