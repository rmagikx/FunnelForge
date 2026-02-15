import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Persona } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/personas/[id]
 * Fetch a single persona. RLS ensures ownership.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    return NextResponse.json({ persona: data as Persona });
  } catch (error) {
    console.error("Get persona error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch persona" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/personas/[id]
 * Update persona name, org_type, or persona_data.
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.orgType !== undefined) updates.org_type = body.orgType?.trim() || null;
    if (body.personaData !== undefined) updates.persona_data = body.personaData;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Check for duplicate name (case-insensitive) when name is being updated
    if (updates.name) {
      const { data: existing } = await supabase
        .from("personas")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", updates.name as string)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "A persona with this name already exists" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("personas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ persona: data as Persona });
  } catch (error) {
    console.error("Update persona error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update persona" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/personas/[id]
 * Delete a persona. Cascades to documents and generations via FK.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("personas")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete persona error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete persona" },
      { status: 500 }
    );
  }
}
