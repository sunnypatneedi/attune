# PRD: Visible Understanding Framework

**Status**: Ready for implementation
**Priority**: P0 — This is the product differentiator
**Audience**: Junior engineers and designers integrating this into an existing chat system
**Last updated**: 2026-03-09

---

## Table of Contents

1. [Why This Matters](#1-why-this-matters)
2. [What We're Building](#2-what-were-building)
3. [How It Works Today](#3-how-it-works-today)
4. [Target Architecture](#4-target-architecture)
5. [Feature Specifications](#5-feature-specifications)
6. [Implementation Guide](#6-implementation-guide)
7. [Design Specifications](#7-design-specifications)
8. [Data Flow Reference](#8-data-flow-reference)
9. [Codebase Map](#9-codebase-map)
10. [Testing Plan](#10-testing-plan)
11. [Success Metrics](#11-success-metrics)
12. [Appendix: Key Types & Interfaces](#appendix-key-types--interfaces)

---

## 1. Why This Matters

### The Problem

Attune has a sophisticated understanding framework that runs on every user message — it detects entities (people, places, topics), classifies intentions (questions, requests, emotions), tracks conversation patterns, and maintains working memory. This is the **only thing that differentiates Attune** from the 400+ open-source ChatGPT wrappers on GitHub.

But right now, **users can't see any of it**.

The framework silently enriches the AI system prompt behind the scenes. There's no visual feedback showing users that Attune "gets" them. The InfoPanel exists but shows fake statistics (first 3 words of messages as "topics"). The understanding framework might as well not exist from the user's perspective.

### The Insight

Users don't trust what they can't see. If Attune understands that you've mentioned "machine learning" three times, shifted from asking questions to requesting specific recommendations, and have a pattern of returning to AI topics — **showing that** is more powerful than any invisible system prompt enrichment.

The goal: make Attune's understanding **visible, trustworthy, and delightful**.

### What Success Looks Like

A user sends "Tell me about transformer architectures" and sees the assistant response appear with subtle chips above it:

```
  [sparkle icon] factual question  |  transformer architectures  |  AI topic
  ┌─────────────────────────────────────────────────────────┐
  │ Transformer architectures are a class of neural network │
  │ models that use self-attention mechanisms...            │
  └─────────────────────────────────────────────────────────┘
```

Three messages later, they mention "BERT" and see:

```
  [sparkle icon] factual question  |  BERT  |  transformer architectures  |  you often ask about AI
  ┌─────────────────────────────────────────────────────────┐
  │ BERT (Bidirectional Encoder Representations from        │
  │ Transformers) builds directly on the transformer...     │
  └─────────────────────────────────────────────────────────┘
```

The user thinks: *"It noticed I keep asking about AI. It remembered transformers from earlier."* That's the moment Attune stops being "another wrapper" and starts being **different**.

---

## 2. What We're Building

### Three Connected Features

| Feature | What users see | Where it appears |
|---------|---------------|-----------------|
| **Inline Context Indicators** | Small chips above assistant messages showing detected entities, intention, topics, patterns | In the chat flow, above each assistant message bubble |
| **Understanding Panel** (InfoPanel rewrite) | Aggregated real-time view of all entities, topics, intentions, and patterns across the conversation | Right sidebar panel (toggle with Cmd+I) |
| **Framework Wiring** | Nothing visible directly — but AI responses become contextually richer because the understanding data is now sent to the API | Behind the scenes; users notice better responses |

### What We're NOT Building

- No new understanding capabilities (entity recognition, intention detection, etc. already exist)
- No persistence layer (that's a separate future workstream)
- No new AI integrations
- No changes to the database schema
- No changes to the simulated response content

---

## 3. How It Works Today

### Current Data Flow (Before)

```
User types message
    │
    ▼
ChatView.handleSend(content)
    │
    ├── addMessage() to Zustand store
    ├── createMessage() to database
    │
    ▼
/api/chat receives { messages, model, conversationId }
    │                                        ▲
    │   understandingContext is UNDEFINED ────┘
    │
    ▼
buildSystemPrompt(undefined) → returns BASE prompt only
    │
    ▼
AI responds with generic system prompt
    │
    ▼
Response streamed to UI
    │
    ▼
InfoPanel shows fake data (first 3 words of messages)
```

### What's Wrong

1. **EnhancedUnderstandingFramework is never instantiated** in the chat flow
2. **processUserMessage() is never called** — no entity/intention detection happens
3. **serializeContext() is never called** — the API never receives understanding data
4. **InfoPanel shows fake data** — "recent topics" are just the first 3 words of each message
5. **Messages have a `metadata` field** that is never populated
6. **The `/api/chat` route accepts `understandingContext`** but it's always undefined

The understanding framework is fully implemented but entirely disconnected.

---

## 4. Target Architecture

### New Data Flow (After)

```
User types message
    │
    ▼
ChatView.handleSend(content)
    │
    ├── framework.processUserMessage(content)     ◄── NEW: runs entity/intention detection
    ├── framework.serializeContext()               ◄── NEW: captures understanding snapshot
    ├── Create MessageInsight from serialized data ◄── NEW: structured insight object
    ├── addMessage() to Zustand store
    ├── createMessage() to database
    │
    ▼
/api/chat receives { messages, model, conversationId, understandingContext }
    │                                                          ▲
    │   understandingContext is NOW POPULATED ──────────────────┘
    │
    ▼
buildSystemPrompt(understandingContext) → enriched prompt with entities, topics, patterns
    │
    ▼
AI responds with contextually-aware system prompt
    │
    ▼
Response streamed to UI
    │
    ├── framework.processSystemMessage(response)  ◄── NEW: feeds response back into framework
    │
    ▼
ChatMessageComponent renders with insight prop   ◄── NEW: shows context indicators
    │
    ▼
InfoPanel shows REAL aggregated understanding data ◄── NEW: entities, topics, intentions, patterns
```

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Framework lives as a `useRef` in ChatView | It's session-scoped, stateful, and shouldn't trigger re-renders on internal state changes |
| Insights stored in Zustand `messageInsights` map | Keyed by assistant message ID, allows any component to access understanding data |
| Historical messages replayed through framework on load | Rebuilds context when navigating to an existing conversation |
| Indicators shown on assistant messages only | Users care about what the system understood when it responded, not what it detected on their own input |
| Indicators hidden during streaming | Avoids visual noise while the response is still arriving |

---

## 5. Feature Specifications

### 5.1 Inline Context Indicators

**Location**: Above each assistant message bubble, below the avatar line
**Visibility**: Only on non-streaming assistant messages that have an associated insight
**Animation**: `fade-in` + `slide-in-from-bottom-1` over 500ms

#### What Gets Shown

Each indicator type has a confidence threshold. Items below the threshold are hidden.

| Indicator | Source | Threshold | Max shown | Visual |
|-----------|--------|-----------|-----------|--------|
| Primary intention | `insight.intentions[0]` | confidence > 0.5 | 1 | `Badge variant="secondary"` with human-readable label |
| Entities | `insight.entities` | confidence > 0.4 | 4 | `Badge variant="outline"` with entity value |
| Active topics | `insight.activeTopics` | (shown only if no entities) | 3 | `Badge variant="outline"` |
| Patterns | `insight.patterns` | confidence > 0.5 | 2 | `Badge variant="secondary"` with primary color |
| Sentiment | `insight.dominantSentiment` | not "neutral" | 1 | `Badge variant="secondary"` with "{sentiment} tone" |

#### Indicator Labels

Intentions are stored as enum values (e.g., `question_factual`). They must be converted to human-readable labels:

| Enum value | Display label |
|------------|--------------|
| `question_factual` | factual question |
| `question_opinion` | seeking opinion |
| `question_clarification` | clarification |
| `request_action` | action request |
| `suggest_action` | suggestion |
| `command` | direct request |
| `greeting` | greeting |
| `farewell` | farewell |
| `gratitude` | thanks |
| `express_positive` | positive |
| `express_negative` | concern |
| `feedback_positive` | positive feedback |
| `feedback_negative` | negative feedback |
| `topic_switch` | topic change |

#### Tooltip Behavior

Every entity and intention badge has a tooltip (300ms delay):
- **Intention**: "Detected intention (87% confidence)"
- **Entity**: "{entity_type} (92%)" — e.g., "topic (92%)"
- **Pattern**: "Pattern detected: {full description} (75%)"

#### Edge Cases

- **No insight data**: Component returns `null` — no empty state, no placeholder
- **Only unknown intention**: Treat as no intention — skip rendering
- **Duplicate entities and topics**: If entities already surface the same info as topics, skip topics
- **Very long pattern descriptions**: Truncate at 30 characters with "..."

### 5.2 Understanding Panel (InfoPanel Rewrite)

**Location**: Right sidebar, toggled with Cmd+I or the brain icon in the header
**Layout**: Vertical stack of collapsible sections

#### Sections

**1. Conversation (always open by default)**
| Field | Source | Format |
|-------|--------|--------|
| Messages | `messages.length` | Number |
| User turns | `messages.filter(user).length` | Number |
| Mode | `mode` | Badge: "Demo" or model name |
| Tone | `dominantSentiment` | Capitalized string (only if non-neutral) |

**2. Entities (open if any exist)**
| Column | Source | Format |
|--------|--------|--------|
| Type badge | `entity.type` | `Badge variant="outline"` with type name |
| Value | `entity.value` | Truncated text |
| Mention count | Aggregated across insights | "x{count}" (only if > 1) |
| Confidence | `entity.confidence` | `Progress` bar (width 32px) |

Entities are deduplicated by lowercase value, sorted by mention count (desc) then confidence (desc). Max 12 shown, with "+N more" overflow indicator.

**3. Topics (open if any exist)**
Topics displayed as `Badge variant="secondary"` in a flex-wrap container. Sorted by occurrence count. Max 8 shown.

**4. Intentions (open if any exist)**
| Column | Source | Format |
|--------|--------|--------|
| Label | Human-readable intention label | Capitalized text |
| Count | Number of occurrences across conversation | "Nx" |
| Avg confidence | `totalConfidence / count` | `Progress` bar |

Filtered to exclude `unknown`. Sorted by count (desc). Max 6 shown.

**5. Patterns (open if any exist)**
Each pattern shows:
- Description text
- Confidence bar with percentage label

Filtered to confidence > 0.4. Shown as they're detected — no max limit (typically 0-3).

#### Empty States

Each section shows an italic muted message when empty:
- Entities: "Send messages to see entity tracking"
- Topics: "Topics will appear as the conversation develops"
- Intentions: "Intention detection activates with messages"
- Patterns: "Patterns emerge after several exchanges"

#### Section Headers

Each section header shows a count badge when items exist:
```
Entities  [7]  ▼
```

### 5.3 Framework Wiring

This is the invisible but critical piece — connecting the understanding framework to the chat flow.

#### On message send:

1. Get framework instance (lazy-initialized `useRef`)
2. Call `framework.processUserMessage(content)` — this runs entity recognition, intention detection, updates working memory, tracks patterns
3. Call `framework.serializeContext()` — returns snapshot of current understanding state
4. Build `MessageInsight` from serialized data (adding human-readable labels to intentions)
5. Store insight in Zustand via `setMessageInsight(assistantMessageId, insight)`
6. Include `understandingContext` in the `/api/chat` fetch body

#### On response complete:

1. Call `framework.processSystemMessage(fullContent)` — feeds assistant response back into the framework so it tracks both sides of conversation

#### On conversation load:

1. Reset framework and clear insights
2. Replay all historical messages through the framework in order (user → processUserMessage, assistant → processSystemMessage)
3. For each user message, if the next message is an assistant message, attach the serialized context as that assistant message's insight
4. This rebuilds the full understanding state from message history

---

## 6. Implementation Guide

This section is written for junior engineers. It assumes you can read TypeScript and React, know what Zustand is, and have the dev server running.

### Prerequisites

```bash
cd /path/to/attune
npm install
npm run dev
# Visit http://localhost:3000/chat
```

### File Map: What to touch

| File | Action | Difficulty |
|------|--------|-----------|
| `src/lib/store.ts` | Add `MessageInsight` type and store fields | Easy |
| `src/components/chat/chat-context-indicator.tsx` | Create new component | Medium |
| `src/components/chat/chat-message.tsx` | Add `insight` prop, render indicator | Easy |
| `src/components/chat/chat-messages.tsx` | Pass `messageInsights` down | Easy |
| `src/components/chat/chat-view.tsx` | Wire framework, biggest change | Hard |
| `src/components/chat/info-panel.tsx` | Rewrite with real data | Medium |

### Step-by-Step

#### Step 1: Add Understanding State to the Store

**File**: `src/lib/store.ts`

Add a new type and three new fields to the store. This is where understanding snapshots live.

**New type to add** (after `ConversationSummary`):

```typescript
/** Understanding context snapshot attached to a message at generation time */
export interface MessageInsight {
  entities: Array<{ type: string; value: string; confidence: number }>;
  intentions: Array<{ type: string; confidence: number; label: string }>;
  activeTopics: string[];
  dominantSentiment?: string;
  patterns: Array<{ type: string; description: string; confidence: number }>;
  messageCount: number;
}
```

**New fields to add to the `ChatStore` interface**:

```typescript
// Understanding
messageInsights: Record<string, MessageInsight>;
setMessageInsight: (messageId: string, insight: MessageInsight) => void;
clearInsights: () => void;
```

**New implementation in the `create()` call**:

```typescript
// Understanding
messageInsights: {},
setMessageInsight: (messageId, insight) => set((s) => ({
  messageInsights: { ...s.messageInsights, [messageId]: insight },
})),
clearInsights: () => set({ messageInsights: {} }),
```

**Why `Record<string, MessageInsight>`?** We key by assistant message ID. When a message renders, it looks up its own ID in this map. If an entry exists, it has understanding data to display. This is a simple, fast O(1) lookup.

**Why not store on the message itself?** The `ChatMessage` type has a `metadata` field, but it's loosely typed (`Record<string, unknown>`) and shared with DB serialization. Keeping insights in a separate map is cleaner and avoids type gymnastics.

#### Step 2: Create the Context Indicator Component

**File**: `src/components/chat/chat-context-indicator.tsx` (new file)

This component receives a `MessageInsight` and renders a row of small badges. Think of it as a "what did Attune understand?" summary.

**Key design rules**:
- Always start with the sparkle icon (from `lucide-react`)
- Show intention first, then entities, then topics (only if no entities), then patterns, then sentiment
- Each badge uses the `Badge` component from `@/components/ui/badge`
- Entities and intentions get `Tooltip` wrappers showing confidence percentages
- Return `null` if there's nothing meaningful to show (all below thresholds)

**Structure**:

```tsx
<div className="flex items-center gap-1.5 flex-wrap animate-in fade-in ...">
  <Sparkles icon />

  {/* Primary intention */}
  {hasIntention && <Badge>factual question</Badge>}

  {/* Top entities */}
  {topEntities.map(entity => <Badge>{entity.value}</Badge>)}

  {/* Topics (only if no entities) */}
  {!hasEntities && topics.map(topic => <Badge>{topic}</Badge>)}

  {/* Patterns */}
  {topPatterns.map(pattern => <Badge>{pattern.description}</Badge>)}

  {/* Sentiment */}
  {sentiment && <Badge>{sentiment} tone</Badge>}
</div>
```

**Styling**:
- Intention badges: `variant="secondary"`, `text-[10px] h-5 px-1.5 font-normal text-muted-foreground`
- Entity badges: `variant="outline"`, same sizing
- Pattern badges: `variant="secondary"`, `text-primary/70` for subtle emphasis
- The whole row: `mb-1.5` to add spacing before the message bubble

**Don't forget**: Wrap in `<TooltipProvider delayDuration={300}>` so tooltips work.

#### Step 3: Update the Message Component

**File**: `src/components/chat/chat-message.tsx`

Add an optional `insight` prop:

```typescript
interface ChatMessageComponentProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  createdAt: Date;
  insight?: MessageInsight;  // ← NEW
}
```

Render the indicator above the message bubble, inside the content column:

```tsx
<div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
  {/* Context indicator — shown above assistant messages */}
  {isAssistant && insight && !isStreaming && (
    <ChatContextIndicator insight={insight} />
  )}

  <div className="rounded-2xl px-4 py-3 ...">
    {/* existing message content */}
  </div>
</div>
```

**Why only assistant messages?** The indicator shows what the system understood from the *preceding* user message. It's the assistant's response that benefits from this context. Showing indicators on user messages would be confusing ("why is it telling me what I said?").

**Why hide during streaming?** The indicator appearing mid-stream is visually jarring. Wait until streaming completes.

#### Step 4: Pass Insights Through the Message List

**File**: `src/components/chat/chat-messages.tsx`

Add `messageInsights` to the props:

```typescript
interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  streamingContent: string;
  messageInsights: Record<string, MessageInsight>;  // ← NEW
}
```

Pass to each message:

```tsx
<ChatMessageComponent
  key={message.id}
  id={message.id}
  role={message.role}
  content={displayContent}
  isStreaming={isStreaming}
  createdAt={message.createdAt}
  insight={messageInsights[message.id]}  // ← NEW
/>
```

#### Step 5: Wire the Understanding Framework (The Big One)

**File**: `src/components/chat/chat-view.tsx`

This is the most complex change. You're connecting the understanding framework to the chat flow.

##### 5a: Import the framework

```typescript
import { EnhancedUnderstandingFramework } from '@/lib/enhanced-understanding-framework';
import { IntentionType } from '@/lib/enhanced-types';
```

##### 5b: Create a label helper

The framework stores intentions as enum values (`question_factual`). Users need human-readable labels. Add this function at the top of the file:

```typescript
function intentionLabel(type: IntentionType | string): string {
  const labels: Record<string, string> = {
    question_factual: 'factual question',
    question_opinion: 'seeking opinion',
    // ... (see Section 5.1 for full table)
  };
  return labels[type] || type;
}
```

##### 5c: Add a framework ref

Inside the component, add:

```typescript
const frameworkRef = useRef<EnhancedUnderstandingFramework | null>(null);

const getFramework = useCallback(() => {
  if (!frameworkRef.current) {
    frameworkRef.current = new EnhancedUnderstandingFramework();
  }
  return frameworkRef.current;
}, []);
```

**Why `useRef` and not state?** The framework is a class with internal mutable state (working memory, entity maps, pattern history). Putting it in React state would cause re-renders on every internal mutation. `useRef` holds the instance without triggering re-renders.

**Why lazy initialization?** The framework constructor creates four sub-systems (IntentionDetector, EntityRecognizer, WorkingMemory, InteractionPatternTracker). Lazy init avoids unnecessary work if the component mounts but the user navigates away.

##### 5d: Replay history on load

In the `useEffect` that loads initial messages, add framework replay:

```typescript
useEffect(() => {
  setActiveConversation(conversationId);
  clearInsights();

  const framework = getFramework();
  framework.reset();

  // ... existing message mapping ...
  setMessages(mapped);

  // Replay existing messages through the framework
  for (let i = 0; i < initialMessages.length; i++) {
    const m = initialMessages[i];
    if (m.role === 'user') {
      framework.processUserMessage(m.content);

      // Attach insight to the NEXT assistant message
      const nextMsg = initialMessages[i + 1];
      if (nextMsg && nextMsg.role === 'assistant') {
        const serialized = framework.serializeContext();
        const insight: MessageInsight = {
          entities: serialized.entities,
          intentions: serialized.intentions.map((i) => ({
            ...i,
            label: intentionLabel(i.type),
          })),
          activeTopics: serialized.activeTopics,
          dominantSentiment: serialized.dominantSentiment,
          patterns: serialized.patterns,
          messageCount: serialized.messageCount,
        };
        setMessageInsight(nextMsg.id, insight);
      }
    } else if (m.role === 'assistant') {
      framework.processSystemMessage(m.content);
    }
  }
}, [conversationId, initialMessages, /* ... */]);
```

**Why replay?** When a user navigates to an existing conversation, the framework starts empty. Replaying messages rebuilds the working memory, entity map, and pattern history so the next message benefits from full context.

**Why attach insight to the NEXT message?** The insight represents what was understood *before* the assistant replied. The assistant message is the one that should display it.

##### 5e: Process user messages in handleSend

At the beginning of `handleSend`, add:

```typescript
const framework = getFramework();
framework.processUserMessage(content);
const serialized = framework.serializeContext();

const insight: MessageInsight = {
  entities: serialized.entities,
  intentions: serialized.intentions.map((i) => ({
    ...i,
    label: intentionLabel(i.type),
  })),
  activeTopics: serialized.activeTopics,
  dominantSentiment: serialized.dominantSentiment,
  patterns: serialized.patterns,
  messageCount: serialized.messageCount,
};
```

Then, after creating the assistant message placeholder:

```typescript
setMessageInsight(assistantId, insight);
```

##### 5f: Send understanding context to the API

In the AI mode fetch call, add `understandingContext`:

```typescript
body: JSON.stringify({
  messages: allMessages,
  model,
  conversationId,
  understandingContext: serialized,  // ← NEW
}),
```

This is what makes the AI responses actually contextual. The `buildSystemPrompt()` function on the server already handles this data — it just never received any before.

##### 5g: Feed responses back into the framework

After streaming completes (both simulated and AI mode):

```typescript
framework.processSystemMessage(fullContent);
```

This ensures the framework tracks both sides of the conversation for pattern detection and context accumulation.

##### 5h: Update the render to pass insights

```tsx
<ChatMessages
  messages={messages}
  streamingMessageId={streamingMessageId}
  streamingContent={streamingContent}
  messageInsights={messageInsights}  // ← NEW
/>
```

#### Step 6: Rewrite the InfoPanel

**File**: `src/components/chat/info-panel.tsx`

Replace the fake data with real aggregated understanding data. The panel should read from `useChatStore().messageInsights`.

**Aggregation logic** (implement as a `useMemo` hook or custom hook):

1. Collect all `MessageInsight` values from the store
2. **Entities**: Deduplicate by lowercase value. Track mention count (how many insights mention this entity). Keep highest confidence per entity. Sort by count desc, then confidence desc.
3. **Topics**: Count occurrences across all insights. Sort by count desc.
4. **Intentions**: Group by type. Count occurrences. Calculate average confidence. Sort by count desc. Filter out `unknown`.
5. **Patterns**: Take from the latest insight (patterns are cumulative). Filter to confidence > 0.4.
6. **Sentiment**: Take the most recent non-neutral sentiment.

**Important**: Use `useMemo` with `[messageInsights, messages.length]` as dependencies. Aggregation involves iterating all insights — don't recompute on every render.

See Section 5.2 for the full section-by-section spec.

---

## 7. Design Specifications

### 7.1 Context Indicator Visual Hierarchy

```
Priority (left to right):
1. Sparkle icon (always, anchors the row)
2. Intention badge (secondary variant, muted color)
3. Entity badges (outline variant, up to 4)
4. Pattern badges (secondary variant, primary color accent)
5. Sentiment badge (secondary variant, rightmost)
```

### 7.2 Badge Sizing

All badges in the indicator row use:
```
text-[10px] h-5 px-1.5 font-normal
```

This is deliberately smaller than standard badges to avoid competing with the message content.

### 7.3 Color Tokens

| Element | Light mode | Dark mode |
|---------|-----------|-----------|
| Intention badge bg | `secondary` (oklch 0.97) | `secondary` (oklch 0.269) |
| Intention badge text | `muted-foreground` | `muted-foreground` |
| Entity badge border | `border` (oklch 0.922) | `border` (oklch 0.269) |
| Entity badge text | `muted-foreground` | `muted-foreground` |
| Pattern badge text | `primary/70` | `primary/70` |
| Sparkle icon | `primary/60` | `primary/60` |
| Hover state (all) | `foreground` | `foreground` |

### 7.4 Animation

- Indicator row: `animate-in fade-in slide-in-from-bottom-1 duration-500`
- Appears after streaming ends (not during)
- Respects `prefers-reduced-motion` (globals.css already handles this)

### 7.5 Responsive Behavior

- **Desktop (>1024px)**: Full indicator row, InfoPanel as resizable sidebar
- **Tablet (640-1024px)**: Indicator row wraps naturally, InfoPanel as Sheet
- **Mobile (<640px)**: Indicator row wraps, may show fewer items. InfoPanel as bottom Sheet

### 7.6 InfoPanel Layout

```
┌─────────────────────────┐
│ [sparkle] Understanding  │
│ Tracking 7 entities...   │
├─────────────────────────┤
│ [brain] Conversation  ▼  │
│   Messages        12     │
│   User turns       6     │
│   Mode         [Demo]    │
│   Tone         curious   │
├─────────────────────────┤
│ [fingerprint] Entities [7] ▼ │
│   [topic] machine learning x3 ██░ │
│   [concept] BERT          x2 █░░ │
│   [person] Vaswani        x1 █░░ │
│   ...                          │
├─────────────────────────┤
│ [eye] Topics [4]       ▼ │
│   [AI] [deep learning]   │
│   [NLP] [transformers]   │
├─────────────────────────┤
│ [target] Intentions [3] ▼│
│   factual question  4x ██│
│   clarification     2x █░│
├─────────────────────────┤
│ [activity] Patterns [1] ▼│
│   You often ask about AI  │
│   ████████░░ 75%          │
└─────────────────────────┘
```

---

## 8. Data Flow Reference

### Message Lifecycle

```
1. User types "What is BERT?"

2. ChatView.handleSend("What is BERT?") is called

3. Framework processes the message:
   framework.processUserMessage("What is BERT?")
   └── EntityRecognizer.recognizeEntities()
   │   └── detects: { type: "product", value: "BERT", confidence: 0.85 }
   │
   └── IntentionDetector.detectIntentions()
   │   └── detects: { type: "question_factual", confidence: 0.9 }
   │
   └── WorkingMemory.addMessage()
   │   └── updates entity map, topic list, engagement level
   │
   └── PatternTracker.trackMessage()
       └── checks for sequential, temporal, frequency patterns

4. Framework serializes context:
   framework.serializeContext()
   └── returns:
       {
         entities: [{ type: "product", value: "BERT", confidence: 0.85 }],
         intentions: [{ type: "question_factual", confidence: 0.9 }],
         activeTopics: ["BERT", "AI"],
         messageCount: 5,
         dominantSentiment: undefined,
         patterns: [{ type: "frequency", description: "frequently mentions AI topics", confidence: 0.7 }]
       }

5. Insight is built and stored:
   setMessageInsight(assistantId, {
     entities: [{ type: "product", value: "BERT", confidence: 0.85 }],
     intentions: [{ type: "question_factual", confidence: 0.9, label: "factual question" }],
     activeTopics: ["BERT", "AI"],
     dominantSentiment: undefined,
     patterns: [{ type: "frequency", description: "frequently mentions AI topics", confidence: 0.7 }],
     messageCount: 5,
   })

6. API call includes understanding context:
   fetch('/api/chat', { body: { messages, model, conversationId, understandingContext: serialized } })

7. Server builds enriched system prompt:
   "You are Attune...
    Current conversation topics: BERT, AI
    Entities mentioned: BERT (product)
    Observed interaction patterns: frequently mentions AI topics
    This is message #6 in the conversation."

8. AI responds with contextual awareness

9. Response streamed to UI, framework updated:
   framework.processSystemMessage(fullContent)

10. Message renders with indicator:
    ChatMessageComponent receives insight prop
    └── ChatContextIndicator renders:
        [sparkle] factual question | BERT | frequently mentions AI topics
```

### Store State After 3 Messages

```typescript
// After: "Hi", "Tell me about ML", "What is BERT?"

useChatStore.getState().messageInsights = {
  "assistant-msg-1": {
    entities: [],
    intentions: [{ type: "greeting", confidence: 0.9, label: "greeting" }],
    activeTopics: [],
    patterns: [],
    messageCount: 1,
  },
  "assistant-msg-2": {
    entities: [{ type: "topic", value: "ML", confidence: 0.8 }],
    intentions: [{ type: "question_factual", confidence: 0.9, label: "factual question" }],
    activeTopics: ["ML"],
    patterns: [],
    messageCount: 3,
  },
  "assistant-msg-3": {
    entities: [
      { type: "product", value: "BERT", confidence: 0.85 },
      { type: "topic", value: "ML", confidence: 0.8 },
    ],
    intentions: [{ type: "question_factual", confidence: 0.9, label: "factual question" }],
    activeTopics: ["BERT", "ML", "AI"],
    patterns: [{ type: "frequency", description: "frequently asks about AI topics", confidence: 0.7 }],
    messageCount: 5,
  },
}
```

---

## 9. Codebase Map

### Understanding Framework Files

| File | What it does | Key class/export |
|------|-------------|-----------------|
| `src/lib/enhanced-understanding-framework.ts` | Orchestrates all understanding | `EnhancedUnderstandingFramework` |
| `src/lib/enhanced-types.ts` | Type definitions | `IntentionType`, `EntityType`, `Entity`, `Intention`, `EnhancedMessage`, `ConversationContext` |
| `src/lib/understanding/entity-recognizer.ts` | Extracts entities from text | `EntityRecognizer` |
| `src/lib/understanding/intention-detector.ts` | Classifies user intentions | `IntentionDetector` |
| `src/lib/memory/working-memory.ts` | Maintains conversation context | `WorkingMemory` |
| `src/lib/patterns/interaction-pattern-tracker.ts` | Detects interaction patterns | `InteractionPatternTracker` |

### Chat Component Files

| File | What it does | Props |
|------|-------------|-------|
| `src/components/chat/chat-view.tsx` | Main chat container, owns the framework | `{ conversationId, initialMessages }` |
| `src/components/chat/chat-messages.tsx` | Message list | `{ messages, streamingMessageId, streamingContent, messageInsights }` |
| `src/components/chat/chat-message.tsx` | Single message | `{ id, role, content, isStreaming, createdAt, insight? }` |
| `src/components/chat/chat-context-indicator.tsx` | Understanding chips | `{ insight }` |
| `src/components/chat/info-panel.tsx` | Understanding sidebar | (reads from store) |

### Store & Backend

| File | What it does |
|------|-------------|
| `src/lib/store.ts` | Zustand store with messages, insights, UI state |
| `src/lib/ai/system-prompt-builder.ts` | Builds AI system prompt from understanding context |
| `src/app/api/chat/route.ts` | Streaming chat API endpoint |
| `src/lib/db/schema.ts` | Database schema (conversations, messages, preferences) |

---

## 10. Testing Plan

### Manual Testing Checklist

Run each scenario in the browser at `http://localhost:3000/chat`.

#### Scenario 1: Basic Indicator Rendering

1. Start a new conversation
2. Send: "Tell me about machine learning"
3. **Verify**: After the assistant responds, context indicator chips appear above the response
4. **Verify**: You see at least an intention badge ("factual question") and an entity ("machine learning")
5. **Verify**: Hovering over a badge shows a tooltip with confidence percentage

#### Scenario 2: Accumulating Context

1. Continue from Scenario 1
2. Send: "How does BERT work?"
3. **Verify**: The new assistant response shows both "BERT" and possibly "machine learning" as entities
4. **Verify**: The InfoPanel (Cmd+I) shows both entities with mention counts

#### Scenario 3: Pattern Detection

1. Send 3+ questions about AI-related topics
2. **Verify**: After enough messages, a pattern badge appears (e.g., "frequently asks about AI topics")
3. **Verify**: The pattern also appears in the InfoPanel's Patterns section

#### Scenario 4: Empty State

1. Start a new conversation
2. Open the InfoPanel (Cmd+I)
3. **Verify**: Each section shows its empty state message
4. **Verify**: No context indicators appear until after the first exchange

#### Scenario 5: Conversation Reload

1. Have a conversation with 4+ messages
2. Refresh the page
3. Navigate back to the same conversation
4. **Verify**: Context indicators appear on historical assistant messages (rebuilt from replay)
5. **Verify**: InfoPanel shows aggregated data from all messages

#### Scenario 6: Streaming Behavior

1. Send a message
2. While the response is streaming:
   - **Verify**: No context indicator is visible yet
3. After streaming completes:
   - **Verify**: Context indicator fades in above the message

#### Scenario 7: Indicator Thresholds

1. Send: "Hi"
2. **Verify**: Indicator shows "greeting" intention (should be high confidence)
3. Send: "asdfghjkl" (gibberish)
4. **Verify**: Either no indicator appears or intention shows as minimal

### Automated Tests

The existing test suite validates component structure:
- `client-components.test.ts`: Verifies `use client` directives
- `component-quality.test.ts`: Verifies exports and no DOM manipulation

Run: `npm run test`

### Build Verification

```bash
npm run build   # No type errors
npm run lint    # No ESLint errors
npm run test    # All tests pass
```

---

## 11. Success Metrics

### Immediate (Can measure now)

| Metric | How to check | Target |
|--------|-------------|--------|
| Indicators render | Manual: send a message, see chips | Every assistant message has indicators |
| InfoPanel shows real data | Manual: open InfoPanel, verify entities | Entities match what user mentioned |
| No build regressions | `npm run build` | Zero errors |
| No test regressions | `npm run test` | All tests pass |

### Future (Requires analytics instrumentation)

| Metric | What it measures | Target |
|--------|-----------------|--------|
| InfoPanel open rate | Do users discover and use the panel? | >20% of sessions |
| Tooltip hover rate | Do users explore the understanding data? | >10% of users hover at least one badge |
| Message count per session | Does visible understanding encourage longer conversations? | >5 messages (up from current ~3) |
| Return rate | Do users come back after experiencing contextual understanding? | >30% within 7 days |
| "Wow moment" latency | How many messages until the user sees a pattern badge? | <5 messages |

### Anti-Metrics (What we don't want)

| Anti-metric | What it means | Mitigation |
|-------------|--------------|-----------|
| Indicator ignored (never hovered) | Too subtle or irrelevant | Increase visual prominence or show more relevant data |
| InfoPanel opened then immediately closed | Data isn't useful | Improve aggregation or reduce noise |
| Users disabling the panel | It's annoying | Make indicators optional in settings |

---

## Appendix: Key Types & Interfaces

### MessageInsight (Store)

```typescript
export interface MessageInsight {
  entities: Array<{
    type: string;       // EntityType enum value: "person", "topic", "concept", etc.
    value: string;      // Raw entity text: "machine learning", "BERT"
    confidence: number; // 0.0-1.0
  }>;
  intentions: Array<{
    type: string;       // IntentionType enum value: "question_factual", "greeting", etc.
    confidence: number; // 0.0-1.0
    label: string;      // Human-readable: "factual question", "greeting"
  }>;
  activeTopics: string[];            // Currently tracked topics
  dominantSentiment?: string;        // "positive", "negative", "neutral", or undefined
  patterns: Array<{
    type: string;       // PatternType: "sequential", "temporal", "frequency"
    description: string; // Human-readable: "frequently asks about AI topics"
    confidence: number;  // 0.0-1.0
  }>;
  messageCount: number;              // Total messages at time of snapshot
}
```

### IntentionType (Framework)

```typescript
enum IntentionType {
  QUESTION_FACTUAL = 'question_factual',
  QUESTION_OPINION = 'question_opinion',
  QUESTION_CLARIFICATION = 'question_clarification',
  REQUEST_ACTION = 'request_action',
  SUGGEST_ACTION = 'suggest_action',
  COMMAND = 'command',
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  GRATITUDE = 'gratitude',
  APOLOGY = 'apology',
  AGREEMENT = 'agreement',
  DISAGREEMENT = 'disagreement',
  EXPRESS_POSITIVE = 'express_positive',
  EXPRESS_NEGATIVE = 'express_negative',
  EXPRESS_NEUTRAL = 'express_neutral',
  FEEDBACK_POSITIVE = 'feedback_positive',
  FEEDBACK_NEGATIVE = 'feedback_negative',
  TOPIC_SWITCH = 'topic_switch',
  META_COMMUNICATION = 'meta_communication',
  SYSTEM_INFORM = 'system_inform',
  SYSTEM_REQUEST = 'system_request',
  SYSTEM_SUGGEST = 'system_suggest',
  SYSTEM_ACKNOWLEDGE = 'system_acknowledge',
  SYSTEM_CLARIFY = 'system_clarify',
  UNKNOWN = 'unknown',
}
```

### EntityType (Framework)

```typescript
enum EntityType {
  PERSON = 'person',
  LOCATION = 'location',
  ORGANIZATION = 'organization',
  DATE_TIME = 'date_time',
  DURATION = 'duration',
  PRODUCT = 'product',
  EVENT = 'event',
  TOPIC = 'topic',
  CONCEPT = 'concept',
  TASK = 'task',
  PREFERENCE = 'preference',
  CUSTOM = 'custom',
}
```

### UnderstandingContext (API)

```typescript
// Sent to /api/chat, consumed by buildSystemPrompt()
interface UnderstandingContext {
  entities: Array<{ type: string; value: string; confidence: number }>;
  intentions: Array<{ type: string; confidence: number }>;
  activeTopics: string[];
  messageCount: number;
  dominantSentiment?: string;
  patterns: Array<{ type: string; description: string; confidence: number }>;
}
```

### serializeContext() Return Shape

```typescript
// Output of framework.serializeContext()
{
  entities: [
    { type: "topic", value: "machine learning", confidence: 0.8 },
    { type: "product", value: "BERT", confidence: 0.85 },
  ],
  intentions: [
    { type: "question_factual", confidence: 0.9 },
  ],
  activeTopics: ["machine learning", "BERT", "AI"],
  messageCount: 5,
  dominantSentiment: undefined,
  patterns: [
    { type: "frequency", description: "frequently mentions AI topics", confidence: 0.7 },
  ],
}
```

---

## Quick Reference: Confidence Thresholds

| Component | Entity threshold | Intention threshold | Pattern threshold |
|-----------|-----------------|--------------------|--------------------|
| Context Indicator | > 0.4 | > 0.5 | > 0.5 |
| InfoPanel entities | (all shown) | — | — |
| InfoPanel patterns | — | — | > 0.4 |
| System prompt (API) | > 0.5 | (all sent) | > 0.5 |

---

*This PRD covers the implementation as built. The code is in the codebase and passes all build, lint, and test checks. This document exists to help a new team understand, maintain, and extend the visible understanding system.*
