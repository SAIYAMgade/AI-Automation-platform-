import { randomBytes, randomUUID, timingSafeEqual, scryptSync } from "crypto";
import { prisma } from "@/db/prisma";
import { authorService } from "@/services/author-service";
import { runtimeFlags } from "@/lib/env";
import { AppError } from "@/lib/errors";

type Role = "customer" | "company";

type RuntimeUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  displayName?: string | null;
  authorId?: string | null;
  createdAt: string;
};

const runtimeUsers: RuntimeUser[] = [];

export class AuthService {
  async signUp(input: { email: string; password: string; role: Role }) {
    const email = normalizeEmail(input.email);

    if (runtimeFlags.shouldUseMockData) {
      const existing = runtimeUsers.find((user) => user.email === email);
      if (existing) {
        throw new AppError("An account already exists with this email.", 409, "ACCOUNT_EXISTS");
      }

      const user: RuntimeUser = {
        id: randomUUID(),
        email,
        passwordHash: hashPassword(input.password),
        role: input.role,
        displayName: displayNameFromEmail(email),
        createdAt: new Date().toISOString(),
      };
      runtimeUsers.push(user);
      return this.toSession(user);
    }

    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("An account already exists with this email.", 409, "ACCOUNT_EXISTS");
    }

    const author = input.role === "customer"
      ? await authorService.findCandidates({ identity: { email } }).then((candidates) => candidates[0] ?? null)
      : null;

    const user = await prisma.appUser.create({
      data: {
        email,
        passwordHash: hashPassword(input.password),
        role: input.role,
        displayName: author?.fullName ?? displayNameFromEmail(email),
        authorId: author?.id,
      },
    });

    return this.toSession(user, author ?? undefined);
  }

  async signIn(input: { email: string; password: string; role: Role }) {
    const email = normalizeEmail(input.email);

    if (runtimeFlags.shouldUseMockData) {
      const user = runtimeUsers.find((item) => item.email === email && item.role === input.role);
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new AppError("Email or password is incorrect.", 401, "INVALID_LOGIN");
      }
      return this.toSession(user);
    }

    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user || user.role !== input.role || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError("Email or password is incorrect.", 401, "INVALID_LOGIN");
    }

    const author = user.authorId
      ? await authorService.getAuthor(user.authorId)
      : input.role === "customer"
        ? await authorService.findCandidates({
            identity: {
              email,
              displayName: user.displayName ?? undefined,
            },
          }).then((candidates) => candidates[0])
        : null;

    return this.toSession(user, author ?? undefined);
  }

  private async toSession(
    user: {
      id: string;
      email: string;
      role: string;
      displayName?: string | null;
      authorId?: string | null;
    },
    author?: Awaited<ReturnType<typeof authorService.getAuthor>>,
  ) {
    if (user.role === "company") {
      return {
        role: "company" as const,
        staffEmail: user.email,
      };
    }

    const fallbackName = user.displayName ?? displayNameFromEmail(user.email);
    return {
      role: "customer" as const,
      name: author?.fullName ?? fallbackName,
      email: user.email,
      phone: author?.phone ?? undefined,
      instagramHandle: author?.instagramHandle ?? undefined,
      bookTitle: author?.books[0]?.title ?? "Dreams of Fire",
    };
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function displayNameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "BookLeaf User";
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [method, salt, hash] = stored.split(":");
  if (method !== "scrypt" || !salt || !hash) return false;

  const actual = Buffer.from(hash, "hex");
  const expected = scryptSync(password, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const authService = new AuthService();
