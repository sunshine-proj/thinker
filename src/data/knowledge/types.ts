/** A Knowledge Base entry, following SKILLS §9: every formula explains each variable and its unit. */
export interface KnowledgeFormula {
  readonly expression: string;
  /** What the formula says in words. */
  readonly meaning: string;
  readonly variables: readonly { readonly symbol: string; readonly meaning: string; readonly unit: string }[];
}

export interface KnowledgeEntry {
  /** A topic id from src/data/topics.ts. */
  readonly topicId: string;
  readonly introduction: string;
  readonly objectives: readonly string[];
  readonly explanation: string;
  readonly formulas: readonly KnowledgeFormula[];
  /** Definitions of the key terms. */
  readonly definitions: readonly { readonly term: string; readonly meaning: string }[];
  readonly examples: readonly string[];
  readonly questions: readonly { readonly question: string; readonly answer: string }[];
  /** Going further, for advanced learners. */
  readonly advanced: string;
}

export const v = (symbol: string, meaning: string, unit: string) => ({ symbol, meaning, unit });
