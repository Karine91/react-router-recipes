import db from "~/db.server";
import type { Route } from "./+types/$recipeId";
import {
  data,
  Form,
  isRouteErrorResponse,
  Outlet,
  redirect,
  useFetcher,
} from "react-router";
import Input from "~/components/forms/Input";
import { ErrorMessage } from "~/components/forms/ErrorMessage";
import { TimeIcon } from "~/components/icons/Time";
import React, { useRef, useState } from "react";
import { TrashIcon } from "~/components/icons/Trash";
import clsx from "clsx";
import { DeleteButton, PrimaryButton } from "~/components/forms/Button";
import z from "zod";
import { getErrors, validateForm } from "../../../../utils/validation";
import { SaveIcon } from "~/components/icons/Save";
import { handleDelete } from "~/models/utils";
import { userContext } from "~/middleware/auth";
import {
  useDebouncedFunction,
  useServerLayoutEffect,
} from "../../../../utils/misc";
import {
  useSaveRecipeNameFetcher,
  useSaveRecipeTotalTimeFetcher,
} from "../../../../utils/hooks";

import { type FileUpload, parseFormData } from "@remix-run/form-data-parser";
import { fileStorage, getStorageKey } from "~/recipe-image-storage.server";

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
  const recipeId = params.recipeId;
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

  const uploadHandler = async (fileUpload: FileUpload) => {
    if (
      fileUpload.fieldName === "image" &&
      fileUpload.type.startsWith("image/")
    ) {
      let storageKey = getStorageKey(recipeId);

      // FileUpload objects are not meant to stick around for very long (they are
      // streaming data from the request.body); store them as soon as possible.
      await fileStorage.set(storageKey, fileUpload);

      // A LazyFile can't be put into FormData, so store the key instead.
      return storageKey;
    }
  };

  const formData = await parseFormData(request, uploadHandler);
  // uploadHandler returns the storage key only when an image was saved
  const image = formData.get("image");
  if (typeof image === "string") {
    await db.recipe.update({
      where: { id: recipeId },
      data: { imageUrl: `/recipes/${recipeId}/image` },
    });
  }
  const _action = formData.get("_action");

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
  params,
}: Route.ComponentProps) {
  const saveNameFetcher = useSaveRecipeNameFetcher<typeof action>(
    params.recipeId,
  );
  const saveTotalTimeFetcher = useSaveRecipeTotalTimeFetcher<typeof action>(
    params.recipeId,
  );
  const saveInstructionsFetcher = useFetcher<typeof action>();
  const createIngredientFetcher = useFetcher<typeof action>();

  const errors = getErrors(actionData);
  const saveNameErrors = getErrors(saveNameFetcher.data);
  const saveTotalTimeErrors = getErrors(saveTotalTimeFetcher.data);
  const saveInstructionsErrors = getErrors(saveInstructionsFetcher.data);
  const newIngredientErrors = getErrors(createIngredientFetcher.data);

  const newIngredientAmountRef = useRef<HTMLInputElement>(null);

  const { renderedIngredients, addIngredient } = useOptimisticIngredients(
    recipe.ingredients,
    createIngredientFetcher.state,
  );

  const saveName = useDebouncedFunction(
    (name: string) =>
      saveNameFetcher.submit(
        { _action: "saveName", name },
        { method: "post", action: `app/recipes/${recipe.id}` },
      ),
    1000,
  );

  const saveTotal = useDebouncedFunction(
    (totalTime: string) =>
      saveTotalTimeFetcher.submit(
        { _action: "saveTotalTime", totalTime },
        { method: "post", action: `app/recipes/${recipe.id}` },
      ),
    1000,
  );

  const saveInstructions = useDebouncedFunction(
    (instructions: string) =>
      saveInstructionsFetcher.submit(
        { _action: "saveInstructions", instructions },
        { method: "post", action: `app/recipes/${recipe.id}` },
      ),
    1000,
  );

  const [createIngredientForm, setCreateIngredientForm] = useState({
    name: "",
    amount: "",
  });

  const createIngredient = () => {
    addIngredient(createIngredientForm.name, createIngredientForm.amount);
    createIngredientFetcher.submit(
      {
        _action: "createIngredient",
        newIngredientName: createIngredientForm.name,
        newIngredientAmount: createIngredientForm.amount,
      },
      { method: "post" },
    );
    setCreateIngredientForm({ name: "", amount: "" });
    newIngredientAmountRef.current?.focus();
  };

  return (
    <>
      <Outlet />
      <Form method="post" reloadDocument encType="multipart/form-data">
        <button name="_action" value="saveRecipe" className="hidden" />
        <div className="mb-2">
          <Input
            type="text"
            placeholder="Recipe Name"
            autoComplete="off"
            className="text-2xl font-extrabold"
            name="name"
            defaultValue={recipe?.name}
            key={recipe?.id}
            error={!!(saveNameErrors?.name || errors?.name)}
            onChange={(e) => saveName(e.target.value)}
          />
          <ErrorMessage>{saveNameErrors?.name || errors?.name}</ErrorMessage>
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
              error={!!(saveTotalTimeErrors?.totalTime || errors?.totalTime)}
              onChange={(e) => saveTotal(e.target.value)}
            />
            <ErrorMessage>
              {saveTotalTimeErrors?.totalTime || errors?.totalTime}
            </ErrorMessage>
          </div>
        </div>
        <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
          <h2 className="font-bold text-sm pb-1">Amount</h2>
          <h2 className="font-bold text-sm pb-1">Name</h2>
          <div></div>
          {renderedIngredients.map((ingredient, ind) => (
            <IngredientRow
              key={ingredient.id}
              id={ingredient.id}
              amount={ingredient.amount}
              amountError={errors?.[`ingredientAmounts.${ind}`]}
              nameError={errors?.[`ingredientNames.${ind}`]}
              name={ingredient.name}
              recipeId={recipe.id}
              isOptimistic={ingredient.isOptimistic}
            />
          ))}

          <div>
            <Input
              ref={newIngredientAmountRef}
              type="text"
              autoComplete="off"
              name="newIngredientAmount"
              className="border-b-gray-200"
              value={createIngredientForm.amount}
              onChange={(e) =>
                setCreateIngredientForm((values) => ({
                  ...values,
                  amount: e.target.value,
                }))
              }
              error={
                !!(
                  newIngredientErrors?.newIngredientAmount ||
                  errors?.newIngredientAmount
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createIngredient();
                }
              }}
            />
            <ErrorMessage>
              {newIngredientErrors?.newIngredientAmount ||
                errors?.newIngredientAmount}
            </ErrorMessage>
          </div>
          <div>
            <Input
              type="text"
              autoComplete="off"
              name="newIngredientName"
              className="border-b-gray-200"
              value={createIngredientForm.name}
              onChange={(e) =>
                setCreateIngredientForm((values) => ({
                  ...values,
                  name: e.target.value,
                }))
              }
              error={
                !!(
                  newIngredientErrors?.newIngredientName ||
                  errors?.newIngredientName
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createIngredient();
                }
              }}
            />
            <ErrorMessage>
              {newIngredientErrors?.newIngredientName ||
                errors?.newIngredientName}
            </ErrorMessage>
          </div>
          <button
            name="_action"
            value="createIngredient"
            onClick={(e) => {
              e.preventDefault();
              createIngredient();
            }}
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
            saveInstructionsErrors?.instructions || errors?.instructions
              ? "border-2 border-red-500 p-3"
              : "",
          )}
          onChange={(e) => saveInstructions(e.target.value)}
        />
        <ErrorMessage>
          {saveInstructionsErrors?.instructions || errors?.instructions}
        </ErrorMessage>
        <label
          htmlFor="image"
          className="block font-bold text-sm pb-2 w-fit mt-4"
        >
          Image
        </label>
        <input
          id="image"
          type="file"
          name="image"
          key={`${recipe?.id}.image`}
        />
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
  recipeId: string;
  isOptimistic?: boolean;
};

