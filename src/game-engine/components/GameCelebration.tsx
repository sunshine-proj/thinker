import { Link, useInRouterContext } from "react-router-dom";
import { StarRating } from "./StarRating";

interface GameCelebrationProps {
  readonly title: string;
  readonly points: number;
  readonly attempts: number;
  readonly stars: number;
  readonly maxStars: number;
  /** The key physics idea in one sentence. */
  readonly insight: string;
  readonly next?: { readonly title: string; readonly path: string } | null;
  readonly onPlayAgain: () => void;
}

/** Completion screen: stars, the key insight and an invitation to a harder challenge. */
export function GameCelebration({ title, points, attempts, stars, maxStars, insight, next, onPlayAgain }: GameCelebrationProps) {
  // Pages are normally inside the router; a plain link keeps the screen usable without one.
  const inRouter = useInRouterContext();
  return (
    <div aria-labelledby="celebration-title" className="game-celebration" role="region">
      <div aria-hidden="true" className="game-celebration__burst">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i }}>✦</span>
        ))}
      </div>
      <p className="game-complete" role="status">
        <strong>Every round complete.</strong>{" "}
        <span>
          You scored {points} points over {attempts} attempts.
        </span>
      </p>
      <h3 id="celebration-title">{title}: every round solved</h3>
      <StarRating max={maxStars} stars={stars} />
      <p className="game-celebration__insight">
        <strong>Key idea:</strong> {insight}
      </p>
      <div className="game-celebration__actions">
        {next &&
          (inRouter ? (
            <Link className="lab-button lab-button--primary" to={next.path}>
              Try a harder challenge: {next.title}
            </Link>
          ) : (
            <a className="lab-button lab-button--primary" href={next.path}>
              Try a harder challenge: {next.title}
            </a>
          ))}
        <button className="lab-button" onClick={onPlayAgain} type="button">
          Play again for more stars
        </button>
      </div>
    </div>
  );
}
