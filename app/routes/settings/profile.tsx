import React from "react";
import { useRouteError } from "react-router";

export function loader() {
  throw Error("Nested error");
}

const Profile = () => {
  return <div>Profile</div>;
};

export default Profile;

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
