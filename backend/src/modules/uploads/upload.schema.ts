import { z } from "zod";

export const uploadImageBodySchema = z
  .object({
    type: z.enum(["qr", "category", "product"]),
    categoryKey: z.string().min(1).optional(),
    productSlug: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "category" && !data.categoryKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryKey"],
        message: "categoryKey is required when type is category",
      });
    }
    if (data.type === "product" && !data.productSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productSlug"],
        message: "productSlug is required when type is product",
      });
    }
  });

export type UploadImageBody = z.infer<typeof uploadImageBodySchema>;
