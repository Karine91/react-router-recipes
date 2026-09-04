import db from "~/db.server";

export function getUser(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function createUser(email: string, firstName: string, lastName: string) {
  return db.user.create({
    data: {
      firstName,
      lastName,
      email,
    },
  });
}

export function getUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}
