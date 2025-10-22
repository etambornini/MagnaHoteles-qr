import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../modules/common/asyncHandler";

const findHotelIdFromRequest = async (req: Request): Promise<string | null> => {
  const header = req.header("x-hotel-id");
  const queryValue = typeof req.query.hotelId === "string" ? req.query.hotelId : undefined;
  const candidate = header ?? queryValue;

  if (!candidate) {
    return null;
  }

  const hotel = await prisma.hotel.findFirst({
    where: {
      OR: [{ id: candidate }, { slug: candidate }],
    },
    select: { id: true },
  });

  return hotel?.id ?? null;
};

export const resolveHotelAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role === "MANAGER") {
    req.hotelId = req.user.hotelId ?? undefined;
    if (!req.hotelId) {
      return res.status(403).json({ message: "Manager has no hotel assigned" });
    }
    return next();
  }

  if (req.user.role === "ADMIN") {
    const hotelId = await findHotelIdFromRequest(req);
    if (!hotelId) {
      return res.status(400).json({ message: "Hotel identifier is required via x-hotel-id header or hotelId query" });
    }
    req.hotelId = hotelId;
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
});
