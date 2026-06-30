import { useRouteError } from "react-router";
import type { Route } from "./+types/discover";

export function loader() {
  throw Error("Loader error...");
}

const Discover = () => {
  return (
    <div>
      <h1>Discover</h1>
      <p>Discover new content!</p>
    </div>
  );
};

export default Discover;

export function ErrorBoundary() {
  const error = useRouteError();
  if (error instanceof Error) {
    return (
      <div className="bg-red-300 border-2 border-red-600 rounded-md p-2">
        {error.message}
      </div>
    );
  }
}
