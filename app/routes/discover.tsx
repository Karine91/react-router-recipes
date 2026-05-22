import type { Route } from "./+types/discover";
import styles from "~/styles/index.css?url";

export const links: Route.LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

const Discover = () => {
  return (
    <div>
      <h1>Discover</h1>
      <p>Discover new content!</p>
    </div>
  );
};

export default Discover;
