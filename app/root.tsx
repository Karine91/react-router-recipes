import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteError,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { useEffect } from "react";
import AppNavLink from "./components/AppNavLink";
import { HomeIcon } from "./components/icons/Home";
import { DiscoverIcon } from "./components/icons/Discover";
import { RecipeBookIcon } from "./components/icons/RecipeBook";
import { SettingsIcon } from "./components/icons/Settings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "React Router Recipes" },
    { name: "description", content: "Welcome to React Router Recipes App!" },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: "/favicon.svg",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="md:flex h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const matches = useMatches();
  useEffect(() => {
    console.log(matches);
  }, []);
  return (
    <>
      <nav className="bg-primary text-white">
        <ul className="flex md:flex-col">
          <AppNavLink to="/">
            <HomeIcon />
          </AppNavLink>
          <AppNavLink to="/settings">
            <SettingsIcon />
          </AppNavLink>
          <AppNavLink to="/discover">
            <DiscoverIcon />
          </AppNavLink>
          <AppNavLink to="/app">
            <RecipeBookIcon />
          </AppNavLink>
        </ul>
      </nav>
      <div className="p-4 w-full md:w-[calc(100%-4rem)]">
        <Outlet />
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <html lang="en">
      <head>
        <title>Whoops!</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="p-4">
        <h1 className="text-2xl pb-3">Whoops!</h1>
        <p>You're seeing this page because an unexpected error occurred.</p>
        {error instanceof Error ? (
          <p className="my-4 font-bold">{error.message}</p>
        ) : null}
        <Link to="/" className="text-primary">
          Take me home
        </Link>
      </body>
    </html>
  );
}
