import { Prisma, AttributeDataType } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { AppError } from "../common/errors";
import { resolvePagination } from "../common/pagination";

const ensureCategoryBelongsToHotel = async (categoryId: string, hotelId: string) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, hotelId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError("Category not found for this hotel", 404);
  }

  return category;
};

export const createCategory = async (
  hotelId: string,
  data: {
    name: string;
    key: string;
    description?: string | null;
    unitOfMeasure?: string | null;
    parentId?: string | null;
    attributes?: Array<{
      name: string;
      key: string;
      type: AttributeDataType;
      isRequired?: boolean;
      unitOfMeasure?: string | null;
      options?: Array<{
        label: string;
        value: string;
        sortOrder?: number;
      }>;
    }>;
  },
) => {
  if (data.parentId) {
    await ensureCategoryBelongsToHotel(data.parentId, hotelId);
  }

  return prisma.category.create({
    data: {
      hotelId,
      name: data.name,
      key: data.key,
      description: data.description,
      unitOfMeasure: data.unitOfMeasure,
      parentId: data.parentId ?? null,
      attributes: data.attributes
        ? {
            create: data.attributes.map((attribute) => ({
              name: attribute.name,
              key: attribute.key,
              type: attribute.type,
              isRequired: attribute.isRequired ?? false,
              unitOfMeasure: attribute.unitOfMeasure,
              options: attribute.options
                ? {
                    create: attribute.options.map((option) => ({
                      label: option.label,
                      value: option.value,
                      sortOrder: option.sortOrder ?? 0,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    },
    include: {
      attributes: { include: { options: true } },
    },
  });
};

export const listCategories = async (
  hotelId: string,
  params: {
    search?: string;
    parentId?: string;
    includeChildren?: boolean;
    includeAttributes?: boolean;
    page?: number;
    pageSize?: number;
  },
) => {
  const { search, parentId, includeChildren, includeAttributes, page, pageSize } = params;
  if (parentId) {
    await ensureCategoryBelongsToHotel(parentId, hotelId);
  }

  const pagination = resolvePagination({ page, pageSize });

  const where: Prisma.CategoryWhereInput = {
    hotelId,
    parentId: parentId ?? null,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { key: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: {
        attributes: includeAttributes ? { include: { options: true } } : false,
        children: includeChildren
          ? {
              include: includeAttributes ? { attributes: { include: { options: true } } } : undefined,
            }
          : false,
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
};

export const getCategoryById = async (
  hotelId: string,
  categoryId: string,
  options: { includeChildren?: boolean; includeAttributes?: boolean } = {},
) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, hotelId },
    include: {
      attributes: options.includeAttributes ? { include: { options: true } } : false,
      children: options.includeChildren
        ? {
            include: options.includeAttributes ? { attributes: { include: { options: true } } } : undefined,
          }
        : false,
      parent: true,
    },
  });

  if (!category) {
    throw new AppError("Category not found for this hotel", 404);
  }

  return category;
};

export const updateCategory = async (
  hotelId: string,
  categoryId: string,
  data: {
    name?: string;
    key?: string;
    description?: string | null;
    unitOfMeasure?: string | null;
    parentId?: string | null;
  },
) => {
  await ensureCategoryBelongsToHotel(categoryId, hotelId);

  if (data.parentId) {
    await ensureCategoryBelongsToHotel(data.parentId, hotelId);
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...data,
      parentId: data.parentId ?? null,
    },
    include: {
      attributes: { include: { options: true } },
    },
  });
};

export const deleteCategory = async (hotelId: string, categoryId: string) => {
  await ensureCategoryBelongsToHotel(categoryId, hotelId);

  await prisma.category.delete({
    where: { id: categoryId },
  });
};

export const createCategoryAttribute = async (
  hotelId: string,
  categoryId: string,
  data: {
    name: string;
    key: string;
    type: AttributeDataType;
    isRequired?: boolean;
    unitOfMeasure?: string | null;
    options?: Array<{ label: string; value: string; sortOrder?: number }>;
  },
) => {
  await ensureCategoryBelongsToHotel(categoryId, hotelId);

  return prisma.categoryAttributeDefinition.create({
    data: {
      categoryId,
      name: data.name,
      key: data.key,
      type: data.type,
      isRequired: data.isRequired ?? false,
      unitOfMeasure: data.unitOfMeasure,
      options: data.options
        ? {
            create: data.options.map((option) => ({
              label: option.label,
              value: option.value,
              sortOrder: option.sortOrder ?? 0,
            })),
          }
        : undefined,
    },
    include: {
      options: true,
    },
  });
};

const ensureAttributeBelongsToCategory = async (attributeId: string, categoryId: string, hotelId: string) => {
  const attribute = await prisma.categoryAttributeDefinition.findFirst({
    where: { id: attributeId, categoryId, category: { hotelId } },
    select: { id: true },
  });

  if (!attribute) {
    throw new AppError("Attribute not found for this category", 404);
  }

  return attribute;
};

export const updateCategoryAttribute = async (
  hotelId: string,
  categoryId: string,
  attributeId: string,
  data: {
    name?: string;
    key?: string;
    type?: AttributeDataType;
    isRequired?: boolean;
    unitOfMeasure?: string | null;
  },
) => {
  await ensureAttributeBelongsToCategory(attributeId, categoryId, hotelId);

  return prisma.categoryAttributeDefinition.update({
    where: { id: attributeId },
    data,
    include: { options: true },
  });
};

export const deleteCategoryAttribute = async (hotelId: string, categoryId: string, attributeId: string) => {
  await ensureAttributeBelongsToCategory(attributeId, categoryId, hotelId);

  await prisma.categoryAttributeDefinition.delete({
    where: { id: attributeId },
  });
};

const ensureOptionBelongsToAttribute = async (
  optionId: string,
  attributeId: string,
  categoryId: string,
  hotelId: string,
) => {
  const option = await prisma.categoryAttributeOption.findFirst({
    where: { id: optionId, definitionId: attributeId, definition: { categoryId, category: { hotelId } } },
    select: { id: true },
  });

  if (!option) {
    throw new AppError("Option not found for this attribute", 404);
  }

  return option;
};

export const createAttributeOption = async (
  hotelId: string,
  categoryId: string,
  attributeId: string,
  data: { label: string; value: string; sortOrder?: number },
) => {
  await ensureAttributeBelongsToCategory(attributeId, categoryId, hotelId);

  return prisma.categoryAttributeOption.create({
    data: {
      definitionId: attributeId,
      label: data.label,
      value: data.value,
      sortOrder: data.sortOrder ?? 0,
    },
  });
};

export const updateAttributeOption = async (
  hotelId: string,
  categoryId: string,
  attributeId: string,
  optionId: string,
  data: { label?: string; value?: string; sortOrder?: number },
) => {
  await ensureOptionBelongsToAttribute(optionId, attributeId, categoryId, hotelId);

  return prisma.categoryAttributeOption.update({
    where: { id: optionId },
    data,
  });
};

export const deleteAttributeOption = async (
  hotelId: string,
  categoryId: string,
  attributeId: string,
  optionId: string,
) => {
  await ensureOptionBelongsToAttribute(optionId, attributeId, categoryId, hotelId);

  await prisma.categoryAttributeOption.delete({
    where: { id: optionId },
  });
};
