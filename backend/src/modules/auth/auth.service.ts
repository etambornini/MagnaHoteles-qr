import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { AppError } from "../common/errors";
import { env } from "../../config/env";
import { UserRole } from "../../generated/prisma";

const SALT_ROUNDS = 10;

export type AuthTokenPayload = {
  userId: string;
  hotelId: string | null;
  role: UserRole;
};

export const registerUser = async (params: {
  email: string;
  password: string;
  role: UserRole;
  hotelSlug?: string;
}) => {
  const { email, password, role, hotelSlug } = params;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  let hotelId: string | null = null;

  if (role === "MANAGER") {
    if (!hotelSlug) {
      throw new AppError("hotelSlug is required for MANAGER role", 400);
    }
    const hotel = await prisma.hotel.findUnique({ where: { slug: hotelSlug } });
    if (!hotel) {
      throw new AppError("Hotel not found", 404);
    }
    hotelId = hotel.id;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      hotelId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      hotel: {
        select: { id: true, name: true, slug: true },
      },
      createdAt: true,
    },
  });

  return user;
};

export const loginUser = async (params: { email: string; password: string }) => {
  const { email, password } = params;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      hotel: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.role === "MANAGER" && !user.hotelId) {
    throw new AppError("Assigned hotel missing for manager", 500);
  }

  const payload: AuthTokenPayload = {
    userId: user.id,
    hotelId: user.hotelId ?? null,
    role: user.role,
  };

  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: "8h",
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      hotel: user.hotel,
    },
  };
};
