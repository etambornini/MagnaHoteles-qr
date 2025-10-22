import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../common/asyncHandler";
import { uploadImageBodySchema } from "./upload.schema";
import { saveHotelImage } from "../../lib/fileStorage";

export const uploadHotelImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.hotelId) {
    return res.status(400).json({ message: "Hotel context is required" });
  }

  const parseResult = uploadImageBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid request", errors: parseResult.error.flatten() });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ message: "Only image files are allowed" });
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: req.hotelId },
    select: { slug: true },
  });

  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  const result = await saveHotelImage({
    hotelSlug: hotel.slug,
    type: parseResult.data.type,
    categoryKey: parseResult.data.categoryKey,
    productSlug: parseResult.data.productSlug,
    buffer: req.file.buffer,
    originalName: req.file.originalname,
  });

  return res.status(201).json({
    url: `/uploads/${result.relativePath}`,
    relativePath: result.relativePath,
    format: result.format,
    size: result.size,
  });
});
