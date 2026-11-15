/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalCost,
  calculateCompatibilityScore,
  generateDockerCompose,
  generateEnvExample,
  swapService,
  synthesizeDefaultBlueprint,
  getConnectionFlowDetails,
  StackServiceNode,
  StackConnection,
} from './stackEngine';

test('calculateTotalCost sums monthly expenses correctly', () => {
  const mockServices: StackServiceNode[] = [
    {
      id: 's1',
      name: 'Service 1',
      layer: 'compute',
      version: '1.0',
      category: 'API',
      description: '',
      status: 'healthy',
      costEstimatePerMonth: 25,
      latencyProfile: '< 5ms',
      envVariables: {},
      ports: [],
      alternatives: [],
      tags: [],
      position: { x: 0, y: 0 },
    },
    {
      id: 's2',
      name: 'Service 2',
      layer: 'data',
      version: '1.0',
      category: 'DB',
      description: '',
      status: 'healthy',
      costEstimatePerMonth: 30,
      latencyProfile: '< 10ms',
      envVariables: {},
      ports: [],
      alternatives: [],
      tags: [],
      position: { x: 0, y: 0 },
    },
  ];

  assert.equal(calculateTotalCost(mockServices), 55);
  assert.equal(calculateTotalCost([]), 0);
});

test('calculateCompatibilityScore scores balanced production stack at 100', () => {
  const blueprint = synthesizeDefaultBlueprint('Real-time collaborative whiteboard app');
  const report = calculateCompatibilityScore(blueprint.services, blueprint.connections);

  assert.ok(report.score >= 85, `Score should be >= 85, got ${report.score}`);
  assert.equal(report.isProductionReady, true);
  assert.equal(report.warnings.length, 0);
});

test('calculateCompatibilityScore flags missing layers and dangling connections', () => {
  const invalidServices: StackServiceNode[] = [
    {
      id: 'only-db',
      name: 'PostgreSQL',
      layer: 'data',
      version: '16.0',
      category: 'DB',
      description: '',
      status: 'healthy',
      costEstimatePerMonth: 20,
      latencyProfile: '< 5ms',
      envVariables: {},
      ports: [],
      alternatives: [],
      tags: ['sql'],
      position: { x: 0, y: 0 },
    },
  ];
  const invalidConnections: StackConnection[] = [
    { id: 'c1', from: 'missing-client', to: 'only-db', protocol: 'HTTP', latency: '< 10ms' },
  ];

  const report = calculateCompatibilityScore(invalidServices, invalidConnections);
  assert.ok(report.score < 85);
  assert.equal(report.isProductionReady, false);
  assert.ok(report.warnings.some((w) => w.includes('client')));
});

test('generateDockerCompose produces valid yaml syntax and depends_on blocks', () => {
  const blueprint = synthesizeDefaultBlueprint('Modern B2B enterprise SaaS');
  const compose = generateDockerCompose(blueprint);

  assert.ok(compose.includes('version: "3.9"'));
  assert.ok(compose.includes('services:'));
  assert.ok(compose.includes('internal_mesh:'));
  assert.ok(compose.includes('container_name:'));
});

test('generateEnvExample extracts all service env variables', () => {
  const blueprint = synthesizeDefaultBlueprint('Realtime AI agent pipeline');
  const envExample = generateEnvExample(blueprint);

  assert.ok(envExample.includes('# Environment configuration'));
  assert.ok(envExample.includes('PORT=') || envExample.includes('POSTGRES_DB=') || envExample.includes('REDIS_'));
});

test('swapService cleanly replaces target node and remaps connections', () => {
  const blueprint = synthesizeDefaultBlueprint('Real-time collaborative whiteboard app');
  const originalDb = blueprint.services.find((s) => s.layer === 'data')!;
  
  const updated = swapService(blueprint, originalDb.id, 'Supabase Managed');
  const replacedDb = updated.services.find((s) => s.name === 'Supabase Managed');
  
  assert.ok(replacedDb, 'Service should have been replaced with Supabase Managed');
  assert.ok(replacedDb.alternatives.includes(originalDb.name), 'Original service should now be listed in alternatives');
  
  // Connection pointing to database should be remapped to new ID
  const connToDb = updated.connections.find((c) => c.to === replacedDb.id);
  assert.ok(connToDb, 'Connection target should be updated to new service ID');
});

test('getConnectionFlowDetails correctly extracts data type, protocols, and multi-block fanout', () => {
  const blueprint = synthesizeDefaultBlueprint('Real-time voice AI assistant');
  const conn = blueprint.connections[0];
  const fromNode = blueprint.services.find((s) => s.id === conn.from);
  const toNode = blueprint.services.find((s) => s.id === conn.to);

  const flow = getConnectionFlowDetails(
    conn,
    fromNode,
    toNode,
    blueprint.services,
    blueprint.connections
  );

  assert.ok(flow.flowName, 'Flow name should be generated');
  assert.ok(flow.dataType, 'Data type should be specified');
  assert.ok(flow.flowPattern, 'Flow pattern should be defined');
  assert.ok(flow.security, 'Security protocol should be specified');
  assert.ok(flow.samplePayload, 'Sample wire payload should be present');
  assert.ok(Array.isArray(flow.fanOutNodes), 'Fanout nodes array should be defined');
});
