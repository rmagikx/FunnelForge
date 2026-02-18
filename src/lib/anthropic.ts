import Anthropic from "@anthropic-ai/sdk";
import type { BrandPersona, GeneratedPlan } from "@/lib/types";
import {
  PERSONA_BUILDER_SYSTEM,
  buildPersonaBuilderPrompt,
  getContentGeneratorSystem,
  buildContentGeneratorPrompt,
} from "@/lib/prompts";

// ── Client ────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

// ── Low-level helper ──────────────────────────

/**
 * Send a system + user message to Claude and return the raw text.
 * Kept as a public export so existing callers (e.g. analyze-persona route) still work.
 */
export async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return block.text;
}

// ── JSON parser with 1 retry ─────────────────

function parseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Claude sometimes wraps JSON in ```json blocks
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error("Failed to parse Claude response as JSON");
  }
}

async function callClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string
): Promise<T> {
  let raw = await callClaude(systemPrompt, userMessage);

  try {
    return parseJSON<T>(raw);
  } catch {
    // Retry once
    console.warn("JSON parse failed, retrying Claude call…");
    raw = await callClaude(systemPrompt, userMessage);
    return parseJSON<T>(raw);
  }
}

// ── Domain functions ──────────────────────────

/**
 * Analyze uploaded documents and return a BrandPersona.
 */
export async function analyzePersona(
  documentTexts: { file_name: string; text: string }[]
): Promise<BrandPersona> {
  const prompt = buildPersonaBuilderPrompt(documentTexts);
  return callClaudeJSON<BrandPersona>(PERSONA_BUILDER_SYSTEM, prompt);
}

/**
 * Generate content for a single funnel stage for the given persona, problem, and channels.
 */
export async function generateContent(
  persona: BrandPersona,
  problemStatement: string,
  channels: string[],
  stage: string
): Promise<GeneratedPlan> {
  const prompt = buildContentGeneratorPrompt(persona, problemStatement, channels, stage);
  return callClaudeJSON<GeneratedPlan>(getContentGeneratorSystem(), prompt);
}
