import { frictionLab } from "./frictionLab";
import { gravityComparison } from "./gravityComparison";
import { magneticFieldLab } from "./magneticFieldLab";
import { projectileLab } from "./projectileLab";
import type { LabDefinition } from "./labTypes";

export const LABS: readonly LabDefinition[] = Object.freeze([gravityComparison, frictionLab, projectileLab, magneticFieldLab]);

export function findLab(id: string): LabDefinition | undefined {
  return LABS.find((lab) => lab.id === id);
}

export { frictionLab, gravityComparison, magneticFieldLab, projectileLab };
