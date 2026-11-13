/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Server, Database, Globe, Zap, Cpu } from 'lucide-react';
import { StackServiceNode, StackConnection, ServiceLayer } from '../utils/stackEngine';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingServices: StackServiceNode[];
  onAddService: (newService: StackServiceNode, newConnection?: StackConnection) => void;
}

const COMMON_PRESETS = [
  {
    name: 'Meilisearch',
    layer: 'data' as ServiceLayer,
    version: 'v1.6.2',
    category: 'Instant Full-Text Search',
    cost: 15,
    latency: '< 4ms query',
    dockerImage: 'getmeili/meilisearch:v1.6',
    tags: ['search', 'typo-tolerant', 'indexes'],
  },
  {
    name: 'ClickHouse OLAP',
    layer: 'data' as ServiceLayer,
    version: 'v24.2',
    category: 'Columnar Analytics Engine',
    cost: 35,
    latency: '< 8ms aggregations',
    dockerImage: 'clickhouse/clickhouse-server:24.2',
    tags: ['olap', 'analytics', 'columnar'],
  },
  {
    name: 'Temporal.io Worker',
    layer: 'async' as ServiceLayer,
    version: 'v1.23.0',
    category: 'Durable Workflow Engine',
    cost: 20,
    latency: '< 5ms dispatch',
    dockerImage: 'temporalio/auto-setup:1.23.0',
    tags: ['workflow', 'sagas', 'distributed'],
  },
  {
    name: 'MinIO S3 Store',
    layer: 'infra' as ServiceLayer,
    version: 'RELEASE.2024-01',
    category: 'High-Performance Object Storage',
    cost: 10,
    latency: '< 15ms TTFB',
    dockerImage: 'minio/minio:RELEASE.2024-01',
    tags: ['s3', 'storage', 'blob'],
  },
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  existingServices,
  onAddService,
}) => {
  const [name, setName] = useState('');
  const [layer, setLayer] = useState<ServiceLayer>('compute');
  const [version, setVersion] = useState('v1.0.0');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState(15);
  const [latency, setLatency] = useState('< 5ms');
  const [dockerImage, setDockerImage] = useState('');
  const [connectToId, setConnectToId] = useState<string>(existingServices[0]?.id || '');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setName(preset.name);
    setLayer(preset.layer);
    setVersion(preset.version);
    setCategory(preset.category);
    setCost(preset.cost);
    setLatency(preset.latency);
    setDockerImage(preset.dockerImage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = `${layer}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

    const layerXPositions: Record<string, number> = {
      client: 80,
      edge: 300,
      compute: 520,
      data: 740,
      async: 960,
      infra: 960,
    };

    // Calculate Y offset based on existing services in layer
    const countInLayer = existingServices.filter((s) => s.layer === layer).length;
    const posY = 80 + countInLayer * 125;

    const newService: StackServiceNode = {
      id: newId,
      name: name.trim(),
      layer,
      version: version.trim() || 'v1.0.0',
      category: category.trim() || 'Custom Microservice',
      description: `User-defined ${category || name} node provisioned on internal service mesh.`,
      status: 'healthy',
      costEstimatePerMonth: Number(cost) || 0,
      latencyProfile: latency || '< 5ms',
      dockerImage: dockerImage.trim() || `${newId}:latest`,
      envVariables: { PORT: '8080', NODE_ENV: 'production' },
      ports: ['8080:8080'],
      alternatives: [],
      tags: [layer, 'custom'],
      position: { x: layerXPositions[layer] || 520, y: posY },
    };

    let newConnection: StackConnection | undefined;
    if (connectToId) {
      newConnection = {
        id: `c-${Date.now()}`,
        from: connectToId,
        to: newId,
        protocol: 'Internal TCP / gRPC',
        latency: '< 2ms',
      };
    }

    onAddService(newService, newConnection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg glass-tier-2 rounded-lg border border-zinc-700/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-100 font-['Geist'] tracking-tight">
              Add Service to Architecture Mesh
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset quick buttons */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5">
            Quick Architecture Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2 py-1 text-[11px] rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-zinc-300 transition-colors"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Service Name</label>
              <input
                type="text"
                placeholder="e.g. Meilisearch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Architecture Layer</label>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value as ServiceLayer)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="client">Client / UI</option>
                <option value="edge">Edge & Security</option>
                <option value="compute">Compute & API</option>
                <option value="data">Data Store</option>
                <option value="async">Async & Queue</option>
                <option value="infra">Cloud Infra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Version Tag</label>
              <input
                type="text"
                placeholder="v1.6.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Category / Role</label>
              <input
                type="text"
                placeholder="Search & Indexing Engine"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Monthly Cost ($/mo)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Latency SLA</label>
              <input
                type="text"
                value={latency}
                onChange={(e) => setLatency(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Connect From Existing Node</label>
            <select
              value={connectToId}
              onChange={(e) => setConnectToId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">No incoming connection (isolated node)</option>
              {existingServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.layer})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-[0_0_12px_rgba(99,102,241,0.3)]"
            >
              Provision Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
