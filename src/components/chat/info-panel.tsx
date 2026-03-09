'use client';

import { useChatStore, type MessageInsight } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Brain, Eye, Activity, ChevronDown, Sparkles, Target, Fingerprint, ShieldCheck } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-foreground transition-colors">
        <Icon className="h-4 w-4 text-primary" />
        <span className="flex-1 text-left">{title}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
            {count}
          </Badge>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pb-3 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Aggregate understanding data from all message insights */
function useAggregatedInsights() {
  const { messageInsights, messages } = useChatStore();

  return useMemo(() => {
    const insights = Object.values(messageInsights);
    if (insights.length === 0) {
      return {
        allEntities: [],
        allTopics: [],
        allIntentions: [],
        allPatterns: [],
        dominantSentiment: undefined as string | undefined,
        latestInsight: undefined as MessageInsight | undefined,
        totalMessages: messages.length,
      };
    }

    // Aggregate entities across all insights, deduplicating by value
    const entityMap = new Map<string, { type: string; value: string; confidence: number; count: number }>();
    for (const insight of insights) {
      for (const entity of insight.entities) {
        const existing = entityMap.get(entity.value.toLowerCase());
        if (existing) {
          existing.count++;
          existing.confidence = Math.max(existing.confidence, entity.confidence);
        } else {
          entityMap.set(entity.value.toLowerCase(), {
            type: entity.type,
            value: entity.value,
            confidence: entity.confidence,
            count: 1,
          });
        }
      }
    }

    // Aggregate topics
    const topicCounts = new Map<string, number>();
    for (const insight of insights) {
      for (const topic of insight.activeTopics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    // Aggregate intentions
    const intentionCounts = new Map<string, { label: string; count: number; totalConfidence: number }>();
    for (const insight of insights) {
      for (const intention of insight.intentions) {
        if (intention.type === 'unknown') continue;
        const existing = intentionCounts.get(intention.type);
        if (existing) {
          existing.count++;
          existing.totalConfidence += intention.confidence;
        } else {
          intentionCounts.set(intention.type, {
            label: intention.label,
            count: 1,
            totalConfidence: intention.confidence,
          });
        }
      }
    }

    // Latest insight for current state
    const latestInsight = insights[insights.length - 1];

    // Most recent non-neutral sentiment
    const sentiments = insights
      .map((i) => i.dominantSentiment)
      .filter((s): s is string => !!s && s !== 'neutral');
    const dominantSentiment = sentiments.length > 0
      ? sentiments[sentiments.length - 1]
      : undefined;

    return {
      allEntities: Array.from(entityMap.values())
        .sort((a, b) => b.count - a.count || b.confidence - a.confidence),
      allTopics: Array.from(topicCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([topic]) => topic),
      allIntentions: Array.from(intentionCounts.values())
        .sort((a, b) => b.count - a.count),
      allPatterns: latestInsight?.patterns.filter((p) => p.confidence > 0.4) || [],
      dominantSentiment,
      latestInsight,
      totalMessages: messages.length,
    };
  }, [messageInsights, messages.length]);
}

export function InfoPanel() {
  const { messages, mode, model } = useChatStore();
  const {
    allEntities,
    allTopics,
    allIntentions,
    allPatterns,
    dominantSentiment,
    latestInsight,
    totalMessages,
  } = useAggregatedInsights();

  const userMessages = messages.filter((m) => m.role === 'user');
  const hasInsights = !!latestInsight;

  // Fetch SPEAR security status
  const [security, setSecurity] = useState<{
    mode: string;
    policy: string;
    enabled: boolean;
    stats: { total: number; blocked: number; riskEvents: number };
  } | null>(null);

  useEffect(() => {
    fetch('/api/security')
      .then((r) => r.json())
      .then(setSecurity)
      .catch(() => {});
  }, [messages.length]); // Refresh when messages change

  return (
    <div className="flex flex-col h-full border-l bg-muted/20">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Understanding
        </h2>
        {hasInsights && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Tracking {allEntities.length} entities across {totalMessages} messages
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {/* Conversation overview */}
          <Section title="Conversation" icon={Brain}>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span>{totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User turns</span>
                <span>{userMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {mode === 'simulated' ? 'Demo' : model}
                </Badge>
              </div>
              {dominantSentiment && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tone</span>
                  <span className="capitalize">{dominantSentiment}</span>
                </div>
              )}
            </div>
          </Section>

          {/* Entities detected */}
          <Section
            title="Entities"
            icon={Fingerprint}
            count={allEntities.length}
            defaultOpen={allEntities.length > 0}
          >
            {allEntities.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                Send messages to see entity tracking
              </p>
            ) : (
              <div className="space-y-1.5">
                {allEntities.slice(0, 12).map((entity) => (
                  <div key={entity.value} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal shrink-0">
                      {entity.type}
                    </Badge>
                    <span className="text-xs truncate flex-1">{entity.value}</span>
                    {entity.count > 1 && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        x{entity.count}
                      </span>
                    )}
                    <div className="w-8 shrink-0">
                      <Progress value={entity.confidence * 100} className="h-1" />
                    </div>
                  </div>
                ))}
                {allEntities.length > 12 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{allEntities.length - 12} more
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* Active topics */}
          <Section
            title="Topics"
            icon={Eye}
            count={allTopics.length}
            defaultOpen={allTopics.length > 0}
          >
            {allTopics.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                Topics will appear as the conversation develops
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {allTopics.slice(0, 8).map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          {/* Detected intentions */}
          <Section
            title="Intentions"
            icon={Target}
            count={allIntentions.length}
            defaultOpen={allIntentions.length > 0}
          >
            {allIntentions.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                Intention detection activates with messages
              </p>
            ) : (
              <div className="space-y-1.5">
                {allIntentions.slice(0, 6).map((intention) => (
                  <div key={intention.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs capitalize truncate">{intention.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {intention.count}x
                      </span>
                      <Progress
                        value={(intention.totalConfidence / intention.count) * 100}
                        className="h-1 w-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Interaction patterns */}
          <Section
            title="Patterns"
            icon={Activity}
            count={allPatterns.length}
            defaultOpen={allPatterns.length > 0}
          >
            {allPatterns.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                Patterns emerge after several exchanges
              </p>
            ) : (
              <div className="space-y-2">
                {allPatterns.map((pattern, i) => (
                  <div key={i} className="text-xs">
                    <p className="text-foreground">{pattern.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Progress value={pattern.confidence * 100} className="h-1 flex-1" />
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Security */}
          <Section title="Security" icon={ShieldCheck} defaultOpen={false}>
            {security ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protection</span>
                  <Badge variant="outline" className="text-[10px] h-5 text-emerald-600 dark:text-emerald-400">
                    SPEAR active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Policy</span>
                  <span className="capitalize">{security.policy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="capitalize">{security.mode}</span>
                </div>
                {security.stats.total > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Checks run</span>
                      <span>{security.stats.total}</span>
                    </div>
                    {security.stats.blocked > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Threats blocked</span>
                        <span className="text-destructive font-medium">{security.stats.blocked}</span>
                      </div>
                    )}
                  </>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Input/output gates protect against prompt injection, PII leaks, and data exfiltration.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic">
                Loading security status...
              </p>
            )}
          </Section>
        </div>
      </ScrollArea>
    </div>
  );
}
