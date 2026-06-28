import clsx from "clsx";
import React from "react";
import { NavLink } from "react-router";

const AppNavLink = ({
  children,
  to,
}: {
  children: React.ReactNode;
  to: string;
}) => {
  return (
    <li className="w-16">
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={clsx("py-4 flex justify-center hover:bg-primary-light", {
              "bg-primary-light": isActive,
            })}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
};

export default AppNavLink;
