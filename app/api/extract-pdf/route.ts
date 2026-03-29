import { NextRequest } from "next/server";

import { parsePdfBuffer } from "@/lib/pdf/parsePdfBuffer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return Response.json({ error: "file must be a PDF" }, { status: 400 });
  }

  try {
    const buf = await file.arrayBuffer();
    const { text, pages } = await parsePdfBuffer(buf);
    return Response.json({ text, pages });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not read PDF" },
      { status: 500 },
    );
  }
}
