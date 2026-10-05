import { createFsFileStorage } from "@remix-run/file-storage/fs";

export const fileStorage = createFsFileStorage("./uploads/recipe-images");

export function getStorageKey(recipeId: string) {
  return `recipe-image-${recipeId}`;
}
