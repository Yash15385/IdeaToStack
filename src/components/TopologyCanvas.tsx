/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Server,
  Database,
  Globe,
  Cpu,
  Zap,
  HardDrive,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StackBlueprint, StackServiceNode, StackConnection } from '../utils/stackEngine';

interface TopologyCanvasProps {
  blueprint: StackBlueprint;
  selectedNodeId: string | null;
  onSelectNode: (node: StackServiceNode) => void;
  onAddNodeClick: () => void;
}

const LAYER_LABELS: Record<string, { label: string; x: number }> = {
  client: { label: 'Client / UI', x: 80 },
  edge: { label: 'Edge & Security', x: 300 },
  compute: { label: 'Compute & API', x: 520 },
  data: { label: 'Data & Persistence', x: 740 },
  async: { label: 'Async & Queue', x: 960 },
};

function getLayerIcon(layer: string) {
  switch (layer) {
    case 'client':
      return Globe;
    case 'edge':
      return ShieldCheck;
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

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  blueprint,
  selectedNodeId,
  onSelectNode,
  onAddNodeClick,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit on initial load or blueprint change
  useEffect(() => {
    setZoom(0.95);
    setPan({ x: 20, y: 10 });
  }, [blueprint.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background directly
    if ((e.target as HTMLElement).closest('.node-card')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Node dimension constants for wiring anchor calculations
  const CARD_WIDTH = 200;
  const CARD_HEIGHT = 120;

  // Build service coordinate map
  const serviceCoordMap = new Map<string, { x: number; y: number }>();
  blueprint.services.forEach((s) => {
    serviceCoordMap.set(s.id, { x: s.position.x, y: s.position.y });
  });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-[calc(100vh-4rem)] bg-[#030712] overflow-hidden select-none cursor-grab active:cursor-grabbing bg-dot-grid"
    >
      {/* Canvas Header / Overview Strip */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none flex items-center gap-3">
        <div className="glass-tier-1 px-3 py-1.5 rounded pointer-events-auto">
          <h2 className="text-sm font-semibold text-zinc-100 font-['Geist'] tracking-tight">
            {blueprint.title}
          </h2>
          <p className="text-[11px] text-zinc-400 font-['Inter']">
            {blueprint.tagline}
          </p>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 glass-tier-1 p-1.5 rounded">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(0.95);
            setPan({ x: 20, y: 10 });
          }}
          title="Reset View"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <button
          onClick={onAddNodeClick}
          className="px-2.5 py-1 text-xs font-medium bg-indigo-600/90 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Main Pan/Zoom World */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="w-[1400px] h-[750px] relative"
      >
        {/* Layer Guides & Headers */}
        {Object.entries(LAYER_LABELS).map(([key, info]) => (
          <div
            key={key}
            style={{ left: `${info.x}px` }}
            className="absolute top-12 w-[200px] pointer-events-none"
          >
            <div className="border-b border-zinc-800/80 pb-1 mb-4 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                {info.label}
              </span>
            </div>
            {/* Faint vertical column guide */}
            <div className="h-[580px] w-px bg-gradient-to-b from-zinc-800/40 via-zinc-800/10 to-transparent" />
          </div>
        ))}

        {/* SVG Wiring Connections & Packet Pulses */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
            </linearGradient>
            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
            </filter>
          </defs>

          {blueprint.connections.map((conn) => {
            const fromPos = serviceCoordMap.get(conn.from);
            const toPos = serviceCoordMap.get(conn.to);

            if (!fromPos || !toPos) return null;

            // Connect from right edge of source to left edge of target
            const x1 = fromPos.x + CARD_WIDTH;
            const y1 = fromPos.y + CARD_HEIGHT / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + CARD_HEIGHT / 2;

            const dx = Math.abs(x2 - x1);
            const curve = Math.max(dx * 0.45, 40);

            // Cubic Bezier curve
            const pathD = `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`;

            return (
              <g key={conn.id}>
                {/* Background ambient stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#1e2230"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Main data link */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#wire-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="url(#wire-glow)"
                />

                {/* Animated Packet Pulse */}
                <circle r="3.5" fill="#38bdf8" className="shadow-[0_0_8px_#38bdf8]">
                  <animateMotion
                    path={pathD}
                    dur={`${2.5 + Math.random() * 0.8}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                  />
                </circle>

                {/* Connection Protocol Tag along midpoint */}
                <foreignObject
                  x={(x1 + x2) / 2 - 40}
                  y={(y1 + y2) / 2 - 10}
                  width="80"
                  height="20"
                  className="overflow-visible"
                >
                  <div className="flex justify-center">
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-zinc-400 whitespace-nowrap shadow-sm">
                      {conn.protocol.split('/')[0]}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Service Node Cards */}
        {blueprint.services.map((service) => {
          const Icon = getLayerIcon(service.layer);
          const isSelected = selectedNodeId === service.id;

          return (
            <div
              key={service.id}
              onClick={() => onSelectNode(service)}
              style={{
                left: `${service.position.x}px`,
                top: `${service.position.y}px`,
                width: `${CARD_WIDTH}px`,
              }}
              className={`node-card absolute z-10 p-3 rounded cursor-pointer transition-all duration-150 glass-tier-1 ${
                isSelected
                  ? 'node-glow-active bg-[#111827]/90 shadow-[0_0_25px_rgba(99,102,241,0.3)]'
                  : 'hover:border-zinc-700/80 hover:bg-[#0c121e]'
              }`}
            >
              {/* Card Header: Icon, Name, Version Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-indigo-400" />
                  </div>
                  <span className="font-semibold text-xs text-zinc-100 font-['Geist'] truncate">
                    {service.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/60 px-1 py-0.5 rounded border border-zinc-700/40 shrink-0">
                  {service.version}
                </span>
              </div>

              {/* Category */}
              <p className="text-[11px] text-zinc-400 truncate mb-2">
                {service.category}
              </p>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1 mb-2">
                {service.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-900/90 text-zinc-400 border border-zinc-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer: Latency & Cost */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                <span className="font-mono text-cyan-400">
                  {service.latencyProfile}
                </span>
                <span className="font-mono text-zinc-300 font-medium">
                  ${service.costEstimatePerMonth}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
