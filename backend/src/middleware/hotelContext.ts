import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../modules/common/asyncHandler";

export const hotelContext = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const identifier =
    req.header("x-hotel-id") ??
    (typeof req.query.hotelId === "string" ? req.query.hotelId : undefined);

  if (!identifier) {
    return res.status(400).json({
      message: "Hotel identifier is required via `x-hotel-id` header or `hotelId` query parameter.",
    });
  }

  const hotel = await prisma.hotel.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    select: { id: true },
  });

  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  req.hotelId = hotel.id;
  return next();
});
