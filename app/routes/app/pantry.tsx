import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import {
  data,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
} from "react-router";
import z from "zod";
import { DeleteButton, PrimaryButton } from "~/components/forms/Button";
import { ErrorMessage } from "~/components/forms/ErrorMessage";
import SearchBar from "~/components/forms/SearchBar";
import { PlusIcon } from "~/components/icons/Plus";
import { SaveIcon } from "~/components/icons/Save";
import { TrashIcon } from "~/components/icons/Trash";
import { userContext } from "~/middleware/auth";
import {
  createShelfItem,
  deleteShelfItem,
  getShelfItem,
} from "~/models/pantry-item.server";
import {
  createShelf,
  deleteShelf,
  getAllShelves,
  getShelf,
  saveShelfName,
} from "~/models/pantry-shelf.server";
import { useIsHydrated, useServerLayoutEffect } from "../../../utils/misc";
import { validateForm } from "../../../utils/validation";
import type { Route } from "./+types";
import Input from "~/components/forms/Input";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const user = context.get(userContext);

  const shelves = await getAllShelves(user.id, q);
  return { shelves };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

const saveShelfNameSchema = z.object({
  shelfId: z.string(),
  shelfName: z.string().min(1, "Shelf name cannot be blank."),
});

const deleteShelfSchema = z.object({
  shelfId: z.string(),
});

const createShelfItemSchema = z.object({
  shelfId: z.string(),
  itemName: z.string().min(1, "Item name cannot be blank"),
});

const deleteShelfItemSchema = z.object({
  itemId: z.string(),
});

export const action = async ({ request, context }: Route.ActionArgs) => {
  const user = context.get(userContext);
  const formData = await request.formData();
  switch (formData.get("_action")) {
    case "createShelf":
      return createShelf(user.id);
    case "deleteShelf": {
      return validateForm(
        formData,
        deleteShelfSchema,
        async (parsedData) => {
          const shelf = await getShelf(parsedData.shelfId);
          if (shelf && shelf.userId !== user.id) {
            throw data(
              {
                message: "This shelf is not yours, so you cannot delete it.",
              },
              { status: 401 },
            );
          }
          return deleteShelf(parsedData.shelfId);
        },
        (errors) => data({ errors }, { status: 400 }),
      );
    }
    case "saveShelfName": {
      return validateForm(
        formData,
        saveShelfNameSchema,
        async (parsedData) => {
          const shelf = await getShelf(parsedData.shelfId);
          if (shelf && shelf.userId !== user.id) {
            throw data(
              {
                message: "This shelf is not yours, so you cannot change it.",
              },
              { status: 401 },
            );
          }
          return saveShelfName(parsedData.shelfId, parsedData.shelfName);
        },
        (errors) => data({ errors }, { status: 400 }),
      );
    }
    case "createShelfItem": {
      return validateForm(
        formData,
        createShelfItemSchema,
        (data) => createShelfItem(user.id, data.shelfId, data.itemName),
        (errors) => data({ errors }, { status: 400 }),
      );
    }
    case "deleteShelfItem": {
      return validateForm(
        formData,
        deleteShelfItemSchema,
        async (parsedData) => {
          const item = await getShelfItem(parsedData.itemId);
          if (item && item.userId !== user.id) {
            throw data(
              {
                message:
                  "This shelf item is not yours, so you cannot delete it.",
              },
              { status: 401 },
            );
          }
          return deleteShelfItem(parsedData.itemId);
        },
        (errors) => data({ errors }, { status: 400 }),
      );
    }
    default:
      return null;
  }
};

