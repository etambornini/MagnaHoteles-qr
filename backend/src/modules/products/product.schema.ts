import { z } from "zod";

const variantSelectionTypeEnum = z.enum(["SINGLE", "MULTIPLE"]);
const attributeTypeEnum = z.enum(["TEXT", "NUMBER", "BOOLEAN", "JSON"]);

const variantOptionSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  priceDelta: z.number().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const variantGroupSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  selectionType: variantSelectionTypeEnum.optional(),
  isRequired: z.boolean().optional(),
  options: z.array(variantOptionSchema).optional(),
});

const attributeValueSchema = z.object({
  attributeId: z.string().cuid(),
  value: z.any(),
});

const customAttributeSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  type: attributeTypeEnum,
  value: z.any(),
  unitOfMeasure: z.string().optional(),
});

const bundleItemSchema = z.object({
  itemProductId: z.string().cuid(),
  quantity: z.number().int().positive().optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const createProductBodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  stock: z.number().int().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  baseUnit: z.string().optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
  variantGroups: z.array(variantGroupSchema).optional(),
  attributeValues: z.array(attributeValueSchema).optional(),
  customAttributes: z.array(customAttributeSchema).optional(),
  bundleItems: z.array(bundleItemSchema).optional(),
});

export const updateProductBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    stock: z.number().int().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    images: z.array(z.string().url()).optional(),
    baseUnit: z.string().optional(),
    categoryIds: z.array(z.string().cuid()).optional(),
    variantGroups: z.array(variantGroupSchema).optional(),
    attributeValues: z.array(attributeValueSchema).optional(),
    customAttributes: z.array(customAttributeSchema).optional(),
    bundleItems: z.array(bundleItemSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  categoryIds: z.string().optional(), // comma separated
  isActive: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  variantOptionId: z.string().cuid().optional(),
  attributes: z.string().optional(), // JSON encoded
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  includeCategories: z.coerce.boolean().optional(),
  includeVariants: z.coerce.boolean().optional(),
  includeAttributes: z.coerce.boolean().optional(),
  includeBundles: z.coerce.boolean().optional(),
});

export const productDetailQuerySchema = z.object({
  includeCategories: z.coerce.boolean().optional(),
  includeVariants: z.coerce.boolean().optional(),
  includeAttributes: z.coerce.boolean().optional(),
  includeBundles: z.coerce.boolean().optional(),
});
