export type HotelMetadata = {
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    [key: string]: unknown;
  };
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    mapsUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type Hotel = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  timeZone?: string | null;
  imgQr?: string | null;
  metadata?: HotelMetadata | null;
  createdAt: string;
  updatedAt: string;
};
