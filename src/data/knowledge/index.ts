import { ASTRONOMY_KNOWLEDGE } from "./astronomy";
import { ELECTROMAGNETISM_KNOWLEDGE } from "./electromagnetism";
import { EVERYDAY_KNOWLEDGE } from "./everyday";
import { FLUIDS_KNOWLEDGE } from "./fluids";
import { MECHANICS_KNOWLEDGE } from "./mechanics";
import { MODERN_PHYSICS_KNOWLEDGE } from "./modernPhysics";
import { NUCLEAR_KNOWLEDGE } from "./nuclear";
import { OPTICS_KNOWLEDGE } from "./optics";
import { THERMODYNAMICS_KNOWLEDGE } from "./thermodynamics";
import type { KnowledgeEntry } from "./types";
import { WAVES_KNOWLEDGE } from "./waves";

export type { KnowledgeEntry, KnowledgeFormula } from "./types";

export const KNOWLEDGE_BASE: readonly KnowledgeEntry[] = Object.freeze([
  ...MECHANICS_KNOWLEDGE,
  ...ELECTROMAGNETISM_KNOWLEDGE,
  ...THERMODYNAMICS_KNOWLEDGE,
  ...OPTICS_KNOWLEDGE,
  ...WAVES_KNOWLEDGE,
  ...ASTRONOMY_KNOWLEDGE,
  ...MODERN_PHYSICS_KNOWLEDGE,
  ...FLUIDS_KNOWLEDGE,
  ...NUCLEAR_KNOWLEDGE,
  ...EVERYDAY_KNOWLEDGE,
]);

export function findKnowledgeEntry(topicId: string): KnowledgeEntry | undefined {
  return KNOWLEDGE_BASE.find((entry) => entry.topicId === topicId);
}
