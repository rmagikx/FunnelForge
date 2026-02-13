// Persona builder
export {
  PERSONA_BUILDER_SYSTEM,
  buildPersonaBuilderPrompt,
} from "./persona-builder";

// Legacy aliases (consumed by analyze-persona route)
export {
  PERSONA_ANALYSIS_SYSTEM,
  buildPersonaAnalysisPrompt,
} from "./persona-analysis";

// Content generator
export {
  CONTENT_GENERATOR_SYSTEM,
  buildContentGeneratorPrompt,
} from "./content-generator";

// Channel specs
export { CHANNEL_SPECS, formatChannelSpecs } from "./channel-specs";
export type { ChannelSpec } from "./channel-specs";
