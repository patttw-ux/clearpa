export type ThinkingStepType =
  | "reading"
  | "question"
  | "found"
  | "flagged"
  | "warning"
  | "drafting"
  | "complete";

export type ThinkingStep = {
  id: string;
  type: ThinkingStepType;
  text: string;
  /** Elapsed seconds from analysis start when the step was recorded */
  atSeconds: number;
};

export type PaAnswerStatus = "answered" | "flagged" | "warning";

export type PaAnswer = {
  questionIndex: number;
  status: PaAnswerStatus;
  answer: string;
  confidence: "high" | "medium" | "low";
};
