import ReactModal from "react-modal";
import React from "react";
import {
  data,
  Form,
  Link,
  redirect,
  type ActionFunctionArgs,
} from "react-router";
import { XIcon } from "~/components/icons/X";
import IconInput from "~/components/forms/IconInput";
import { DeleteButton, PrimaryButton } from "~/components/forms/Button";
import { useRecipeContext } from "../$recipeId";
import { canChangeRecipe } from "../../../../../utils/abilities.server";
import db from "~/db.server";
import z from "zod";
import { getErrors, validateForm } from "../../../../../utils/validation";
import { ErrorMessage } from "~/components/forms/ErrorMessage";
import type { Route } from "./+types/update-meal-plan";

if (typeof window !== "undefined") {
  ReactModal.setAppElement("#root");
}

const updateMealPlanSchema = z.object({
  mealPlanMultiplier: z.preprocess(
    (value) => parseInt(String(value)),
    z.number().min(1),
  ),
});

export async function action({ context, params, request }: ActionFunctionArgs) {
  const recipeId = String(params.recipeId);
  await canChangeRecipe(context, recipeId);

  const formData = await request.formData();
  switch (formData.get("_action")) {
    case "removeFromMealPlan": {
      await db.recipe.update({
        where: { id: recipeId },
        data: { mealPlanMultiplier: null },
      });
      return redirect("..");
    }
    case "updateMealPlan": {
      return validateForm(
        formData,
        updateMealPlanSchema,
        async ({ mealPlanMultiplier }) => {
          await db.recipe.update({
            where: { id: recipeId },
            data: { mealPlanMultiplier },
          });
          return redirect("..");
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

const UpdateMealPlan = ({ actionData }: Route.ComponentProps) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const { recipeName, mealPlanMultiplier } = useRecipeContext();

  const errors = getErrors(actionData);

  React.useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <ReactModal
      isOpen={isOpen}
      className="md:h-fit lg:w-1/2 md:mx-auto md:mt-24"
    >
      <div className="p-4 rounded-md bg-white shadow-md">
        <div className="flex justify-between mb-8">
          <h1 className="text-lg font-bold">Update Meal Plan</h1>
          <Link to=".." replace>
            <XIcon />
          </Link>
        </div>
        <Form method="post" reloadDocument>
          <h2 className="mb-2">{recipeName}</h2>
          <IconInput
            icon={<XIcon />}
            defaultValue={mealPlanMultiplier ?? 1}
            type="number"
            autoComplete="off"
            name="mealPlanMultiplier"
          />
          <ErrorMessage>{errors?.mealPlanMultiplier}</ErrorMessage>
          <div className="flex justify-end gap-4 mt-8">
            {mealPlanMultiplier !== null ? (
              <DeleteButton name="_action" value="removeFromMealPlan">
                Remove from Meal Plan
              </DeleteButton>
            ) : null}
            <PrimaryButton name="_action" value="updateMealPlan">
              Save
            </PrimaryButton>
          </div>
        </Form>
      </div>
    </ReactModal>
  );
};
export default UpdateMealPlan;
