import {
  calculateLearningPoints,
  getLevelStatus,
  type LevelStatus,
} from "../../game-engine/progression/levels";
import { useProgressStore } from "../../store/progressStore";

/** Player level derived from best scores and saved experiments. */
export function useProgressLevel(): LevelStatus {
  const totalBestScore = useProgressStore((state) => state.progress.totalBestScore);
  const experimentCount = useProgressStore((state) => state.experiments.length);
  return getLevelStatus(calculateLearningPoints(totalBestScore, experimentCount));
}
