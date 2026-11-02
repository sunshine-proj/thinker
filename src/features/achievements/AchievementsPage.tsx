import { useEffect } from "react";
import { LevelCard } from "../../components/common";
import { ACHIEVEMENTS } from "../../game-engine/progression/achievements";
import { useProgressLevel } from "../profile/useProgressLevel";
import { useProgressStore } from "../../store/progressStore";

export function AchievementsPage() {
  const achievements = useProgressStore((state) => state.achievements);
  const status = useProgressStore((state) => state.status);
  const hydrate = useProgressStore((state) => state.hydrate);
  const level = useProgressLevel();
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const unlockedAt = new Map(
    achievements.map((achievement) => [achievement.achievementId, achievement.unlockedAt]),
  );

  return (
    <div className="worlds-page">
      <header className="worlds-page__header">
        <p className="eyebrow">Celebrate your progress</p>
        <h1>Achievements</h1>
        <p>
          {status === "ready"
            ? `${achievements.length} of ${ACHIEVEMENTS.length} unlocked.`
            : "Loading your achievements…"}
        </p>
      </header>

      <LevelCard status={level} />

      <ul className="world-section__list">
        {ACHIEVEMENTS.map((achievement) => {
          const date = unlockedAt.get(achievement.id);
          return (
            <li key={achievement.id}>
              <div
                className={date ? "world-card" : "world-card world-card--soon"}
              >
                <span className="world-card__meta">
                  {date
                    ? `UNLOCKED ${new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" }).toUpperCase()}`
                    : "LOCKED"}
                </span>
                <strong>{achievement.title}</strong>
                <span>{achievement.description}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
