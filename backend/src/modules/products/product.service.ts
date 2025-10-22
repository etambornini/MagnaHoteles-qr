import { Prisma, AttributeDataType, VariantSelectionType } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { AppError } from "../common/errors";
import { resolvePagination } from "../common/pagination";

type VariantGroupInput = {
  name: string;
  key: string;
  selectionType?: VariantSelectionType;
  isRequired?: boolean;
  options?: Array<{
    name: string;
    value: string;
    priceDelta?: number;
    isAvailable?: boolean;
    sortOrder?: number;
  }>;
};

type AttributeValueInput = {
  attributeId: string;
  value: unknown;
};

type CustomAttributeInput = {
  name: string;
  key: string;
  type: AttributeDataType;
  value: unknown;
  unitOfMeasure?: string;
};

type BundleItemInput = {
  itemProductId: string;
  quantity?: number;
};

type CreateProductInput = {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  stock?: number;
  price?: number;
  images?: string[];
  baseUnit?: string;
  categoryIds?: string[];
  variantGroups?: VariantGroupInput[];
  attributeValues?: AttributeValueInput[];
  customAttributes?: CustomAttributeInput[];
  bundleItems?: BundleItemInput[];
};

type UpdateProductInput = Partial<CreateProductInput>;

type ProductIncludeOptions = {
  includeCategories?: boolean;
  includeVariants?: boolean;
  includeAttributes?: boolean;
  includeBundles?: boolean;
};

type JsonInput = Prisma.InputJsonValue | Prisma.JsonNullValueInput;

const toJsonInput = (value: unknown): JsonInput => {
  if (value === null) {
    return Prisma.JsonNull;
  }
  if (value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};

const ensureCategoriesBelongToHotel = async (hotelId: string, categoryIds: string[]) => {
  if (!categoryIds.length) {
    return;
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, hotelId },
    select: { id: true },
  });

  if (categories.length !== categoryIds.length) {
    throw new AppError("Some categories do not belong to this hotel", 400);
  }
};

const ensureAttributeDefinitionsBelongToHotel = async (
  hotelId: string,
  attributeValues: AttributeValueInput[],
) => {
  if (!attributeValues.length) {
    return;
  }

  const definitions = await prisma.categoryAttributeDefinition.findMany({
    where: {
      id: { in: attributeValues.map((attr) => attr.attributeId) },
      category: { hotelId },
    },
    select: { id: true },
  });

  if (definitions.length !== attributeValues.length) {
    throw new AppError("Some attribute definitions do not belong to this hotel", 400);
  }
};

const ensureBundleItemsBelongToHotel = async (hotelId: string, bundleItems: BundleItemInput[]) => {
  if (!bundleItems.length) {
    return;
  }

  const items = await prisma.product.findMany({
    where: { id: { in: bundleItems.map((item) => item.itemProductId) }, hotelId },
    select: { id: true },
  });

  if (items.length !== bundleItems.length) {
    throw new AppError("Some bundle products do not belong to this hotel", 400);
  }
};

const toDecimal = (value?: number) => {
  if (value === undefined) {
    return undefined;
  }

  return value.toString();
};

const buildProductInclude = (options: ProductIncludeOptions) => ({
  categories: options.includeCategories
    ? {
        include: {
          category: true,
        },
      }
    : false,
  variantGroups: options.includeVariants
    ? {
        include: {
          options: true,
        },
      }
    : false,
  attributeValues: options.includeAttributes
    ? {
        include: {
          attribute: {
            include: {
              category: true,
            },
          },
        },
      }
    : false,
  customAttributes: options.includeAttributes ? true : false,
  bundleItems: options.includeBundles
    ? {
        include: {
          item: true,
        },
      }
    : false,
  bundles: options.includeBundles
    ? {
        include: {
          parent: true,
        },
      }
    : false,
});

const ensureProductBelongsToHotel = async (productId: string, hotelId: string) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, hotelId },
    select: { id: true },
  });

  if (!product) {
    throw new AppError("Product not found for this hotel", 404);
  }

  return product;
};

