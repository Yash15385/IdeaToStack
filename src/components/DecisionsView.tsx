/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { StackBlueprint, ArchitectureDecision } from '../utils/stackEngine';

interface DecisionsViewProps {
  blueprint: StackBlueprint;
  onAddDecision: (decision: ArchitectureDecision) => void;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  blueprint,
  onAddDecision,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContext, setNewContext] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [newConsequences, setNewConsequences] = useState('');
  const [newAlternatives, setNewAlternatives] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDecision.trim()) return;

    const decision: ArchitectureDecision = {
      id: `adr-${Date.now()}`,
      title: newTitle.trim(),
      status: 'Accepted',
      context: newContext.trim() || 'Technical requirement for system reliability and performance.',
      decision: newDecision.trim(),
      consequences: newConsequences.trim() || 'Optimized throughput and operational durability.',
      alternativesConsidered: newAlternatives
        ? newAlternatives.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    onAddDecision(decision);
    setNewTitle('');
    setNewContext('');
    setNewDecision('');
    setNewConsequences('');
    setNewAlternatives('');
    setIsAdding(false);
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-[#030712] p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 font-['Geist'] tracking-tight">
              Architecture Decision Records (ADRs)
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Documented trade-offs, rationale, and structural decisions governing this stack.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Record Decision'}</span>
          </button>
        </div>

        {/* Add Decision Form */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded border border-indigo-500/40 bg-zinc-900/80 space-y-3"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              New Architecture Decision Record
            </h3>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Decision Title</label>
              <input
                type="text"
                placeholder="e.g., Adopt Event Sourcing for Financial Transaction Durability"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Context & Problem</label>
                <textarea
                  rows={2}
                  placeholder="What technical problem or requirement forces this architectural choice?"
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Decision Taken</label>
                <textarea
                  rows={2}
                  placeholder="What architecture pattern, library, or protocol was decided?"
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Consequences & Trade-offs</label>
                <input
                  type="text"
                  placeholder="e.g., Higher read performance at the cost of eventual consistency"
                  value={newConsequences}
                  onChange={(e) => setNewConsequences(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Alternatives Considered (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., MySQL sharding, MongoDB, CockroachDB"
                  value={newAlternatives}
                  onChange={(e) => setNewAlternatives(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
              >
                Save ADR
              </button>
            </div>
          </form>
        )}

        {/* ADR List */}
        <div className="space-y-4">
          {blueprint.decisions.map((adr, index) => (
            <div
              key={adr.id}
              className="p-5 rounded glass-tier-1 space-y-3 border-l-2 border-l-indigo-500"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-500">
                    ADR {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-semibold text-sm text-zinc-100 font-['Geist']">
                    {adr.title}
                  </h3>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{adr.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300 pt-1">
                <div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    Context & Constraints
                  </span>
                  <p className="text-zinc-400 leading-relaxed">{adr.context}</p>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider block mb-1">
                    Architectural Decision
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-medium">{adr.decision}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-zinc-400">Consequence: </span>
                  <span className="text-zinc-300">{adr.consequences}</span>
                </div>

                {adr.alternativesConsidered.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-400">Evaluated:</span>
                    {adr.alternativesConsidered.map((alt, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
