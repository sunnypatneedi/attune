import 'server-only';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type ModelProvider = 'openai' | 'anthropic' | 'google';

export interface ModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', modelId: 'gpt-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', modelId: 'gpt-4o-mini' },
  { id: 'claude-sonnet', label: 'Claude Sonnet', provider: 'anthropic', modelId: 'claude-sonnet-4-20250514' },
  { id: 'claude-haiku', label: 'Claude Haiku', provider: 'anthropic', modelId: 'claude-haiku-4-5-20251001' },
  { id: 'gemini-pro', label: 'Gemini 2.0 Flash', provider: 'google', modelId: 'gemini-2.0-flash' },
];

const providers = {
  openai: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  anthropic: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  google: () => createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }),
} as const;

export function getModel(modelId: string) {
  const option = MODEL_OPTIONS.find((m) => m.id === modelId);
  if (!option) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  const provider = providers[option.provider]();
  return provider(option.modelId);
}

export function getAvailableModels(): ModelOption[] {
  const available: ModelOption[] = [];
  if (process.env.OPENAI_API_KEY) {
    available.push(...MODEL_OPTIONS.filter((m) => m.provider === 'openai'));
  }
  if (process.env.ANTHROPIC_API_KEY) {
    available.push(...MODEL_OPTIONS.filter((m) => m.provider === 'anthropic'));
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    available.push(...MODEL_OPTIONS.filter((m) => m.provider === 'google'));
  }
  return available;
}

export function hasAnyApiKey(): boolean {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}
