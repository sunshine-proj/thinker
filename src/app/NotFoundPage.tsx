import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="section-page" aria-labelledby="not-found-title">
      <p className="eyebrow">Wrong turn?</p>
      <h1 id="not-found-title">That page is out of this world.</h1>
      <p className="section-page__description">
        The page you’re looking for doesn’t exist. Head back and choose another
        direction.
      </p>
      <Link className="button button--primary" to="/">
        Go to home
      </Link>
    </section>
  );
}
