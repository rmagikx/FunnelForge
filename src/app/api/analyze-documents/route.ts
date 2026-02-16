import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseDocument } from "@/lib/document-parser";
import { analyzePersona } from "@/lib/anthropic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
];

/**
 * POST /api/analyze-documents
 *
 * Stateless document analysis — does NOT create any database records.
 * Accepts FormData with one or more files, parses text, sends to Claude,
 * and returns the BrandPersona JSON.
 *
 * Used by the persona creation wizard so nothing is persisted until the
 * user explicitly saves.
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

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    // Parse text from each file
    const documentTexts: { file_name: string; text: string }[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Unsupported file type: ${file.type}. Allowed: PDF, DOCX, CSV, TXT`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10 MB limit` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        const text = await parseDocument(buffer, file.type);
        if (text.trim()) {
          documentTexts.push({ file_name: file.name, text });
        }
      } catch (parseError) {
        console.error(`Failed to parse ${file.name}:`, parseError);
        // Continue with other files
      }
    }

    if (documentTexts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from any of the uploaded files. Please try different files.",
        },
        { status: 400 }
      );
    }

    // Send to Claude for analysis — no DB writes
    const personaData = await analyzePersona(documentTexts);

    return NextResponse.json({ personaData });
  } catch (error) {
    console.error("Analyze documents error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze documents",
      },
      { status: 500 }
    );
  }
}
