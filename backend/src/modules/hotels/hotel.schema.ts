import { z } from "zod";

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
);

const urlOrRelativePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      try {
        // Accept absolute HTTP/HTTPS URLs
        const parsed = new URL(value);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return true;
        }
      } catch {
        // ignore parsing failure, might be relative path
      }
      // Accept relative paths that start with a slash (e.g. /uploads/...)
      return value.startsWith("/");
    },
    { message: "Debe ser una URL válida o una ruta relativa que comience con '/'." },
  );

export const hotelIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const createHotelBodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  timeZone: z.string().optional(),
  imgQr: urlOrRelativePathSchema.nullable().optional(),
  metadata: jsonSchema.optional(),
});

export const updateHotelBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    timeZone: z.string().optional(),
    imgQr: urlOrRelativePathSchema.nullable().optional(),
    metadata: jsonSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const hotelListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});
