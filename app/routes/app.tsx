import { NavLink, Outlet } from "react-router";
import clsx from "clsx";

const App = () => {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl front-bold my-4">App</h1>
      <nav className="mt-2 pb-2 border-b-2 border-b-gray-300">
        <NavLink
          to="pantry"
          className={({ isActive }) =>
            clsx("hover:text-gray-500 pb-2.5 px-2 md:px-4", {
              "border-b-2 border-b-primary": isActive,
            })
          }
        >
          Pantry
        </NavLink>
      </nav>
      <div className="py-4 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default App;
