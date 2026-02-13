export const PERSONA_BUILDER_SYSTEM = `You are an expert brand strategist and persona analyst.
Given source documents about a business, product, or target audience, you synthesize a detailed brand persona.

You MUST respond with valid JSON only — no markdown, no explanation outside the JSON.
Every field must be populated. Use context clues from the documents to infer missing details.`;

export function buildPersonaBuilderPrompt(
  documents: { file_name: string; text: string }[]
): string {
  const docBlock = documents
    .map((d) => `--- ${d.file_name} ---\n${d.text}`)
    .join("\n\n");

  return `Analyze the following documents and build a comprehensive brand persona.

<documents>
${docBlock}
</documents>

Return a JSON object with this exact structure:
{
  "name": "A short, memorable persona label (e.g. 'Enterprise SaaS Buyer')",
  "type": "Organization/product type (e.g. 'B2B SaaS', 'DTC E-commerce')",
  "mission": "One-sentence brand mission statement",
  "tone": ["3-5 adjectives describing the brand voice, e.g. 'confident', 'empathetic', 'authoritative'"],
  "audience": ["2-4 target audience segments described in one phrase each"],
  "values": ["3-5 core brand values"],
  "vocabulary": ["10-15 on-brand power words and phrases the brand should use"],
  "voiceSamples": ["3-5 example sentences written in the brand's ideal voice"],
  "differentiators": ["3-5 unique selling points that separate this brand from competitors"],
  "contentPatterns": ["3-5 recommended content formats/patterns, e.g. 'case-study-driven blog posts', 'short-form video testimonials'"]
}`;
}
