// ──────────────────────────────────────────────
// Domain types — BrandPersona & content generation
// ──────────────────────────────────────────────

export interface BrandPersona {
  name: string;
  type: string;
  mission: string;
  tone: string[];
  audience: string[];
  values: string[];
  vocabulary: string[];
  voiceSamples: string[];
  differentiators: string[];
  contentPatterns: string[];
}

export interface ContentPiece {
  headline: string;
  body: string;
  cta: string;
  format: string;
  hashtags: string[];
  posting_tip: string;
}

export interface ChannelContent {
  awareness: ContentPiece[];
  consideration: ContentPiece[];
  conversion: ContentPiece[];
}

/** channel name → ChannelContent */
export type GeneratedPlan = Record<string, ChannelContent>;

// ──────────────────────────────────────────────
// Database row types
// ──────────────────────────────────────────────

export interface PersonaRow {
  id: string;
  user_id: string;
  name: string;
  org_type: string | null;
  persona_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  persona_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text: string | null;
  created_at: string;
}

export interface GenerationRow {
  id: string;
  user_id: string;
  persona_id: string;
  problem_statement: string;
  channels: string[];
  generated_content: Record<string, unknown>;
  created_at: string;
}

// ──────────────────────────────────────────────
// Backward-compatible aliases
// ──────────────────────────────────────────────

export type Persona = PersonaRow;
export type Document = DocumentRow;
export type Generation = GenerationRow;
