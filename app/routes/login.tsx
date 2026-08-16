import {
  type ActionFunctionArgs,
  data,
  type LoaderFunction,
  useActionData,
} from "react-router";
import { PrimaryButton } from "~/components/forms/Button";
import { ErrorMessage } from "~/components/forms/ErrorMessage";
import { z } from "zod";
import { validateForm } from "../../utils/validation";
import { getUser } from "~/models/user.server";
import { sessionCookie } from "~/cookies";
import { commitSession, getSession } from "~/sessions";

const loginSchema = z.object({
  email: z.email(),
});

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  console.log("session data: ", session.data);
  return null;
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  return validateForm(
    formData,
    loginSchema,
    async ({ email }) => {
      const user = await getUser(email);

      if (!user) {
        return data(
          { errors: { email: "User with this email does not exist" } },
          { status: 401 },
        );
      }
      session.set("userId", user.id);

      return data(user, {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    },
    (errors) =>
      data(
        { errors, email: formData.get("email")?.toString() },
        { status: 400 },
      ),
  );
}

export default function Login() {
  const actionData: any = useActionData<typeof action>();
  return (
    <div className="text-center mt-36">
      <h1 className="text-3xl mb-8">React Router Recipes</h1>
      <form method="post" className="mx-auto md:w-1/3">
        <div className="text-left pb-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="off"
            defaultValue={actionData?.email}
            className="w-full outline-none border-2 border-gray-200 focus:border-primary rounded-md p-2"
          />
          <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
        </div>
        <PrimaryButton className="w-1/3 mx-auto">Log In</PrimaryButton>
      </form>
    </div>
  );
}
