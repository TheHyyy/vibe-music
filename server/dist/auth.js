import jwt from "jsonwebtoken";
export function getJwtSecret() {
    return process.env.JWT_SECRET || "dev_secret_change_me";
}
export function signToken(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}
export function verifyToken(token) {
    return jwt.verify(token, getJwtSecret());
}
