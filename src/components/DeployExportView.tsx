/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, FileCode, FileSpreadsheet, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  StackBlueprint,
  generateDockerCompose,
  generateEnvExample,
  generateCliScaffoldCommand,
  exportBlueprintAsMarkdown,
} from '../utils/stackEngine';

interface DeployExportViewProps {
  blueprint: StackBlueprint;
}

type CodeTab = 'compose' | 'env' | 'cli' | 'markdown';

export const DeployExportView: React.FC<DeployExportViewProps> = ({ blueprint }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('compose');
  const [copied, setCopied] = useState(false);

  const composeCode = generateDockerCompose(blueprint);
  const envCode = generateEnvExample(blueprint);
  const cliCommand = generateCliScaffoldCommand(blueprint);
  const markdownSpec = exportBlueprintAsMarkdown(blueprint);

  let currentContent = '';
  let filename = '';

  switch (activeCodeTab) {
    case 'compose':
      currentContent = composeCode;
      filename = 'docker-compose.yml';
      break;
    case 'env':
      currentContent = envCode;
      filename = '.env.example';
      break;
    case 'cli':
      currentContent = cliCommand;
      filename = 'scaffold.sh';
      break;
    case 'markdown':
      currentContent = markdownSpec;
      filename = 'ARCHITECTURE.md';
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (_) {}
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(blueprint, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stack-${blueprint.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-[#030712] p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 font-['Geist'] tracking-tight">
              Deployment & Infrastructure Boilerplate
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Production configuration files, container compose manifests, and environment tokens.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Blueprint</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {filename}</span>
            </button>
          </div>
        </div>

        {/* Code Viewer Card */}
        <div className="border border-zinc-800/80 rounded bg-[#060a12] overflow-hidden">
          {/* Subheader / Tabs */}
          <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveCodeTab('compose')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  activeCodeTab === 'compose'
                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3 h-3 text-indigo-400" />
                <span>docker-compose.yml</span>
              </button>

              <button
                onClick={() => setActiveCodeTab('env')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  activeCodeTab === 'env'
                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>.env.example</span>
              </button>

              <button
                onClick={() => setActiveCodeTab('cli')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  activeCodeTab === 'cli'
                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-mono text-xs text-cyan-400">&gt;_</span>
                <span>CLI Quickstart</span>
              </button>

              <button
                onClick={() => setActiveCodeTab('markdown')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  activeCodeTab === 'markdown'
                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>ARCHITECTURE.md</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded border border-zinc-700/60 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-mono text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span className="font-mono text-[11px]">Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto max-h-[520px]">
            <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre font-['JetBrains_Mono']">
              <code>{currentContent}</code>
            </pre>
          </div>
        </div>

        {/* Quick Setup Instructions Strip */}
        <div className="p-4 rounded border border-zinc-800/80 bg-zinc-900/30 flex items-start gap-3">
          <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-semibold text-zinc-200 block font-['Geist']">
              Local Development Bootstrap
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Run <code className="text-indigo-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">docker compose up -d</code> to spin up all containers on your local mesh network. All environment variable bindings and service ports are pre-configured to match the synthesized topology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
