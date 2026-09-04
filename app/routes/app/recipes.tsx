import { userContext } from "~/middleware/auth";
import type { Route } from "./+types/recipes";
import db from "~/db.server";
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from "~/components/recipes";
import { data, Form, NavLink, Outlet, redirect } from "react-router";
import SearchBar from "~/components/forms/SearchBar";
import { PrimaryButton } from "~/components/forms/Button";
import { PlusIcon } from "~/components/icons/Plus";

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const user = context.get(userContext);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const recipes = await db.recipe.findMany({
    where: { userId: user.id, name: { contains: q, mode: "insensitive" } },
    select: { name: true, totalTime: true, imageUrl: true, id: true },
  });

  return data({ recipes });
};

export const action = async ({ context }: Route.ActionArgs) => {
  const user = context.get(userContext);

  const recipe = await db.recipe.create({
    data: {
      userId: user.id,
      name: "New recipe",
      totalTime: "0 min",
      imageUrl: "https://placehold.co/150?text=Remix+Recipes",
      instructions: "",
    },
  });

  return redirect(`/app/recipes/${recipe.id}`);
};

export default function Recipes({
  loaderData: { recipes },
}: Route.ComponentProps) {
  console.log(recipes);
  return (
    <RecipePageWrapper>
      <RecipeListWrapper>
        <SearchBar placeholder="Search recipes" />
        <Form method="post" className="mt-4" reloadDocument>
          <PrimaryButton className="w-full">
            <div className="flex w-full justify-center">
              <PlusIcon />
              <span className="ml-2">Create New Recipe</span>
            </div>
          </PrimaryButton>
        </Form>
        <ul>
          {recipes.map((recipe) => (
            <li className="my-4" key={recipe.id}>
              <NavLink reloadDocument to={recipe.id}>
                {({ isActive }) => {
                  return (
                    <RecipeCard
                      name={recipe.name}
                      totalTime={recipe.totalTime}
                      imageUrl={recipe.imageUrl}
                      isActive={isActive}
                    />
                  );
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </RecipeListWrapper>
      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}
