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
  dataType?: string;
}

export interface ConnectionFlowDetails {
  flowName: string;
  dataType: string;
  flowPattern: string;
  security: string;
  latency: string;
  throughput: string;
  samplePayload: string;
  direction: 'unidirectional' | 'bidirectional';
  fanOutNodes: { id: string; name: string; layer: ServiceLayer; protocol: string }[];
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
  const altLower = alternativeName.toLowerCase();
  if (altLower.includes('supabase')) {
    updatedService.costEstimatePerMonth = 25;
    updatedService.version = 'v2.64.0';
    updatedService.dockerImage = 'supabase/postgres:latest';
  } else if (altLower.includes('qdrant self-hosted') || altLower.includes('gce e2-micro')) {
    updatedService.costEstimatePerMonth = 7;
    updatedService.version = 'v1.12.0';
    updatedService.dockerImage = 'qdrant/qdrant:v1.12.0';
    updatedService.latencyProfile = '22ms p95 self-hosted';
  } else if (altLower.includes('pgvector on neon') || altLower.includes('pgvector')) {
    updatedService.costEstimatePerMonth = 0;
    updatedService.version = 'v16.4';
    updatedService.dockerImage = 'neondatabase/neon_postgres:latest';
    updatedService.latencyProfile = '24ms p95 vector scan';
  } else if (altLower.includes('remix')) {
    updatedService.costEstimatePerMonth = 0;
    updatedService.version = 'v2.8.0';
    updatedService.latencyProfile = '12ms edge SSR';
  } else if (altLower.includes('fastify')) {
    updatedService.costEstimatePerMonth = 15;
    updatedService.version = 'v4.26';
    updatedService.latencyProfile = '35ms warm p95';
  } else if (altLower.includes('vertex ai') || altLower.includes('gemini 1.5')) {
    updatedService.costEstimatePerMonth = 20;
    updatedService.version = 'gemini-1.5-pro';
    updatedService.latencyProfile = '240ms TTFT streaming';
  } else if (altLower.includes('gcp memory') || altLower.includes('memorystore')) {
    updatedService.costEstimatePerMonth = 16;
    updatedService.version = 'v7.0';
  } else if (altLower.includes('bullmq')) {
    updatedService.costEstimatePerMonth = 10;
    updatedService.version = 'v5.4.0';
  } else if (altLower.includes('redis')) {
    updatedService.costEstimatePerMonth = 15;
    updatedService.version = 'v7.2.4';
  } else if (altLower.includes('dragonfly')) {
    updatedService.costEstimatePerMonth = 12;
    updatedService.version = 'v1.14.0';
  } else if (altLower.includes('clickhouse')) {
    updatedService.costEstimatePerMonth = 35;
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
 * Derives comprehensive data flow details, payload types, security protocols,
 * and multi-block fanout information for an architectural connection.
 */
export function getConnectionFlowDetails(
  conn: StackConnection,
  fromNode?: StackServiceNode,
  toNode?: StackServiceNode,
  allServices?: StackServiceNode[],
  allConnections?: StackConnection[]
): ConnectionFlowDetails {
  const fromName = fromNode?.name.toLowerCase() || '';
  const toName = toNode?.name.toLowerCase() || '';
  const fromCategory = fromNode?.category.toLowerCase() || '';
  const toCategory = toNode?.category.toLowerCase() || '';
  const proto = conn.protocol.toLowerCase();

  // Find all sibling destinations this source node fans out to
  const siblingConnections = (allConnections || []).filter((c) => c.from === conn.from);
  const fanOutNodes = siblingConnections.map((c) => {
    const targetService = (allServices || []).find((s) => s.id === c.to);
    return {
      id: c.to,
      name: targetService?.name || c.to,
      layer: targetService?.layer || 'compute',
      protocol: c.protocol,
    };
  });

  // 1. LLM / AI Reasoning Pipelines (e.g. Gemini, OpenAI, Claude, Local LLMs)
  if (
    toName.includes('llm') ||
    toName.includes('gemini') ||
    toName.includes('openai') ||
    toName.includes('anthropic') ||
    toCategory.includes('llm') ||
    toCategory.includes('ai')
  ) {
    return {
      flowName: `${fromNode?.name || 'Orchestrator'} ➔ ${toNode?.name || 'LLM Engine'} Streaming Inference`,
      dataType: 'Token Stream / JSON-RPC (Server-Sent Events / Chunked HTTP)',
      flowPattern: 'Bidirectional Streaming / Dynamic Token Generation',
      security: 'TLS 1.3 with Secret API Key / IAM Workload Identity',
      latency: conn.latency || '< 25ms TTFT (Time to First Token)',
      throughput: 'Real-time SSE token frames (~40-90 tokens/sec)',
      samplePayload: JSON.stringify(
        {
          model: toNode?.name || 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: 'You are an intelligent real-time conversational agent.' },
            { role: 'user', content: 'Process transcribed speech input and generate next turn.' },
          ],
          stream: true,
          temperature: 0.7,
        },
        null,
        2
      ),
      direction: 'bidirectional',
      fanOutNodes,
    };
  }

