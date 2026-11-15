/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { synthesizeDefaultBlueprint, calculateTotalCost, calculateCompatibilityScore, StackBlueprint } from './src/utils/stackEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI client dynamically with required telemetry header
function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    dotenv.config();
  }
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  const ai = getGenAI();
  res.json({
    status: 'healthy',
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Generates an architectural stack blueprint from a natural language idea prompt.
 */
app.post(['/api/generate-stack', '/generate-stack'], async (req: Request, res: Response) => {
  const { prompt, constraints } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A valid project idea prompt is required.' });
  }

  // Fallback blueprint generated first to guarantee instant, high-quality response
  const baselineBlueprint = synthesizeDefaultBlueprint(prompt, constraints);

  const ai = getGenAI();
  if (!ai) {
    // Return high-quality deterministic blueprint if no Gemini key configured
    return res.json({
      blueprint: baselineBlueprint,
      source: 'heuristic-engine',
      note: 'Using IdeaToStack deterministic architectural synthesis engine. Set GEMINI_API_KEY in .env for Gemini AI synthesis.',
    });
  }

  try {
    const systemInstruction = `You are a Principal Software Architect and Infrastructure Engineer at a top cloud infrastructure company.
Analyze the user's software project idea and output an exact, production-ready system architecture blueprint matching modern technical minimalism and developer rigor.
Provide realistic services across layers: client, edge, compute, data, async, and infra.
Return valid JSON adhering to the provided schema.`;

    const candidateModels = ['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let response: any = null;
    let successfulModel = 'gemini-4-hydrogen';

    const promptContents = `Design a comprehensive production stack blueprint for this project idea: "${prompt}".
Constraints:
- Cloud Hosting Target: ${constraints?.hosting || 'Cloud Run / GCP'}
- Primary Language: ${constraints?.language || 'TypeScript'}
- Target Budget: ${constraints?.budgetTier || 'Cost-Optimized (<$50/mo)'}
- Scale Profile: ${constraints?.scalability || 'Growth (1k-100k users)'}`;

    const config = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Architecture Title' },
          tagline: { type: Type.STRING, description: 'A 1-sentence technical architectural summary' },
          estimatedLatencyMs: { type: Type.INTEGER, description: 'Estimated p95 roundtrip latency in ms' },
          services: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                layer: { type: Type.STRING, enum: ['client', 'edge', 'compute', 'data', 'async', 'infra'] },
                version: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                costEstimatePerMonth: { type: Type.INTEGER },
                latencyProfile: { type: Type.STRING },
                dockerImage: { type: Type.STRING },
                ports: { type: Type.ARRAY, items: { type: Type.STRING } },
                alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['id', 'name', 'layer', 'version', 'category', 'description', 'costEstimatePerMonth', 'latencyProfile', 'alternatives', 'tags'],
            },
          },
          connections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                protocol: { type: Type.STRING },
                latency: { type: Type.STRING },
              },
              required: ['id', 'from', 'to', 'protocol', 'latency'],
            },
          },
          decisions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['Accepted', 'Proposed'] },
                context: { type: Type.STRING },
                decision: { type: Type.STRING },
                consequences: { type: Type.STRING },
                alternativesConsidered: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['id', 'title', 'status', 'context', 'decision', 'consequences', 'alternativesConsidered'],
            },
          },
        },
        required: ['title', 'tagline', 'estimatedLatencyMs', 'services', 'connections', 'decisions'],
      },
    };

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: promptContents,
          config,
        });
        successfulModel = model;
        break;
      } catch (modelErr: any) {
        console.warn(`Attempt with ${model} failed:`, modelErr?.message || modelErr);
        if (model === candidateModels[candidateModels.length - 1]) {
          throw modelErr;
        }
      }
    }

    const parsedJson = JSON.parse(response.text || '{}');

    if (!parsedJson.services || parsedJson.services.length === 0) {
      throw new Error('Gemini response did not contain valid services.');
    }

    // Lay out positions across canvas coordinates
    const layerXPositions: Record<string, number> = {
      client: 80,
      edge: 300,
      compute: 520,
      data: 740,
      async: 960,
      infra: 960,
    };
    const layerYCounts: Record<string, number> = {};

    const enrichedServices = parsedJson.services.map((s: any) => {
      const layer = s.layer || 'compute';
      layerYCounts[layer] = (layerYCounts[layer] || 0) + 1;
      const yOffset = 160 + (layerYCounts[layer] - 1) * 150;

      return {
        ...s,
        status: 'healthy' as const,
        envVariables: s.envVariables || { PORT: '8080', NODE_ENV: 'production' },
        position: {
          x: layerXPositions[layer] || 520,
          y: yOffset,
        },
      };
    });

    const totalCost = calculateTotalCost(enrichedServices);
    const report = calculateCompatibilityScore(enrichedServices, parsedJson.connections || []);

    const synthesizedBlueprint: StackBlueprint = {
      id: `stack-${Date.now()}`,
      title: parsedJson.title || baselineBlueprint.title,
      tagline: parsedJson.tagline || baselineBlueprint.tagline,
      ideaPrompt: prompt,
      constraints: baselineBlueprint.constraints,
      services: enrichedServices,
      connections: parsedJson.connections || baselineBlueprint.connections,
      decisions: parsedJson.decisions || baselineBlueprint.decisions,
      totalMonthlyCost: totalCost,
      compatibilityScore: report.score,
      validationStatus: report.isProductionReady ? 'Production Ready' : 'Review Recommended',
      estimatedLatencyMs: parsedJson.estimatedLatencyMs || 25,
    };

    return res.json({
      blueprint: synthesizedBlueprint,
      source: successfulModel,
    });
  } catch (err: any) {
    console.error('Error invoking Gemini model for stack synthesis:', err?.message || err);
    // Graceful fallback to rich deterministic blueprint so user experience remains 100% operational
    return res.json({
      blueprint: baselineBlueprint,
      source: 'fallback-engine',
      warning: 'Synthesized with local high-velocity architecture engine.',
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[IdeaToStack] Server running on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

export default app;

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}
