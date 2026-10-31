import { Link, Outlet, useLocation } from "react-router-dom";
import { AppIcon } from "../common/AppIcon";
import { PrimaryNavigation } from "../navigation/PrimaryNavigation";
import { PRIMARY_NAVIGATION } from "../navigation/navigationItems";

function Brand() {
  return (
    <Link aria-label="Physics Playground home" className="brand" to="/">
      <span className="brand__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand__text">
        <strong>physics</strong>
        <span>PLAYGROUND</span>
      </span>
    </Link>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const currentPage = PRIMARY_NAVIGATION.find((item) => item.to === pathname);
  const pageLabel = currentPage?.label ?? "Your learning space";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <p className="sidebar__label">YOUR PLAYGROUND</p>
        <PrimaryNavigation />
        <div className="sidebar__thought">
          <span className="sidebar__thought-icon" aria-hidden="true">
            ✦
          </span>
          <p>Stay curious.</p>
          <span>Every great discovery starts with a question.</span>
        </div>
        <div className="sidebar__footer">
          <span className="sidebar__footer-dot" aria-hidden="true" />
          Built for curious minds
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__brand">
            <Brand />
          </div>
          <p className="topbar__location">
            <span>PLAYGROUND</span>
            <span aria-hidden="true">/</span>
            <strong>{pageLabel}</strong>
          </p>
          <Link
            aria-label="Go to your profile"
            className="topbar__profile"
            to="/profile"
          >
            <span className="topbar__avatar" aria-hidden="true">
              <AppIcon name="profile" />
            </span>
            <span>My space</span>
          </Link>
        </header>

        <div className="mobile-navigation">
          <PrimaryNavigation />
        </div>

        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        <footer className="site-footer">
          <span>Play. Experiment. Discover.</span>
          <span>Made for curious minds</span>
        </footer>
      </div>
    </div>
  );
}
