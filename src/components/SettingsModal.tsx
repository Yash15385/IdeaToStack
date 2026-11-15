/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Settings, Check, Sparkles, Moon, Sun, Flame, Zap, Shield, Cpu } from 'lucide-react';

export type ThemeMode = 'dark' | 'light' | 'red';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

interface ThemeOption {
  id: ThemeMode;
  name: string;
  tagline: string;
  badge: string;
  icon: React.ElementType;
  colors: {
    bg: string;
    surface: string;
    accent: string;
    border: string;
  };
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Midnight Void',
    tagline: 'Modern technical minimalism with dark glassmorphism & electric indigo accents.',
    badge: 'Default Dark',
    icon: Moon,
    colors: {
      bg: '#030712',
      surface: '#090d16',
      accent: '#6366f1',
      border: '#27272a',
    },
  },
  {
    id: 'light',
    name: 'Technical Crisp',
    tagline: 'High-contrast, clean daylight architectural aesthetic with slate borders & crisp readability.',
    badge: 'Clean Light',
    icon: Sun,
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      accent: '#4f46e5',
      border: '#cbd5e1',
    },
  },
  {
    id: 'red',
    name: 'Crimson Velocity',
    tagline: 'High-energy, hyper-focused motivational red theme with fiery glowing borders & raw developer momentum.',
    badge: '⚡ High Motivative',
    icon: Flame,
    colors: {
      bg: '#0b0204',
      surface: '#140407',
      accent: '#e11d48',
      border: '#9f1239',
    },
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl glass-tier-2 rounded-xl border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 font-['Geist'] tracking-tight">
                Settings & Environment Preferences
              </h2>
              <p className="text-xs text-zinc-400">
                Personalize workspace appearance, themes, and synthesis telemetry.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Theme Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                  Workspace Theme
                </span>
                <span className="text-xs text-zinc-300">
                  Select visual environment mode for the topology canvas and data matrix.
                </span>
              </div>
              <span className="font-mono text-[10px] text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                Live Preview
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectTheme(opt.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all flex items-start justify-between gap-3 relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/40'
                        : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-100 font-['Geist']">
                            {opt.name}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                              opt.id === 'red'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : opt.id === 'light'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm">
                          {opt.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Color Swatch Preview & Checkmark */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-1">
                      <div className="flex items-center -space-x-1 border border-zinc-700/60 p-0.5 rounded bg-zinc-950/80">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: opt.colors.bg }}
                          title="Background"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: opt.colors.surface }}
                          title="Surface"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: opt.colors.accent }}
                          title="Accent"
                        />
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'border-zinc-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* High Motivation Boost Banner (Active when Red Theme is selected) */}
          {theme === 'red' && (
            <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/40 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-[11px] font-semibold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>High Motivative Velocity Mode Active</span>
              </div>
              <p className="text-xs text-rose-200 font-['Geist'] italic">
                &ldquo;Move fast. Architect fearlessly. Deploy with conviction. Zero latency, unstoppable momentum.&rdquo;
              </p>
            </div>
          )}

          {/* System & Architecture Engine Diagnostics */}
          <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Engine & Synthesis Telemetry
            </span>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block">AI Studio Model</span>
                <span className="text-indigo-400 font-medium">gemini-4-hydrogen</span>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block">Fallback Engine</span>
                <span className="text-emerald-400 font-medium">Deterministic v2.4</span>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block">Deployment Mesh</span>
                <span className="text-zinc-300">Docker + Vercel SPA</span>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block">Theme State</span>
                <span className="text-cyan-400 uppercase font-semibold">{theme} mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Preference automatically saved to localStorage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

