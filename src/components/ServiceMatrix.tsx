/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ArrowUpDown, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { StackBlueprint, StackServiceNode, ServiceLayer } from '../utils/stackEngine';

interface ServiceMatrixProps {
  blueprint: StackBlueprint;
  onSelectNode: (node: StackServiceNode) => void;
  onSwapService: (nodeId: string, alternative: string) => void;
}

export const ServiceMatrix: React.FC<ServiceMatrixProps> = ({
  blueprint,
  onSelectNode,
  onSwapService,
}) => {
  const [filterLayer, setFilterLayer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredServices = blueprint.services.filter((s) => {
    const matchesLayer = filterLayer === 'all' || s.layer === filterLayer;
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLayer && matchesQuery;
  });

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-[#030712] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 font-['Geist'] tracking-tight">
              Service Catalog & Compatibility Matrix
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Multi-tier inventory of all active services, container images, and runtime latency SLAs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded w-fit">
          {['all', 'client', 'edge', 'compute', 'data', 'async'].map((layer) => (
            <button
              key={layer}
              onClick={() => setFilterLayer(layer)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all capitalize ${
                filterLayer === layer
                  ? 'bg-zinc-800 text-white shadow-sm border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {layer === 'all' ? 'All Services' : layer}
            </button>
          ))}
        </div>

        {/* High-Density Data Grid */}
        <div className="border border-zinc-800/80 rounded overflow-hidden bg-zinc-900/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/70 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Service Node</th>
                <th className="py-2.5 px-4 font-medium">Layer</th>
                <th className="py-2.5 px-4 font-medium">Version</th>
                <th className="py-2.5 px-4 font-medium">Latency SLA</th>
                <th className="py-2.5 px-4 font-medium">Monthly Cost</th>
                <th className="py-2.5 px-4 font-medium">Docker Target</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filteredServices.map((service) => (
                <tr
                  key={service.id}
                  className="hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-zinc-100 font-['Geist'] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{service.name}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {service.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 capitalize">
                      {service.layer}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-zinc-400">
                      {service.version}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-cyan-400 text-[11px]">
                      {service.latencyProfile}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-200 tabular-nums">
                    ${service.costEstimatePerMonth}
                    <span className="text-zinc-500 text-[10px]">/mo</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800/80 max-w-[180px] truncate inline-block">
                      {service.dockerImage || `${service.id}:latest`}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectNode(service)}
                        className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700/60 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {service.alternatives.length > 0 && (
                        <button
                          onClick={() => onSwapService(service.id, service.alternatives[0])}
                          title={`Swap to ${service.alternatives[0]}`}
                          className="px-2 py-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 rounded border border-indigo-800/60 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span className="max-w-[70px] truncate">{service.alternatives[0]}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
