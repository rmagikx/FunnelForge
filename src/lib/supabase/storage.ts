import { createClient } from "./server";
import { parseDocument } from "@/lib/document-parser";
import type { Document } from "@/lib/types";

const BUCKET = "user-documents";

/**
 * Upload a file to Supabase Storage, parse its text content, and insert a
 * document record with the extracted text cached in the `extracted_text` column.
 *
 * Path: {userId}/{personaId}/{filename}
 *
 * @param userId    - authenticated user's id
 * @param personaId - persona the document belongs to
 * @param file      - the uploaded File object
 * @param fileBuffer - the file contents as a Buffer (for server-side parsing)
 */
export async function uploadDocument(
  userId: string,
  personaId: string,
  file: File,
  fileBuffer: Buffer
): Promise<Document> {
  const supabase = await createClient();
  const storagePath = `${userId}/${personaId}/${file.name}`;

  // 1. Upload binary to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Parse text from the buffer (best-effort — null on failure)
  let extractedText: string | null = null;
  try {
    extractedText = await parseDocument(fileBuffer, file.type);
  } catch (parseError) {
    console.error(`Text extraction failed for ${file.name}:`, parseError);
  }

  // 3. Insert the document row with extracted_text included
  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      persona_id: personaId,
      user_id: userId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      extracted_text: extractedText,
    })
    .select()
    .single();

  if (insertError) {
    // Clean up the uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  return data as Document;
}

/**
 * Fetch all document records for a given persona.
 */
export async function getDocumentsForPersona(
  personaId: string
): Promise<Document[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("persona_id", personaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data ?? []) as Document[];
}

/**
 * Generate a signed download URL for a file (valid for 60 minutes).
 */
export async function downloadDocument(
  storagePath: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) {
    throw new Error(`Failed to create download URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a document from both Storage and the database.
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = await createClient();

  // Fetch the record first to get the storage path
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (fetchError) {
    throw new Error(`Document not found: ${fetchError.message}`);
  }

  // Remove from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([doc.storage_path]);

  if (storageError) {
    throw new Error(`Failed to delete file: ${storageError.message}`);
  }

  // Remove the database record
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (dbError) {
    throw new Error(`Failed to delete document record: ${dbError.message}`);
  }
}

/**
 * Return cached extracted text for all documents in a persona.
 * Avoids re-parsing files — the text is stored at upload time.
 */
export async function getExtractedTexts(
  personaId: string
): Promise<{ id: string; file_name: string; extracted_text: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, extracted_text")
    .eq("persona_id", personaId)
    .not("extracted_text", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch extracted texts: ${error.message}`);
  }

  return (data ?? []) as {
    id: string;
    file_name: string;
    extracted_text: string;
  }[];
}

/**
 * Return just the extracted text strings for all parsed documents in a persona.
 * Useful when you only need the raw text array (e.g. for feeding to an LLM).
 *
 * Accepts a Supabase client so the caller can reuse the one it already has.
 */
export async function getExtractedTextsForPersona(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personaId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("persona_id", personaId)
    .not("extracted_text", "is", null);

  if (error) throw error;
  return (data ?? [])
    .map((doc: { extracted_text: string | null }) => doc.extracted_text)
    .filter(Boolean) as string[];
}

/**
 * Update the extracted_text column for a document.
 * Called after server-side text parsing.
 */
export async function saveExtractedText(
  documentId: string,
  text: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("documents")
    .update({ extracted_text: text })
    .eq("id", documentId);

  if (error) {
    throw new Error(`Failed to save extracted text: ${error.message}`);
  }
}
