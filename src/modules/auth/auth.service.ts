import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";

type JwtPayload = {
  sub: string;
  role: "USER" | "ADMIN";
};

function signToken(payload: JwtPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export class AuthService {
  static async register(input: { name: string; email: string; password: string }) {
    const email = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    // User JWT always has role USER (admin JWT comes from Admin table)
    const token = signToken({ sub: user.id, role: "USER" });
    return { user, token };
  }

  static async login(input: { email: string; password: string }) {
    const email = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true }
    });

    if (!user) throw new ApiError(401, "Invalid email or password");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid email or password");

    const token = signToken({ sub: user.id, role: "USER" });

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  }
}