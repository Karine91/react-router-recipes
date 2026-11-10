import { data, RouterContextProvider } from "react-router";
import db from "~/db.server";
import { userContext } from "~/middleware/auth";

export async function canChangeRecipe(
  context: Readonly<RouterContextProvider>,
  recipeId: string,
) {
  const user = context.get(userContext);
  const recipe = await db.recipe.findUnique({
    where: {
      id: recipeId,
      userId: user.id,
    },
  });

  if (!recipe) {
    throw data({ message: "Recipe not found" }, { status: 404 });
  }
}
