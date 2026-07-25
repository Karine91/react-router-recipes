import clsx from "clsx";
import {
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
  Form,
  useNavigation,
  type ActionFunction,
  type ActionFunctionArgs,
  useFetcher,
} from "react-router";
import { PlusIcon } from "~/components/icons/Plus";
import { SearchIcon } from "~/components/icons/Search";
import {
  createShelf,
  deleteShelf,
  getAllShelves,
  saveShelfName,
} from "~/models/pantry-shelf.server";
import { DeleteButton, PrimaryButton } from "~/components/forms/Button";
import { useEffect, useRef } from "react";
import { SaveIcon } from "~/components/icons/Save";
import z from "zod";
import { validateForm } from "../../../utils/validation";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const shelves = await getAllShelves(q);
  return { shelves };
}

const saveShelfNameSchema = z.object({
  shelfId: z.string(),
  shelfName: z.string().min(1),
});

const deleteShelfSchema = z.object({
  id: z.string(),
});

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  switch (formData.get("_action")) {
    case "createShelf":
      return createShelf();
    case "deleteShelf": {
      return validateForm(
        formData,
        deleteShelfSchema,
        (data) => deleteShelf(data.id),
        (errors) => ({ errors }),
      );
    }
    case "saveShelfName": {
      validateForm(
        formData,
        saveShelfNameSchema,
        (data) => saveShelfName(data.shelfId, data.shelfName),
        (errors) => ({ errors }),
      );
    }
    default:
      return null;
  }
};

const Pantry = () => {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const createShelfFetcher = useFetcher();

  const containerRef = useRef<HTMLUListElement>(null);

  const isSearching = navigation.formData?.has("q");
  const isCreatingShelf =
    createShelfFetcher.formData?.get("_action") === "createShelf";

  useEffect(() => {
    if (!isCreatingShelf && containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [isCreatingShelf]);

  return (
    <div>
      <createShelfFetcher.Form
        className={clsx(
          "flex border-2 border-gray-300 rounded-md",
          "focus-within:border-primary md:w-80",
          isSearching && "animate-pulse",
        )}
      >
        <button type="submit" className="px-2 mr-1">
          <SearchIcon />
        </button>
        <input
          type="text"
          name="q"
          defaultValue={searchParams.get("q") || ""}
          autoComplete="off"
          placeholder="Search Shelves..."
          className="w-full py-3 px-2 outline-none"
        />
      </createShelfFetcher.Form>
      <Form method="post">
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
      </Form>
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
  shelf: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
    }[];
  };
};

function Shelf({ shelf }: ShelfProps) {
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();

  const isDeletingShelf =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;

  return (
    <li
      className={clsx(
        "border-2 border-primary rounded-md p-4 h-fit",
        "w-[calc(100vw-2rem)] flex-none snap-center",
        "md:w-96",
      )}
    >
      <saveShelfNameFetcher.Form method="post" reloadDocument className="flex">
        <input
          type="text"
          className={clsx(
            "text-2xl font-extrabold mb-2 w-full outline-none",
            "border-b-2 focus:border-b-primary border-b-background",
          )}
          defaultValue={shelf.name}
          name="shelfName"
          placeholder="Shelf name"
          autoComplete="off"
        />
        <button name="_action" value="saveShelfName" className="ml-4">
          <SaveIcon />
        </button>
        <input type="hidden" name="shelfId" value={shelf.id} />
      </saveShelfNameFetcher.Form>
      <ul>
        {shelf.items.map((item) => (
          <li className="py-2" key={item.id}>
            {item.name}
          </li>
        ))}
      </ul>
      <deleteShelfFetcher.Form method="post" className="pt-8">
        <input type="hidden" name="shelfId" value={shelf.id} />
        <DeleteButton
          className="w-full"
          name="_action"
          value="deleteShelf"
          isLoading={isDeletingShelf}
        >
          {isDeletingShelf ? "Deleting Shelf" : "Delete Shelf"}
        </DeleteButton>
      </deleteShelfFetcher.Form>
    </li>
  );
}

export default Pantry;
