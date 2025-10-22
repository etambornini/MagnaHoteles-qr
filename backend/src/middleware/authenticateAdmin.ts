import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { UserRole } from "../generated/prisma";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      hotelId: string | null;
      role: UserRole;
    };
    hotelId?: string;
  }
}

type TokenPayload = {
  userId: string;
  hotelId: string | null;
  role: UserRole;
  iat: number;
  exp: number;
};

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        hotelId: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hotelId = user.hotelId ?? null;

    if (user.role !== decoded.role) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      hotelId,
    };

    if (user.role === "MANAGER") {
      if (decoded.hotelId && hotelId && decoded.hotelId !== hotelId) {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (!hotelId) {
        return res.status(403).json({ message: "Manager has no hotel assigned" });
      }
      req.hotelId = hotelId;
    }

    return next();
  } catch (error) {
    console.error("Authentication error", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
