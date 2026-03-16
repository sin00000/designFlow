import { PrismaClient } from '@prisma/client';

function makeClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    result: {
      reference: {
        tags: {
          needs: { tags: true },
          compute(ref): string[] {
            return typeof ref.tags === 'string'
              ? JSON.parse(ref.tags || '[]')
              : (ref.tags ?? []);
          },
        },
      },
      communityPost: {
        tags: {
          needs: { tags: true },
          compute(post): string[] {
            return typeof post.tags === 'string'
              ? JSON.parse(post.tags || '[]')
              : (post.tags ?? []);
          },
        },
      },
      portfolio: {
        tags: {
          needs: { tags: true },
          compute(item): string[] {
            return typeof item.tags === 'string'
              ? JSON.parse(item.tags || '[]')
              : (item.tags ?? []);
          },
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof makeClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

const db = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
export { db };
