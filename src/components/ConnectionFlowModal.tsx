/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeftRight,
  Shield,
  Activity,
  Cpu,
  Layers,
  Database,
  Globe,
  Zap,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Radio,
  Server,
  Share2,
} from 'lucide-react';
import {
  StackConnection,
  StackServiceNode,
  getConnectionFlowDetails,
  ServiceLayer,
} from '../utils/stackEngine';

interface ConnectionFlowModalProps {
  connection: StackConnection | null;
  onClose: () => void;
  services: StackServiceNode[];
  allConnections: StackConnection[];
  onSelectConnection: (conn: StackConnection) => void;
  onInspectNode: (service: StackServiceNode) => void;
}

function getLayerIcon(layer: ServiceLayer) {
  switch (layer) {
    case 'client':
      return Globe;
    case 'edge':
      return Shield;
    case 'compute':
      return Cpu;
    case 'data':
      return Database;
    case 'async':
      return Zap;
    case 'infra':
      return HardDrive;
    default:
      return Server;
  }
}

function getLayerBadgeColor(layer: ServiceLayer) {
  switch (layer) {
    case 'client':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'edge':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'compute':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    case 'data':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'async':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'infra':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
  }
}

export const ConnectionFlowModal: React.FC<ConnectionFlowModalProps> = ({
  connection,
  onClose,
  services,
  allConnections,
  onSelectConnection,
  onInspectNode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!connection) return null;

  const sourceNode = services.find((s) => s.id === connection.from);
  const targetNode = services.find((s) => s.id === connection.to);

  const flowDetails = getConnectionFlowDetails(
    connection,
    sourceNode,
    targetNode,
    services,
    allConnections
  );

  const SourceIcon = sourceNode ? getLayerIcon(sourceNode.layer) : Server;
  const TargetIcon = targetNode ? getLayerIcon(targetNode.layer) : Server;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(flowDetails.samplePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-tier-2 rounded-xl border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100 font-['Geist'] tracking-tight">
                  Data Flow & Connection Inspector
                </h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  {connection.protocol}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Detailed protocol specifications and real-time payload transmission between mesh blocks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Visual Block-to-Block Flow Diagram */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Mesh Transmission Path
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              {/* Source Block Card */}
              <div
                onClick={() => sourceNode && onInspectNode(sourceNode)}
                className="sm:col-span-5 p-3 rounded-lg bg-zinc-900/80 border border-zinc-700/80 hover:border-indigo-500/60 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.2 rounded border uppercase font-semibold ${
                      sourceNode ? getLayerBadgeColor(sourceNode.layer) : 'text-zinc-400 border-zinc-700'
                    }`}
                  >
                    Source: {sourceNode?.layer || 'compute'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                    <SourceIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-zinc-100 font-['Geist'] truncate">
                      {sourceNode?.name || connection.from}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {sourceNode?.category || 'Service Block'}
                    </p>
                    {sourceNode?.ports && sourceNode.ports.length > 0 && (
                      <span className="font-mono text-[9px] text-zinc-500 block mt-0.5">
                        Port: {sourceNode.ports.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Flow Indicator & Protocol */}
              <div className="sm:col-span-1 flex flex-col items-center justify-center py-1">
                <div className="flex items-center justify-center text-indigo-400">
                  {flowDetails.direction === 'bidirectional' ? (
                    <ArrowLeftRight className="w-5 h-5 text-indigo-400 animate-pulse" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <span className="font-mono text-[9px] text-cyan-400 font-medium whitespace-nowrap mt-1">
                  {connection.latency}
                </span>
              </div>

              {/* Target Block Card */}
              <div
                onClick={() => targetNode && onInspectNode(targetNode)}
                className="sm:col-span-5 p-3 rounded-lg bg-zinc-900/80 border border-zinc-700/80 hover:border-indigo-500/60 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.2 rounded border uppercase font-semibold ${
                      targetNode ? getLayerBadgeColor(targetNode.layer) : 'text-zinc-400 border-zinc-700'
                    }`}
                  >
                    Target: {targetNode?.layer || 'data'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                    <TargetIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-zinc-100 font-['Geist'] truncate">
                      {targetNode?.name || connection.to}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {targetNode?.category || 'Service Block'}
                    </p>
                    {targetNode?.ports && targetNode.ports.length > 0 && (
                      <span className="font-mono text-[9px] text-zinc-500 block mt-0.5">
                        Port: {targetNode.ports.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Block Fan-Out Context (if source connects to multiple blocks) */}
          {flowDetails.fanOutNodes.length > 1 && (
            <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                  Multi-Block Pipeline Fanout ({flowDetails.fanOutNodes.length} Downstream Blocks)
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                <strong className="text-white">{sourceNode?.name}</strong> simultaneously broadcasts data to {flowDetails.fanOutNodes.length} blocks in the topology:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {flowDetails.fanOutNodes.map((sibling) => {
                  const isCurrent = sibling.id === connection.to;
                  const siblingConn = allConnections.find(
                    (c) => c.from === connection.from && c.to === sibling.id
                  );

                  return (
                    <button
                      key={sibling.id}
                      onClick={() => siblingConn && onSelectConnection(siblingConn)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all flex items-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm font-semibold'
                          : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <span>{sibling.name}</span>
                      <span className="text-[9px] opacity-75">({sibling.protocol.split('/')[0]})</span>
                      {isCurrent && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data & Transmission Specifications */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Data Flow & Transmission Characteristics
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data Type */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Information & Data Type</span>
                </div>
                <p className="font-semibold text-xs text-zinc-100">
                  {flowDetails.dataType}
                </p>
              </div>

              {/* Flow Pattern */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Transmission Pattern</span>
                </div>
                <p className="font-semibold text-xs text-zinc-100">
                  {flowDetails.flowPattern}
                </p>
              </div>

              {/* Security & Encryption */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security & Isolation</span>
                </div>
                <p className="font-semibold text-xs text-zinc-100">
                  {flowDetails.security}
                </p>
              </div>

              {/* Latency & Throughput */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Performance & SLA</span>
                </div>
                <p className="font-semibold text-xs text-cyan-400 font-mono">
                  {flowDetails.latency} • {flowDetails.throughput}
                </p>
              </div>
            </div>
          </div>

          {/* Sample Payload Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Sample Wire Payload & Frame Structure
              </span>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/60"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/90 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
              <code>{flowDetails.samplePayload}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-zinc-500">
            Clicking any connection curve or protocol tag inspects its payload specifications
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
