export interface TriggerPoint {
  triggerName: string;
  triggerType: "absent" | "weak" | "misapplied" | "overused";
  originalQuote: string;
  critique: string;
  solution: string;
}

export interface TriggersCritique {
  title: string;
  score: number; // 0 - 100
  triggerDensityScore: number; // 0 - 100 scale measuring trigger saturation/overload vs dry
  triggerDensityExplanation: string; // analysis of trigger density and cognitive overload
  points: TriggerPoint[];
}

export interface CtaCritique {
  title: string;
  score: number; // 0 - 100
  originalQuote: string;
  critique: string;
  solution: string;
}

export interface CtaContextAnalysis {
  isPremature: boolean;
  desireBuiltBeforeCTA: number; // 0-100
  objectionHandlingBeforeCTA: number; // 0-100;
  contextualCoherence: string;
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

export interface NarrativeMeasure {
  score: number;
  critique: string;
}

export interface NarrativeStructure {
  hookEffectiveness: NarrativeMeasure;
  tensionBuilding: NarrativeMeasure;
  logicalFlow: NarrativeMeasure;
  pacingIssues: string[];
}

export interface EmotionalJourneyMap {
  intendedEmotions: string[];
  actualEmotions: string[];
  emotionalGaps: string[];
}

export interface ObjectionHandling {
  anticipatedObjections: string[];
  addressedObjections: string[];
  missingObjections: string[];
  objectionHandlingScore: number;
}

export interface MakeoverStrategy {
  coreStrategicChanges: string[];
  optionalImprovements: string[];
  priorityRanking: string[];
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
  narrativeStructure: NarrativeStructure;
  ctaContextAnalysis: CtaContextAnalysis;
  emotionalJourneyMap: EmotionalJourneyMap;
  objectionHandling: ObjectionHandling;
  makeoverStrategy: MakeoverStrategy;
  transcription?: string; // Full transcript generated if audio was processed
}

export interface CritiqueRequest {
  type: 'text' | 'audio';
  textScript?: string;
  audioBase64?: string; // optional base64 representation
  audioMimeType?: string;
  subAudienceDetail?: string; // e.g., "Refinanciamento", "Novo Benefício", etc.
}
