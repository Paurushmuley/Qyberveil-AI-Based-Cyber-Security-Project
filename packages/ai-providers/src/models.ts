import { AIProvider } from '@vulnsight/shared-types';
import { ModelDescriptor } from './types.js';

export const SUPPORTED_MODELS: Record<AIProvider, ModelDescriptor[]> = {
  [AIProvider.GEMINI]: [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Ultra-fast, high-capability reasoning ideal for real-time security finding triage and remediation.',
      recommended: true,
      contextWindow: 1048576,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Deep reasoning and complex correlation across large scan histories and source code repositories.',
      recommended: false,
      contextWindow: 2097152,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Cost-effective, low-latency triage for high-volume passive scan outputs.',
      recommended: false,
      contextWindow: 1048576,
    },
  ],
  [AIProvider.OPENAI]: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Flagship multimodal model with state-of-the-art AppSec vulnerability reasoning.',
      recommended: true,
      contextWindow: 128000,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Affordable, fast model suitable for high-frequency finding classification.',
      recommended: false,
      contextWindow: 128000,
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      description: 'Advanced reasoning model with deep chain-of-thought verification for complex exploit analysis.',
      recommended: false,
      contextWindow: 200000,
    },
  ],
  [AIProvider.GROK]: [
    {
      id: 'grok-2',
      name: 'Grok-2',
      description: 'State-of-the-art reasoning model by xAI with strong technical and coding capabilities.',
      recommended: true,
      contextWindow: 128000,
    },
    {
      id: 'grok-2-mini',
      name: 'Grok-2 Mini',
      description: 'Lightweight model by xAI optimized for fast inference and structured outputs.',
      recommended: false,
      contextWindow: 128000,
    },
    {
      id: 'grok-beta',
      name: 'Grok Beta',
      description: 'Preview model with latest xAI model weights and capability enhancements.',
      recommended: false,
      contextWindow: 128000,
    },
  ],
  [AIProvider.OLLAMA]: [
    {
      id: 'llama3.3',
      name: 'Llama 3.3 (70B)',
      description: 'Leading open-weights model capable of enterprise-grade security analysis offline.',
      recommended: true,
      contextWindow: 128000,
    },
    {
      id: 'deepseek-r1',
      name: 'DeepSeek R1',
      description: 'Open reasoning model with transparent chain-of-thought verification for false-positive detection.',
      recommended: false,
      contextWindow: 64000,
    },
    {
      id: 'qwen2.5-coder',
      name: 'Qwen 2.5 Coder (32B)',
      description: 'Specialized for code review, patch generation, and vulnerability root-cause analysis.',
      recommended: false,
      contextWindow: 32000,
    },
    {
      id: 'mistral',
      name: 'Mistral (7B/8x7B)',
      description: 'Fast, compact model suitable for lightweight local triage on developer laptops.',
      recommended: false,
      contextWindow: 32000,
    },
  ],
};

export const DEFAULT_MODEL_BY_PROVIDER: Record<AIProvider, string> = {
  [AIProvider.GEMINI]: 'gemini-2.0-flash',
  [AIProvider.OPENAI]: 'gpt-4o',
  [AIProvider.GROK]: 'grok-2',
  [AIProvider.OLLAMA]: 'llama3.3',
};
