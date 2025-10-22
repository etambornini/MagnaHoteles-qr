import { Request, Response } from "express";
import { asyncHandler } from "../common/asyncHandler";
import { createHotel, deleteHotel, getHotelById, listHotels, updateHotel } from "./hotel.service";

const toSingleValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export const createHotelHandler = asyncHandler(async (req: Request, res: Response) => {
  const hotel = await createHotel(req.body);
  res.status(201).json(hotel);
});

export const listHotelsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string | string[] | undefined>;
  const search = toSingleValue(query.search);
  const page = toSingleValue(query.page);
  const pageSize = toSingleValue(query.pageSize);

  const result = await listHotels({
    search: search ?? undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(result);
});

export const getHotelHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const hotel = await getHotelById(id);
  res.json(hotel);
});

export const updateHotelHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const hotel = await updateHotel(id, req.body);
  res.json(hotel);
});

export const deleteHotelHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await deleteHotel(id);
  res.status(204).send();
});
