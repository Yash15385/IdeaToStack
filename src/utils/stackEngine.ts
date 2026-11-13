/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IdeaToStack Core Architecture Engine
 * Pure logic calculations for stack topology, compatibility analysis,
 * docker-compose generation, cost calculation, and ADR management.
 */

export type ServiceLayer = 'client' | 'edge' | 'compute' | 'data' | 'async' | 'infra';

export interface StackServiceNode {
  id: string;
  name: string;
  layer: ServiceLayer;
  version: string;
  category: string;
  description: string;
  status: 'healthy' | 'validating' | 'configured';
  costEstimatePerMonth: number;
  latencyProfile: string;
  dockerImage?: string;
  envVariables: Record<string, string>;
  ports: string[];
  alternatives: string[];
  tags: string[];
  position: { x: number; y: number };
}

export interface StackConnection {
  id: string;
  from: string;
  to: string;
  protocol: string;
  latency: string;
  description?: string;
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  status: 'Accepted' | 'Proposed' | 'Deprecated';
  context: string;
  decision: string;
  consequences: string;
  alternativesConsidered: string[];
}

export interface StackConstraints {
  hosting: 'Cloud Run / GCP' | 'AWS ECS' | 'Cloudflare + Edge' | 'Self-Hosted / Kubernetes';
  language: 'TypeScript' | 'Go' | 'Python' | 'Rust';
  budgetTier: 'Free Tier' | 'Cost-Optimized (<$50/mo)' | 'Scale-Ready (<$250/mo)' | 'Enterprise';
  scalability: 'MVP (0-1k users)' | 'Growth (1k-100k users)' | 'High Scale (100k+ users)';
}

export interface StackBlueprint {
  id: string;
  title: string;
  tagline: string;
  ideaPrompt: string;
  constraints: StackConstraints;
  services: StackServiceNode[];
  connections: StackConnection[];
  decisions: ArchitectureDecision[];
  totalMonthlyCost: number;
  compatibilityScore: number;
  validationStatus: 'Production Ready' | 'Review Recommended' | 'Draft';
  estimatedLatencyMs: number;
}

export interface CompatibilityReport {
  score: number;
  isProductionReady: boolean;
  warnings: string[];
  strengths: string[];
}

/**
 * Computes aggregate monthly infrastructure estimate across services.
 */
export function calculateTotalCost(services: StackServiceNode[]): number {
  if (!services || services.length === 0) return 0;
  return services.reduce((acc, curr) => acc + (curr.costEstimatePerMonth || 0), 0);
}

/**
 * Validates stack cohesion and compatibility between connected nodes and architectural layers.
 */
