# ClearPA

> Chart to approval. In seconds.

**ClearPA** is an AI-powered prior authorization assistant for ophthalmology private practices. Upload a patient chart PDF and the payer's questionnaire — Claude reads both and pre-fills answers using approval-correlated clinical language.

## The Problem

Prior authorization paperwork costs US healthcare $36 billion annually. In a small ophthalmology practice, one coordinator spends 13+ hours per week hunting through chart notes to answer whatever questions the insurance company sends — in language precise enough for their AI reviewers to approve.

## The Solution

Chart PDF in. Payer questionnaire in. Answered form out. In ~30 seconds instead of 30–100 minutes.

ClearPA uses Claude to:
- Extract and parse clinical data from EHR PDF exports
- Match chart findings to payer questions
- Generate answers in approval-correlated language (H16.223, not H04.123; full drug class names, not abbreviations; step therapy with dates and outcomes)
- Flag questions it can't answer for the coordinator to complete
- Detect concomitant-use warnings before submission

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/clearpa
cd clearpa
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `ANTHROPIC_MODEL` | Model to use (default: `claude-sonnet-4-6`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Architecture

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **AI**: Anthropic Claude via @anthropic-ai/sdk with streaming
- **PDF parsing**: pdfjs-dist (client-side — PDFs never uploaded to servers)
- **Database**: Supabase (session history only — no PHI stored)
- **Deploy**: Vercel

## HIPAA Considerations

- PDFs are parsed client-side; only extracted text is sent to Claude
- No patient data is stored without explicit coordinator action
- Anthropic enterprise API with BAA provides HIPAA-eligible data handling
- No PHI is ever logged or persisted by default

## Team

Built at UM CBC Spring Hackathon 2026 by Patrick Wang.
Domain validation: practicing ophthalmologist at San Jose Eye.
First user: Kaitlynn (PA coordinator).
