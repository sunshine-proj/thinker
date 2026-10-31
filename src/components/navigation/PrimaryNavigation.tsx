import { NavLink } from "react-router-dom";
import { AppIcon } from "../common/AppIcon";
import { PRIMARY_NAVIGATION } from "./navigationItems";

interface PrimaryNavigationProps {
  className?: string;
}

export function PrimaryNavigation({ className }: PrimaryNavigationProps) {
  const navigationClassName = className
    ? `primary-navigation ${className}`
    : "primary-navigation";

  return (
    <nav aria-label="Primary navigation" className={navigationClassName}>
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
