import db from "~/db.server";
import type { Route } from "./+types/$recipeId";
import {
  data,
  Form,
  isRouteErrorResponse,
  redirect,
  useFetcher,
} from "react-router";
import Input from "~/components/forms/Input";
import { ErrorMessage } from "~/components/forms/ErrorMessage";
import { TimeIcon } from "~/components/icons/Time";
import React, { useRef } from "react";
import { TrashIcon } from "~/components/icons/Trash";
import clsx from "clsx";
import { DeleteButton, PrimaryButton } from "~/components/forms/Button";
import z from "zod";
import { validateForm } from "../../../../utils/validation";
import { SaveIcon } from "~/components/icons/Save";
import { handleDelete } from "~/models/utils";
import { userContext } from "~/middleware/auth";

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const user = context.get(userContext);

  const recipe = await db.recipe.findUnique({
    where: { id: params.recipeId, userId: user.id },
    include: {
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!recipe) {
    throw data({ message: "Recipe not found" }, { status: 404 });
  }

  return data(
    { recipe },
    {
      headers: {
        "Cache-Control": "max-age=5",
      },
    },
  );
};

const saveNameSchema = z.object({
  name: z.string().min(1, "Name cannot be blank"),
});

const saveTotalTimeSchema = z.object({
  totalTime: z.string().min(1, "Total time cannot be blank"),
});

const saveInstructionsSchema = z.object({
  instructions: z.string().min(1, "Instructions cannot be blank"),
});

const ingredientId = z.string().min(1, "Ingredient ID is missing");
const ingredientAmount = z.string().nullable();
const ingredientName = z.string().min(1, "Name cannot be blank");

const saveIngredientAmountSchema = z.object({
  amount: ingredientAmount,
  id: ingredientId,
});

const saveIngredientNameSchema = z.object({
  name: ingredientName,
  id: ingredientId,
});

const saveRecipeSchema = z
  .object({
    ingredientIds: z.array(ingredientId).optional(),
    ingredientAmounts: z.array(ingredientAmount).optional(),
    ingredientNames: z.array(ingredientName).optional(),
  })
  .and(saveNameSchema)
  .and(saveTotalTimeSchema)
  .and(saveInstructionsSchema)
  .refine(
    (data) =>
      data.ingredientIds?.length === data.ingredientAmounts?.length &&
      data.ingredientIds?.length === data.ingredientNames?.length,
    {
      message: "Ingredient arrays must all be the same length",
      path: ["ingredientIds"],
    },
  );
const createIngredientSchema = z.object({
  newIngredientAmount: z.string().nullable(),
  newIngredientName: z.string().min(1, "Name cannot be blank"),
});

export async function action({ request, params, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const recipeId = params.recipeId;
  const _action = formData.get("_action");
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

  if (typeof _action === "string" && _action.includes("deleteIngredient")) {
    const ingredientId = _action.split(".")[1];
    return handleDelete(() =>
      db.ingredient.delete({ where: { id: ingredientId } }),
    );
  }

  switch (_action) {
    case "saveRecipe": {
      //save recipe
      return validateForm(
        formData,
        saveRecipeSchema,
        ({
          ingredientIds,
          ingredientAmounts,
          ingredientNames,
          ...parsedData
        }) => {
          return db.recipe.update({
            where: { id: recipeId },
            data: {
              ...parsedData,
              ingredients: {
                updateMany: ingredientIds?.map((id, index) => {
                  return {
                    where: { id },
                    data: {
                      amount: ingredientAmounts![index],
                      name: ingredientNames![index]!,
                    },
                  };
                }),
              },
            },
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    case "createIngredient": {
      return validateForm(
        formData,
        createIngredientSchema,
        (parsedData) => {
          return db.ingredient.create({
            data: {
              amount: parsedData.newIngredientAmount ?? "",
              name: parsedData.newIngredientName,
              recipeId,
            },
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    case "deleteRecipe": {
      await handleDelete(() => db.recipe.delete({ where: { id: recipeId } }));
      return redirect("/app/recipes");
    }
    case "saveName": {
      return validateForm(
        formData,
        saveNameSchema,
        (parsedData) => {
          return db.recipe.update({
            where: { id: recipeId },
            data: parsedData,
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    case "saveInstructions": {
      return validateForm(
        formData,
        saveInstructionsSchema,
        (parsedData) => {
          return db.recipe.update({
            where: { id: recipeId },
            data: parsedData,
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    case "saveTotalTime": {
      return validateForm(
        formData,
        saveTotalTimeSchema,
        (parsedData) => {
          return db.recipe.update({
            where: { id: recipeId },
            data: parsedData,
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    case "saveIngredientAmount": {
      return validateForm(
        formData,
        saveIngredientAmountSchema,
        ({ id, amount }) => {
          return db.ingredient.update({
            where: { id },
            data: {
              amount,
            },
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    case "saveIngredientName": {
      return validateForm(
        formData,
        saveIngredientNameSchema,
        ({ id, name }) => {
          return db.ingredient.update({
            where: { id },
            data: {
              name,
            },
          });
        },
        (errors) => {
          return data({ errors }, { status: 400 });
        },
      );
    }
    default: {
      return null;
    }
  }
}

export default function RecipeDetail({
  loaderData: { recipe },
  actionData,
}: Route.ComponentProps) {
  const saveNameFetcher = useFetcher();
  const saveTotalTimeFetcher = useFetcher();
  const saveInstructionsFetcher = useFetcher();
  const createIngredientFetcher = useFetcher<typeof action>();
  const errors =
    actionData && typeof actionData !== "string" && "errors" in actionData
      ? actionData.errors
      : undefined;
  const newIngredientData = createIngredientFetcher.data;
  const newIngredientErrors =
    newIngredientData &&
    typeof newIngredientData !== "string" &&
    "errors" in newIngredientData
      ? newIngredientData.errors
      : undefined;

  const createIngredientFormRef = useRef<HTMLFormElement>(null);

  const saveName = (name: string) =>
    saveNameFetcher.submit({ _action: "saveName", name }, { method: "post" });

  const saveTotal = (totalTime: string) =>
    saveTotalTimeFetcher.submit(
      { _action: "saveTotalTime", totalTime },
      { method: "post" },
    );

  const saveInstructions = (instructions: string) =>
    saveInstructionsFetcher.submit(
      { _action: "saveInstructions", instructions },
      { method: "post" },
    );
  return (
    <>
      <Form method="post" reloadDocument>
        <div className="mb-2">
          <Input
            type="text"
            placeholder="Recipe Name"
            autoComplete="off"
            className="text-2xl font-extrabold"
            name="name"
            defaultValue={recipe?.name}
            key={recipe?.id}
            error={!!(saveNameFetcher?.data?.errors?.name || errors?.name)}
            onChange={(e) => saveName(e.target.value)}
          />
          <ErrorMessage>
            {saveNameFetcher?.data?.errors?.name || errors?.name}
          </ErrorMessage>
        </div>
        <div className="flex">
          <TimeIcon />
          <div className="ml-2 grow">
            <Input
              placeholder="Time"
              type="text"
              autoComplete="off"
              name="totalTime"
              defaultValue={recipe?.totalTime}
              key={recipe?.id}
              error={
                !!(
                  saveTotalTimeFetcher?.data?.errors?.totalTime ||
                  errors?.totalTime
                )
              }
              onChange={(e) => saveTotal(e.target.value)}
            />
            <ErrorMessage>
              {saveTotalTimeFetcher?.data?.errors?.totalTime ||
                errors?.totalTime}
            </ErrorMessage>
          </div>
        </div>
        <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
          <h2 className="font-bold text-sm pb-1">Amount</h2>
          <h2 className="font-bold text-sm pb-1">Name</h2>
          <div></div>
          {recipe?.ingredients.map((ingredient, ind) => (
            <IngredientRow
              key={ingredient.id}
              id={ingredient.id}
              amount={ingredient.amount}
              amountError={errors?.[`ingredientAmounts.${ind}`]}
              nameError={errors?.[`ingredientNames.${ind}`]}
              name={ingredient.name}
            />
          ))}

          <div>
            <Input
              type="text"
              autoComplete="off"
              name="newIngredientAmount"
              className="border-b-gray-200"
              form="create-ingredient"
              error={!!newIngredientErrors?.newIngredientAmount}
            />
            <ErrorMessage>
              {newIngredientErrors?.newIngredientAmount}
            </ErrorMessage>
          </div>
          <div>
            <Input
              type="text"
              autoComplete="off"
              name="newIngredientName"
              className="border-b-gray-200"
              form="create-ingredient"
              error={!!newIngredientErrors?.newIngredientName}
            />
            <ErrorMessage>
              {newIngredientErrors?.newIngredientName}
            </ErrorMessage>
          </div>
          <button
            form="create-ingredient"
            name="_action"
            value="createIngredient"
          >
            <SaveIcon />
          </button>
        </div>
        <label
          className="block font-bold text-sm pb-2 w-fit"
          htmlFor="instructions"
        >
          Instructions
        </label>
        <textarea
          name="instructions"
          key={recipe?.id}
          id="instructions"
          placeholder="Instructions go here"
          defaultValue={recipe?.instructions}
          className={clsx(
            "w-full h-56 rounded-md outline-none",
            "focus:border-2 focus:p-3 focus:border-primary duration-300",
            saveInstructionsFetcher?.data?.errors?.instructions ||
              errors?.instructions
              ? "border-2 border-red-500 p-3"
              : "",
          )}
          onChange={(e) => saveInstructions(e.target.value)}
        />
        <ErrorMessage>
          {saveInstructionsFetcher?.data?.errors?.instructions ||
            errors?.instructions}
        </ErrorMessage>
        <hr className="my-4" />
        <div className="flex justify-between">
          <DeleteButton name="_action" value="deleteRecipe">
            Delete this Recipe
          </DeleteButton>
          <PrimaryButton
            name="_action"
            value="saveRecipe"
            className="flex align-center"
          >
            Save
          </PrimaryButton>
        </div>
      </Form>

      <createIngredientFetcher.Form
        onSubmit={(event) => {
          event.preventDefault();
          createIngredientFetcher.submit(createIngredientFormRef.current, {
            method: "post",
          });
          createIngredientFormRef.current?.reset();
        }}
        method="post"
        id="create-ingredient"
        ref={createIngredientFormRef}
      >
        <input type="hidden" name="_action" value="createIngredient" />
      </createIngredientFetcher.Form>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div className="bg-red-600 text-white rounded-md p-4">
        <h1 className="mb-2">
          {error.status} - {error.statusText}
        </h1>
        <p>{error.data.message}</p>
      </div>
    );
  }
  return (
    <div className="bg-red-600 text-white rounded-md p-4">
      <h1 className="mb-2">An unexpected error occurred.</h1>
    </div>
  );
}

type IngredientRowProps = {
  id: string;
  amount: string | null;
  amountError?: string;
  name: string;
  nameError?: string;
};

function IngredientRow({
  id,
  amount,
  amountError,
  name,
  nameError,
}: IngredientRowProps) {
  const saveAmountFetcher = useFetcher();
  const saveNameFetcher = useFetcher();

  const saveAmount = (amount: string) => {
    return saveAmountFetcher.submit(
      {
        _action: "saveIngredientAmount",
        amount,
        id,
      },
      { method: "POST" },
    );
  };
  const saveName = (name: string) => {
    return saveNameFetcher.submit(
      {
        _action: "saveIngredientName",
        name,
        id,
      },
      { method: "POST" },
    );
  };
  return (
    <React.Fragment>
      <input type="hidden" name="ingredientIds[]" value={id} />
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientAmounts[]"
          defaultValue={amount ?? ""}
          error={
            !!(saveAmountFetcher?.data?.errors?.amountError || amountError)
          }
          onChange={(e) => saveAmount(e.target.value)}
        />
        <ErrorMessage>
          {saveAmountFetcher?.data?.errors?.amountError || amountError}
        </ErrorMessage>
      </div>
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientNames[]"
          defaultValue={name}
          error={!!(saveNameFetcher?.data?.errors?.name || nameError)}
          onChange={(e) => saveName(e.target.value)}
        />
        <ErrorMessage>
          {saveNameFetcher?.data?.errors?.name || nameError}
        </ErrorMessage>
      </div>
      <button name="_action" value={`deleteIngredient.${id}`}>
        <TrashIcon />
      </button>
    </React.Fragment>
  );
}
