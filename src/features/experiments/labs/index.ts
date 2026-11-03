import { heatTransferLab } from "./heatTransferLab";
import { lensFocalLab } from "./lensFocalLab";
import { orbitalMotionLab } from "./orbitalMotionLab";
import { waveInterferenceLab } from "./waveInterferenceLab";
import { frictionLab } from "./frictionLab";
import { gravityComparison } from "./gravityComparison";
import { magneticFieldLab } from "./magneticFieldLab";
import { projectileLab } from "./projectileLab";
import type { LabDefinition } from "./labTypes";

export const LABS: readonly LabDefinition[] = Object.freeze([gravityComparison, frictionLab, projectileLab, magneticFieldLab, heatTransferLab, lensFocalLab, waveInterferenceLab, orbitalMotionLab]);

export function findLab(id: string): LabDefinition | undefined {
  return LABS.find((lab) => lab.id === id);
}

export { frictionLab, gravityComparison, heatTransferLab, lensFocalLab, magneticFieldLab, orbitalMotionLab, projectileLab, waveInterferenceLab };
