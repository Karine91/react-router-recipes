import clsx from "clsx";
import React from "react";
import { NavLink, useNavigation, useResolvedPath } from "react-router";

const AppNavLink = ({
  children,
  to,
}: {
  children: React.ReactNode;
  to: string;
}) => {
  const navigation = useNavigation();
  const path = useResolvedPath(to);
  const isLoading =
    navigation.state === "loading" &&
    navigation.location.pathname === path.pathname;

  return (
    <li className="w-16">
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={clsx("py-4 flex justify-center hover:bg-primary-light", {
              "bg-primary-light": isActive || isLoading,
              "animate-pulse": isLoading,
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
