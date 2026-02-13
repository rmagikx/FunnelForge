export const PERSONA_ANALYSIS_SYSTEM = `You are an expert marketing strategist and buyer persona analyst.
Given documents about a business, product, or audience, you synthesize a detailed buyer persona.

You MUST respond with valid JSON only — no markdown, no explanation outside the JSON.`;

export function buildPersonaAnalysisPrompt(
  documents: { file_name: string; text: string }[]
): string {
  const docBlock = documents
    .map((d) => `--- ${d.file_name} ---\n${d.text}`)
    .join("\n\n");

  return `Analyze the following documents and create a comprehensive buyer persona.

<documents>
${docBlock}
</documents>

Return a JSON object with this exact structure:
{
  "summary": "One-paragraph overview of who this persona is",
  "demographics": {
    "age_range": "e.g. 30-45",
    "gender": "e.g. Mixed / Primarily female",
    "income_level": "e.g. $75k-$120k",
    "education": "e.g. Bachelor's degree or higher",
    "location": "e.g. Urban areas, US/Europe",
    "job_title": "e.g. Marketing Manager"
  },
  "psychographics": {
    "values": ["list of core values"],
    "interests": ["list of interests"],
    "lifestyle": "brief description",
    "personality_traits": ["list of traits"]
  },
  "pain_points": ["list of key pain points and frustrations"],
  "goals": ["list of primary goals and desired outcomes"],
  "buying_behavior": {
    "decision_drivers": ["what motivates purchase decisions"],
    "objections": ["common hesitations or objections"],
    "preferred_channels": ["where they consume content"],
    "budget_sensitivity": "low / medium / high"
  },
  "messaging": {
    "tone": "recommended tone of voice",
    "key_messages": ["3-5 resonant marketing messages"],
    "words_to_use": ["power words that resonate"],
    "words_to_avoid": ["words that turn them off"]
  }
}`;
}
