import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import Papa from "papaparse";

const MAX_TEXT_LENGTH = 10_000;

/**
 * Parse a file buffer into plain text based on MIME type.
 * Supports: PDF, DOCX, TXT, CSV.
 * Result is truncated to 10,000 characters.
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  let text: string;

  switch (mimeType) {
    case "application/pdf": {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
      break;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }

    case "text/csv": {
      const csvText = buffer.toString("utf-8");
      const parsed = Papa.parse(csvText, { header: true });
      text = parsed.data
        .map((row) => {
          const r = row as Record<string, string>;
          return Object.entries(r)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
        })
        .join("\n");
      break;
    }

    case "text/plain": {
      text = buffer.toString("utf-8");
      break;
    }

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Truncate to keep token usage reasonable
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH) + "\n\n[Truncated at 10,000 characters]";
  }

  return text;
}
