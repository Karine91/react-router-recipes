import { z } from "zod";
type FieldErrors = Record<string, string>;

export function validateForm<T, Success, Error>(
  formData: FormData,
  zodSchema: z.Schema<T>,
  successFn: (data: T) => Success,
  errorFn: (errors: FieldErrors) => Error,
): Success | Error {
  const result = zodSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    const errors: FieldErrors = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    });
    return errorFn(errors);
  }
  return successFn(result.data);
}
