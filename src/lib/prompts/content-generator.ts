import type { BrandPersona } from "@/lib/types";
import { formatChannelSpecs } from "./channel-specs";

export const CONTENT_GENERATOR_SYSTEM = `You are an expert marketing copywriter, familiar with the different social media channels like LinkedIn, Instagram, TikTok etc.
Given a buyer persona and a problem statement, you generate high-converting funnel content
tailored to the persona's psychology, preferences, pain points, and preferred channels. This content should be relevant to today and future. If it is not possible to create the content, please say - No content possible for this problem statement; Need more context.
Do not hallucinate.
You MUST respond with valid JSON only — no markdown, no explanation outside the JSON.`;

const STAGE_GUIDANCE: Record<string, string> = {
  awareness: "Content should educate and attract — raise awareness of the problem and position the brand as a knowledgeable voice.",
  consideration: "Content should build trust and demonstrate expertise — help the audience evaluate solutions and see the brand as the right choice.",
  conversion: "Content should drive a specific action (signup, purchase, booking, demo request) — create urgency and remove objections.",
};

export function buildContentGeneratorPrompt(
  persona: BrandPersona,
  problemStatement: string,
  channels: string[],
  stage: string
): string {
  const channelBlock = formatChannelSpecs(channels);
  const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1);
  const guidance = STAGE_GUIDANCE[stage] ?? "";

  return `Generate funnel content for the "${stageLabel}" stage for the following brand persona and problem.

<brand_persona>
Name: ${persona.name}
Type: ${persona.type}
Mission: ${persona.mission}
Tone: ${persona.tone.join(", ")}
Audience: ${persona.audience.join("; ")}
Values: ${persona.values.join(", ")}
Vocabulary: ${persona.vocabulary.join(", ")}
Voice samples:
${persona.voiceSamples.map((s) => `  - "${s}"`).join("\n")}
Differentiators: ${persona.differentiators.join("; ")}
Content patterns: ${persona.contentPatterns.join(", ")}
</brand_persona>

<problem_statement>
${problemStatement}
</problem_statement>

<channel_specifications>
${channelBlock}
</channel_specifications>

<funnel_stage>
Stage: ${stageLabel}
${guidance}
</funnel_stage>

For EACH channel listed above, generate exactly 2 content pieces for the "${stage}" funnel stage ONLY.
Do NOT generate content for any other stage.

Return a JSON object where each key is the channel name (lowercase, e.g. "linkedin", "email") and the value is:
{
  "${stage}": [
    {
      "headline": "Attention-grabbing headline",
      "body": "Full content body text, written in the brand's voice",
      "cta": "Call-to-action text",
      "format": "Content format (e.g. 'carousel post', 'email', 'blog article')",
      "hashtags": ["relevant", "hashtags"],
      "posting_tip": "One practical tip for publishing this content"
    }
  ]
}

Ensure:
- All content matches the brand's tone and vocabulary
- Each piece is complete and ready to publish (not just a concept)
- Generate exactly 2 pieces per channel for the "${stage}" stage`;
}
