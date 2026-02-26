import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  roomId: string;
}

let jwtSecret: string | null = null;

export function getJwtSecret(): string {
  if (jwtSecret) return jwtSecret;

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET environment variable is required in production. Please set it before starting the server.",
      );
    }
    console.warn(
      "[WARN] Using default JWT secret for development. Set JWT_SECRET environment variable for production.",
    );
    jwtSecret = "dev_secret_change_me";
  } else {
    jwtSecret = secret;
  }

  return jwtSecret;
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