const Pantry = () => {
  const data = useLoaderData<typeof loader>();
  const createShelfFetcher = useFetcher();

  const containerRef = useRef<HTMLUListElement>(null);

  const isCreatingShelf =
    createShelfFetcher.formData?.get("_action") === "createShelf";

  useEffect(() => {
    if (!isCreatingShelf && containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [isCreatingShelf]);

  return (
    <div>
      <SearchBar className="md:w-80" placeholder="Search Shelves..." />
      <createShelfFetcher.Form method="post">
        <PrimaryButton
          name="_action"
          value="createShelf"
          className="mt-4 w-full md:w-fit"
          isLoading={isCreatingShelf}
        >
          <PlusIcon />
          <span className="pl-2">
            {isCreatingShelf ? "Creating Shelf" : "Create Shelf"}
          </span>
        </PrimaryButton>
      </createShelfFetcher.Form>
      <ul
        className={clsx(
          "flex gap-8 overflow-x-auto mt-4 pb-4",
          "snap-x snap-mandatory md:snap-none",
        )}
        ref={containerRef}
      >
        {data.shelves.map((shelf) => {
          return <Shelf key={shelf.id} shelf={shelf} />;
        })}
      </ul>
    </div>
  );
};

type ShelfProps = {
  shelf: LoaderData["shelves"][number];
};

function Shelf({ shelf }: ShelfProps) {
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();
  const createShelfItemFetcher = useFetcher();

  const createItemFormRef = useRef<HTMLFormElement>(null);

  const { renderedItems, addItem } = useOptimisticItems(
    shelf.items,
    createShelfItemFetcher.state,
  );

  const isDeletingShelf =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;

  const isHydrated = useIsHydrated();

  return isDeletingShelf ? null : (
    <li
      className={clsx(
        "border-2 border-primary rounded-md p-4 h-fit",
        "w-[calc(100vw-2rem)] flex-none snap-center",
        "md:w-96",
      )}
    >
      <saveShelfNameFetcher.Form method="post" className="flex">
        <div className="w-full mb-2 peer">
          <Input
            type="text"
            required
            error={saveShelfNameFetcher.data?.errors?.shelfName}
            className={"text-2xl font-extrabold"}
            defaultValue={shelf.name}
            name="shelfName"
            placeholder="Shelf name"
            autoComplete="off"
            onChange={(event) =>
              event.target.value &&
              saveShelfNameFetcher.submit(
                {
                  _action: "saveShelfName",
                  shelfName: event.target.value,
                  shelfId: shelf.id,
                },
                { method: "post" },
              )
            }
          />
          <ErrorMessage>
            {saveShelfNameFetcher.data?.errors?.shelfName}
          </ErrorMessage>
        </div>
        {isHydrated ? null : (
          <button
            name="_action"
            value="saveShelfName"
            className={clsx(
              "ml-4 opacity-0 hover:opacity-100 focus:opacity-100",
              "peer-focus-within:opacity-100",
            )}
          >
            <SaveIcon />
          </button>
        )}
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {saveShelfNameFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </saveShelfNameFetcher.Form>
      <createShelfItemFetcher.Form
        method="post"
        className="flex py-2"
        onSubmit={(event) => {
          const target = event.target;
          const itemNameInput = target.elements.namedItem(
            "itemName",
          ) as HTMLInputElement;
          addItem(itemNameInput.value);
          event.preventDefault();
          createShelfItemFetcher.submit(
            {
              itemName: itemNameInput.value,
              shelfId: shelf.id,
              _action: "createShelfItem",
            },
            { method: "POST" },
          );
          createItemFormRef.current?.reset();
        }}
        ref={createItemFormRef}
      >
        <div className="w-full mb-2 peer">
          <input
            required
            type="text"
            className={clsx(
              "w-full outline-none",
              "border-b-2 focus:border-b-primary border-b-background",
              createShelfItemFetcher.data?.errors?.itemName
                ? "border-b-red-600"
                : "",
            )}
            name="itemName"
            placeholder="New Item"
            autoComplete="off"
          />{" "}
          <ErrorMessage>
            {createShelfItemFetcher.data?.errors?.itemName}
          </ErrorMessage>
        </div>
        <button
          name="_action"
          value="createShelfItem"
          className={clsx(
            "ml-4 opacity-0 hover:opacity-100 focus:opacity-100",
            "peer-focus-within:opacity-100",
          )}
        >
          <SaveIcon />
        </button>
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {createShelfItemFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </createShelfItemFetcher.Form>
      <ul>
        {renderedItems.map((item) => (
          <ShelfItem key={item.id} shelfItem={item} />
        ))}
      </ul>
      <deleteShelfFetcher.Form
        method="post"
        className="pt-8"
        onSubmit={(event) => {
          if (!confirm("Are you sure you want to delete this shelf?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pb-2">
          {deleteShelfFetcher.data?.errors?.shelfId}
        </ErrorMessage>
        <DeleteButton
          className="w-full"
          name="_action"
          value="deleteShelf"
          isLoading={isDeletingShelf}
        >
          Delete Shelf
        </DeleteButton>
      </deleteShelfFetcher.Form>
    </li>
  );
}

type ShelfItemProps = {
  shelfItem: RenderedItem;
};

function ShelfItem({ shelfItem }: ShelfItemProps) {
  const deleteShelfItemFetcher = useFetcher();
  const isDeletingItem = !!deleteShelfItemFetcher.formData;
  return (
    !isDeletingItem && (
      <li className="py-2">
        <deleteShelfItemFetcher.Form method="post" className="flex">
          <p className="w-full">{shelfItem.name}</p>
          {!shelfItem.isOptimistic && (
            <button name="_action" value="deleteShelfItem">
              <TrashIcon />
            </button>
          )}
          <input type="hidden" name="itemId" value={shelfItem.id} />
          <ErrorMessage className="pl-2">
            {deleteShelfItemFetcher.data?.errors?.itemId}
          </ErrorMessage>
        </deleteShelfItemFetcher.Form>
      </li>
    )
  );
}

type RenderedItem = {
  id: string;
  name: string;
  isOptimistic?: boolean;
};

function useOptimisticItems(
  savedItems: RenderedItem[],
  createShelfItemsState: "idle" | "submitting" | "loading",
) {
  const [optimisticItems, setOptimisticItems] = useState<RenderedItem[]>([]);

  const renderedItems = [...optimisticItems, ...savedItems];

  renderedItems.sort((a, b) => {
    if (a.name === b.name) return 0;
    return a.name < b.name ? -1 : 1;
  });

  useServerLayoutEffect(() => {
    if (createShelfItemsState === "idle") {
      setOptimisticItems([]);
    }
  }, [createShelfItemsState]);

  const addItem = (name: string) => {
    setOptimisticItems((items) => [
      ...items,
      { name, id: createItemId(), isOptimistic: true },
    ]);
  };

  return {
    renderedItems,
    addItem,
  };
}

function createItemId() {
  return `${Math.round(Math.random() * 1_000_000)}`;
}

export default Pantry;

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
