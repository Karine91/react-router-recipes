import db from "../db.server";

function getShelves() {
  return [
    {
      name: "Dairy",
      items: {
        create: [{ name: "Milk" }, { name: "Eggs" }, { name: "Cheese" }],
      },
    },
    {
      name: "Fruits",
      items: {
        create: [{ name: "Apple" }, { name: "Banana" }, { name: "Oranges" }],
      },
    },
  ];
}

async function seed() {
  await Promise.all(
    getShelves().map((shelf) => db.pantryShelf.create({ data: shelf })),
  );
}

seed();
