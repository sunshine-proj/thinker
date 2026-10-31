import { Link } from "react-router-dom";
import { AppIcon, type IconName } from "../components/common/AppIcon";

interface SectionPageProps {
  title: string;
  eyebrow: string;
  description: string;
  icon: IconName;
}

export function SectionPage({
  title,
  eyebrow,
  description,
  icon,
}: SectionPageProps) {
  return (
    <section className="section-page" aria-labelledby="section-title">
      <div className="section-page__icon" aria-hidden="true">
        <AppIcon name={icon} />
      </div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="section-title">{title}</h1>
      <p className="section-page__description">{description}</p>
      <div className="section-page__note">
        <span className="section-page__note-mark" aria-hidden="true">
          ✦
        </span>
        <div>
          <h2>This space is taking shape</h2>
          <p>
            We’re building a hands-on learning experience, one idea at a time.
            Check back as new activities and explanations are added.
          </p>
          <Link className="text-link" to="/">
            Back to your starting point
            <AppIcon name="arrowRight" />
          </Link>
        </div>
      </div>
    </section>
  );
}
