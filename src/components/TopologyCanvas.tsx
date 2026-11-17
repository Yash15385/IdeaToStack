/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  RotateCcw,
  GripHorizontal,
} from 'lucide-react';
import { StackBlueprint, StackServiceNode, StackConnection } from '../utils/stackEngine';
import { ConnectionFlowModal } from './ConnectionFlowModal';

interface TopologyCanvasProps {
  blueprint: StackBlueprint;
  selectedNodeId: string | null;
  onSelectNode: (node: StackServiceNode) => void;
  onAddNodeClick: () => void;
  theme?: 'dark' | 'light' | 'red';
  onUpdateNodePosition?: (nodeId: string, position: { x: number; y: number }) => void;
}

const LAYER_BADGES: Record<string, { label: string; badge: string; text: string }> = {
  client: {
    label: 'Client / UI',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    text: 'text-sky-400',
  },
  edge: {
    label: 'Edge & Security',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    text: 'text-emerald-400',
  },
  compute: {
    label: 'Compute & API',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    text: 'text-indigo-400',
  },
  data: {
    label: 'Data & Persistence',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
  },
  async: {
    label: 'Async & Queue',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    text: 'text-purple-400',
  },
  infra: {
    label: 'Infra & Storage',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    text: 'text-cyan-400',
  },
};

