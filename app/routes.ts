import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/discover", "routes/discover.tsx"),
  route("/app", "routes/app.tsx", [
    index("routes/app/index.tsx"),
    route("pantry", "routes/app/pantry.tsx"),
    route("recipes", "routes/app/recipes.tsx", [
      route(":recipeId", "routes/app/recipes/$recipeId.tsx"),
    ]),
  ]),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("/validate-magic-link", "routes/validate-magic-link.tsx"),
  route("/settings", "routes/settings.tsx", [
    route("profile", "routes/settings/profile.tsx"),
    route("app", "routes/settings/app.tsx"),
  ]),
] satisfies RouteConfig;
