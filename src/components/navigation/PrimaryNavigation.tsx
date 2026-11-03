import { NavLink } from "react-router-dom";
import { AppIcon } from "../common/AppIcon";
import { PRIMARY_NAVIGATION } from "./navigationItems";

interface PrimaryNavigationProps {
  className?: string;
  /** Landmarks of the same kind need different names; the compact bar uses its own. */
  label?: string;
}

export function PrimaryNavigation({ className, label = "Primary navigation" }: PrimaryNavigationProps) {
  const navigationClassName = className
    ? `primary-navigation ${className}`
    : "primary-navigation";

  return (
    <nav aria-label={label} className={navigationClassName}>
      {PRIMARY_NAVIGATION.map((item) => (
        <NavLink
          key={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            isActive
              ? "primary-navigation__link is-active"
              : "primary-navigation__link"
          }
          end={item.to === "/"}
          to={item.to}
        >
          <AppIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
