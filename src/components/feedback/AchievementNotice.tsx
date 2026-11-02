import { useProgressStore } from "../../store/progressStore";

/** Announces newly unlocked achievements to everyone, including screen-reader users. */
export function AchievementNotice() {
  const newlyUnlocked = useProgressStore((state) => state.newlyUnlocked);
  const acknowledge = useProgressStore((state) => state.acknowledgeAchievements);

  return (
    <div aria-live="polite" className="achievement-notice-region">
      {newlyUnlocked.length > 0 && (
        <div className="achievement-notice" role="status">
          <div>
            <strong>
              {newlyUnlocked.length === 1
                ? "Achievement unlocked"
                : `${newlyUnlocked.length} achievements unlocked`}
            </strong>
            <span>{newlyUnlocked.map((a) => a.title).join(" · ")}</span>
          </div>
          <button className="circuit-chip" onClick={acknowledge} type="button">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