export const createProduct = async (hotelId: string, data: CreateProductInput, includeOptions: ProductIncludeOptions) => {
  await ensureCategoriesBelongToHotel(hotelId, data.categoryIds ?? []);
  await ensureAttributeDefinitionsBelongToHotel(hotelId, data.attributeValues ?? []);
  await ensureBundleItemsBelongToHotel(hotelId, data.bundleItems ?? []);

  const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.product.create({
      data: {
        hotelId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive ?? true,
        stock: data.stock ?? 0,
        price: toDecimal(data.price),
        images: toJsonInput(data.images ?? []),
        baseUnit: data.baseUnit,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        variantGroups: data.variantGroups
          ? {
              create: data.variantGroups.map((group) => ({
                name: group.name,
                key: group.key,
                selectionType: group.selectionType ?? "SINGLE",
                isRequired: group.isRequired ?? false,
                options: group.options
                  ? {
                      create: group.options.map((option) => ({
                        name: option.name,
                        value: option.value,
                        priceDelta: toDecimal(option.priceDelta),
                        isAvailable: option.isAvailable ?? true,
                        sortOrder: option.sortOrder ?? 0,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
        attributeValues: data.attributeValues
          ? {
              create: data.attributeValues.map((attribute) => ({
                attribute: { connect: { id: attribute.attributeId } },
                value: toJsonInput(attribute.value),
              })),
            }
          : undefined,
        customAttributes: data.customAttributes
          ? {
              create: data.customAttributes.map((attribute) => ({
                name: attribute.name,
                key: attribute.key,
                type: attribute.type,
                value: toJsonInput(attribute.value),
                unitOfMeasure: attribute.unitOfMeasure,
              })),
            }
          : undefined,
        bundleItems: data.bundleItems
          ? {
              create: data.bundleItems.map((bundle) => ({
                quantity: bundle.quantity ?? 1,
                item: { connect: { id: bundle.itemProductId } },
              })),
            }
          : undefined,
      },
    });

    return created;
  });

  return getProductById(hotelId, product.id, includeOptions);
};

type AttributeFilter = {
  attributeId: string;
  value: JsonInput;
};

const parseAttributeFilters = (raw?: string): AttributeFilter[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return null;
        }

        if (typeof item.attributeId !== "string" || item.attributeId.length === 0) {
          return null;
        }

        return {
          attributeId: item.attributeId,
          value: toJsonInput(item.value),
        };
      })
      .filter((item): item is AttributeFilter => !!item);
  } catch {
    return [];
  }
};

export const listProducts = async (
  hotelId: string,
  params: {
    search?: string;
    categoryIds?: string[];
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    variantOptionId?: string;
    attributes?: string;
    page?: number;
    pageSize?: number;
  },
  includeOptions: ProductIncludeOptions,
) => {
  const pagination = resolvePagination({ page: params.page, pageSize: params.pageSize });

  const where: Prisma.ProductWhereInput = {
    hotelId,
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { slug: { contains: params.search } },
            { description: { contains: params.search } },
          ],
        }
      : {}),
    ...(params.categoryIds && params.categoryIds.length
      ? {
          categories: {
            some: {
              categoryId: { in: params.categoryIds },
            },
          },
        }
      : {}),
    ...(params.variantOptionId
      ? {
          variantGroups: {
            some: {
              options: {
                some: {
                  id: params.variantOptionId,
                },
              },
            },
          },
        }
      : {}),
    ...(params.minPrice !== undefined || params.maxPrice !== undefined
      ? {
          price: {
            ...(params.minPrice !== undefined ? { gte: toDecimal(params.minPrice) } : {}),
            ...(params.maxPrice !== undefined ? { lte: toDecimal(params.maxPrice) } : {}),
          },
        }
      : {}),
  };

  const attributeFilters = parseAttributeFilters(params.attributes);

  if (attributeFilters.length) {
    const existingAnd = where.AND
      ? Array.isArray(where.AND)
        ? [...where.AND]
        : [where.AND]
      : [];

    where.AND = [
      ...existingAnd,
      ...attributeFilters.map((filter) => ({
        attributeValues: {
          some: {
            attributeId: filter.attributeId,
            value: {
              equals: filter.value,
            },
          },
        },
      })),
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { name: "asc" },
      include: buildProductInclude(includeOptions),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
};

export const getProductById = async (
  hotelId: string,
  productId: string,
  includeOptions: ProductIncludeOptions,
) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, hotelId },
    include: buildProductInclude(includeOptions),
  });

  if (!product) {
    throw new AppError("Product not found for this hotel", 404);
  }

  return product;
};

