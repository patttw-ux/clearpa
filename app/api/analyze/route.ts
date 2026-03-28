import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages/messages";

import { CLEARPA_ANALYZE_SYSTEM_PROMPT } from "@/lib/prompts/analyze-system";

export const runtime = "nodejs";
export const maxDuration = 300;

function formatQuestionsList(items: string[]): string {
  return items.map((q, i) => `[${i}] ${q.trim()}`).join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data with chartFile and questions." },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const chartFile = formData.get("chartFile");
  if (!(chartFile instanceof File) || chartFile.size === 0) {
    return Response.json(
      { error: "chartFile is required and must be a non-empty PDF." },
      { status: 400 },
    );
  }

  if (chartFile.type !== "application/pdf") {
    return Response.json(
      { error: "chartFile must be a PDF (application/pdf)." },
      { status: 400 },
    );
  }

  const questionnaireFileRaw = formData.get("questionnaireFile");
  const questionnaireFile =
    questionnaireFileRaw instanceof File && questionnaireFileRaw.size > 0
      ? questionnaireFileRaw
      : null;

  if (
    questionnaireFile &&
    questionnaireFile.type !== "application/pdf"
  ) {
    return Response.json(
      { error: "questionnaireFile must be a PDF (application/pdf)." },
      { status: 400 },
    );
  }

  const questionnaireTextRaw = formData.get("questionnaireText");
  const questionnaireText =
    typeof questionnaireTextRaw === "string" ? questionnaireTextRaw.trim() : "";

  const questionsRaw = formData.get("questions");
  if (typeof questionsRaw !== "string" || !questionsRaw.trim()) {
    return Response.json(
      { error: "questions is required as a JSON array string." },
      { status: 400 },
    );
  }

  let questionsParsed: string[];
  try {
    const parsed = JSON.parse(questionsRaw) as unknown;
    if (!Array.isArray(parsed)) {
      return Response.json(
        { error: "questions must be a JSON array of strings." },
        { status: 400 },
      );
    }
    if (!parsed.every((x) => typeof x === "string")) {
      return Response.json(
        { error: "questions array must contain only strings." },
        { status: 400 },
      );
    }
    questionsParsed = parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {
    return Response.json(
      { error: "questions must be valid JSON." },
      { status: 400 },
    );
  }

  /** Empty list is allowed only when the payer questionnaire is attached as a PDF (Claude reads it natively). */
  if (questionsParsed.length === 0) {
    const questionnaireFileForEmpty =
      questionnaireFileRaw instanceof File && questionnaireFileRaw.size > 0;
    if (!questionnaireFileForEmpty) {
      return Response.json(
        {
          error:
            "questions must be a non-empty array unless a payer questionnaire PDF is attached.",
        },
        { status: 400 },
      );
    }
  }

  const chartBuffer = Buffer.from(await chartFile.arrayBuffer());
  const chartB64 = chartBuffer.toString("base64");

  let questionnaireB64: string | null = null;
  if (questionnaireFile) {
    const qBuf = Buffer.from(await questionnaireFile.arrayBuffer());
    questionnaireB64 = qBuf.toString("base64");
  }

  const questionsBlock =
    questionsParsed.length > 0
      ? formatQuestionsList(questionsParsed)
      : `Answer every question in the payer questionnaire PDF (second document) in the order it appears. Use questionIndex 0 for the first question, 1 for the second, and so on.`;

  const docBlocks: ContentBlockParam[] = [
    {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: chartB64,
      },
      title: "Patient chart",
    },
  ];

  if (questionnaireB64) {
    docBlocks.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: questionnaireB64,
      },
      title: "Payer questionnaire",
    });
  }

  let instructions = `The first attached PDF is the patient chart.`;

  if (questionnaireB64) {
    instructions += ` The second attached PDF is the payer questionnaire.`;
  } else if (questionnaireText) {
    instructions += ` The payer questionnaire was pasted as text below.`;
  }

  instructions += `

--- PAYER QUESTIONS (answer each; use indices) ---
${questionsBlock}`;

  if (questionnaireText && !questionnaireB64) {
    instructions += `

--- PAYER QUESTIONNAIRE (pasted text) ---
${questionnaireText}`;
  }

  instructions += `

Follow the system output format exactly.`;

  const userContent: ContentBlockParam[] = [
    ...docBlocks,
    { type: "text", text: instructions },
  ];

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  const anthropic = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let lineBuffer = "";

      const flushLine = (raw: string) => {
        const line = raw.trim();
        if (!line) return;

        if (line.startsWith("[THINK]")) {
          const jsonStr = line.slice(7).trim();
          try {
            const payload = JSON.parse(jsonStr) as Record<string, unknown>;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ kind: "thinking", payload })}\n\n`,
              ),
            );
          } catch {
            /* ignore malformed line */
          }
        } else if (line.startsWith("[ANSWER]")) {
          const jsonStr = line.slice(8).trim();
          try {
            const payload = JSON.parse(jsonStr) as Record<string, unknown>;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ kind: "answer", payload })}\n\n`,
              ),
            );
          } catch {
            /* ignore */
          }
        }
      };

      try {
        const anthropicStream = await anthropic.messages.create({
          model,
          max_tokens: 4000,
          stream: true,
          system: CLEARPA_ANALYZE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta") {
            const d = event.delta;
            if (d.type === "text_delta" && d.text) {
              lineBuffer += d.text;
              let nl: number;
              while ((nl = lineBuffer.indexOf("\n")) !== -1) {
                const complete = lineBuffer.slice(0, nl);
                lineBuffer = lineBuffer.slice(nl + 1);
                flushLine(complete);
              }
            }
          }
        }

        if (lineBuffer.trim()) {
          flushLine(lineBuffer);
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ kind: "done" })}\n\n`),
        );
        controller.close();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Analysis failed unexpectedly";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ kind: "error", message })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
