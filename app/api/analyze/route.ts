import Anthropic from "@anthropic-ai/sdk";

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

  let body: { chartText?: string; questions?: string | string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chartTextRaw = body.chartText;
  const chartText =
    typeof chartTextRaw === "string" ? chartTextRaw.trim() : "";
  console.log(
    "[/api/analyze] chartText:",
    chartText.length > 0
      ? chartText.length > 100
        ? `${chartText.slice(0, 100)}… (${chartText.length} chars)`
        : `${chartText} (${chartText.length} chars)`
      : "EMPTY",
  );

  const questionsRaw = body.questions;
  if (!chartText) {
    return Response.json(
      {
        error:
          typeof chartTextRaw === "undefined"
            ? "chartText is missing from the request body."
            : "chartText is empty or whitespace only—the patient chart PDF may have no extractable text.",
      },
      { status: 400 },
    );
  }
  if (
    questionsRaw === undefined ||
    (Array.isArray(questionsRaw) && questionsRaw.length === 0) ||
    (typeof questionsRaw === "string" && !questionsRaw.trim())
  ) {
    return Response.json(
      {
        error:
          "questions is required: provide a non-empty string or string array.",
      },
      { status: 400 },
    );
  }

  const questionsBlock = Array.isArray(questionsRaw)
    ? formatQuestionsList(questionsRaw)
    : formatQuestionsList([questionsRaw.trim()]);

  const userContent = `--- PATIENT CHART ---
${chartText}

--- PAYER QUESTIONS (answer each; use indices) ---
${questionsBlock}

Follow the system output format exactly.`;

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
          max_tokens: 16384,
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