export function calculateCompatibilityScore(
  services: StackServiceNode[],
  connections: StackConnection[]
): CompatibilityReport {
  const warnings: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  if (services.length === 0) {
    return {
      score: 0,
      isProductionReady: false,
      warnings: ['No services defined in blueprint.'],
      strengths: [],
    };
  }

  const layersPresent = new Set(services.map((s) => s.layer));
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  // Layer checks
  if (!layersPresent.has('client')) {
    warnings.push('Stack is missing a dedicated client/frontend presentation layer.');
    score -= 15;
  } else {
    strengths.push('Client presentation layer configured.');
  }

  if (!layersPresent.has('compute')) {
    warnings.push('Stack has no application compute or API runtime.');
    score -= 20;
  } else {
    strengths.push('Compute runtime provisioned.');
  }

  if (!layersPresent.has('data')) {
    warnings.push('Stack has no persistent data store layer.');
    score -= 15;
  } else {
    strengths.push('Persistent storage layer attached.');
  }

  // Connection coherence checks
  if (connections.length === 0 && services.length > 1) {
    warnings.push('Nodes are isolated; no interconnect wiring specified.');
    score -= 25;
  } else {
    let danglingPointers = 0;
    connections.forEach((conn) => {
      if (!serviceMap.has(conn.from) || !serviceMap.has(conn.to)) {
        danglingPointers++;
      }
    });

    if (danglingPointers > 0) {
      warnings.push(`${danglingPointers} connection link(s) reference missing service nodes.`);
      score -= danglingPointers * 10;
    } else {
      strengths.push('All connection topologies point to active infrastructure nodes.');
    }
  }

  // Caching check for databases
  const hasDb = services.some((s) => s.layer === 'data' && s.tags.includes('sql'));
  const hasCache = services.some((s) => s.tags.includes('cache') || s.name.toLowerCase().includes('redis'));
  if (hasDb && hasCache) {
    strengths.push('In-memory caching layer mitigates database load and optimizes read latency.');
  } else if (hasDb && !hasCache && services.length >= 4) {
    warnings.push('Consider attaching an in-memory caching node (e.g. Redis) to buffer database query spikes.');
    score -= 5;
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  return {
    score: boundedScore,
    isProductionReady: boundedScore >= 85 && warnings.length === 0,
    warnings,
    strengths,
  };
}

/**
 * Generates production-grade docker-compose.yml spec from stack blueprint.
 */
export function generateDockerCompose(blueprint: StackBlueprint): string {
  const lines: string[] = [];
  lines.push('# ========================================================');
  lines.push(`# IdeaToStack Generated Compose: ${blueprint.title}`);
  lines.push(`# Prompt: "${blueprint.ideaPrompt.slice(0, 60)}${blueprint.ideaPrompt.length > 60 ? '...' : ''}"`);
  lines.push('# Generated with production environment bindings');
  lines.push('# ========================================================');
  lines.push('version: "3.9"');
  lines.push('');
  lines.push('services:');

  blueprint.services.forEach((service) => {
    const slug = service.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    lines.push(`  ${slug}:`);
    lines.push(`    container_name: ${slug}`);
    lines.push(`    image: ${service.dockerImage || `${slug}:latest`}`);
    lines.push('    restart: unless-stopped');

    if (service.ports && service.ports.length > 0) {
      lines.push('    ports:');
      service.ports.forEach((p) => lines.push(`      - "${p}"`));
    }

    if (service.envVariables && Object.keys(service.envVariables).length > 0) {
      lines.push('    environment:');
      Object.entries(service.envVariables).forEach(([k, v]) => {
        lines.push(`      - ${k}=${v}`);
      });
    }

    // Depends on derived from connections
    const dependencies = blueprint.connections
      .filter((c) => c.from === service.id)
      .map((c) => c.to.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))
      .filter((dep) => dep !== slug);

    if (dependencies.length > 0) {
      lines.push('    depends_on:');
      Array.from(new Set(dependencies)).forEach((dep) => lines.push(`      - ${dep}`));
    }

    lines.push('    networks:');
    lines.push('      - internal_mesh');
    lines.push('');
  });

  lines.push('networks:');
  lines.push('  internal_mesh:');
  lines.push('    driver: bridge');

  return lines.join('\n');
}

/**
 * Generates an annotated .env.example file.
 */
