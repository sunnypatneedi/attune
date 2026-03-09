import { streamText } from 'ai';
import { getModel, hasAnyApiKey } from '@/lib/ai/provider-config';
import { buildSystemPrompt, type UnderstandingContext } from '@/lib/ai/system-prompt-builder';
import { getDb } from '@/lib/db';
import { messages as messagesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { guardInput, guardOutput } from '@/lib/security/spear';

export async function POST(req: Request) {
  const { messages, model: modelId, conversationId, understandingContext } =
    (await req.json()) as {
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
      model: string;
      conversationId: string;
      understandingContext?: UnderstandingContext;
    };

  if (!hasAnyApiKey()) {
    return new Response(JSON.stringify({ error: 'No API keys configured' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- SPEAR Input Gate ---
  // Scans all messages for prompt injection, unicode attacks, instruction overrides
  const preResult = await guardInput(messages, { sessionId: conversationId });

  if (!preResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'blocked',
        reason: preResult.reason || 'Message flagged by security policy',
        riskScore: preResult.riskScore,
      }),
      {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
          'X-Spear-Blocked': 'true',
          'X-Spear-Risk-Score': String(preResult.riskScore),
        },
      }
    );
  }

  const db = getDb();
  const systemPrompt = buildSystemPrompt(understandingContext);

  // Save user message to DB
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg?.role === 'user') {
    db.insert(messagesTable)
      .values({
        id: uuidv4(),
        conversationId,
        role: 'user',
        content: lastUserMsg.content,
        status: 'complete',
        createdAt: new Date(),
      })
      .run();
  }

  const assistantId = uuidv4();

  // Insert placeholder for streaming message
  db.insert(messagesTable)
    .values({
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: new Date(),
    })
    .run();

  // Use sanitized messages from SPEAR (unicode-cleaned, validated)
  const sanitizedMessages = preResult.messages
    .filter((m) => m.role !== 'system' && m.role !== 'developer')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt,
    messages: sanitizedMessages,
    onFinish: async ({ text }) => {
      // --- SPEAR Output Gate ---
      // Scans response for PII leaks, canary exfiltration, deny-listed content
      const postResult = await guardOutput(text, preResult.canary, systemPrompt);

      const finalContent = postResult.allowed ? postResult.output : text;

      db.update(messagesTable)
        .set({
          content: finalContent,
          status: 'complete',
          metadata: {
            spear: {
              inputRiskScore: preResult.riskScore,
              outputRiskScore: postResult.riskScore,
              outputAllowed: postResult.allowed,
              outputReason: postResult.reason,
            },
          },
        })
        .where(eq(messagesTable.id, assistantId))
        .run();
    },
  });

  return result.toTextStreamResponse({
    headers: {
      'X-Message-Id': assistantId,
      'X-Spear-Risk-Score': String(preResult.riskScore),
    },
  });
}
