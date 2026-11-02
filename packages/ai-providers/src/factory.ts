import { AIProvider } from '@vulnsight/shared-types';
import { AIProviderAdapter, AIProviderConfigOptions } from './types.js';
import { GeminiAdapter } from './adapters/gemini.adapter.js';
import { OpenAIAdapter } from './adapters/openai.adapter.js';
import { GrokAdapter } from './adapters/grok.adapter.js';
import { OllamaAdapter } from './adapters/ollama.adapter.js';
import { DEFAULT_MODEL_BY_PROVIDER } from './models.js';

export class AIProviderFactory {
  public static createAdapter(config: AIProviderConfigOptions): AIProviderAdapter {
    const model = config.modelName || DEFAULT_MODEL_BY_PROVIDER[config.provider];

    switch (config.provider) {
      case AIProvider.GEMINI:
        if (!config.apiKey) throw new Error('API Key is required for Gemini provider');
        return new GeminiAdapter(config.apiKey, model);

      case AIProvider.OPENAI:
        if (!config.apiKey) throw new Error('API Key is required for OpenAI provider');
        return new OpenAIAdapter(config.apiKey, model, config.baseUrl);

      case AIProvider.GROK:
        if (!config.apiKey) throw new Error('API Key is required for xAI Grok provider');
        return new GrokAdapter(config.apiKey, model, config.baseUrl);

      case AIProvider.OLLAMA:
        return new OllamaAdapter(model, config.baseUrl || 'http://localhost:11434');

      default:
        throw new Error(`Unsupported AI provider: ${String(config.provider)}`);
    }
  }
}
