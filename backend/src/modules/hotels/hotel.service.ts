import { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { resolvePagination } from "../common/pagination";
import { AppError } from "../common/errors";

export const createHotel = async (input: Prisma.HotelCreateInput) => {
  return prisma.hotel.create({
    data: input,
  });
};

export const listHotels = async (params: { search?: string; page?: number; pageSize?: number }) => {
  const { search, page, pageSize } = params;
  const pagination = resolvePagination({ page, pageSize });

  const where: Prisma.HotelWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.hotel.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
};

export const getHotelById = async (id: string) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
  });

  if (!hotel) {
    throw new AppError("Hotel not found", 404);
  }

  return hotel;
};

export const updateHotel = async (id: string, data: Prisma.HotelUpdateInput) => {
  return prisma.hotel.update({
    where: { id },
    data,
  });
};

export const deleteHotel = async (id: string) => {
  return prisma.hotel.delete({
    where: { id },
  });
};
