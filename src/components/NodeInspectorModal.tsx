/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, RefreshCw, Server, Check, ArrowRight, ShieldCheck, DollarSign, Clock } from 'lucide-react';
import { StackServiceNode } from '../utils/stackEngine';

interface NodeInspectorModalProps {
  service: StackServiceNode | null;
  onClose: () => void;
  onSwapService: (nodeId: string, alternative: string) => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  service,
  onClose,
  onSwapService,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg glass-tier-2 rounded-lg h-full max-h-[85vh] flex flex-col overflow-hidden border border-zinc-700/80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-start justify-between gap-4 bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {service.layer}
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                {service.version}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-50 font-['Geist'] tracking-tight">
              {service.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {service.category}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Description */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Service Role
            </span>
            <p className="text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded border border-zinc-800/80">
              {service.description}
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Latency Profile</span>
              </div>
              <span className="font-mono text-sm font-semibold text-cyan-300 tabular-nums">
                {service.latencyProfile}
              </span>
            </div>

            <div className="p-3 rounded bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monthly Estimate</span>
              </div>
              <span className="font-mono text-sm font-semibold text-zinc-100 tabular-nums">
                ${service.costEstimatePerMonth}/mo
              </span>
            </div>
          </div>

          {/* Container & Ports */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
              Container Runtime & Port Bindings
            </span>
            <div className="p-3 rounded bg-zinc-950/80 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Docker Image:</span>
                <span className="text-indigo-300">{service.dockerImage || `${service.id}:latest`}</span>
              </div>
              {service.ports && service.ports.length > 0 && (
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-400">Exposed Ports:</span>
                  <span className="text-zinc-300">{service.ports.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Environment Variables */}
          {Object.keys(service.envVariables).length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                Environment Configuration
              </span>
              <div className="p-3 rounded bg-zinc-950/80 border border-zinc-800/80 overflow-x-auto space-y-1">
                {Object.entries(service.envVariables).map(([k, v]) => (
                  <div key={k} className="font-mono text-[11px] flex items-center justify-between gap-4">
                    <span className="text-indigo-400 shrink-0">{k}:</span>
                    <span className="text-zinc-300 truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatible Alternatives Swap */}
          {service.alternatives.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Compatible Architecture Alternatives
                </span>
                <span className="text-[10px] text-zinc-400">Instant Hot-Swap</span>
              </div>

              <div className="space-y-2">
                {service.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-xs text-zinc-200 block font-['Geist']">
                        {alt}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Compatible replacement for {service.name}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSwapService(service.id, alt);
                        onClose();
                      }}
                      className="px-3 py-1 text-xs font-medium bg-indigo-600/90 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Swap</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
