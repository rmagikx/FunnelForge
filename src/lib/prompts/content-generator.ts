import type { BrandPersona } from "@/lib/types";
import { formatChannelSpecs } from "./channel-specs";

export const CONTENT_GENERATOR_SYSTEM = `You are an expert marketing copywriter, familiar with the different social media channels like LinkedIn, Instagram, TikTok etc.
Given a buyer persona and a problem statement, you generate high-converting funnel content
tailored to the persona's psychology, preferences, pain points, and preferred channels. This content should be relevant to today and future. If it is not possible to create the content, please say - No content possible for this problem statement; Need more context.
Do not hallucinate.
You MUST respond with valid JSON only — no markdown, no explanation outside the JSON.`;

export function buildContentGeneratorPrompt(
  persona: BrandPersona,
  problemStatement: string,
  channels: string[]
): string {
  const channelBlock = formatChannelSpecs(channels);

  return `Generate a full-funnel content plan for the following brand persona and problem.

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

For EACH channel listed above, generate content for all three funnel stages.
Each stage should have 2-3 content pieces.

Return a JSON object where each key is the channel name (lowercase, e.g. "linkedin", "email") and the value is:
{
  "awareness": [
    {
      "headline": "Attention-grabbing headline",
      "body": "Full content body text, written in the brand's voice",
      "cta": "Call-to-action text",
      "format": "Content format (e.g. 'carousel post', 'email', 'blog article')",
      "hashtags": ["relevant", "hashtags"],
      "posting_tip": "One practical tip for publishing this content"
    }
  ],
  "consideration": [ ... same structure ... ],
  "conversion": [ ... same structure ... ]
}

Ensure:
- All content matches the brand's tone and vocabulary
- Awareness content educates and attracts
- Consideration content builds trust and demonstrates expertise
- Conversion content drives a specific action (signup, purchase, booking)
- Each piece is complete and ready to publish (not just a concept)`;
}
