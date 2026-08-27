import { createContext, redirect, type MiddlewareFunction } from "react-router";
import { getCurrentUser } from "../../utils/auth.server";
import type { User } from "../../generated/prisma/client";

export const requireLoggedOutUserMiddleware: MiddlewareFunction = async ({
  request,
}) => {
  const user = await getCurrentUser(request);
  if (user !== null) {
    throw redirect("/app");
  }
};

export const userContext = createContext<User>();

export const requireLoggedInUserMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = await getCurrentUser(request);
  if (user == null) {
    throw redirect("/login");
  }
  context.set(userContext, user);
};
