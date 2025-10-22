import { z } from "zod";

const roleEnum = z.enum(["ADMIN", "MANAGER"]);

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      role: roleEnum.default("MANAGER"),
      hotelSlug: z.string().min(2).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === "MANAGER" && !data.hotelSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hotelSlug"],
          message: "hotelSlug is required for MANAGER role",
        });
      }
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});
