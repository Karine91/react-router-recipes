import { Link, Outlet } from "react-router";

export default function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Update your preferences and configure your account settings here.</p>
      <nav>
        <Link to="app">App</Link>
        <Link to="profile">Profile</Link>
      </nav>
      <Outlet />
    </div>
  );
}
