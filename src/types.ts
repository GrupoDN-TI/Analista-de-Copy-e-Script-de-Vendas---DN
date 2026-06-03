export interface TriggerPoint {
  triggerName: string;
  originalQuote: string;
  critique: string;
  solution: string;
}

export interface TriggersCritique {
  title: string;
  score: number; // 0 - 100
  points: TriggerPoint[];
}

export interface CtaCritique {
  title: string;
  score: number; // 0 - 100
  originalQuote: string;
  critique: string;
  solution: string;
}

export interface HeadspaceBreakPoint {
  title: string;
  originalQuote: string;
  whyItBreaks: string;
  retireeReaction: string;
  solution: string;
}

export interface CopyMakeoverSection {
  original: string;
  replacement: string;
  why: string;
}

export interface CopyMakeover {
  hook: CopyMakeoverSection;
  body: CopyMakeoverSection;
  cta: CopyMakeoverSection;
  completeNewScript: string;
}

export interface VoiceAnalysis {
  toneFeedback: string;
  paceFeedback: string;
  warmthEvaluation: string;
  generalScore: number;
}

export interface CritiqueReport {
  overallScore: number; // 0 - 100 (harsh grading)
  overallVerdict: string; // e.g., "CATASTRÓFICO", "VENDEDOR CHATO", "AMADOR", "SULTÃO DO GOLPE", etc.
  overallExplanation: string; // Scathing overview of the copy's fatal flaw.
  triggersCritique: TriggersCritique;
  ctaCritique: CtaCritique;
  headspaceBreaks: HeadspaceBreakPoint[];
  makeover: CopyMakeover;
  voiceAnalysis: VoiceAnalysis;
  transcription?: string; // Full transcript generated if audio was processed
}

export interface CritiqueRequest {
  type: 'text' | 'audio';
  textScript?: string;
  audioBase64?: string; // optional base64 representation
  audioMimeType?: string;
  subAudienceDetail?: string; // e.g., "Refinanciamento", "Novo Benefício", etc.
}
