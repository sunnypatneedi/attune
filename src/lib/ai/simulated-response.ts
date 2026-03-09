/**
 * Simulated Response Generator
 *
 * Provides a rich demo experience that showcases Attune's understanding
 * framework without requiring API keys. Uses the understanding context
 * to generate contextually-aware responses.
 */

import type { UnderstandingContext } from './system-prompt-builder';

const GREETING_RESPONSES = [
  "Hello! I'm Attune -- a chat experience built around **contextual understanding**. As we talk, I track entities, detect your intentions, and notice patterns in our conversation.\n\nTry asking me about a topic you're curious about, and watch the understanding indicators above my responses.",
  "Hey there! Welcome to Attune. I'm running in demo mode right now, but I can still show you how contextual understanding works.\n\nNotice the **Understanding Panel** (toggle with Cmd+I) -- it shows what I'm tracking in real time. Try asking me something!",
  "Hi! Great to see you. I'm Attune's demo mode, here to show you what **contextual intelligence** looks like in action.\n\nAs you chat with me, look for the small chips above my responses -- they show detected entities, intentions, and patterns. Let's explore!",
];

const TOPIC_RESPONSES: Record<string, string[]> = {
  ai: [
    "That's a great topic! In the AI space, understanding context is everything. Traditional chatbots treat each message independently -- Attune tracks **entities** (like \"AI\"), **intentions** (like your curiosity right now), and **patterns** across the whole conversation.\n\nWith API keys configured, I'd give you a deep, contextually-enriched answer. The understanding framework enriches my system prompt so each response builds on everything discussed before.",
    "AI and machine learning are fascinating areas. What makes Attune different from a basic wrapper is that I'm analyzing your messages in real-time:\n\n- **Entity recognition**: I noticed you mentioned an AI-related topic\n- **Intention detection**: You're seeking information (factual question)\n- **Pattern tracking**: If you keep asking about AI, I'll detect that pattern\n\nCheck the Understanding Panel to see this data live.",
  ],
  programming: [
    "Programming is a great conversation topic! Let me show you what Attune does behind the scenes:\n\n1. **Entity extraction**: I detected programming-related concepts in your message\n2. **Context accumulation**: Each message adds to my working memory\n3. **Pattern detection**: After a few exchanges, I'll notice your interests\n\nIn AI mode, all this context enriches every response. Try mentioning specific languages or frameworks!",
  ],
  understanding: [
    "Great question about the understanding framework! Here's how it works:\n\n**Entity Recognition** detects people, places, topics, concepts, and more from your text using pattern matching and known entity lists.\n\n**Intention Detection** classifies what you're trying to do -- asking a factual question, making a request, expressing emotion, switching topics, etc.\n\n**Working Memory** maintains the last 10 messages, tracks entity mention counts, and calculates engagement levels.\n\n**Pattern Tracking** detects sequential patterns (you do A then B), temporal patterns (when you're active), and frequency patterns (topics you return to).\n\nAll of this runs client-side and gets serialized into the AI system prompt for contextually-aware responses.",
  ],
  default: [
    "That's an interesting topic! I'm tracking what you've mentioned as **entities** and what you're trying to do as **intentions**. In AI mode, this context would make my response much richer.\n\nKeep chatting -- after a few messages, you'll see **pattern detection** kick in above my responses. The more we talk, the more I understand your conversation style.",
    "I hear you! Even in demo mode, notice how the understanding indicators above my responses change with each message. They reflect real analysis of your input:\n\n- Entities I've detected\n- Your apparent intention\n- Active conversation topics\n\nAdd API keys to `.env.local` to see this understanding translate into genuinely contextual AI responses.",
  ],
};

