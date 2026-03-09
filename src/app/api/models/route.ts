import { getAvailableModels, hasAnyApiKey } from '@/lib/ai/provider-config';

export async function GET() {
  return Response.json({
    hasApiKeys: hasAnyApiKey(),
    models: getAvailableModels(),
  });
}
