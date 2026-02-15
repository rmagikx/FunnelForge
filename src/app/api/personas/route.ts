import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Persona } from "@/lib/types";

/**
 * GET /api/personas
 * List all personas for the authenticated user. RLS handles filtering.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("personas")
      .select("*, documents(count)")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ personas: data as Persona[] });
  } catch (error) {
    console.error("List personas error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list personas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/personas
 * Create a new persona. Accepts { name, orgType?, personaData? }
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
    const { name, orgType, personaData } = body as {
      name: string;
      orgType?: string;
      personaData?: Record<string, unknown>;
    };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Persona name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name (case-insensitive) for this user
    const { data: existing } = await supabase
      .from("personas")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A persona with this name already exists" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("personas")
      .insert({
        user_id: user.id,
        name: name.trim(),
        org_type: orgType?.trim() || null,
        persona_data: personaData || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ persona: data as Persona }, { status: 201 });
  } catch (error) {
    console.error("Create persona error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create persona" },
      { status: 500 }
    );
  }
}
