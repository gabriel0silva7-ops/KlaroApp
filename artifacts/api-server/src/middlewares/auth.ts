import type { Request, Response, NextFunction } from "express";

// Augment the session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

/**
 * Middleware to require an authenticated session.
 * Returns 401 if no session user is present.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
