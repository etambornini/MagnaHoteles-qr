export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type PaginationResult = {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const resolvePagination = ({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: PaginationInput) => {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const normalizedSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PAGE_SIZE;
  const finalSize = Math.min(normalizedSize, MAX_PAGE_SIZE);

  return {
    skip: (normalizedPage - 1) * finalSize,
    take: finalSize,
    page: normalizedPage,
    pageSize: finalSize,
  } satisfies PaginationResult;
};
