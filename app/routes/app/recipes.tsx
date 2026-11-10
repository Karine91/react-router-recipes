import { userContext } from "~/middleware/auth";
import type { Route } from "./+types/recipes";
import db from "~/db.server";
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from "~/components/recipes";
import {
  data,
  Form,
  NavLink,
  Outlet,
  redirect,
  useFetcher,
  useLocation,
  useNavigation,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import SearchBar from "~/components/forms/SearchBar";
import { PrimaryButton } from "~/components/forms/Button";
import { PlusIcon } from "~/components/icons/Plus";
import {
  useSaveRecipeNameFetcher,
  useSaveRecipeTotalTimeFetcher,
} from "../../../utils/hooks";
import { mealPlanModalIsOpeningOrClosing } from "../../../utils/revalidation";

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const user = context.get(userContext);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const recipes = await db.recipe.findMany({
    where: { userId: user.id, name: { contains: q, mode: "insensitive" } },
    select: { name: true, totalTime: true, imageUrl: true, id: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return data(
    { recipes },
    {
      headers: {
        "Cache-Control": "max-age=5",
      },
    },
  );
};

export const action = async ({ context, request }: Route.ActionArgs) => {
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

  const url = new URL(request.url);
  url.pathname = `/app/recipes/${recipe.id}`;
  return redirect(url.toString());
};

export function shouldRevalidate(arg: ShouldRevalidateFunctionArgs) {
  return !mealPlanModalIsOpeningOrClosing(arg);
}

export default function Recipes({
  loaderData: { recipes },
}: Route.ComponentProps) {
  const location = useLocation();
  const navigation = useNavigation();

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
          {recipes.map((recipe) => {
            return <RecipeListItem key={recipe.id} recipe={recipe} />;
          })}
        </ul>
      </RecipeListWrapper>
      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}

type RecipeListItemProps = {
  recipe: {
    id: string;
    name: string;
    totalTime: string;
    imageUrl: string;
  };
};

function RecipeListItem({ recipe }: RecipeListItemProps) {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.location?.pathname.endsWith(recipe.id);
  const saveNameFetcher = useSaveRecipeNameFetcher(recipe.id);
  const saveTotalTimeFetcher = useSaveRecipeTotalTimeFetcher(recipe.id);

  const optimisticData = {
    name: saveNameFetcher.formData?.get("name")?.toString(),
    totalTime: saveTotalTimeFetcher.formData?.get("totalTime")?.toString(),
  };

  return (
    <li className="my-4" key={recipe.id}>
      <NavLink
        prefetch="intent"
        to={{ pathname: recipe.id, search: location.search }}
      >
        {({ isActive }) => {
          return (
            <RecipeCard
              name={optimisticData.name ?? recipe.name}
              totalTime={optimisticData.totalTime ?? recipe.totalTime}
              imageUrl={recipe.imageUrl}
              isActive={isActive}
              isLoading={isLoading}
            />
          );
        }}
      </NavLink>
    </li>
  );
}
