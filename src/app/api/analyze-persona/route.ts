import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzePersona } from "@/lib/anthropic";
import { getExtractedTexts } from "@/lib/supabase/storage";
import type { Persona } from "@/lib/types";

/**
 * POST /api/analyze-persona
 *
 * Mode 1 — Reanalyze existing persona:
 *   Body: { personaId: string }
 *   Fetches cached extracted_text, sends to Claude, updates persona_data.
 *
 * Mode 2 — Analyze from inline texts (used during creation flow):
 *   Body: { personaId: string, texts: { file_name: string; text: string }[] }
 *   Uses the provided texts directly instead of fetching from DB.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { personaId, texts } = body as {
      personaId: string;
      texts?: { file_name: string; text: string }[];
    };

    if (!personaId) {
      return NextResponse.json(
        { error: "personaId is required" },
        { status: 400 }
      );
    }

    // Verify the persona belongs to this user
    const { data: persona, error: fetchError } = await supabase
      .from("personas")
      .select("*")
      .eq("id", personaId)
      .single();

    if (fetchError || !persona) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
    }

    // Gather document texts
    let documents: { file_name: string; text: string }[];

    if (texts && texts.length > 0) {
      // Mode 2: use provided texts
      documents = texts;
    } else {
      // Mode 1: fetch cached extracted texts from DB
      const extracted = await getExtractedTexts(personaId);

      if (extracted.length === 0) {
        return NextResponse.json(
          { error: "No documents with extracted text found for this persona" },
          { status: 400 }
        );
      }

      documents = extracted.map((d) => ({
        file_name: d.file_name,
        text: d.extracted_text,
      }));
    }

    // Call Claude to analyze the persona using the new analyzePersona function
    const personaData = await analyzePersona(documents);

    // Save the analyzed data back to the persona
    const { data: updated, error: updateError } = await supabase
      .from("personas")
      .update({ persona_data: personaData })
      .eq("id", personaId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ persona: updated as Persona });
  } catch (error) {
    console.error("Analyze persona error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze persona",
      },
      { status: 500 }
    );
  }
}
