import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";

type JwtPayload = {
  sub: string;
  role: "ADMIN";
};

function signAdminToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export class AdminService {
  static async login(input: { email: string; password: string }) {
    const email = input.email.toLowerCase().trim();

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true }
    });

    if (!admin) throw new ApiError(401, "Invalid email or password");

    const ok = await bcrypt.compare(input.password, admin.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid email or password");

    const token = signAdminToken({ sub: admin.id, role: "ADMIN" });

    return {
      admin: { id: admin.id, email: admin.email, role: admin.role },
      token
    };
  }
}