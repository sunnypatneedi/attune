/**
 * SPEAR Security Layer for Attune
 *
 * Integrates @spear-secure/core to protect against prompt injection,
 * jailbreaks, PII leaks, and data exfiltration.
 *
 * Server-only module — do NOT import from client components.
 */
import 'server-only';

import {
  createRuntime,
  getDefaultPolicy,
  type SPEARRuntime,
  type PreResult,
  type PostResult,
  type TelemetryEvent,
} from '@spear-secure/core';

// Runtime singleton
let _runtime: SPEARRuntime | null = null;

/**
 * Get (or create) the SPEAR runtime singleton.
 * Uses env vars for configuration with sensible defaults.
 */
export function getSpearRuntime(): SPEARRuntime {
  if (!_runtime) {
    const mode = (process.env.SPEAR_MODE as 'shadow' | 'enforce') || 'shadow';
    const sidecarUrl = process.env.SPEAR_SIDECAR_URL || null;

    // Use getDefaultPolicy() instead of quick() which tries to load YAML from disk
    // — that fails in Next.js's bundled environment
    const policy = getDefaultPolicy();
    _runtime = createRuntime({
      policy,
      mode,
      sidecarUrl,
      enableLogging: process.env.NODE_ENV !== 'production',
    });
  }
  return _runtime;
}

/**
 * Pre-process messages through SPEAR's input gate before sending to LLM.
 *
 * Checks for:
 * - Prompt injection (7 attack classes)
 * - Unicode attacks (bidi, zero-width)
 * - Instruction override attempts
 * - Role escalation
 */
export async function guardInput(
  messages: Array<{ role: string; content: string }>,
  context?: { sessionId?: string; userId?: string }
): Promise<PreResult> {
  const runtime = getSpearRuntime();

  // Map to SPEAR message format
  const spearMessages = messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant' | 'developer',
    content: m.content,
  }));

  return runtime.pre(spearMessages, {
    sessionId: context?.sessionId,
    userId: context?.userId,
  });
}

/**
 * Post-process LLM output through SPEAR's output gate before returning to user.
 *
 * Checks for:
 * - Canary token exfiltration (system prompt leak)
 * - PII in output (emails, phones, credit cards)
 * - Deny-listed n-grams ("system prompt", "developer message")
 * - Encoded data leaks (base64, hex)
 */
export async function guardOutput(
  output: string,
  canary?: string,
  systemPrompt?: string
): Promise<PostResult> {
  const runtime = getSpearRuntime();

  return runtime.post({
    output,
    canary,
    systemPrompt,
  });
}

/**
 * Get recent SPEAR telemetry events for display in the UI.
 */
export function getSecurityTelemetry(): TelemetryEvent[] {
  const runtime = getSpearRuntime();
  return runtime.getTelemetry();
}

/**
 * Get the current SPEAR mode.
 */
export function getSpearMode(): 'shadow' | 'enforce' {
  return (process.env.SPEAR_MODE as 'shadow' | 'enforce') || 'shadow';
}

/**
 * Get the current SPEAR policy name.
 */
export function getSpearPolicy(): string {
  return process.env.SPEAR_POLICY || 'balanced';
}

/**
 * Serialize a security event summary for the client.
 * Does NOT expose raw telemetry — only aggregated stats.
 */
export function getSecuritySummary(): {
  mode: string;
  policy: string;
  enabled: boolean;
  stats: { total: number; blocked: number; riskEvents: number };
} {
  const runtime = getSpearRuntime();
  const telemetry = runtime.getTelemetry();

  return {
    mode: getSpearMode(),
    policy: getSpearPolicy(),
    enabled: true,
    stats: {
      total: telemetry.length,
      blocked: telemetry.filter((e) => !e.allowed).length,
      riskEvents: telemetry.filter((e) => (e.score ?? 0) > 0.5).length,
    },
  };
}
