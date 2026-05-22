import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"), 
    route("/discover", 'routes/discover.tsx'),
    route("/app", 'routes/app.tsx'),
    route('/settings', 'routes/settings.tsx', [
        route('profile', 'routes/settings/profile.tsx'),
        route('app', 'routes/settings/app.tsx'),
    ]),
] satisfies RouteConfig;