export function generateEnvExample(blueprint: StackBlueprint): string {
  const lines: string[] = [];
  lines.push(`# Environment configuration for ${blueprint.title}`);
  lines.push(`# Generated by IdeaToStack Engine`);
  lines.push(`# NODE_ENV=development`);
  lines.push('');

  blueprint.services.forEach((service) => {
    if (Object.keys(service.envVariables).length > 0) {
      lines.push(`### ${service.name} (${service.category})`);
      Object.entries(service.envVariables).forEach(([k, v]) => {
        lines.push(`${k}=${v}`);
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}

/**
 * Generates quickstart CLI command snippet.
 */
export function generateCliScaffoldCommand(blueprint: StackBlueprint): string {
  const slug = blueprint.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `npx create-idea-stack ${slug} --template=${blueprint.constraints.language.toLowerCase()} --hosting=${blueprint.constraints.hosting.split(' ')[0].toLowerCase()}`;
}

/**
 * Exports complete architectural design record (ADR + topology) as Markdown.
 */
export function exportBlueprintAsMarkdown(blueprint: StackBlueprint): string {
  const lines: string[] = [];
  lines.push(`# Architecture Blueprint: ${blueprint.title}`);
  lines.push(`> ${blueprint.tagline}`);
  lines.push('');
  lines.push(`- **Original Prompt:** ${blueprint.ideaPrompt}`);
  lines.push(`- **Primary Language:** ${blueprint.constraints.language}`);
  lines.push(`- **Target Cloud Hosting:** ${blueprint.constraints.hosting}`);
  lines.push(`- **Budget Profile:** ${blueprint.constraints.budgetTier} (~$${blueprint.totalMonthlyCost}/mo)`);
  lines.push(`- **Compatibility Score:** ${blueprint.compatibilityScore}% (${blueprint.validationStatus})`);
  lines.push(`- **Estimated Latency Budget:** ${blueprint.estimatedLatencyMs}ms`);
  lines.push('');
  lines.push('## 1. Topology Services');
  lines.push('| Service | Layer | Version | Latency | Est. Cost | Category |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
  blueprint.services.forEach((s) => {
    lines.push(`| **${s.name}** | \`${s.layer}\` | \`${s.version}\` | ${s.latencyProfile} | $${s.costEstimatePerMonth}/mo | ${s.category} |`);
  });
  lines.push('');
  lines.push('## 2. Infrastructure Wiring & Connections');
  lines.push('| Origin | Protocol | Destination | Latency |');
  lines.push('| :--- | :--- | :--- | :--- |');
  const serviceMap = new Map(blueprint.services.map((s) => [s.id, s.name]));
  blueprint.connections.forEach((c) => {
    const fromName = serviceMap.get(c.from) || c.from;
    const toName = serviceMap.get(c.to) || c.to;
    lines.push(`| ${fromName} | \`${c.protocol}\` | ${toName} | ${c.latency} |`);
  });
  lines.push('');
  lines.push('## 3. Architecture Decision Records (ADRs)');
  blueprint.decisions.forEach((d, idx) => {
    lines.push(`### ADR ${String(idx + 1).padStart(2, '0')}: ${d.title} [${d.status}]`);
    lines.push(`- **Context:** ${d.context}`);
    lines.push(`- **Decision:** ${d.decision}`);
    lines.push(`- **Consequences:** ${d.consequences}`);
    if (d.alternativesConsidered?.length > 0) {
      lines.push(`- **Alternatives Evaluated:** ${d.alternativesConsidered.join(', ')}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Swaps a service in the blueprint with an alternative, recalculating cost and compatibility.
 */
export function swapService(
  blueprint: StackBlueprint,
  nodeId: string,
  alternativeName: string
): StackBlueprint {
  const serviceIndex = blueprint.services.findIndex((s) => s.id === nodeId);
  if (serviceIndex === -1) return blueprint;

  const oldService = blueprint.services[serviceIndex];
  const oldName = oldService.name;

  // Derive replacement attributes
  const updatedService: StackServiceNode = {
    ...oldService,
    name: alternativeName,
    id: `${oldService.layer}-${alternativeName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    dockerImage: `${alternativeName.toLowerCase().replace(/[^a-z0-9]/g, '')}:latest`,
    alternatives: [
      ...oldService.alternatives.filter((a) => a.toLowerCase() !== alternativeName.toLowerCase()),
      oldName,
    ],
  };

  // Adjust cost profile if known
  if (alternativeName.toLowerCase().includes('supabase')) {
    updatedService.costEstimatePerMonth = 25;
    updatedService.version = 'v2.64.0';
  } else if (alternativeName.toLowerCase().includes('redis')) {
    updatedService.costEstimatePerMonth = 15;
    updatedService.version = 'v7.2.4';
  } else if (alternativeName.toLowerCase().includes('dragonfly')) {
    updatedService.costEstimatePerMonth = 12;
    updatedService.version = 'v1.14.0';
  } else if (alternativeName.toLowerCase().includes('clickhouse')) {
    updatedService.costEstimatePerMonth = 40;
    updatedService.version = 'v24.2';
  }

  const updatedServices = [...blueprint.services];
  updatedServices[serviceIndex] = updatedService;

  // Remap connections referencing old id to new id
  const updatedConnections = blueprint.connections.map((c) => ({
    ...c,
    from: c.from === oldService.id ? updatedService.id : c.from,
    to: c.to === oldService.id ? updatedService.id : c.to,
  }));

  const totalMonthlyCost = calculateTotalCost(updatedServices);
  const report = calculateCompatibilityScore(updatedServices, updatedConnections);

  return {
    ...blueprint,
    services: updatedServices,
    connections: updatedConnections,
    totalMonthlyCost,
    compatibilityScore: report.score,
    validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
  };
}

/**
 * Intelligent deterministic blueprint synthesis engine based on natural language intent.
 */
export function synthesizeDefaultBlueprint(
  ideaPrompt: string,
  constraints?: Partial<StackConstraints>
): StackBlueprint {
  const promptLower = ideaPrompt.toLowerCase();

  const finalConstraints: StackConstraints = {
    hosting: constraints?.hosting || 'Cloud Run / GCP',
    language: constraints?.language || 'TypeScript',
    budgetTier: constraints?.budgetTier || 'Cost-Optimized (<$50/mo)',
    scalability: constraints?.scalability || 'Growth (1k-100k users)',
  };

  // Profile 1: Real-time collaborative canvas or chat
  if (
    promptLower.includes('realtime') ||
    promptLower.includes('real-time') ||
    promptLower.includes('collab') ||
    promptLower.includes('whiteboard') ||
    promptLower.includes('canvas') ||
    promptLower.includes('chat')
  ) {
    const services: StackServiceNode[] = [
      {
        id: 'client-app',
        name: 'React 19 + Konva / Canvas',
        layer: 'client',
        version: 'v19.0',
        category: 'Interactive Web UI',
        description: 'Zero-latency vector rendering engine with client-side optimistic reconciliation.',
        status: 'healthy',
        costEstimatePerMonth: 0,
        latencyProfile: '< 1ms local',
        dockerImage: 'node:22-alpine',
        envVariables: { VITE_WS_URL: 'wss://api.stack.internal/ws', VITE_API_BASE: 'https://api.stack.internal' },
        ports: ['3000:3000'],
        alternatives: ['Next.js 15 App Router', 'Svelte 5', 'SolidJS'],
        tags: ['react', 'webgl', 'canvas', 'pwa'],
        position: { x: 80, y: 160 },
      },
      {
        id: 'edge-gateway',
        name: 'Cloudflare Edge / Envoy',
        layer: 'edge',
        version: 'v1.28',
        category: 'Edge WSS Proxy',
        description: 'Global TLS termination, DDoS mitigation, and WebSocket persistent connection routing.',
        status: 'healthy',
        costEstimatePerMonth: 5,
        latencyProfile: '< 10ms edge',
        dockerImage: 'envoyproxy/envoy:v1.28.0',
        envVariables: { ENVOY_PORT: '443', LOG_LEVEL: 'info' },
        ports: ['80:80', '443:443'],
        alternatives: ['NGINX Ingress', 'Traefik v3', 'AWS CloudFront'],
        tags: ['edge', 'websocket', 'loadbalancer'],
        position: { x: 300, y: 160 },
      },
      {
        id: 'compute-ws-hub',
        name: 'Node.js / uWebSockets Server',
        layer: 'compute',
        version: 'v22.5',
        category: 'High-Throughput WS Engine',
        description: 'CRDT state synchronizer handling presence, cursor tracks, and delta broadcasts.',
        status: 'healthy',
        costEstimatePerMonth: 20,
        latencyProfile: '< 4ms dispatch',
        dockerImage: 'node:22-slim',
        envVariables: { PORT: '8080', REDIS_HOST: 'cache-redis', DB_URI: 'postgresql://postgres:secret@db-postgres:5432/app' },
        ports: ['8080:8080'],
        alternatives: ['Go Fiber Websockets', 'Rust Axum', 'Elixir Phoenix Channels'],
        tags: ['crdt', 'websocket', 'realtime'],
        position: { x: 520, y: 160 },
      },
      {
        id: 'cache-redis',
        name: 'Redis 7 (Pub/Sub & Ephemeral)',
        layer: 'async',
        version: 'v7.2.4',
        category: 'Pub/Sub Broker & Presence',
        description: 'Multi-node presence sync, room pub/sub channels, and sub-millisecond session state.',
        status: 'healthy',
        costEstimatePerMonth: 15,
        latencyProfile: '< 1ms ram',
        dockerImage: 'redis:7.2-alpine',
        envVariables: { REDIS_MAXMEMORY: '512mb', REDIS_MAXMEMORY_POLICY: 'allkeys-lru' },
        ports: ['6379:6379'],
        alternatives: ['Dragonfly DB', 'NATS Core', 'KeyDB'],
        tags: ['cache', 'pubsub', 'in-memory'],
        position: { x: 740, y: 80 },
      },
      {
        id: 'db-postgres',
        name: 'PostgreSQL 16 + pgvector',
        layer: 'data',
        version: 'v16.1',
        category: 'Relational & Snapshot Store',
        description: 'Periodic snapshot durability, document history, and user workspace authorization.',
        status: 'healthy',
        costEstimatePerMonth: 25,
        latencyProfile: '< 8ms p95',
        dockerImage: 'pgvector/pgvector:pg16',
        envVariables: { POSTGRES_DB: 'canvas_store', POSTGRES_USER: 'admin', POSTGRES_PASSWORD: 'secretpassword' },
        ports: ['5432:5432'],
        alternatives: ['Supabase Managed', 'CockroachDB', 'Neon Serverless'],
        tags: ['sql', 'acid', 'relational', 'pgvector'],
        position: { x: 740, y: 260 },
      },
      {
        id: 'storage-s3',
        name: 'Cloudflare R2 / S3 Object Store',
        layer: 'infra',
        version: 'v4.0',
        category: 'Binary Object Storage',
        description: 'Zero-egress asset storage for exported PNGs, SVG canvases, and user file attachments.',
        status: 'healthy',
        costEstimatePerMonth: 5,
        latencyProfile: '< 25ms TTFB',
        dockerImage: 'minio/minio:RELEASE.2024-01',
        envVariables: { S3_BUCKET: 'canvas-assets', S3_REGION: 'auto' },
        ports: ['9000:9000'],
        alternatives: ['AWS S3', 'Google Cloud Storage', 'Wasabi'],
        tags: ['storage', 's3', 'media'],
        position: { x: 960, y: 160 },
      },
    ];

    const connections: StackConnection[] = [
      { id: 'c1', from: 'client-app', to: 'edge-gateway', protocol: 'WSS / HTTP2', latency: '< 12ms' },
      { id: 'c2', from: 'edge-gateway', to: 'compute-ws-hub', protocol: 'Internal TCP Proxy', latency: '< 2ms' },
      { id: 'c3', from: 'compute-ws-hub', to: 'cache-redis', protocol: 'RESP3 Pub/Sub', latency: '< 1ms' },
      { id: 'c4', from: 'compute-ws-hub', to: 'db-postgres', protocol: 'PostgreSQL Wire', latency: '< 4ms' },
      { id: 'c5', from: 'compute-ws-hub', to: 'storage-s3', protocol: 'S3 API / HTTPS', latency: '< 18ms' },
    ];

    const decisions: ArchitectureDecision[] = [
      {
        id: 'adr-01',
        title: 'Adopt Hybrid WebSocket Hub with Redis Pub/Sub for CRDT Fanout',
        status: 'Accepted',
        context: 'High-frequency cursor movements and collaborative canvas mutations require sub-16ms latency broadcast without exhausting backend memory.',
        decision: 'Pair lightweight uWebSockets Node server with Redis pub/sub backplane to decouple client sockets from persistence.',
        consequences: 'Scales horizontally across container pods without cross-instance socket drift; periodic state flushes save database write IOPS.',
        alternativesConsidered: ['Direct database polling', 'Single-node monolithic websocket server', 'Firebase Realtime DB'],
      },
      {
        id: 'adr-02',
        title: 'Use PostgreSQL with pgvector for Vector Search & Canvas Snapshots',
        status: 'Accepted',
        context: 'Canvas documents need point-in-time rollback plus semantic search over diagram components.',
        decision: 'Single database engine for relational tables and vector embeddings to avoid dual-write synchronization bugs.',
        consequences: 'Simplifies backups, operational complexity, and zero out-of-sync states.',
        alternativesConsidered: ['Pinecone + MySQL', 'MongoDB GridFS'],
      },
    ];

    const totalCost = calculateTotalCost(services);
    const report = calculateCompatibilityScore(services, connections);

    return {
      id: 'stack-realtime-canvas',
      title: 'Real-Time Collaborative Canvas & Sync Mesh',
      tagline: 'Ultra-low latency CRDT document mesh with Redis fanout and pgvector snapshots',
      ideaPrompt,
      constraints: finalConstraints,
      services,
      connections,
      decisions,
      totalMonthlyCost: totalCost,
      compatibilityScore: report.score,
      validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
      estimatedLatencyMs: 14,
    };
  }

  // Profile 2: AI Agent / LLM RAG Pipeline
  if (
    promptLower.includes('ai') ||
    promptLower.includes('llm') ||
    promptLower.includes('agent') ||
    promptLower.includes('rag') ||
    promptLower.includes('vector') ||
    promptLower.includes('gemini') ||
    promptLower.includes('bot')
  ) {
    const services: StackServiceNode[] = [
      {
        id: 'client-chat',
        name: 'Next.js 15 App Router + Tailwind',
        layer: 'client',
        version: 'v15.2.0',
        category: 'Streaming Web Client',
        description: 'Server components with SSE streaming hook for real-time generative tokens and interactive markdown.',
        status: 'healthy',
        costEstimatePerMonth: 0,
        latencyProfile: '< 30ms TTFB',
        dockerImage: 'node:22-alpine',
        envVariables: { NEXT_PUBLIC_API_URL: 'https://api.agentic.internal' },
        ports: ['3000:3000'],
        alternatives: ['Remix Vite', 'Astro 4', 'Vite React 19 SPA'],
        tags: ['nextjs', 'react', 'streaming', 'tailwind'],
        position: { x: 80, y: 160 },
      },
      {
        id: 'edge-router',
        name: 'Kong API Gateway',
        layer: 'edge',
        version: 'v3.5',
        category: 'API Gateway & Rate Limiter',
        description: 'Token quota enforcement, API key validation, and SSE connection pass-through.',
        status: 'healthy',
        costEstimatePerMonth: 10,
        latencyProfile: '< 2ms gateway',
        dockerImage: 'kong:3.5-alpine',
        envVariables: { KONG_DATABASE: 'off', KONG_DECLARATIVE_CONFIG: '/etc/kong/kong.yml' },
        ports: ['8000:8000', '8443:8443'],
        alternatives: ['Cloudflare API Shield', 'Tyk Gateway', 'FastAPI Proxy'],
        tags: ['api-gateway', 'rate-limit', 'auth'],
        position: { x: 300, y: 160 },
      },
      {
        id: 'compute-agent',
        name: 'Python FastAPI / LangChain Engine',
        layer: 'compute',
        version: 'v0.110.0',
        category: 'Agentic Orchestration Runtime',
        description: 'Async task execution, prompt synthesis, tool calling, and Gemini API integration.',
        status: 'healthy',
        costEstimatePerMonth: 30,
        latencyProfile: '< 25ms cold',
        dockerImage: 'tiangolo/uvicorn-gunicorn-fastapi:python3.11',
        envVariables: { GEMINI_API_KEY: 'env(SECRET)', VECTOR_URL: 'http://db-qdrant:6333', REDIS_URL: 'redis://cache-redis:6379' },
        ports: ['8000:8000'],
        alternatives: ['Go LangGraph', 'TypeScript LangChain Node', 'Rust Actix Agent'],
        tags: ['fastapi', 'python', 'ai-agent', 'gemini'],
        position: { x: 520, y: 160 },
      },
      {
        id: 'db-qdrant',
        name: 'Qdrant Vector Database',
        layer: 'data',
        version: 'v1.7.4',
        category: 'Vector Similarity Engine',
        description: 'High-dimensional semantic vector indexing, payload filtering, and sub-10ms similarity queries.',
        status: 'healthy',
        costEstimatePerMonth: 25,
        latencyProfile: '< 7ms recall',
        dockerImage: 'qdrant/qdrant:v1.7.4',
        envVariables: { QDRANT_SERVICE_PORT: '6333' },
        ports: ['6333:6333'],
        alternatives: ['pgvector Postgres', 'Milvus', 'ChromaDB'],
        tags: ['vector-db', 'rag', 'embeddings', 'similarity'],
        position: { x: 740, y: 80 },
      },
      {
        id: 'db-postgres',
        name: 'PostgreSQL 16 (Auditing & Memory)',
        layer: 'data',
        version: 'v16.1',
        category: 'Conversation & User Ledger',
        description: 'Session histories, structured agent evaluations, feedback metrics, and user tenancy.',
        status: 'healthy',
        costEstimatePerMonth: 20,
        latencyProfile: '< 5ms query',
        dockerImage: 'postgres:16-alpine',
        envVariables: { POSTGRES_DB: 'agent_logs', POSTGRES_PASSWORD: 'secure_password' },
        ports: ['5432:5432'],
        alternatives: ['Supabase', 'PlanetScale', 'Neon'],
        tags: ['sql', 'relational', 'history'],
        position: { x: 740, y: 260 },
      },
      {
        id: 'async-celery',
        name: 'Redis 7 + Celery Workers',
        layer: 'async',
        version: 'v5.3.6',
        category: 'Async Document Pipeline',
        description: 'Background ingestion, chunking, OCR document parsing, and batch embedding regeneration.',
        status: 'healthy',
        costEstimatePerMonth: 15,
        latencyProfile: '< 3ms queue',
        dockerImage: 'python:3.11-slim',
        envVariables: { CELERY_BROKER_URL: 'redis://cache-redis:6379/0' },
        ports: [],
        alternatives: ['Temporal.io', 'BullMQ Node', 'AWS SQS'],
        tags: ['background-queue', 'chunking', 'embeddings'],
        position: { x: 960, y: 160 },
      },
    ];

    const connections: StackConnection[] = [
      { id: 'c1', from: 'client-chat', to: 'edge-router', protocol: 'HTTPS / SSE', latency: '< 20ms' },
      { id: 'c2', from: 'edge-router', to: 'compute-agent', protocol: 'HTTP/2 Streaming', latency: '< 3ms' },
      { id: 'c3', from: 'compute-agent', to: 'db-qdrant', protocol: 'gRPC / HTTP', latency: '< 6ms' },
      { id: 'c4', from: 'compute-agent', to: 'db-postgres', protocol: 'SQLAlchemy Pool', latency: '< 4ms' },
      { id: 'c5', from: 'compute-agent', to: 'async-celery', protocol: 'Redis AMQP Protocol', latency: '< 2ms' },
    ];

    const decisions: ArchitectureDecision[] = [
      {
        id: 'adr-01',
        title: 'Decouple Ingestion from Agent Query Runtime via Celery Workers',
        status: 'Accepted',
        context: 'Embedding PDF files and web scrapes involves heavy CPU and unpredictable memory spikes that must not degrade live chat SSE response streaming.',
        decision: 'Offload ingestion and semantic chunking to Celery async queues with Redis broker.',
        consequences: 'Protects user response latencies; allows scalable worker autoscaling based on queue depth.',
        alternativesConsidered: ['Synchronous FastAPI in-process background tasks', 'AWS Lambda trigger'],
      },
      {
        id: 'adr-02',
        title: 'Dedicated Vector Engine (Qdrant) with Metadata Filtering',
        status: 'Accepted',
        context: 'RAG search requires dynamic multi-tenant filtering (e.g. organization_id, doc_type) over millions of vector embeddings.',
        decision: 'Provision Qdrant for SIMD-accelerated cosine distance search with built-in payload indexes.',
        consequences: 'Sub-10ms vector recall; avoids heavy index locking on the primary relational database.',
        alternativesConsidered: ['pgvector', 'Pinecone Managed Cloud'],
      },
    ];

    const totalCost = calculateTotalCost(services);
    const report = calculateCompatibilityScore(services, connections);

    return {
      id: 'stack-ai-rag-agent',
      title: 'Agentic RAG Pipeline & Semantic Intelligence Mesh',
      tagline: 'High-performance streaming agent with Qdrant vector store and async document parsing',
      ideaPrompt,
      constraints: finalConstraints,
      services,
      connections,
      decisions,
      totalMonthlyCost: totalCost,
      compatibilityScore: report.score,
      validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
      estimatedLatencyMs: 38,
    };
  }

  // Profile 3: Default High-Velocity B2B SaaS / Fintech / Marketplace
  const services: StackServiceNode[] = [
    {
      id: 'client-web',
      name: 'React 19 + Vite / Tailwind',
      layer: 'client',
      version: 'v19.0.1',
      category: 'Web App & Dashboard',
      description: 'Single-page web client with modern technical glassmorphism, responsive data grids, and keyboard shortcuts.',
      status: 'healthy',
      costEstimatePerMonth: 0,
      latencyProfile: '< 15ms CDN',
      dockerImage: 'node:22-alpine',
      envVariables: { VITE_API_URL: 'https://api.enterprise.internal' },
      ports: ['3000:3000'],
      alternatives: ['Next.js 15', 'Nuxt 3', 'Remix'],
      tags: ['react', 'spa', 'vite', 'tailwind'],
      position: { x: 80, y: 160 },
    },
    {
      id: 'edge-gateway',
      name: 'Cloudflare Workers / Edge Gateway',
      layer: 'edge',
      version: 'v2024.1',
      category: 'Zero-Trust Gateway & WAF',
      description: 'Edge geo-routing, security headers, DDoS defense, and JWT signature verification before origin hits.',
      status: 'healthy',
      costEstimatePerMonth: 5,
      latencyProfile: '< 5ms edge',
      dockerImage: 'cloudflare/cloudflared:latest',
      envVariables: { CF_ZONE_ID: 'prod_zone_01', RATE_LIMIT_RPM: '600' },
      ports: ['443:443'],
      alternatives: ['AWS API Gateway', 'Envoy Gateway', 'Traefik v3'],
      tags: ['edge', 'waf', 'security', 'cdn'],
      position: { x: 300, y: 160 },
    },
    {
      id: 'compute-api',
      name: 'Go Fiber / Node Fastify Core',
      layer: 'compute',
      version: 'v2.52.0',
      category: 'Scalable Microservice API',
      description: 'High-throughput REST/GraphQL gateway managing multi-tenant business transactions, billing, and ACLs.',
      status: 'healthy',
      costEstimatePerMonth: 25,
      latencyProfile: '< 6ms p95',
      dockerImage: 'golang:1.22-alpine',
      envVariables: { PORT: '8080', DATABASE_URL: 'postgres://app:secret@db-postgres:5432/primary_db', REDIS_HOST: 'cache-redis:6379' },
      ports: ['8080:8080'],
      alternatives: ['Python FastAPI', 'Rust Axum', 'NestJS'],
      tags: ['golang', 'api', 'microservice', 'low-latency'],
      position: { x: 520, y: 160 },
    },
    {
      id: 'db-postgres',
      name: 'PostgreSQL 16 + Drizzle ORM',
      layer: 'data',
      version: 'v16.1',
      category: 'Relational ACID Core',
      description: 'Strict schema enforcement, row-level security (RLS) for multi-tenancy, and automated point-in-time recovery.',
      status: 'healthy',
      costEstimatePerMonth: 25,
      latencyProfile: '< 6ms query',
      dockerImage: 'postgres:16-alpine',
      envVariables: { POSTGRES_DB: 'enterprise_core', POSTGRES_USER: 'app_user', POSTGRES_PASSWORD: 'encrypted_vault' },
      ports: ['5432:5432'],
      alternatives: ['Supabase Enterprise', 'MySQL 8.4', 'CockroachDB Serverless'],
      tags: ['sql', 'acid', 'drizzle', 'rls'],
      position: { x: 740, y: 160 },
    },
    {
      id: 'cache-redis',
      name: 'Dragonfly / Redis 7',
      layer: 'async',
      version: 'v7.2.4',
      category: 'Distributed Cache & Rate Buffer',
      description: 'Session token verification, cache aside for expensive queries, and API rate-limit token buckets.',
      status: 'healthy',
      costEstimatePerMonth: 15,
      latencyProfile: '< 1ms memory',
      dockerImage: 'dragonflydb/dragonfly:latest',
      envVariables: { DFLY_MAXMEMORY: '1gb' },
      ports: ['6379:6379'],
      alternatives: ['AWS ElastiCache', 'Memcached', 'Upstash Redis'],
      tags: ['cache', 'in-memory', 'sessions'],
      position: { x: 960, y: 80 },
    },
    {
      id: 'queue-temporal',
      name: 'Temporal.io / BullMQ Orchestrator',
      layer: 'async',
      version: 'v1.23.0',
      category: 'Durable Execution Engine',
      description: 'Fault-tolerant multi-step billing cycles, customer onboarding workflows, and webhook retry sagas.',
      status: 'healthy',
      costEstimatePerMonth: 20,
      latencyProfile: '< 10ms dispatch',
      dockerImage: 'temporalio/auto-setup:1.23.0',
      envVariables: { TEMPORAL_CLI_ADDRESS: 'temporal:7233' },
      ports: ['7233:7233'],
      alternatives: ['AWS SQS + SNS', 'Kafka Strimzi', 'RabbitMQ'],
      tags: ['orchestration', 'workflow', 'durability'],
      position: { x: 960, y: 260 },
    },
  ];

  const connections: StackConnection[] = [
    { id: 'c1', from: 'client-web', to: 'edge-gateway', protocol: 'HTTPS / TLS 1.3', latency: '< 14ms' },
    { id: 'c2', from: 'edge-gateway', to: 'compute-api', protocol: 'Private VPC Proxy', latency: '< 2ms' },
    { id: 'c3', from: 'compute-api', to: 'db-postgres', protocol: 'PgWire / Connection Pool', latency: '< 3ms' },
    { id: 'c4', from: 'compute-api', to: 'cache-redis', protocol: 'RESP3 Protocol', latency: '< 1ms' },
    { id: 'c5', from: 'compute-api', to: 'queue-temporal', protocol: 'gRPC Durable Client', latency: '< 4ms' },
  ];

  const decisions: ArchitectureDecision[] = [
    {
      id: 'adr-01',
      title: 'Adopt PostgreSQL 16 with Row-Level Security for Multi-Tenancy',
      status: 'Accepted',
      context: 'B2B SaaS requires strict isolation between enterprise tenant workspaces without exploding infrastructure costs of running separate databases per customer.',
      decision: 'Enforce PostgreSQL Row-Level Security (RLS) policies pinned to the tenant JWT token context.',
      consequences: 'Guarantees zero tenant data leaks at database engine level while sharing connection pools and migrations.',
      alternativesConsidered: ['Database-per-tenant schema sprawl', 'Application-level WHERE tenant_id clauses without RLS'],
    },
    {
      id: 'adr-02',
      title: 'Durable Execution via Temporal for Mission-Critical Workflows',
      status: 'Accepted',
      context: 'Stripe subscription billing, multi-step customer onboarding, and third-party webhooks fail unpredictably when servers restart.',
      decision: 'Model all business transactions as idempotent Temporal workflows with automatic retries and sleep states.',
      consequences: 'Eliminates orphaned subscription states and manual customer support interventions.',
      alternativesConsidered: ['Ad-hoc database cron polling', 'Celery with manual idempotency keys'],
    },
  ];

  const totalCost = calculateTotalCost(services);
  const report = calculateCompatibilityScore(services, connections);

  return {
    id: 'stack-enterprise-saas',
    title: 'High-Velocity Multi-Tenant Infrastructure',
    tagline: 'Production-ready cloud mesh with edge security, ACID durability, and resilient workflow automation',
    ideaPrompt: ideaPrompt || 'Modern B2B enterprise SaaS with multi-tenancy, Stripe billing, and resilient background jobs',
    constraints: finalConstraints,
    services,
    connections,
    decisions,
    totalMonthlyCost: totalCost,
    compatibilityScore: report.score,
    validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
    estimatedLatencyMs: 22,
  };
}