function IngredientRow({
  id,
  amount,
  amountError,
  name,
  nameError,
  recipeId,
  isOptimistic,
}: IngredientRowProps) {
  const saveAmountFetcher = useFetcher<typeof action>();
  const saveNameFetcher = useFetcher<typeof action>();
  const deleteIngredientFetcher = useFetcher<typeof action>();

  const saveAmountErrors = getErrors(saveAmountFetcher.data);
  const saveNameErrors = getErrors(saveNameFetcher.data);

  const saveAmount = useDebouncedFunction((amount: string) => {
    return saveAmountFetcher.submit(
      {
        _action: "saveIngredientAmount",
        amount,
        id,
      },
      { method: "POST", action: `app/recipes/${recipeId}` },
    );
  }, 1000);
  const saveName = useDebouncedFunction((name: string) => {
    return saveNameFetcher.submit(
      {
        _action: "saveIngredientName",
        name,
        id,
      },
      { method: "POST", action: `app/recipes/${recipeId}` },
    );
  }, 1000);

  return deleteIngredientFetcher.state !== "idle" ? null : (
    <React.Fragment>
      <input type="hidden" name="ingredientIds[]" value={id} />
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientAmounts[]"
          defaultValue={amount ?? ""}
          error={!!(saveAmountErrors?.amount || amountError)}
          onChange={(e) => saveAmount(e.target.value)}
          disabled={isOptimistic}
        />
        <ErrorMessage>{saveAmountErrors?.amount || amountError}</ErrorMessage>
      </div>
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientNames[]"
          defaultValue={name}
          error={!!(saveNameErrors?.name || nameError)}
          onChange={(e) => saveName(e.target.value)}
          disabled={isOptimistic}
        />
        <ErrorMessage>{saveNameErrors?.name || nameError}</ErrorMessage>
      </div>
      <button
        name="_action"
        value={`deleteIngredient.${id}`}
        onClick={(e) => {
          e.preventDefault();
          deleteIngredientFetcher.submit(
            {
              _action: `deleteIngredient.${id}`,
            },
            { method: "post" },
          );
        }}
      >
        <TrashIcon />
      </button>
    </React.Fragment>
  );
}

type RenderedIngredient = {
  id: string;
  name: string;
  amount: string | null;
  isOptimistic?: boolean;
};

function useOptimisticIngredients(
  savedIngredients: RenderedIngredient[],
  createIngredientsState: "idle" | "submitting" | "loading",
) {
  const [optimisticIngredients, setOptimisticIngredients] = useState<
    RenderedIngredient[]
  >([]);

  const renderedIngredients = [...savedIngredients, ...optimisticIngredients];

  useServerLayoutEffect(() => {
    if (createIngredientsState === "idle") {
      setOptimisticIngredients([]);
    }
  }, [createIngredientsState]);

  const addIngredient = (name: string, amount: string | null) => {
    setOptimisticIngredients((ingredients) => [
      ...ingredients,
      { name, id: createIngredientId(), isOptimistic: true, amount },
    ]);
  };

  return {
    renderedIngredients,
    addIngredient,
  };
}

function createIngredientId() {
  return `${Math.round(Math.random() * 1_000_000)}`;
}
