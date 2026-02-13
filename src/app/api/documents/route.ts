import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadDocument,
  deleteDocument,
} from "@/lib/supabase/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
];

/**
 * POST /api/documents
 * Accepts FormData with:
 *   - personaId: string
 *   - files: File[] (one or more)
 * Uploads each file, extracts text, saves to DB. Returns document records.
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
    const personaId = formData.get("personaId") as string | null;

    if (!personaId) {
      return NextResponse.json(
        { error: "personaId is required" },
        { status: 400 }
      );
    }

    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    const documents = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Unsupported file type: ${file.type}. Allowed: PDF, DOCX, CSV, TXT`,
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10 MB limit` },
          { status: 400 }
        );
      }

      // Read file buffer once for both upload and text extraction
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to storage, parse text, and insert DB record (with extracted_text)
      const doc = await uploadDocument(user.id, personaId, file, buffer);

      documents.push(doc);
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents
 * Accepts JSON body: { documentId: string }
 * Removes the file from storage and the record from the database.
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    await deleteDocument(documentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
