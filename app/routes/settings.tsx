import { Await, Link, Outlet, useLoaderData, useLocation } from "react-router";
import React from "react";

export async function loader() {
  const slowMessage = new Promise<string>((resolve) => {
    setTimeout(() => resolve("This message is slow"), 700);
  });
  return { message: "Hello, there", slowMessage };
}

export default function Settings() {
  const location = useLocation();
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Settings</h1>
      <p>message from loader: {data.message}</p>
      <React.Suspense fallback={<div>Loading...</div>} key={location.pathname}>
        <Await resolve={data.slowMessage}>
          {(value) => <p>Another message from loader: {value}</p>}
        </Await>
      </React.Suspense>
      <p>Update your preferences and configure your account settings here.</p>
      <nav>
        <Link to="app">App</Link>
        <Link to="profile">Profile</Link>
      </nav>
      <Outlet />
    </div>
  );
}
