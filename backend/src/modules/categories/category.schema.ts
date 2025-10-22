import { z } from "zod";

const attributeTypeEnum = z.enum(["TEXT", "NUMBER", "BOOLEAN", "JSON"]);

export const categoryIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const categoryAttributeIdParamSchema = z.object({
  attributeId: z.string().cuid(),
});

export const categoryAttributeOptionIdParamSchema = z.object({
  optionId: z.string().cuid(),
});

const attributeOptionBodySchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export const createCategoryBodySchema = z.object({
  name: z.string().min(2),
  key: z.string().min(2),
  description: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  parentId: z.string().cuid().nullable().optional(),
  attributes: z
    .array(
      z.object({
        name: z.string().min(1),
        key: z.string().min(1),
        type: attributeTypeEnum,
        isRequired: z.boolean().optional(),
        unitOfMeasure: z.string().optional(),
        options: z.array(attributeOptionBodySchema).optional(),
      }),
    )
    .optional(),
});

export const updateCategoryBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    key: z.string().min(2).optional(),
    description: z.string().nullable().optional(),
    unitOfMeasure: z.string().nullable().optional(),
    parentId: z.string().cuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const categoryListQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.string().cuid().optional(),
  includeChildren: z.coerce.boolean().optional(),
  includeAttributes: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const categoryDetailQuerySchema = z.object({
  includeChildren: z.coerce.boolean().optional(),
  includeAttributes: z.coerce.boolean().optional(),
});

export const createCategoryAttributeBodySchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  type: attributeTypeEnum,
  isRequired: z.boolean().optional(),
  unitOfMeasure: z.string().optional(),
  options: z.array(attributeOptionBodySchema).optional(),
});

export const updateCategoryAttributeBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    type: attributeTypeEnum.optional(),
    isRequired: z.boolean().optional(),
    unitOfMeasure: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const createAttributeOptionBodySchema = attributeOptionBodySchema;

export const updateAttributeOptionBodySchema = z
  .object({
    label: z.string().min(1).optional(),
    value: z.string().min(1).optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
