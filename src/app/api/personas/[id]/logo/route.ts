import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LOGO_BUCKET = "brand-logos";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/personas/[id]/logo
 * Upload or replace a brand logo for a persona.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify persona ownership
    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, SVG, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2 MB" },
        { status: 400 }
      );
    }

    // Determine file extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/svg+xml": "svg",
      "image/webp": "webp",
    };
    const ext = extMap[file.type] || "png";
    const storagePath = `${user.id}/${id}/logo.${ext}`;

    // Remove any existing logo files for this persona (different extensions)
    const { data: existingFiles } = await supabase.storage
      .from(LOGO_BUCKET)
      .list(`${user.id}/${id}`);

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles
        .filter((f) => f.name.startsWith("logo."))
        .map((f) => `${user.id}/${id}/${f.name}`);
      if (filesToRemove.length > 0) {
        await supabase.storage.from(LOGO_BUCKET).remove(filesToRemove);
      }
    }

    // Upload the new logo
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(storagePath);

    const logoUrl = urlData.publicUrl;

    // Update the persona record
    const { error: updateError } = await supabase
      .from("personas")
      .update({ logo_url: logoUrl })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update persona: ${updateError.message}`);
    }

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload logo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/personas/[id]/logo
 * Remove the brand logo for a persona.
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

    // Verify persona ownership
    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    // Remove all logo files for this persona
    const { data: existingFiles } = await supabase.storage
      .from(LOGO_BUCKET)
      .list(`${user.id}/${id}`);

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles
        .filter((f) => f.name.startsWith("logo."))
        .map((f) => `${user.id}/${id}/${f.name}`);
      if (filesToRemove.length > 0) {
        await supabase.storage.from(LOGO_BUCKET).remove(filesToRemove);
      }
    }

    // Clear the logo_url in the database
    const { error: updateError } = await supabase
      .from("personas")
      .update({ logo_url: null })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update persona: ${updateError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete logo" },
      { status: 500 }
    );
  }
}
