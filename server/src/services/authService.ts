// FR-901: Authentication service — register, login, JWT
import bcrypt from "bcryptjs";
import { sign, verify } from "hono/jwt";
import type { PrismaClient } from "@prisma/client";
import type { UserPublic } from "@campus-gps/shared-types";

const JWT_SECRET = process.env.JWT_SECRET ?? "campus-gps-dev-secret";
const JWT_EXPIRATION_DAYS = 7;
const BCRYPT_ROUNDS = 10;

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  exp: number;
}

/** Hash a plaintext password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Compare plaintext password against hash */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Generate JWT token for a user */
export async function generateToken(user: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: now + JWT_EXPIRATION_DAYS * 24 * 60 * 60,
  };
  return sign(payload, JWT_SECRET);
}

/** Verify and decode JWT token */
export async function verifyToken(token: string): Promise<TokenPayload> {
  return verify(token, JWT_SECRET, "HS256") as Promise<TokenPayload>;
}

/** Register a new user */
export async function registerUser(
  prisma: PrismaClient,
  data: { email: string; password: string; name: string; deviceId?: string }
): Promise<{ user: UserPublic; token: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AuthError("EMAIL_EXISTS", "El email ya está registrado");
  }

  if (data.password.length < 6) {
    throw new AuthError(
      "WEAK_PASSWORD",
      "La contraseña debe tener al menos 6 caracteres"
    );
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      name: data.name.trim(),
      deviceId: data.deviceId ?? null,
    },
  });

  // FR-901: Link existing incidents from deviceId
  if (data.deviceId) {
    await prisma.incident.updateMany({
      where: { deviceId: data.deviceId },
      data: {}, // no-op — deviceId stays, but we could add userId later
    });
  }

  const token = await generateToken(user);

  return {
    user: toUserPublic(user),
    token,
  };
}

/** Login with email and password */
export async function loginUser(
  prisma: PrismaClient,
  data: { email: string; password: string }
): Promise<{ user: UserPublic; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "Email o contraseña incorrectos");
  }

  const valid = await comparePassword(data.password, user.password);
  if (!valid) {
    throw new AuthError("INVALID_CREDENTIALS", "Email o contraseña incorrectos");
  }

  const token = await generateToken(user);

  return {
    user: toUserPublic(user),
    token,
  };
}

/** Convert DB user to public user (no password) */
function toUserPublic(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserPublic["role"],
    createdAt: user.createdAt.toISOString(),
  };
}

/** Auth-specific error with code */
export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}

export { JWT_SECRET };
