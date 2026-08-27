import { data } from "react-router";
import type { Route } from "./+types/login";
import { PrimaryButton } from "~/components/forms/Button";
import { ErrorMessage } from "~/components/forms/ErrorMessage";
import { z } from "zod";
import { validateForm } from "../../utils/validation";

import { commitSession, getSession } from "~/sessions";
import { generateMagicLink, sendMagicLinkEmail } from "~/magic-links.server";
import { v4 as uuid } from "uuid";
import { PrimaryInput } from "~/components/forms/PrimaryInput";
import { requireLoggedOutUserMiddleware } from "~/middleware/auth";

const loginSchema = z.object({
  email: z.email(),
});

export const middleware = [requireLoggedOutUserMiddleware];

// need this to make sure middleware runs during client side navigation
export function loader() {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  return validateForm(
    formData,
    loginSchema,
    async ({ email }) => {
      const nonce = uuid();
      session.set("nonce", nonce);
      const link = generateMagicLink(email, nonce);

      await sendMagicLinkEmail(link, email);

      return data(
        { success: true },
        {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        },
      );
    },
    (errors) =>
      data(
        { errors, email: formData.get("email")?.toString() },
        { status: 400 },
      ),
  );
}

export default function Login({ actionData }: Route.ComponentProps) {
  if (actionData && "success" in actionData) {
    return (
      <div className="text-center mt-36">
        <h1 className="text-2xl py-8">Yum!</h1>
        <p>
          Check your email and follow the instructions to finish logging in.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center mt-36">
      <h1 className="text-3xl mb-8">React Router Recipes</h1>
      <form method="post" className="mx-auto md:w-1/3">
        <div className="text-left pb-4">
          <PrimaryInput
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="off"
            defaultValue={actionData?.email}
          />
          <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
        </div>
        <PrimaryButton className="w-1/3 mx-auto">Log In</PrimaryButton>
      </form>
    </div>
  );
}
