export type CategoryAttributeOption = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type CategoryAttribute = {
  id: string;
  name: string;
  key: string;
  type: string;
  isRequired: boolean;
  unitOfMeasure?: string | null;
  options?: CategoryAttributeOption[];
};

export type Category = {
  id: string;
  hotelId: string;
  name: string;
  key: string;
  description?: string | null;
  unitOfMeasure?: string | null;
  parentId?: string | null;
  attributes?: CategoryAttribute[];
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCategoryLink = {
  categoryId: string;
  productId: string;
  assignedAt: string;
  category?: Category;
};

export type ProductVariantOption = {
  id: string;
  name: string;
  value: string;
  priceDelta?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
};

export type ProductVariantGroup = {
  id: string;
  name: string;
  key: string;
  selectionType: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  options?: ProductVariantOption[];
};

export type Product = {
  id: string;
  hotelId: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  stock: number;
  price?: string | null;
  images?: string[] | null;
  baseUnit?: string | null;
  categories?: ProductCategoryLink[];
  variantGroups?: ProductVariantGroup[];
  attributeValues?: Array<{
    id: string;
    attributeId: string;
    value: unknown;
  }>;
  createdAt?: string;
  updatedAt?: string;
};