function getLayerBadge(layer: string) {
  return (
    LAYER_BADGES[layer] || {
      label: layer.toUpperCase(),
      badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      text: 'text-zinc-400',
    }
  );
}

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
  theme = 'dark',
  onUpdateNodePosition,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedConn, setSelectedConn] = useState<StackConnection | null>(null);
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  // Sync refs so non-passive native wheel and touch listeners have access to current values
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  // Local state for dynamically dragged node positions
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const initialPos: Record<string, { x: number; y: number }> = {};
    blueprint.services.forEach((s) => {
      initialPos[s.id] = { x: s.position.x, y: s.position.y };
    });
    return initialPos;
  });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const dragRef = useRef<{
    nodeId: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
    hasMoved: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit on initial load or blueprint change
  useEffect(() => {
    setZoom(0.95);
    setPan({ x: 20, y: 10 });
  }, [blueprint.id]);

  // Sync positions when blueprint changes externally (e.g. new synthesis or reset)
  useEffect(() => {
    const updatedPos: Record<string, { x: number; y: number }> = {};
    blueprint.services.forEach((s) => {
      updatedPos[s.id] = { x: s.position.x, y: s.position.y };
    });
    setNodePositions(updatedPos);
  }, [blueprint.id, blueprint.services.length]);

  // Mouse Wheel & Trackpad Pinch-to-Zoom (Cursor Centered)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent standard browser page scrolling / global browser zoom
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      // Coordinate in the canvas world before zoom
      const worldX = (cursorX - currentPan.x) / currentZoom;
      const worldY = (cursorY - currentPan.y) / currentZoom;

      // Trackpad pinch (e.ctrlKey) or mouse wheel scroll
      let zoomDelta = 0;
      if (e.ctrlKey) {
        // Trackpad pinch-to-zoom gives smaller deltas
        zoomDelta = -e.deltaY * 0.015;
      } else {
        // Mouse wheel scroll: proportional smooth step
        const step = Math.min(Math.max(-e.deltaY * 0.0018, -0.2), 0.2);
        zoomDelta = step;
      }

      const newZoom = Math.min(Math.max(currentZoom + zoomDelta, 0.4), 2.4);
      if (Math.abs(newZoom - currentZoom) < 0.001) return;

      // Keep world coordinates under cursor stationary (Zoom towards cursor)
      const newPanX = cursorX - worldX * newZoom;
      const newPanY = cursorY - worldY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Two-Finger Touch Screen Pinch-to-Zoom and Pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartDist = 0;
    let touchStartZoom = 1;
    let touchStartPan = { x: 0, y: 0 };
    let touchStartMid = { x: 0, y: 0 };
    let isTouchPinching = false;

    // Single finger canvas panning
    let singleTouchStart = { x: 0, y: 0 };
    let singlePanStart = { x: 0, y: 0 };
    let isSingleTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();

      if (e.touches.length === 2) {
        isTouchPinching = true;
        isSingleTouching = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];

        touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchStartZoom = zoomRef.current;
        touchStartPan = { ...panRef.current };
        touchStartMid = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
      } else if (e.touches.length === 1) {
        // Single finger panning if touching canvas background
        if (!(e.target as HTMLElement).closest('.node-card')) {
          isSingleTouching = true;
          isTouchPinching = false;
          singleTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          singlePanStart = { ...panRef.current };
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();

      // 1. Two-finger pinch-to-zoom & two-finger pan
      if (e.touches.length === 2 && isTouchPinching) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];

        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (touchStartDist === 0) return;

        const scale = currentDist / touchStartDist;
        const newZoom = Math.min(Math.max(touchStartZoom * scale, 0.4), 2.4);

        const currentMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const currentMidY = (t1.clientY + t2.clientY) / 2 - rect.top;

        // Origin in world coordinates at pinch start
        const worldX = (touchStartMid.x - touchStartPan.x) / touchStartZoom;
        const worldY = (touchStartMid.y - touchStartPan.y) / touchStartZoom;

        const newPanX = currentMidX - worldX * newZoom;
        const newPanY = currentMidY - worldY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
        return;
      }

      // 2. Dragging a node card on touch devices
      if (dragRef.current && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = (t.clientX - dragRef.current.startMouseX) / zoomRef.current;
        const dy = (t.clientY - dragRef.current.startMouseY) / zoomRef.current;

        if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 3) {
          dragRef.current.hasMoved = true;
        }

        if (dragRef.current.hasMoved) {
          const newX = Math.round(dragRef.current.startNodeX + dx);
          const newY = Math.round(dragRef.current.startNodeY + dy);

          setNodePositions((prev) => ({
            ...prev,
            [dragRef.current!.nodeId]: { x: newX, y: newY },
          }));
        }
        return;
      }

      // 3. Single finger canvas background panning
      if (e.touches.length === 1 && isSingleTouching) {
        e.preventDefault();
        const dx = e.touches[0].clientX - singleTouchStart.x;
        const dy = e.touches[0].clientY - singleTouchStart.y;
        setPan({ x: singlePanStart.x + dx, y: singlePanStart.y + dy });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isTouchPinching = false;
      }
      if (e.touches.length === 0) {
        isSingleTouching = false;
      }

      // If finished dragging a node via touch
      if (dragRef.current && e.touches.length === 0) {
        const wasMoved = dragRef.current.hasMoved;
        const movedNodeId = dragRef.current.nodeId;
        const finalPos = nodePositions[movedNodeId];

        dragRef.current = null;
        setDraggingNodeId(null);

        if (wasMoved && finalPos && onUpdateNodePosition) {
          onUpdateNodePosition(movedNodeId, finalPos);
        } else if (!wasMoved) {
          const service = blueprint.services.find((s) => s.id === movedNodeId);
          if (service) onSelectNode(service);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [nodePositions, onUpdateNodePosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background directly
    if ((e.target as HTMLElement).closest('.node-card')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, serviceId: string) => {
    // Only initiate drag on primary (left) mouse button
    if (e.button !== 0) return;
    e.stopPropagation();

    const currentPos =
      nodePositions[serviceId] ||
      blueprint.services.find((s) => s.id === serviceId)?.position || { x: 0, y: 0 };

    dragRef.current = {
      nodeId: serviceId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: currentPos.x,
      startNodeY: currentPos.y,
      hasMoved: false,
    };
    setDraggingNodeId(serviceId);
  };

  const handleNodeTouchStart = (e: React.TouchEvent, serviceId: string) => {
    // Only drag with single touch (two touches is reserved for pinch-to-zoom)
    if (e.touches.length !== 1) return;
    e.stopPropagation();

    const currentPos =
      nodePositions[serviceId] ||
      blueprint.services.find((s) => s.id === serviceId)?.position || { x: 0, y: 0 };

    dragRef.current = {
      nodeId: serviceId,
      startMouseX: e.touches[0].clientX,
      startMouseY: e.touches[0].clientY,
      startNodeX: currentPos.x,
      startNodeY: currentPos.y,
      hasMoved: false,
    };
    setDraggingNodeId(serviceId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. If currently dragging a service block
    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.startMouseX) / zoom;
      const dy = (e.clientY - dragRef.current.startMouseY) / zoom;

      if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 3) {
        dragRef.current.hasMoved = true;
      }

      if (dragRef.current.hasMoved) {
        const newX = Math.round(dragRef.current.startNodeX + dx);
        const newY = Math.round(dragRef.current.startNodeY + dy);

        setNodePositions((prev) => ({
          ...prev,
          [dragRef.current!.nodeId]: { x: newX, y: newY },
        }));
      }
      return;
    }

    // 2. If currently panning the canvas background
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    if (dragRef.current) {
      const wasMoved = dragRef.current.hasMoved;
      const movedNodeId = dragRef.current.nodeId;
      const finalPos = nodePositions[movedNodeId];

      dragRef.current = null;
      setDraggingNodeId(null);

      if (wasMoved && finalPos && onUpdateNodePosition) {
        onUpdateNodePosition(movedNodeId, finalPos);
      } else if (!wasMoved) {
        // If the user clicked without dragging, select the node to open inspector
        const service = blueprint.services.find((s) => s.id === movedNodeId);
        if (service) onSelectNode(service);
      }
      return;
    }

    setIsPanning(false);
  };

  // Ensure dragging cleanly ends if user releases mouse outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragRef.current) {
        const wasMoved = dragRef.current.hasMoved;
        const movedNodeId = dragRef.current.nodeId;
        const finalPos = nodePositions[movedNodeId];

        dragRef.current = null;
        setDraggingNodeId(null);

        if (wasMoved && finalPos && onUpdateNodePosition) {
          onUpdateNodePosition(movedNodeId, finalPos);
        }
      }
      setIsPanning(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [nodePositions, onUpdateNodePosition]);

  const handleResetPositions = () => {
    const defaultPos: Record<string, { x: number; y: number }> = {};
    blueprint.services.forEach((s) => {
      defaultPos[s.id] = { x: s.position.x, y: s.position.y };
      if (onUpdateNodePosition) {
        onUpdateNodePosition(s.id, { x: s.position.x, y: s.position.y });
      }
    });
    setNodePositions(defaultPos);
  };

  // Node dimension constants for wiring anchor calculations
  const CARD_WIDTH = 200;
  const CARD_HEIGHT = 136;

  // Build service coordinate map from current nodePositions so wires dynamically follow moving blocks
  const serviceCoordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    blueprint.services.forEach((s) => {
      const pos = nodePositions[s.id] || s.position;
      map.set(s.id, { x: pos.x, y: pos.y });
    });
    return map;
  }, [blueprint.services, nodePositions]);

  // Smart multi-directional anchor & cubic Bezier curve calculation that adapts to any node position & distance
  const connectionRoutes = useMemo(() => {
    return blueprint.connections
      .map((conn) => {
        const fromPos = serviceCoordMap.get(conn.from);
        const toPos = serviceCoordMap.get(conn.to);

        if (!fromPos || !toPos) return null;

        const fromCx = fromPos.x + CARD_WIDTH / 2;
        const fromCy = fromPos.y + CARD_HEIGHT / 2;
        const toCx = toPos.x + CARD_WIDTH / 2;
        const toCy = toPos.y + CARD_HEIGHT / 2;

        const dx = toCx - fromCx;
        const dy = toCy - fromCy;

        let x1 = 0;
        let y1 = 0;
        let x2 = 0;
        let y2 = 0;
        let cp1X = 0;
        let cp1Y = 0;
        let cp2X = 0;
        let cp2Y = 0;

        // Determine best routing direction based on relative position
        if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
          // Horizontal orientation
          if (toCx >= fromCx) {
            // Standard: Source Right -> Target Left
            x1 = fromPos.x + CARD_WIDTH;
            y1 = fromPos.y + CARD_HEIGHT / 2;
            x2 = toPos.x;
            y2 = toPos.y + CARD_HEIGHT / 2;

            const distX = Math.max(Math.abs(x2 - x1), 40);
            const cpOffset = Math.max(distX * 0.45, 40);
            cp1X = x1 + cpOffset;
            cp1Y = y1;
            cp2X = x2 - cpOffset;
            cp2Y = y2;
          } else {
            // Inverted: Source Left -> Target Right (target dragged behind source)
            x1 = fromPos.x;
            y1 = fromPos.y + CARD_HEIGHT / 2;
            x2 = toPos.x + CARD_WIDTH;
            y2 = toPos.y + CARD_HEIGHT / 2;

            const distX = Math.max(Math.abs(x1 - x2), 40);
            const cpOffset = Math.max(distX * 0.45, 40);
            cp1X = x1 - cpOffset;
            cp1Y = y1;
            cp2X = x2 + cpOffset;
            cp2Y = y2;
          }
        } else {
          // Vertical orientation (target placed directly above/below source)
          if (toCy >= fromCy) {
            // Source Bottom -> Target Top
            x1 = fromPos.x + CARD_WIDTH / 2;
            y1 = fromPos.y + CARD_HEIGHT;
            x2 = toPos.x + CARD_WIDTH / 2;
            y2 = toPos.y;

            const distY = Math.max(Math.abs(y2 - y1), 40);
            const cpOffset = Math.max(distY * 0.45, 40);
            cp1X = x1;
            cp1Y = y1 + cpOffset;
            cp2X = x2;
            cp2Y = y2 - cpOffset;
          } else {
            // Source Top -> Target Bottom
            x1 = fromPos.x + CARD_WIDTH / 2;
            y1 = fromPos.y;
            x2 = toPos.x + CARD_WIDTH / 2;
            y2 = toPos.y + CARD_HEIGHT;

            const distY = Math.max(Math.abs(y1 - y2), 40);
            const cpOffset = Math.max(distY * 0.45, 40);
            cp1X = x1;
            cp1Y = y1 - cpOffset;
            cp2X = x2;
            cp2Y = y2 + cpOffset;
          }
        }

        const pathD = `M ${x1} ${y1} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x2} ${y2}`;

        // Precise midpoint at t = 0.5 along the cubic Bezier curve
        const midX = 0.125 * x1 + 0.375 * cp1X + 0.375 * cp2X + 0.125 * x2;
        const midY = 0.125 * y1 + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * y2;

        const isHovered = hoveredConnId === conn.id;
        const isSelected = selectedConn?.id === conn.id;
        const isActive = isHovered || isSelected;

        return {
          conn,
          x1,
          y1,
          x2,
          y2,
          pathD,
          midX,
          midY,
          isActive,
        };
      })
      .filter(Boolean) as Array<{
      conn: StackConnection;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      pathD: string;
      midX: number;
      midY: number;
      isActive: boolean;
    }>;
  }, [blueprint.connections, serviceCoordMap, hoveredConnId, selectedConn]);

  // Theme-aware wire & pulse color schemes
  const wireTheme =
    theme === 'red'
      ? {
          stop1: '#f43f5e',
          stop2: '#fb923c',
          stop3: '#e11d48',
          glow: '#e11d48',
          glowHover: '#fb7185',
          ambient: '#3a0812',
          pulse: '#fb7185',
          highlight: '#f43f5e',
        }
      : theme === 'light'
      ? {
          stop1: '#4f46e5',
          stop2: '#0284c7',
          stop3: '#059669',
          glow: '#4f46e5',
          glowHover: '#4338ca',
          ambient: '#cbd5e1',
          pulse: '#0284c7',
          highlight: '#4f46e5',
        }
      : {
          stop1: '#6366f1',
          stop2: '#38bdf8',
          stop3: '#10b981',
          glow: '#6366f1',
          glowHover: '#818cf8',
          ambient: '#1e2230',
          pulse: '#38bdf8',
          highlight: '#6366f1',
        };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative flex-1 h-[calc(100vh-4rem)] bg-[#030712] overflow-hidden select-none bg-dot-grid ${
        draggingNodeId ? 'cursor-grabbing' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
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

        <div className="glass-tier-1 px-2.5 py-1.5 rounded pointer-events-auto hidden md:flex items-center gap-2 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono">
            Scroll/Pinch to zoom • Drag blocks to move • Click wires to inspect flow
          </span>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 sm:gap-2 glass-tier-1 p-1.5 rounded shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.4))}
          title="Zoom In (Scroll Up or Pinch with Two Fingers)"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span
          title="Current Zoom Scale"
          className="font-mono text-[10px] text-zinc-300 select-none w-9 text-center font-medium"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          title="Zoom Out (Scroll Down or Pinch with Two Fingers)"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(0.95);
            setPan({ x: 20, y: 10 });
          }}
          title="Reset View (Pan/Zoom)"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetPositions}
          title="Auto-Align: Reset all blocks back to standard column grid"
          className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto-Align</span>
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
          overflow: 'visible',
        }}
        className="w-[1400px] h-[750px] relative overflow-visible"
      >
        {/* SVG Wiring Connections & Packet Pulses */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="wire-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={wireTheme.glow} floodOpacity="0.45" />
            </filter>
            <filter id="wire-glow-hover" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={wireTheme.glowHover} floodOpacity="0.8" />
            </filter>
            {connectionRoutes.map((route) => (
              <linearGradient
                key={`grad-${route.conn.id}`}
                id={`wire-grad-${route.conn.id}`}
                gradientUnits="userSpaceOnUse"
                x1={route.x1}
                y1={route.y1}
                x2={route.x2}
                y2={route.y2}
              >
                <stop offset="0%" stopColor={wireTheme.stop1} stopOpacity="0.85" />
                <stop offset="50%" stopColor={wireTheme.stop2} stopOpacity="0.85" />
                <stop offset="100%" stopColor={wireTheme.stop3} stopOpacity="0.85" />
              </linearGradient>
            ))}
          </defs>

          {connectionRoutes.map((route) => {
            const { conn, pathD, isActive } = route;

            return (
              <g key={conn.id} className="transition-all duration-150">
                {/* Background ambient stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isActive ? wireTheme.highlight : wireTheme.ambient}
                  strokeWidth={isActive ? '5' : '3'}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />

                {/* Main data link with per-connection gradient */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isActive ? wireTheme.glowHover : `url(#wire-grad-${conn.id})`}
                  strokeWidth={isActive ? '3' : '1.5'}
                  strokeLinecap="round"
                  filter={isActive ? 'url(#wire-glow-hover)' : 'url(#wire-glow)'}
                  className="transition-all duration-150"
                />

                {/* Animated Packet Pulse */}
                <circle
                  r={isActive ? '5' : '3.5'}
                  fill={isActive ? '#ffffff' : wireTheme.pulse}
                  style={{
                    filter: `drop-shadow(0 0 ${isActive ? '10px' : '6px'} ${wireTheme.pulse})`,
                  }}
                >
                  <animateMotion
                    path={pathD}
                    dur={`${isActive ? 1.4 : 2.5 + Math.random() * 0.8}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                  />
                </circle>

                {/* Invisible wide hit-target path for easy clicking anywhere along the line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  className="cursor-pointer pointer-events-auto"
                  onMouseEnter={() => setHoveredConnId(conn.id)}
                  onMouseLeave={() => setHoveredConnId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConn(conn);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Connection Protocol Tags Layer (Clickable HTML Pills) */}
        {connectionRoutes.map((route) => {
          const { conn, midX, midY, isActive } = route;
          return (
            <div
              key={`badge-${conn.id}`}
              style={{
                position: 'absolute',
                left: `${midX}px`,
                top: `${midY}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
              }}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConn(conn);
                }}
                onMouseEnter={() => setHoveredConnId(conn.id)}
                onMouseLeave={() => setHoveredConnId(null)}
                title={`Click to inspect ${conn.protocol} flow`}
                className={`font-mono text-[9px] px-2 py-0.5 rounded border transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] scale-110 font-semibold ring-2 ring-indigo-400/40'
                    : 'bg-zinc-950/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                }`}
              >
                <span>{conn.protocol.split('/')[0]}</span>
              </button>
            </div>
          );
        })}

        {/* Service Node Cards */}
        {blueprint.services.map((service) => {
          const Icon = getLayerIcon(service.layer);
          const layerBadge = getLayerBadge(service.layer);
          const isSelected = selectedNodeId === service.id;
          const isDraggingThis = draggingNodeId === service.id;
          const currentPos = nodePositions[service.id] || service.position;

          const isConnectedToHovered =
            hoveredConnId &&
            (blueprint.connections.find((c) => c.id === hoveredConnId)?.from === service.id ||
              blueprint.connections.find((c) => c.id === hoveredConnId)?.to === service.id);
          const isConnectedToSelected =
            selectedConn && (selectedConn.from === service.id || selectedConn.to === service.id);
          const isWireConnected = isConnectedToHovered || isConnectedToSelected;

          return (
            <div
              key={service.id}
              onMouseDown={(e) => handleNodeMouseDown(e, service.id)}
              onTouchStart={(e) => handleNodeTouchStart(e, service.id)}
              style={{
                left: `${currentPos.x}px`,
                top: `${currentPos.y}px`,
                width: `${CARD_WIDTH}px`,
              }}
              title="Click & hold to move block, click to inspect"
              className={`node-card group absolute p-3 rounded transition-all glass-tier-1 select-none ${
                isDraggingThis
                  ? 'z-30 cursor-grabbing shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_35px_rgba(99,102,241,0.55)] ring-2 ring-indigo-400 scale-[1.03] bg-[#111827]'
                  : isSelected
                  ? 'z-20 cursor-grab node-glow-active bg-[#111827]/90 shadow-[0_0_25px_rgba(99,102,241,0.3)]'
                  : isWireConnected
                  ? 'z-10 cursor-grab ring-2 ring-indigo-400 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.45)] bg-[#101726]/95 scale-[1.02]'
                  : 'z-10 cursor-grab hover:border-zinc-700/80 hover:bg-[#0c121e]'
              }`}
            >
              {/* Attached Layer Badge Header */}
              <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-zinc-800/60">
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${layerBadge.badge}`}
                >
                  {layerBadge.label}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <GripHorizontal className="w-3 h-3 text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="font-mono text-[9px] text-zinc-400 bg-zinc-800/60 px-1 py-0.5 rounded border border-zinc-700/40">
                    {service.version}
                  </span>
                </div>
              </div>

              {/* Service Icon & Name */}
              <div className="flex items-center gap-1.5 min-w-0 mb-1">
                <div className="w-5 h-5 rounded bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0">
                  <Icon className={`w-3 h-3 ${layerBadge.text}`} />
                </div>
                <span className="font-semibold text-xs text-zinc-100 font-['Geist'] truncate" title={service.name}>
                  {service.name}
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

      {/* Connection Flow Inspector Modal */}
      <ConnectionFlowModal
        connection={selectedConn}
        onClose={() => setSelectedConn(null)}
        services={blueprint.services}
        allConnections={blueprint.connections}
        onSelectConnection={(newConn) => setSelectedConn(newConn)}
        onInspectNode={(node) => {
          setSelectedConn(null);
          onSelectNode(node);
        }}
      />
    </div>
  );
};
