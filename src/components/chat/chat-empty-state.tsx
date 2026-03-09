'use client';

import { useChatStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Sparkles, Brain, Lightbulb, Shield, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/app/chat/actions';

const SUGGESTIONS = [
  { icon: Sparkles, text: "What makes you different from other chatbots?", color: "text-purple-500" },
  { icon: Brain, text: "Tell me about your understanding framework", color: "text-blue-500" },
  { icon: Lightbulb, text: "How do you detect intentions and entities?", color: "text-amber-500" },
  { icon: MessageSquare, text: "Let's talk about artificial intelligence", color: "text-green-500" },
];

export function ChatEmptyState() {
  const { addConversation, setActiveConversation, mode } = useChatStore();
  const router = useRouter();

  const handleSuggestion = async (text: string) => {
    const convo = await createConversation(text.slice(0, 50));
    addConversation({ id: convo.id, title: convo.title, updatedAt: convo.updatedAt });
    setActiveConversation(convo.id);
    router.push(`/chat/${convo.id}?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight">Welcome to Attune</h2>
        <p className="text-muted-foreground max-w-md">
          A chat experience built on <strong>contextual understanding</strong>.
          Every message is analyzed for entities, intentions, and patterns.
        </p>

        <div className="flex items-center justify-center gap-2 mt-3">
          {mode === 'simulated' ? (
            <Badge variant="secondary" className="text-xs gap-1">
              <Brain className="h-3 w-3" />
              Demo Mode -- try the suggestions below
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1 text-emerald-600 dark:text-emerald-400">
              <Key className="h-3 w-3" />
              AI Mode active
            </Badge>
          )}
          <Badge variant="outline" className="text-xs gap-1 text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3 w-3" />
            SPEAR protected
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {SUGGESTIONS.map(({ icon: Icon, text, color }) => (
          <Button
            key={text}
            variant="outline"
            className="h-auto p-4 text-left justify-start gap-3 hover:bg-accent/50 transition-colors"
            onClick={() => handleSuggestion(text)}
          >
            <Icon className={`h-5 w-5 shrink-0 ${color}`} />
            <span className="text-sm">{text}</span>
          </Button>
        ))}
      </div>

      {mode === 'simulated' && (
        <div className="text-center text-xs text-muted-foreground max-w-sm space-y-1">
          <p>
            To unlock AI-powered responses, add API keys to <code className="bg-muted px-1 py-0.5 rounded text-[11px]">.env.local</code>:
          </p>
          <p className="font-mono text-[10px] opacity-70">
            OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY
          </p>
        </div>
      )}
    </div>
  );
}