  // 2. Speech-to-Text / Audio Streaming (e.g. Nova-2, Deepgram, Whisper)
  if (
    toName.includes('speech') ||
    toName.includes('stt') ||
    toName.includes('deepgram') ||
    toName.includes('nova') ||
    toName.includes('whisper') ||
    fromName.includes('speech') ||
    proto.includes('websocket')
  ) {
    if (
      toName.includes('speech') ||
      toName.includes('stt') ||
      toName.includes('nova') ||
      toName.includes('deepgram')
    ) {
      return {
        flowName: `${fromNode?.name || 'Audio Orchestrator'} ➔ ${toNode?.name || 'Speech Engine'} Live Audio Stream`,
        dataType: 'Raw PCM 16kHz Binary Audio & Word-Level Timestamp Transcripts',
        flowPattern: 'Full-Duplex Low-Latency WebSocket (WSS) Channel',
        security: 'WSS (WebSocket Secure) with Ephemeral Client Handshake Token',
        latency: conn.latency || '< 120ms p95 transcription delay',
        throughput: 'Continuous 16kHz 16-bit Linear PCM Audio (~256 kbps)',
        samplePayload: JSON.stringify(
          {
            type: 'audio_stream',
            encoding: 'linear16',
            sample_rate: 16000,
            channels: 1,
            interim_results: true,
            chunk_size_bytes: 4096,
            metadata: { session_id: 'sess_live_9481', language: 'en-US' },
          },
          null,
          2
        ),
        direction: 'bidirectional',
        fanOutNodes,
      };
    }
  }

  // 3. Cache / Key-Value In-Memory (Redis, Memcached, Upstash, KeyDB)
  if (
    toName.includes('redis') ||
    toName.includes('cache') ||
    toName.includes('upstash') ||
    toCategory.includes('cache') ||
    proto.includes('resp')
  ) {
    return {
      flowName: `${fromNode?.name || 'Compute'} ➔ ${toNode?.name || 'In-Memory Cache'} Session Pipeline`,
      dataType: 'RESP3 Serialized In-Memory Keys, Hashes, Expire TTLs & Pub/Sub Signals',
      flowPattern: 'Pipelined TCP / Sub-Millisecond In-Memory Read & Write',
      security: 'TLS with Redis AUTH Token / VPC Private Peering',
      latency: conn.latency || '< 1ms p95 latency',
      throughput: 'High-Throughput IOPS (10k+ ops/sec with connection pooling)',
      samplePayload: `# RESP3 In-Memory Session & Turn State Pipeline\nHSET session:usr_98a active 1 current_turn 4 last_seen 1794759090\nEXPIRE session:usr_98a 86400\nPUBLISH room:canvas:98 "{\\"type\\":\\"state_sync\\",\\"version\\":4}"`,
      direction: 'bidirectional',
      fanOutNodes,
    };
  }

  // 4. Databases & Document Stores (PostgreSQL, Firestore, MongoDB, MySQL, Neon)
  if (
    toName.includes('postgres') ||
    toName.includes('firestore') ||
    toName.includes('mongo') ||
    toName.includes('db') ||
    toName.includes('neon') ||
    toName.includes('database') ||
    toCategory.includes('database') ||
    toCategory.includes('persistence') ||
    proto.includes('sql') ||
    proto.includes('pgwire')
  ) {
    return {
      flowName: `${fromNode?.name || 'Compute'} ➔ ${toNode?.name || 'Database Store'} ACID Persistence`,
      dataType: 'Parameterized Queries, ACID Transactions & Document JSON Entities',
      flowPattern: 'Connection-Pooled Relational / Document Persistence',
      security: 'Encrypted TLS with IAM Service Account & Row-Level Security',
      latency: conn.latency || '< 5ms p95 query execution',
      throughput: 'Batched Multi-Row Writes & Indexed Point Lookups',
      samplePayload: JSON.stringify(
        {
          collection: 'transcripts_and_turns',
          document_id: 'doc_turn_10481',
          data: {
            session_id: 'sess_live_9481',
            timestamp: new Date().toISOString(),
            speaker: 'user',
            transcript: 'Connect the streaming speech-to-text pipeline to the persistent transcript storage.',
            confidence: 0.982,
            latency_ms: 18,
          },
          write_concern: 'journaled',
        },
        null,
        2
      ),
      direction: 'bidirectional',
      fanOutNodes,
    };
  }

