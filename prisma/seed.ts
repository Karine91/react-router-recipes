import db from "../db.server";

function createUser() {
  return db.user.create({
    data: {
      email: "me@example.com",
      firstName: "Karine",
      lastName: "H",
    },
  });
}

function getShelves(userId: string) {
  return [
    {
      userId,
      name: "Dairy",
      items: {
        create: [
          { name: "Milk", userId },
          { name: "Eggs", userId },
          { name: "Cheese", userId },
        ],
      },
    },
    {
      userId,
      name: "Fruits",
      items: {
        create: [
          { name: "Apple", userId },
          { name: "Banana", userId },
          { name: "Oranges", userId },
        ],
      },
    },
  ];
}

async function seed() {
  const user = await createUser();
  await Promise.all(
    getShelves(user.id).map((shelf) => db.pantryShelf.create({ data: shelf })),
  );
}

seed();
