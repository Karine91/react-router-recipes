import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export async function handleDelete<T>(deleteFn: () => T){
    try {
    const deleted = await deleteFn();
    return deleted;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return error.message;
      }
    }
    throw error;
  }
}