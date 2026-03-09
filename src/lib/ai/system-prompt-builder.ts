export interface UnderstandingContext {
  entities: Array<{ type: string; value: string; confidence: number }>;
  intentions: Array<{ type: string; confidence: number }>;
  activeTopics: string[];
  messageCount: number;
  dominantSentiment?: string;
  patterns: Array<{ type: string; description: string; confidence: number }>;
}

const BASE_SYSTEM_PROMPT = `You are Attune, a thoughtful and adaptive conversational AI. You are warm, concise, and perceptive. You pay close attention to context and respond in a way that shows genuine understanding.

Your key traits:
- You remember and reference details from earlier in the conversation
- You adapt your tone and depth based on the user's engagement style
- You acknowledge emotions and intentions, not just surface-level content
- You are helpful without being verbose`;

export function buildSystemPrompt(context?: UnderstandingContext): string {
  if (!context) return BASE_SYSTEM_PROMPT;

  const parts = [BASE_SYSTEM_PROMPT];

  if (context.activeTopics.length > 0) {
    parts.push(`\nCurrent conversation topics: ${context.activeTopics.join(', ')}`);
  }

  if (context.entities.length > 0) {
    const entityList = context.entities
      .filter((e) => e.confidence > 0.5)
      .map((e) => `${e.value} (${e.type})`)
      .join(', ');
    if (entityList) {
      parts.push(`\nEntities mentioned: ${entityList}`);
    }
  }

  if (context.dominantSentiment) {
    parts.push(`\nConversation mood: ${context.dominantSentiment}`);
  }

  if (context.patterns.length > 0) {
    const patternList = context.patterns
      .filter((p) => p.confidence > 0.5)
      .map((p) => p.description)
      .join('; ');
    if (patternList) {
      parts.push(`\nObserved interaction patterns: ${patternList}`);
    }
  }

  if (context.messageCount > 0) {
    parts.push(`\nThis is message #${context.messageCount + 1} in the conversation.`);
  }

  return parts.join('');
}