const FOLLOWUP_RESPONSES = [
  "I notice you're continuing to explore this topic -- that's exactly the kind of pattern I track! After a few more exchanges, the **Patterns** section in the Understanding Panel will show detected conversation patterns.\n\nIn AI mode, this accumulated context makes each response progressively more relevant.",
  "Great follow-up. My working memory now has context from our previous messages. In AI mode, the system prompt would include:\n\n- All entities mentioned so far\n- Your primary intention pattern\n- Active topics across the conversation\n- Any detected interaction patterns\n\nThis is what makes Attune different from stateless chat wrappers.",
  "Each message adds depth to my understanding. The Understanding Panel should now show multiple entities and topics accumulating.\n\nWith API keys configured, this context directly shapes how the AI responds -- making it feel like the model truly *knows* what we've been discussing.",
];

const FAREWELL_RESPONSES = [
  "Thanks for exploring Attune! Before you go -- check the Understanding Panel one more time. It shows everything I tracked across our conversation: entities, topics, intentions, and patterns.\n\nTo experience the full product, add your API keys to `.env.local` and watch contextual understanding transform AI responses.",
  "See you later! This demo showed the understanding framework in action. To unlock the real experience:\n\n1. Add `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`\n2. Restart the dev server\n3. Select a model from the dropdown\n\nThe understanding framework will enrich every AI response with accumulated context.",
];

const GRATITUDE_RESPONSES = [
  "You're welcome! Happy to demonstrate how contextual understanding works. Each response you've seen has been shaped by the entities, intentions, and patterns detected in your messages.\n\nReady to go deeper? Add API keys for the full AI experience.",
  "Glad I could help! Notice how the understanding indicators evolved throughout our conversation -- that's contextual intelligence at work.",
];

function detectCategory(message: string): string {
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings|howdy|yo)\b/.test(lower)) return 'greeting';
  if (/^(bye|goodbye|see you|later|farewell)\b/.test(lower)) return 'farewell';
  if (/^(thanks|thank you|thx|ty)\b/.test(lower)) return 'gratitude';

  if (/\b(understand|framework|entity|intention|pattern|working memory|context)\b/.test(lower)) return 'understanding';
  if (/\b(ai|artificial intelligence|machine learning|ml|neural|llm|gpt|claude|model)\b/.test(lower)) return 'ai';
  if (/\b(code|programming|developer|software|api|function|typescript|react|python)\b/.test(lower)) return 'programming';

  return 'default';
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a simulated response that demonstrates the understanding framework.
 * Optionally accepts understanding context to make responses contextually aware.
 */
export function generateSimulatedResponse(
  message: string,
  context?: UnderstandingContext
): string {
  const category = detectCategory(message);

  // If we have context with multiple messages, use follow-up responses
  if (context && context.messageCount > 3 && category === 'default') {
    return pick(FOLLOWUP_RESPONSES);
  }

  switch (category) {
    case 'greeting':
      return pick(GREETING_RESPONSES);
    case 'farewell':
      return pick(FAREWELL_RESPONSES);
    case 'gratitude':
      return pick(GRATITUDE_RESPONSES);
    case 'understanding':
      return pick(TOPIC_RESPONSES.understanding);
    case 'ai':
      return pick(TOPIC_RESPONSES.ai);
    case 'programming':
      return pick(TOPIC_RESPONSES.programming);
    default: {
      // If we have entity context, reference it
      if (context && context.entities.length > 0) {
        const entityNames = context.entities
          .slice(0, 3)
          .map((e) => `**${e.value}**`)
          .join(', ');
        return `I noticed you mentioned ${entityNames}. In AI mode, I'd use this entity tracking to give you a deeply contextual response.\n\nRight now in demo mode, I can show you that the understanding framework is working -- check the chips above this message and the Understanding Panel (Cmd+I) for the full picture.\n\nTo unlock real AI responses enriched with this context, add your API keys to \`.env.local\`.`;
      }
      return pick(TOPIC_RESPONSES.default);
    }
  }
}

export async function* streamSimulatedResponse(
  message: string,
  context?: UnderstandingContext
): AsyncGenerator<string> {
  const response = generateSimulatedResponse(message, context);
  const words = response.split(' ');

  for (const word of words) {
    yield word + ' ';
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 35));
  }
}
