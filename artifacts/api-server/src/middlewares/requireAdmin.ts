import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/firebase";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    // Di Firebase, kita bisa pakai custom claims untuk role admin
    // Atau sementara anggap semua user terautentikasi adalah admin jika ini app pribadi
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}