  // 5. Tracing / Monitoring / Telemetry (OpenTelemetry, Datadog, Prometheus, Cloud Monitoring)
  if (
    toName.includes('telemetry') ||
    toName.includes('trace') ||
    toName.includes('monitor') ||
    toName.includes('opentelemetry') ||
    toCategory.includes('observability') ||
    proto.includes('otlp')
  ) {
    return {
      flowName: `${fromNode?.name || 'Services'} ➔ ${toNode?.name || 'Observability Collector'} Telemetry Ingestion`,
      dataType: 'OpenTelemetry (OTLP) Tracing Spans, Metric Gauges & Trace Context',
      flowPattern: 'Asynchronous Non-Blocking UDP / gRPC Stream',
      security: 'mTLS Internal Mesh with VPC Access Control',
      latency: conn.latency || '< 2ms non-blocking async flush',
      throughput: 'Batched Span Export (500 spans / buffer interval)',
      samplePayload: JSON.stringify(
        {
          resourceSpans: [
            {
              resource: { service_name: fromNode?.name || 'stream-orchestrator' },
              scopeSpans: [
                {
                  name: 'process_audio_frame',
                  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
                  spanId: '00f067aa0ba902b7',
                  durationMs: 4.8,
                  attributes: {
                    'rpc.method': 'StreamTranscribe',
                    'net.peer.name': toNode?.name || 'telemetry-collector',
                    'http.status_code': 200,
                  },
                },
              ],
            },
          ],
        },
        null,
        2
      ),
      direction: 'unidirectional',
      fanOutNodes,
    };
  }

  // 6. Vector Search & Similarity Memory (Qdrant, Pinecone, pgvector, Weaviate)
  if (
    toName.includes('qdrant') ||
    toName.includes('vector') ||
    toName.includes('pinecone') ||
    toName.includes('weaviate') ||
    toCategory.includes('vector')
  ) {
    return {
      flowName: `${fromNode?.name || 'Compute'} ➔ ${toNode?.name || 'Vector Engine'} Similarity Search`,
      dataType: 'Float32 Embedding Vectors (768/1536 dim) & Cosine Distance Queries',
      flowPattern: 'gRPC / HTTP/2 High-Dimension Vector Lookup',
      security: 'TLS 1.3 with API Key Header Authentication',
      latency: conn.latency || '< 12ms p95 ANN search',
      throughput: 'HNSW Index Traversals & Top-K Nearest Neighbor Scans',
      samplePayload: JSON.stringify(
        {
          collection: 'knowledge_embeddings',
          vector: [0.0142, -0.0481, 0.1293, '... (1536 dims)'],
          top_k: 5,
          score_threshold: 0.82,
          filter: { status: 'published' },
        },
        null,
        2
      ),
      direction: 'bidirectional',
      fanOutNodes,
    };
  }

  // 7. Message Queue / Durable Workflow (RabbitMQ, Kafka, SQS, Temporal, Celery)
  if (
    toName.includes('queue') ||
    toName.includes('temporal') ||
    toName.includes('kafka') ||
    toName.includes('celery') ||
    toName.includes('rabbit') ||
    toCategory.includes('queue') ||
    toCategory.includes('async')
  ) {
    return {
      flowName: `${fromNode?.name || 'Producer'} ➔ ${toNode?.name || 'Queue / Workflow'} Event Bus`,
      dataType: 'Serialized CloudEvents / JSON Job Envelopes & Ack Tokens',
      flowPattern: 'Asynchronous Push-Pull with Idempotent Deduplication',
      security: 'Encrypted Message Broker with SASL/SCRAM or IAM Role',
      latency: conn.latency || '< 5ms publish latency',
      throughput: 'Durable Queue Buffering (At-least-once delivery guarantee)',
      samplePayload: JSON.stringify(
        {
          eventId: 'evt_job_542890',
          topic: 'media.transcription.completed',
          timestamp: new Date().toISOString(),
          idempotencyKey: 'idem_90481_v1',
          payload: {
            session_id: 'sess_live_9481',
            status: 'READY_FOR_SUMMARY',
            audio_duration_seconds: 48.2,
          },
        },
        null,
        2
      ),
      direction: 'unidirectional',
      fanOutNodes,
    };
  }

