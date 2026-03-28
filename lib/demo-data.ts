import type { PaAnswer, ThinkingStepType } from "@/lib/types/analysis";

/** Synthetic ophthalmology chart for hackathon / HIPAA-safe demos only. */
export const DEMO_CHART_TEXT = `OPHTHALMOLOGY CLINIC NOTE — SYNTHETIC DEMO PATIENT (NOT REAL PHI)

Patient: J.M., DOB 08/14/1967, F
MRN: [DEMO]

Chief complaint: Bilateral dry eye with burning and foreign body sensation; symptoms worse with screen use and in low humidity.

History of present illness: Patient reports chronic ocular surface discomfort for >12 months. Prior artificial tears and punctal occlusion provided incomplete relief. She continues to experience significant symptom burden affecting work and daily activities.

Diagnosis:
• H16.223 — Keratoconjunctivitis sicca, bilateral (moderate-to-severe dry eye disease)

Exam findings (most recent visit):
• Tear break-up time (TBUT): 4 seconds OU
• Schirmer's test without anesthesia: 4 mm/5 min OU
• Oxford corneal staining: grade 3 OU
• Ocular Surface Disease Index (OSDI): 52 (severe; score ≥33 indicates severe disease)

Prior treatment history (summarized):
• Systane Ultra artificial tears, 4 drops/day OU × 10 weeks (Oct–Dec 2025) — inadequate symptomatic response; OSDI 54 at follow-up.
• TheraTears lubricating drops, 4×/day OU × 8 weeks (Dec 2025–Feb 2026) — inadequate response; TBUT unchanged from baseline.
• Restasis 0.05% ophthalmic emulsion BID OU × 6 months (Jul 2025–Jan 2026) — OSDI remained ≥33 at 6-month follow-up (score 48); therapy discontinued due to inadequate efficacy after adequate trial per payer criteria.
• Punctal plugs placed OU (Nov 2025) — partial relief only; insufficient as monotherapy.

Current medications: None — all prior prescription dry eye therapies discontinued at last visit.

Plan / request: Initiate cyclosporine ophthalmic solution 0.09% (Cequa) BID OU for moderate-to-severe dry eye with documented inadequate response to prior therapies as above.

Prescriber: Dr. [Redacted], MD, Ophthalmology
NPI: [Redacted]

This note is fabricated for product demonstration purposes and does not represent a real person.`;

/** Representative UHC-style Cequa prior authorization questions (demo). */
export const DEMO_QUESTIONS: string[] = [
  "What is the patient's primary diagnosis? Please provide ICD-10 code and description.",
  "Is this patient being treated for keratoconjunctivitis sicca (KCS) or moderate-to-severe dry eye disease?",
  "Has the patient failed Miebo (perfluorohexyloctane)? If so, provide dates and reason for discontinuation.",
  "Has the patient failed Restasis (cyclosporine 0.05%)? If so, provide dates and reason for discontinuation.",
  "Has the patient failed Xiidra (lifitegrast)? If so, provide dates and reason for discontinuation.",
  "Please provide OSDI or equivalent validated questionnaire score.",
  "Will this medication be used concurrently with any other prescription dry eye medication?",
  "Please confirm prescriber specialty and NPI.",
];

export type DemoThinkingStepRaw = {
  type: ThinkingStepType;
  text: string;
};

/** Pre-scripted thinking stream for offline demo (no API). */
export const DEMO_THINKING_STEPS: DemoThinkingStepRaw[] = [
  { type: "reading", text: "Reading patient chart... 4 pages extracted." },
  {
    type: "question",
    text: "Processing: Primary diagnosis and ICD-10 code",
  },
  {
    type: "found",
    text: "Found: H16.223 — Keratoconjunctivitis sicca, bilateral (moderate-to-severe)",
  },
  {
    type: "drafting",
    text: "Drafting answer with approval-correlated language...",
  },
  {
    type: "question",
    text: "Processing: Restasis failure documentation",
  },
  {
    type: "found",
    text: "Found: Restasis 0.05% BID OU × 6 months (Jul 2025–Jan 2026), OSDI 48 at 6-month follow-up",
  },
  {
    type: "drafting",
    text: "Drafting step therapy failure statement...",
  },
  {
    type: "question",
    text: "Processing: Miebo (perfluorohexyloctane) failure",
  },
  {
    type: "flagged",
    text: "Could not locate Miebo trial in chart — question flagged for coordinator",
  },
  {
    type: "question",
    text: "Processing: Concurrent medication check",
  },
  {
    type: "found",
    text: "No concurrent Rx dry eye medications listed in current medications",
  },
  {
    type: "complete",
    text: "Analysis complete. 7 of 8 questions answered. 1 flagged for review.",
  },
];

/** Synthetic answers aligned with DEMO_QUESTIONS and the demo chart (Q3 Miebo = flagged). */
export const DEMO_ANSWERS: PaAnswer[] = [
  {
    questionIndex: 0,
    status: "answered",
    answer:
      "Primary diagnosis: H16.223 — Keratoconjunctivitis sicca, bilateral (moderate-to-severe), per chart.",
    confidence: "high",
  },
  {
    questionIndex: 1,
    status: "answered",
    answer:
      "Yes. Chart documents keratoconjunctivitis sicca (KCS) with moderate-to-severe dry eye disease (OSDI 52; TBUT 4 sec OU; Schirmer 4 mm/5 min OU; Oxford grade 3 OU).",
    confidence: "high",
  },
  {
    questionIndex: 2,
    status: "flagged",
    answer:
      "INCOMPLETE — Coordinator to fill: Document Miebo (perfluorohexyloctane) trial dates and discontinuation reason if applicable, or confirm patient has not trialed Miebo.",
    confidence: "low",
    suggestedAction:
      "No Miebo use documented in this synthetic chart; verify with prescriber for PA submission.",
  },
  {
    questionIndex: 3,
    status: "answered",
    answer:
      "Yes. Restasis 0.05% emulsion BID OU × 6 months (Jul 2025–Jan 2026); inadequate efficacy — OSDI remained ≥33 (score 48) at 6-month follow-up; discontinued.",
    confidence: "high",
  },
  {
    questionIndex: 4,
    status: "answered",
    answer:
      "No Xiidra (lifitegrast) trial documented in chart. Coordinator to confirm if trialed elsewhere.",
    confidence: "medium",
  },
  {
    questionIndex: 5,
    status: "answered",
    answer: "OSDI score: 52 (severe).",
    confidence: "high",
  },
  {
    questionIndex: 6,
    status: "answered",
    answer:
      "Chart lists no concurrent prescription dry eye medications; all prior Rx dry eye therapies discontinued.",
    confidence: "high",
  },
  {
    questionIndex: 7,
    status: "answered",
    answer:
      "Prescriber: Ophthalmology. NPI on file as [Redacted] per demo chart (replace with valid NPI for submission).",
    confidence: "medium",
  },
];
