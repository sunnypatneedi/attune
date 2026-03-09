'use client';

import { type MessageInsight } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

/** Human-readable labels for intention types */
const INTENTION_LABELS: Record<string, string> = {
  question_factual: 'factual question',
  question_opinion: 'seeking opinion',
  question_clarification: 'asking for clarification',
  request_action: 'action request',
  suggest_action: 'suggestion',
  command: 'direct request',
  greeting: 'greeting',
  farewell: 'farewell',
  gratitude: 'thanks',
  apology: 'apology',
  agreement: 'agreement',
  disagreement: 'disagreement',
  express_positive: 'positive sentiment',
  express_negative: 'negative sentiment',
  express_neutral: 'neutral',
  feedback_positive: 'positive feedback',
  feedback_negative: 'negative feedback',
  topic_switch: 'topic change',
  meta_communication: 'meta-conversation',
};

/** Human-readable labels for entity types */
const ENTITY_TYPE_LABELS: Record<string, string> = {
  person: 'person',
  location: 'place',
  organization: 'org',
  date_time: 'date/time',
  duration: 'duration',
  product: 'product',
  event: 'event',
  topic: 'topic',
  concept: 'concept',
  task: 'task',
  preference: 'preference',
};

interface ChatContextIndicatorProps {
  insight: MessageInsight;
}

export function ChatContextIndicator({ insight }: ChatContextIndicatorProps) {
  // Filter to meaningful, high-confidence items
  const topEntities = insight.entities
    .filter((e) => e.confidence > 0.4)
    .slice(0, 4);

  const primaryIntention = insight.intentions
    .filter((i) => i.confidence > 0.5 && i.type !== 'unknown')
    .sort((a, b) => b.confidence - a.confidence)[0];

  const topics = insight.activeTopics.slice(0, 3);

  const topPatterns = insight.patterns
    .filter((p) => p.confidence > 0.5)
    .slice(0, 2);

  // Don't render if nothing interesting to show
  const hasEntities = topEntities.length > 0;
  const hasIntention = !!primaryIntention;
  const hasTopics = topics.length > 0;
  const hasPatterns = topPatterns.length > 0;

  if (!hasEntities && !hasIntention && !hasTopics && !hasPatterns) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1.5 flex-wrap animate-in fade-in slide-in-from-bottom-1 duration-500 mb-1.5">
        <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />

        {/* Primary intention */}
        {hasIntention && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground hover:text-foreground transition-colors cursor-default"
              >
                {primaryIntention.label ||
                  INTENTION_LABELS[primaryIntention.type] ||
                  primaryIntention.type}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Detected intention ({Math.round(primaryIntention.confidence * 100)}% confidence)
            </TooltipContent>
          </Tooltip>
        )}

        {/* Entities */}
        {topEntities.map((entity, i) => (
          <Tooltip key={`${entity.value}-${i}`}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground hover:text-foreground transition-colors cursor-default"
              >
                {entity.value}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {ENTITY_TYPE_LABELS[entity.type] || entity.type} ({Math.round(entity.confidence * 100)}%)
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Active topics (only if no entities already show them) */}
        {!hasEntities && topics.map((topic) => (
          <Badge
            key={topic}
            variant="outline"
            className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
          >
            {topic}
          </Badge>
        ))}

        {/* Patterns */}
        {topPatterns.map((pattern, i) => (
          <Tooltip key={`pattern-${i}`}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 font-normal text-primary/70 hover:text-primary transition-colors cursor-default"
              >
                {pattern.description.length > 30
                  ? pattern.description.slice(0, 27) + '...'
                  : pattern.description}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              Pattern detected: {pattern.description} ({Math.round(pattern.confidence * 100)}%)
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Sentiment indicator */}
        {insight.dominantSentiment &&
          insight.dominantSentiment !== 'neutral' && (
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
            >
              {insight.dominantSentiment} tone
            </Badge>
          )}
      </div>
    </TooltipProvider>
  );
}
