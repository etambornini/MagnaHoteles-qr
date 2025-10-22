import { Router } from "express";
import multer from "multer";
import { uploadHotelImageHandler } from "./upload.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadRouter = Router();

uploadRouter.post("/images", upload.single("file"), uploadHotelImageHandler);
