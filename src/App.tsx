/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav, ActiveTab } from './components/TopNav';
import { PromptRail } from './components/PromptRail';
import { TopologyCanvas } from './components/TopologyCanvas';
import { ServiceMatrix } from './components/ServiceMatrix';
import { DecisionsView } from './components/DecisionsView';
import { DeployExportView } from './components/DeployExportView';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { AddServiceModal } from './components/AddServiceModal';
import {
  StackBlueprint,
  StackServiceNode,
  StackConnection,
  StackConstraints,
  ArchitectureDecision,
  synthesizeDefaultBlueprint,
  swapService,
  calculateTotalCost,
  calculateCompatibilityScore,
} from './utils/stackEngine';

export default function App() {
  const [blueprint, setBlueprint] = useState<StackBlueprint>(() =>
    synthesizeDefaultBlueprint(
      'Real-time collaborative whiteboard app with multi-cursor sync, CRDT conflict resolution, pgvector diagram search, and Redis pub/sub fanout.'
    )
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('canvas');
  const [selectedNode, setSelectedNode] = useState<StackServiceNode | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  const handleSynthesize = async (prompt: string, constraints: StackConstraints) => {
    setIsSynthesizing(true);
    try {
      const response = await fetch('/api/generate-stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, constraints }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data?.blueprint) {
        setBlueprint(data.blueprint);
        showToast(
          data.source === 'gemini-4-hydrogen'
            ? 'Architecture synthesized with Gemini AI'
            : 'Architecture topology generated'
        );
      }
    } catch (err) {
      console.warn('Backend API unavailable or error; using local synthesis engine:', err);
      // Fallback deterministic client-side synthesis
      const fallbackBlueprint = synthesizeDefaultBlueprint(prompt, constraints);
      setBlueprint(fallbackBlueprint);
      showToast('Topology synthesized with local engine');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSwapService = (nodeId: string, alternativeName: string) => {
    const updated = swapService(blueprint, nodeId, alternativeName);
    setBlueprint(updated);
    showToast(`Swapped node with ${alternativeName}`);
    if (selectedNode?.id === nodeId) {
      const updatedNode = updated.services.find((s) => s.name === alternativeName);
      if (updatedNode) setSelectedNode(updatedNode);
    }
  };

  const handleAddService = (newService: StackServiceNode, newConnection?: StackConnection) => {
    const updatedServices = [...blueprint.services, newService];
    const updatedConnections = newConnection
      ? [...blueprint.connections, newConnection]
      : blueprint.connections;

    const totalCost = calculateTotalCost(updatedServices);
    const report = calculateCompatibilityScore(updatedServices, updatedConnections);

    setBlueprint({
      ...blueprint,
      services: updatedServices,
      connections: updatedConnections,
      totalMonthlyCost: totalCost,
      compatibilityScore: report.score,
      validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
    });

    showToast(`Provisioned ${newService.name} on service mesh`);
  };

  const handleAddDecision = (newDecision: ArchitectureDecision) => {
    setBlueprint({
      ...blueprint,
      decisions: [newDecision, ...blueprint.decisions],
    });
    showToast(`Recorded ADR: ${newDecision.title}`);
  };

  const handleReset = () => {
    const fresh = synthesizeDefaultBlueprint(
      'Modern B2B enterprise SaaS with multi-tenancy, Stripe billing, and resilient background jobs'
    );
    setBlueprint(fresh);
    showToast('Reset architecture to baseline SaaS template');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#dfe2ef] flex flex-col font-['Inter']">
      {/* Top Bar Navigation conforming to 3-zone contract */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSynthesizeClick={() => handleSynthesize(blueprint.ideaPrompt, blueprint.constraints)}
        isSynthesizing={isSynthesizing}
        validationScore={blueprint.compatibilityScore}
      />

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#090d16] overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              activeTab === 'canvas' ? 'bg-zinc-800 text-white border border-indigo-500/40' : 'text-zinc-400'
            }`}
          >
            Canvas
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              activeTab === 'matrix' ? 'bg-zinc-800 text-white border border-indigo-500/40' : 'text-zinc-400'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              activeTab === 'decisions' ? 'bg-zinc-800 text-white border border-indigo-500/40' : 'text-zinc-400'
            }`}
          >
            ADRs
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              activeTab === 'deploy' ? 'bg-zinc-800 text-white border border-indigo-500/40' : 'text-zinc-400'
            }`}
          >
            Deploy
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Configuration & Idea Prompt Rail */}
        <PromptRail
          blueprint={blueprint}
          onSynthesize={handleSynthesize}
          isSynthesizing={isSynthesizing}
          onReset={handleReset}
        />

        {/* Center / Right Workspace View */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {activeTab === 'canvas' && (
            <TopologyCanvas
              blueprint={blueprint}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={(node) => setSelectedNode(node)}
              onAddNodeClick={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'matrix' && (
            <ServiceMatrix
              blueprint={blueprint}
              onSelectNode={(node) => setSelectedNode(node)}
              onSwapService={handleSwapService}
            />
          )}

          {activeTab === 'decisions' && (
            <DecisionsView
              blueprint={blueprint}
              onAddDecision={handleAddDecision}
            />
          )}

          {activeTab === 'deploy' && (
            <DeployExportView blueprint={blueprint} />
          )}
        </div>
      </main>

      {/* Node Inspector Drawer / Modal */}
      <NodeInspectorModal
        service={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSwapService={handleSwapService}
      />

      {/* Add Custom Service Modal */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingServices={blueprint.services}
        onAddService={handleAddService}
      />

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded bg-zinc-900/90 text-white text-xs border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