export const updateProduct = async (
  hotelId: string,
  productId: string,
  data: UpdateProductInput,
  includeOptions: ProductIncludeOptions,
) => {
  await ensureProductBelongsToHotel(productId, hotelId);

  await ensureCategoriesBelongToHotel(hotelId, data.categoryIds ?? []);
  await ensureAttributeDefinitionsBelongToHotel(hotelId, data.attributeValues ?? []);
  await ensureBundleItemsBelongToHotel(hotelId, data.bundleItems ?? []);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.price !== undefined) updateData.price = toDecimal(data.price);
    if (data.images !== undefined) updateData.images = toJsonInput(data.images);
    if (data.baseUnit !== undefined) updateData.baseUnit = data.baseUnit;

    if (Object.keys(updateData).length) {
      await tx.product.update({
        where: { id: productId },
        data: updateData,
      });
    }

    if (data.categoryIds) {
      await tx.productCategory.deleteMany({ where: { productId } });
      if (data.categoryIds.length) {
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            productId,
            categoryId,
          })),
        });
      }
    }

    if (data.variantGroups) {
      await tx.productVariantOption.deleteMany({
        where: { group: { productId } },
      });
      await tx.productVariantGroup.deleteMany({
        where: { productId },
      });

      if (data.variantGroups.length) {
        for (const group of data.variantGroups) {
          await tx.productVariantGroup.create({
            data: {
              productId,
              name: group.name,
              key: group.key,
              selectionType: group.selectionType ?? "SINGLE",
              isRequired: group.isRequired ?? false,
              options: group.options
                ? {
                    create: group.options.map((option) => ({
                      name: option.name,
                      value: option.value,
                      priceDelta: toDecimal(option.priceDelta),
                      isAvailable: option.isAvailable ?? true,
                      sortOrder: option.sortOrder ?? 0,
                    })),
                  }
                : undefined,
            },
          });
        }
      }
    }

    if (data.attributeValues) {
      await tx.productAttributeValue.deleteMany({ where: { productId } });
      if (data.attributeValues.length) {
        await tx.productAttributeValue.createMany({
          data: data.attributeValues.map((attribute) => ({
            productId,
            attributeId: attribute.attributeId,
            value: toJsonInput(attribute.value),
          })),
        });
      }
    }

    if (data.customAttributes) {
      await tx.productCustomAttribute.deleteMany({ where: { productId } });
      if (data.customAttributes.length) {
        await tx.productCustomAttribute.createMany({
          data: data.customAttributes.map((attribute) => ({
            productId,
            name: attribute.name,
            key: attribute.key,
            type: attribute.type,
            value: toJsonInput(attribute.value),
            unitOfMeasure: attribute.unitOfMeasure,
          })),
        });
      }
    }

    if (data.bundleItems) {
      await tx.productBundleItem.deleteMany({ where: { parentProductId: productId } });
      if (data.bundleItems.length) {
        await tx.productBundleItem.createMany({
          data: data.bundleItems.map((bundle) => ({
            parentProductId: productId,
            itemProductId: bundle.itemProductId,
            quantity: bundle.quantity ?? 1,
          })),
        });
      }
    }
  });

  return getProductById(hotelId, productId, includeOptions);
};

export const deleteProduct = async (hotelId: string, productId: string) => {
  await ensureProductBelongsToHotel(productId, hotelId);

  await prisma.product.delete({
    where: { id: productId },
  });
};
