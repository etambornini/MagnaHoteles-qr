import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";

type ImageType = "qr" | "category" | "product";

const sanitizeSegment = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const sanitized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return sanitized || fallback;
};

const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const resolveRelativePath = (params: {
  hotelSlug: string;
  type: ImageType;
  categoryKey?: string | null;
  productSlug?: string | null;
  filename: string;
}) => {
  const hotelSegment = sanitizeSegment(params.hotelSlug, "hotel");

  if (params.type === "qr") {
    return path.join(hotelSegment, "qr", params.filename);
  }

  if (params.type === "category") {
    const categorySegment = sanitizeSegment(params.categoryKey, "general");
    return path.join(hotelSegment, "categories", categorySegment, params.filename);
  }

  const productSegment = sanitizeSegment(params.productSlug, "general");
  return path.join(hotelSegment, "products", productSegment, params.filename);
};

const generateFilename = (originalName: string) => {
  const { name } = path.parse(originalName);
  const base = sanitizeSegment(name, "image");
  const hash = crypto.randomBytes(6).toString("hex");
  return `${base}-${hash}.webp`;
};

export const saveHotelImage = async (params: {
  hotelSlug: string;
  type: ImageType;
  categoryKey?: string | null;
  productSlug?: string | null;
  buffer: Buffer;
  originalName: string;
}) => {
  const filename = generateFilename(params.originalName);
  const relativePath = resolveRelativePath({ ...params, filename });
  const absolutePath = path.join(PUBLIC_DIR, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  const processed = await sharp(params.buffer).rotate().webp({ quality: 80 }).toBuffer();

  await fs.writeFile(absolutePath, processed);

  return {
    relativePath: relativePath.replace(/\\/g, "/"),
    absolutePath,
    format: "webp",
    size: processed.length,
  };
};
