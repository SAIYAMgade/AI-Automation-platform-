import stringSimilarity from "string-similarity";
import { prisma } from "@/db/prisma";
import { mockAuthors } from "@/db/mock-data";
import { runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { AuthorRecord, ContactIdentity } from "@/types/domain";
import { normalizeEmail, normalizeInstagram, normalizePhone } from "@/lib/security/sanitize";

export class AuthorService {
  async findCandidates(input: {
    identity: ContactIdentity;
    authorName?: string;
    bookTitle?: string;
  }): Promise<AuthorRecord[]> {
    if (runtimeFlags.shouldUseMockData) {
      return findMockCandidates(input);
    }

    const email = normalizeEmail(input.identity.email);
    const phone = normalizePhone(input.identity.phone);
    const instagram = normalizeInstagram(input.identity.instagramHandle);

    try {
      const direct = await prisma.author.findMany({
        where: {
          OR: [
            email ? { email } : undefined,
            phone ? { phone } : undefined,
            instagram ? { instagramHandle: { equals: `@${instagram}`, mode: "insensitive" } } : undefined,
            input.identity.dashboardUserId ? { dashboardUserId: input.identity.dashboardUserId } : undefined,
            input.authorName ? { fullName: { contains: input.authorName, mode: "insensitive" } } : undefined,
            input.bookTitle
              ? { books: { some: { title: { contains: input.bookTitle, mode: "insensitive" } } } }
              : undefined,
          ].filter(Boolean) as never[],
        },
        include: { books: true },
        take: 10,
      });

      return direct.map((author) => ({
        ...author,
        books: author.books.map((book) => ({
          ...book,
          royaltyAmountDue: book.royaltyAmountDue.toString(),
          addOnServices: book.addOnServices as Record<string, unknown>,
          metadata: undefined,
        })),
        metadata: author.metadata as Record<string, unknown>,
      }));
    } catch (error) {
      logger.warn({ error }, "Author lookup failed; falling back to local demo authors");
      return findMockCandidates(input);
    }
  }

  async getAuthor(authorId: string): Promise<AuthorRecord | null> {
    if (runtimeFlags.shouldUseMockData) {
      return mockAuthors.find((author) => author.id === authorId) ?? null;
    }

    try {
      const author = await prisma.author.findUnique({
        where: { id: authorId },
        include: { books: true },
      });

      if (!author) return null;

      return {
        ...author,
        books: author.books.map((book) => ({
          ...book,
          royaltyAmountDue: book.royaltyAmountDue.toString(),
          addOnServices: book.addOnServices as Record<string, unknown>,
        })),
        metadata: author.metadata as Record<string, unknown>,
      };
    } catch (error) {
      logger.warn({ error, authorId }, "Author load failed; falling back to local demo author");
      return mockAuthors.find((author) => author.id === authorId) ?? null;
    }
  }
}

function findMockCandidates(input: {
  identity: ContactIdentity;
  authorName?: string;
  bookTitle?: string;
}) {
  const email = normalizeEmail(input.identity.email);
  const phone = normalizePhone(input.identity.phone);
  const instagram = normalizeInstagram(input.identity.instagramHandle);
  const displayName = input.identity.displayName ?? input.authorName;
  const bookTitle = input.bookTitle?.toLowerCase();

  const directMatches = mockAuthors.filter((author) => {
    if (email && normalizeEmail(author.email ?? undefined) === email) return true;
    if (phone && normalizePhone(author.phone ?? undefined) === phone) return true;
    if (instagram && normalizeInstagram(author.instagramHandle ?? undefined) === instagram) return true;
    if (input.identity.dashboardUserId && author.dashboardUserId === input.identity.dashboardUserId) return true;
    if (bookTitle && author.books.some((book) => book.title.toLowerCase().includes(bookTitle))) return true;
    return false;
  });

  if (directMatches.length > 0) return directMatches;

  if (displayName) {
    return mockAuthors
      .map((author) => ({
        author,
        score: stringSimilarity.compareTwoStrings(displayName.toLowerCase(), author.fullName.toLowerCase()),
      }))
      .filter(({ score }) => score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ author }) => author);
  }

  return [];
}

export const authorService = new AuthorService();
