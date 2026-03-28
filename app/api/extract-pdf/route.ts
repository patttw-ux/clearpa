import { createRequire } from "node:module";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// Avoid pdf-parse root index (known test-file side effects); use the parser implementation.
const require = createRequire(import.meta.url);
type PdfParseResult = {
  text: string;
  numpages: number;
  numrender: number;
};
type PdfParseFn = (
  dataBuffer: Buffer,
  options?: Record<string, unknown>,
) => Promise<PdfParseResult>;

const pdfParse: PdfParseFn = require("pdf-parse/lib/pdf-parse.js");

const PDFJS_VERSIONS = [
  "v1.10.100",
  "v1.10.88",
  "v1.9.426",
  "v2.0.550",
] as const;

async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pages: number;
  partial: boolean;
  warning?: string;
}> {
  try {
    const r = await pdfParse(buffer);
    return { text: r.text, pages: r.numpages, partial: false };
  } catch (primaryErr) {
    console.error("[extract-pdf] Default pdf-parse failed:", primaryErr);
  }

  for (const version of PDFJS_VERSIONS) {
    try {
      const r = await pdfParse(buffer, { version });
      console.log("[extract-pdf] Succeeded with pdf.js version:", version);
      return { text: r.text, pages: r.numpages, partial: false };
    } catch (e) {
      console.error(`[extract-pdf] pdf-parse with version ${version} failed:`, e);
    }
  }

  let lastGood: { text: string; pages: number } | null = null;
  for (let max = 1; max <= 500; max++) {
    try {
      const r = await pdfParse(buffer, { max });
      lastGood = { text: r.text, pages: r.numpages };
      if (r.numrender >= r.numpages) {
        return { text: r.text, pages: r.numpages, partial: false };
      }
    } catch (e) {
      console.error(`[extract-pdf] Incremental parse (max=${max}) failed:`, e);
      if (lastGood?.text?.trim()) {
        return {
          text: lastGood.text,
          pages: lastGood.pages,
          partial: true,
          warning: `Only part of the document could be read (failed after ${max - 1} page(s)).`,
        };
      }
      break;
    }
  }

  if (lastGood?.text?.trim()) {
    return {
      text: lastGood.text,
      pages: lastGood.pages,
      partial: true,
      warning: "Partial text only; some pages could not be processed.",
    };
  }

  console.error(
    "[extract-pdf] All pdf-parse strategies failed; returning empty text instead of 500.",
  );
  return {
    text: "",
    pages: 0,
    partial: true,
    warning: "Could not extract text from this PDF.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const entry = formData.get("file");

    if (!entry || !(entry instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Use multipart/form-data with a "file" field.' },
        { status: 400 },
      );
    }

    if (entry.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit." },
        { status: 400 },
      );
    }

    const arrayBuffer = await entry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text, pages, partial, warning } = await extractPdfText(buffer);

    return NextResponse.json({
      text,
      pages,
      ...(partial && { partial: true, ...(warning && { warning }) }),
    });
  } catch (e) {
    console.error("[extract-pdf] Unexpected handler error:", e);
    const message =
      e instanceof Error ? e.message : "Failed to extract text from PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
