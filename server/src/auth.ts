import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  roomId: string;
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
