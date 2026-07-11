import clsx from "clsx";
import { useLoaderData } from "react-router";
import { getAllShelves } from "~/models/pantry-shelf.server";

export async function loader() {
  const shelves = await getAllShelves();
  return { shelves };
}

const Pantry = () => {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <ul
        className={clsx(
          "flex gap-8 overflow-x-auto",
          "snap-x snap-mandatory md:snap-none",
        )}
      >
        {data.shelves.map((shelf) => (
          <li
            className={clsx(
              "border-2 border-primary rounded-md p-4 h-fit",
              "w-[calc(100vw-2rem)] flex-none snap-center",
              "md:w-96",
            )}
            key={shelf.id}
          >
            <h1 className="font-extrabold text-2xl mb-2">{shelf.name}</h1>
            <ul>
              {shelf.items.map((item) => (
                <li className="py-2" key={item.id}>
                  {item.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pantry;
