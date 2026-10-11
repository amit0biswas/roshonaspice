import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "./models.js";

export type AuthRequest = Request & { user?: { id: string; role: "customer" | "admin" } };

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.roshona_session as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");
    const payload = jwt.verify(token, secret) as { sub: string; role: "customer" | "admin"; version?: number };
    const user = await UserModel.findById(payload.sub).select("_id role tokenVersion");
    if (!user || (payload.version ?? 0) !== user.tokenVersion) {
      res.status(401).json({ error: "Your session is no longer valid." });
      return;
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.clearCookie("roshona_session");
      res.status(401).json({ error: "Your session has expired. Please sign in again." });
      return;
    }
    next(error);
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Administrator access is required." });
    return;
  }
  next();
}

export function validate<T>(schema: { parse: (input: unknown) => T }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
