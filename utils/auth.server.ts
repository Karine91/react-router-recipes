import { getUserById } from "~/models/user.server";
import { getSession } from "~/sessions";

export async function getCurrentUser(request: Request) {
  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);

  const userId = session.get("userId");
  if (typeof userId !== "string") {
    return null;
  }

  const user = getUserById(userId);
  return user;
}