  // 8. Client to Edge / Gateway
  if (fromNode?.layer === 'client' || toNode?.layer === 'edge') {
    return {
      flowName: `${fromNode?.name || 'Client Application'} ➔ ${toNode?.name || 'Edge Gateway'} Ingress Tunnel`,
      dataType: 'HTTPS / WSS Ingress Requests, Static Bundles & Auth Handshakes',
      flowPattern: 'TLS Termination, Edge Caching & Anycast Routing',
      security: 'TLS 1.3 / Automated ACME Certificate / Cloudflare DDoS Shield',
      latency: conn.latency || '< 15ms global edge termination',
      throughput: 'Anycast Distributed Edge Bandwidth',
      samplePayload: JSON.stringify(
        {
          method: 'GET',
          path: '/api/v1/session/live',
          headers: {
            'Host': 'voice.app.internal',
            'Upgrade': 'websocket',
            'Connection': 'Upgrade',
            'Sec-WebSocket-Version': '13',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1Ni...',
          },
        },
        null,
        2
      ),
      direction: 'bidirectional',
      fanOutNodes,
    };
  }

  // Default / Generic Microservice Connection
  return {
    flowName: `${fromNode?.name || 'Origin Service'} ➔ ${toNode?.name || 'Target Service'} Mesh Flow`,
    dataType: 'Encrypted JSON / Binary Microservice Request-Response',
    flowPattern: 'Synchronous Request-Response / HTTP REST or Internal gRPC',
    security: 'TLS 1.3 / Internal VPC Network Isolation',
    latency: conn.latency || '< 10ms internal hop',
    throughput: 'Internal Cluster Mesh Throughput',
    samplePayload: JSON.stringify(
      {
        source: fromNode?.name || 'origin-node',
        target: toNode?.name || 'target-node',
        protocol: conn.protocol,
        action: 'dispatch_payload',
        timestamp: new Date().toISOString(),
        payload: { status: 'healthy', context_routed: true },
      },
      null,
      2
    ),
    direction: 'bidirectional',
    fanOutNodes,
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

  // Profile 2: AI Agent / LLM RAG Pipeline (Matches artifacts r2, r3, r4, r5)
  if (
    promptLower.includes('ai') ||
    promptLower.includes('llm') ||
    promptLower.includes('agent') ||
    promptLower.includes('rag') ||
    promptLower.includes('vector') ||
    promptLower.includes('gemini') ||
    promptLower.includes('bot') ||
    promptLower.includes('research')
  ) {
    const services: StackServiceNode[] = [
      {
        id: 'client-nextjs',
        name: 'Next.js Research UI',
        layer: 'client',
        version: '15.1',
        category: 'Frontend SPA',
        description: 'Streaming Next.js client with SSE tokens, reactive markdown rendering, and vector citations.',
        status: 'healthy',
        costEstimatePerMonth: 0,
        latencyProfile: '15ms TTFB global static edge',
        dockerImage: 'client-nextjs:latest',
        envVariables: { NEXT_PUBLIC_API_URL: 'https://agent-api.internal', VITE_AUTH_DOMAIN: 'auth.internal' },
        ports: ['3000:3000'],
        alternatives: ['Remix on Cloudflare', 'SvelteKit 2'],
        tags: ['typescript', 'nextjs'],
        position: { x: 80, y: 160 },
      },
      {
        id: 'edge-cloudflare',
        name: 'Cloudflare Edge & WAF',
        layer: 'edge',
        version: '2025.1',
        category: 'CDN & API Gateway',
        description: 'Edge routing, WAF defense, DDoS mitigation, and global SSE stream passthrough.',
        status: 'healthy',
        costEstimatePerMonth: 0,
        latencyProfile: '12ms p95 edge routing',
        dockerImage: 'edge-cloudflare:latest',
        envVariables: { CF_ZONE: 'agent_mesh_01', RATE_LIMIT_RPM: '1200' },
        ports: ['443:443'],
        alternatives: ['GCP Cloud Armor + Load Balancer'],
        tags: ['cdn', 'waf'],
        position: { x: 300, y: 160 },
      },
      {
        id: 'compute-agent',
        name: 'TypeScript Agent Orchestrator',
        layer: 'compute',
        version: '22-alpine',
        category: 'Cloud Run Service',
        description: 'Hono/Node runtime coordinating multi-step Gemini tool calling, Qdrant searches, and Celery tasks.',
        status: 'healthy',
        costEstimatePerMonth: 8,
        latencyProfile: '45ms warm p95, 650ms cold start',
        dockerImage: 'us-central1-docker.pkg.dev/agent:latest',
        envVariables: { PORT: '8080', NODE_ENV: 'production', GEMINI_MODEL: 'gemini-2.5-flash', QDRANT_URL: 'https://qdrant.internal:6333' },
        ports: ['8080:8080'],
        alternatives: ['Fastify on ECS', 'Python FastAPI'],
        tags: ['typescript', 'hono'],
        position: { x: 520, y: 160 },
      },
      {
        id: 'compute-gemini',
        name: 'Google Gemini 2.5 Flash API',
        layer: 'compute',
        version: 'gemini-2.5-flash',
        category: 'Managed LLM & Embeddings',
        description: 'High-throughput multimodal reasoning, prompt synthesis, structured schema extraction, and embeddings.',
        status: 'healthy',
        costEstimatePerMonth: 12,
        latencyProfile: '180ms TTFT streaming',
        dockerImage: 'compute-gemini-api:latest',
        envVariables: { GEMINI_API_KEY: 'env(SECRET)', EMBEDDING_MODEL: 'text-embedding-004' },
        ports: [],
        alternatives: ['Vertex AI Gemini 1.5 Pro', 'Claude 3.5 Sonnet'],
        tags: ['gemini', 'llm'],
        position: { x: 520, y: 310 },
      },
      {
        id: 'data-qdrant',
        name: 'Qdrant Cloud Vector Memory',
        layer: 'data',
        version: '1.12',
        category: 'Vector Database',
        description: 'Managed Qdrant cluster storing 768-dimensional document chunk embeddings with payload filtering for multi-tenant citation retrieval and long-term agent memory.',
        status: 'healthy',
        costEstimatePerMonth: 10,
        latencyProfile: '18ms p95 HNSW cosine search',
        dockerImage: 'data-qdrant:latest',
        envVariables: { PORT: '8080', NODE_ENV: 'production', QDRANT_STORAGE_PATH: '/qdrant/storage' },
        ports: ['6333:6333', '6334:6334'],
        alternatives: ['Qdrant Self-Hosted on GCE e2-micro', 'pgvector on Neon'],
        tags: ['qdrant', 'vector-db'],
        position: { x: 740, y: 160 },
      },
      {
        id: 'data-neon',
        name: 'Neon Serverless Postgres',
        layer: 'data',
        version: '16.4',
        category: 'Relational Database',
        description: 'Serverless branching relational database managing tenant workspaces, user accounts, and billing records.',
        status: 'healthy',
        costEstimatePerMonth: 0,
        latencyProfile: '25ms p95 pooled HTTP driver',
        dockerImage: 'data-neon-postgres:latest',
        envVariables: { DATABASE_URL: 'postgres://app:secret@ep-cool-db.us-east-2.aws.neon.tech/neondb' },
        ports: ['5432:5432'],
        alternatives: ['Supabase Postgres', 'Cloud SQL'],
        tags: ['postgres', 'serverless'],
        position: { x: 740, y: 310 },
      },
      {
        id: 'data-gcs',
        name: 'Google Cloud Storage',
        layer: 'data',
        version: 'Standard',
        category: 'Object Storage',
        description: 'Document blob storage for parsed PDF papers, research artifacts, and user file attachments.',
        status: 'healthy',
        costEstimatePerMonth: 1,
        latencyProfile: '35ms p95 object read',
        dockerImage: 'gcs-storage:latest',
        envVariables: { GCS_BUCKET: 'agent-research-artifacts', GCS_LOCATION: 'us-central1' },
        ports: [],
        alternatives: ['AWS S3', 'Cloudflare R2'],
        tags: ['gcs', 'object-storage'],
        position: { x: 740, y: 460 },
      },
      {
        id: 'async-upstash',
        name: 'Upstash Serverless Redis',
        layer: 'async',
        version: '7.2',
        category: 'Message Broker & Cache',
        description: 'Serverless Redis for Celery job queues, ephemeral streaming token buffers, and rate limiting.',
        status: 'healthy',
        costEstimatePerMonth: 3,
        latencyProfile: '8ms p95 regional TLS',
        dockerImage: 'async-upstash-redis:latest',
        envVariables: { UPSTASH_REDIS_REST_URL: 'https://upstash.internal:6379' },
        ports: ['6379:6379'],
        alternatives: ['GCP Memorystore', 'Dragonfly DB'],
        tags: ['redis', 'cache'],
        position: { x: 960, y: 160 },
      },
      {
        id: 'async-celery',
        name: 'Celery Document Chunker',
        layer: 'async',
        version: '5.4',
        category: 'Cloud Run Worker',
        description: 'Async background worker downloading academic papers, OCR extraction, and batch embedding regeneration.',
        status: 'healthy',
        costEstimatePerMonth: 5,
        latencyProfile: '1200ms per document chunk batch',
        dockerImage: 'us-central1-docker.pkg.dev/chunker:latest',
        envVariables: { CELERY_BROKER_URL: 'redis://upstash:6379/0', CHUNK_SIZE: '512' },
        ports: [],
        alternatives: ['BullMQ TypeScript Worker', 'Temporal.io'],
        tags: ['celery', 'python'],
        position: { x: 960, y: 310 },
      },
      {
        id: 'infra-artifact',
        name: 'GCP Artifact Registry & CI/CD',
        layer: 'infra',
        version: 'latest',
        category: 'CI/CD & Observability',
        description: 'Automated container builds, OpenTelemetry trace aggregation, and Cloud Run automated deployment mesh.',
        status: 'healthy',
        costEstimatePerMonth: 2,
        latencyProfile: 'Async telemetry ingestion',
        dockerImage: 'gcp-telemetry:latest',
        envVariables: { OTEL_EXPORTER_OTLP_ENDPOINT: 'https://telemetry.internal:4318' },
        ports: [],
        alternatives: ['Datadog APM', 'GitHub Container Registry'],
        tags: ['gcp', 'artifact-registry'],
        position: { x: 960, y: 460 },
      },
    ];

    const connections: StackConnection[] = [
      { id: 'c1', from: 'client-nextjs', to: 'edge-cloudflare', protocol: 'HTTPS / SSE', latency: '< 15ms' },
      { id: 'c2', from: 'edge-cloudflare', to: 'compute-agent', protocol: 'HTTP/2 Streaming', latency: '< 2ms' },
      { id: 'c3', from: 'compute-agent', to: 'compute-gemini', protocol: 'Gemini REST / SSE', latency: '< 180ms' },
      { id: 'c4', from: 'compute-agent', to: 'data-qdrant', protocol: 'gRPC / HNSW Search', latency: '< 18ms' },
      { id: 'c5', from: 'compute-agent', to: 'data-neon', protocol: 'PostgreSQL Wire', latency: '< 25ms' },
      { id: 'c6', from: 'compute-agent', to: 'data-gcs', protocol: 'GCS S3 API', latency: '< 35ms' },
      { id: 'c7', from: 'compute-agent', to: 'async-upstash', protocol: 'RESP3 Redis Protocol', latency: '< 8ms' },
      { id: 'c8', from: 'async-upstash', to: 'async-celery', protocol: 'Celery Broker Dispatch', latency: '< 5ms' },
      { id: 'c9', from: 'async-celery', to: 'compute-gemini', protocol: 'Batch Embedding API', latency: '< 120ms' },
      { id: 'c10', from: 'async-celery', to: 'data-qdrant', protocol: 'Vector Upsert Stream', latency: '< 20ms' },
      { id: 'c11', from: 'async-celery', to: 'data-gcs', protocol: 'Blob Ingestion', latency: '< 30ms' },
      { id: 'c12', from: 'compute-agent', to: 'infra-artifact', protocol: 'OTel OTLP Trace', latency: '< 1ms' },
      { id: 'c13', from: 'async-celery', to: 'infra-artifact', protocol: 'OTel OTLP Metrics', latency: '< 1ms' },
      { id: 'c14', from: 'edge-cloudflare', to: 'infra-artifact', protocol: 'WAF Access Logs', latency: '< 2ms' },
    ];

    const decisions: ArchitectureDecision[] = [
      {
        id: 'adr-01',
        title: 'Decouple Ingestion from Agent Query Runtime via Celery Workers',
        status: 'Accepted',
        context: 'Embedding PDF files and web scrapes involves heavy CPU and unpredictable memory spikes that must not degrade live chat SSE response streaming.',
        decision: 'Offload ingestion and semantic chunking to Celery async queues with Upstash Redis broker.',
        consequences: 'Protects user response latencies; allows scalable worker autoscaling based on queue depth.',
        alternativesConsidered: ['Synchronous FastAPI in-process background tasks', 'AWS Lambda trigger'],
      },
      {
        id: 'adr-02',
        title: 'Dedicated Vector Engine (Qdrant Cloud) with Metadata Filtering',
        status: 'Accepted',
        context: 'RAG search requires dynamic multi-tenant filtering (e.g. organization_id, doc_type) over millions of vector embeddings.',
        decision: 'Provision Qdrant for SIMD-accelerated cosine distance search with built-in payload indexes.',
        consequences: 'Sub-18ms vector recall; avoids heavy index locking on the primary relational database.',
        alternativesConsidered: ['pgvector on Neon', 'Pinecone Managed Cloud'],
      },
    ];

    const totalCost = calculateTotalCost(services);
    const report = calculateCompatibilityScore(services, connections);

    return {
      id: 'stack-ai-rag-agent',
      title: 'Autonomous AI Research Agent Blueprint',
      tagline: 'Cost-optimized GCP Cloud Run TypeScript architecture pairing SSE-streamed Gemini reasoning with Celery document chunking and Qdrant vector memory.',
      ideaPrompt,
      constraints: finalConstraints,
      services,
      connections,
      decisions,
      totalMonthlyCost: totalCost,
      compatibilityScore: report.score,
      validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
      estimatedLatencyMs: 210,
    };
  }

  // Profile 4: Edge-First Global E-Commerce
  if (
    promptLower.includes('ecommerce') ||
    promptLower.includes('e-commerce') ||
    promptLower.includes('commerce') ||
    promptLower.includes('d1') ||
    promptLower.includes('store') ||
    promptLower.includes('checkout')
  ) {
    const services: StackServiceNode[] = [
      {
        id: 'client-pages',
        name: 'Cloudflare Pages + Astro 4',
        layer: 'client',
        version: 'v4.2.0',
        category: 'Edge SSR Storefront',
        description: 'Zero-JS static island catalog with client hydration for checkout cart and dynamic search.',
        status: 'healthy',
        costEstimatePerMonth: 0,
        latencyProfile: '< 8ms TTFB edge',
        dockerImage: 'cloudflare/pages:latest',
        envVariables: { PUBLIC_API_URL: 'https://api.store.internal' },
        ports: ['3000:3000'],
        alternatives: ['Next.js 15 on Vercel', 'Remix Vite'],
        tags: ['astro', 'edge-ssr', 'ecommerce'],
        position: { x: 80, y: 160 },
      },
      {
        id: 'edge-waf',
        name: 'Cloudflare Workers WAF & Bot Management',
        layer: 'edge',
        version: 'v2024.2',
        category: 'Edge Security Gateway',
        description: 'Automated bot detection, inventory scalper rate limiting, and geo-routed currency conversion.',
        status: 'healthy',
        costEstimatePerMonth: 5,
        latencyProfile: '< 4ms edge',
        dockerImage: 'cloudflare/workers:latest',
        envVariables: { BOT_MITIGATION_MODE: 'enforce', RATE_LIMIT_RPM: '400' },
        ports: ['443:443'],
        alternatives: ['Fastly Signal Sciences', 'AWS CloudFront WAF'],
        tags: ['waf', 'security', 'bot-defense'],
        position: { x: 300, y: 160 },
      },
      {
        id: 'compute-checkout',
        name: 'Cloudflare Workers Checkout API',
        layer: 'compute',
        version: 'v2.1.0',
        category: 'Serverless Edge API',
        description: 'V8 isolate microservices executing cart validation, Stripe Checkout Sessions, and order locking.',
        status: 'healthy',
        costEstimatePerMonth: 10,
        latencyProfile: '< 12ms cold start',
        dockerImage: 'cloudflare/workerd:latest',
        envVariables: { STRIPE_KEY: 'env(SECRET)', D1_BINDING: 'DB_STORE' },
        ports: ['8787:8787'],
        alternatives: ['Go Fiber on Fly.io', 'AWS Lambda Node.js'],
        tags: ['workers', 'v8-isolate', 'stripe'],
        position: { x: 520, y: 160 },
      },
      {
        id: 'data-d1',
        name: 'Cloudflare D1 SQL Database',
        layer: 'data',
        version: 'v1.0.0',
        category: 'Global Read-Replicated SQL',
        description: 'Distributed SQLite database with automatic read replicas in 300+ edge locations for sub-10ms catalog reads.',
        status: 'healthy',
        costEstimatePerMonth: 5,
        latencyProfile: '< 6ms read edge',
        dockerImage: 'cloudflare/d1:latest',
        envVariables: { D1_DATABASE_ID: 'd1_ecommerce_prod' },
        ports: [],
        alternatives: ['Turso libSQL', 'Neon Serverless Postgres'],
        tags: ['d1', 'sqlite', 'edge-db'],
        position: { x: 740, y: 160 },
      },
      {
        id: 'async-queues',
        name: 'Cloudflare Queues + Fraud Worker',
        layer: 'async',
        version: 'v1.0.0',
        category: 'At-Least-Once Event Queue',
        description: 'Asynchronous event stream processing inventory decrements, customer receipts, and fraud scoring.',
        status: 'healthy',
        costEstimatePerMonth: 5,
        latencyProfile: '< 15ms queue batch',
        dockerImage: 'cloudflare/queues:latest',
        envVariables: { QUEUE_NAME: 'order-events' },
        ports: [],
        alternatives: ['AWS SQS', 'Upstash QStash'],
        tags: ['queue', 'async', 'events'],
        position: { x: 960, y: 160 },
      },
      {
        id: 'infra-r2',
        name: 'Cloudflare R2 Media & Product Assets',
        layer: 'infra',
        version: 'v4.0.0',
        category: 'Zero-Egress Object Storage',
        description: 'Optimized product image and catalog thumbnail storage with zero egress fees.',
        status: 'healthy',
        costEstimatePerMonth: 10,
        latencyProfile: '< 15ms TTFB',
        dockerImage: 'minio/minio:latest',
        envVariables: { R2_BUCKET_NAME: 'store-product-images' },
        ports: [],
        alternatives: ['AWS S3 + CloudFront', 'Google Cloud Storage'],
        tags: ['r2', 's3', 'media'],
        position: { x: 960, y: 310 },
      },
    ];

    const connections: StackConnection[] = [
      { id: 'c1', from: 'client-pages', to: 'edge-waf', protocol: 'HTTPS / HTTP3', latency: '< 8ms' },
      { id: 'c2', from: 'edge-waf', to: 'compute-checkout', protocol: 'Cloudflare Service Binding', latency: '< 1ms' },
      { id: 'c3', from: 'compute-checkout', to: 'data-d1', protocol: 'D1 Native Binding', latency: '< 4ms' },
      { id: 'c4', from: 'compute-checkout', to: 'async-queues', protocol: 'Queue Producer Binding', latency: '< 2ms' },
      { id: 'c5', from: 'client-pages', to: 'infra-r2', protocol: 'Custom Domain CDN', latency: '< 15ms' },
      { id: 'c6', from: 'async-queues', to: 'data-d1', protocol: 'D1 Write Transaction', latency: '< 8ms' },
    ];

    const decisions: ArchitectureDecision[] = [
      {
        id: 'adr-01',
        title: 'Edge-First Distributed Architecture with Cloudflare D1',
        status: 'Accepted',
        context: 'Global e-commerce requires sub-20ms page load times worldwide to prevent cart abandonment without paying high multi-region DB costs.',
        decision: 'Deploy storefront on Cloudflare Pages and state on Cloudflare D1 with automatic global read replication.',
        consequences: 'Catalog reads achieve sub-10ms globally; writes are routed seamlessly to primary coordinator.',
        alternativesConsidered: ['Centralized AWS RDS PostgreSQL in us-east-1', 'CockroachDB Dedicated'],
      },
      {
        id: 'adr-02',
        title: 'Asynchronous Order Processing via Cloudflare Queues',
        status: 'Accepted',
        context: 'Post-checkout operations (receipt email, inventory ERP sync, analytics) should not block the customer confirmation screen.',
        decision: 'Enqueue order events to Cloudflare Queues for reliable background consumption.',
        consequences: 'Guarantees order durability even during flash sales with traffic spikes.',
        alternativesConsidered: ['Direct synchronous webhooks in checkout handler', 'Third-party Zapier'],
      },
    ];

    const totalCost = calculateTotalCost(services);
    const report = calculateCompatibilityScore(services, connections);

    return {
      id: 'stack-edge-ecommerce',
      title: 'Edge-First Global E-Commerce Mesh',
      tagline: 'Sub-10ms global edge SSR with Cloudflare D1 distributed database and asynchronous fraud detection',
      ideaPrompt,
      constraints: finalConstraints,
      services,
      connections,
      decisions,
      totalMonthlyCost: totalCost,
      compatibilityScore: report.score,
      validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
      estimatedLatencyMs: 12,
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
