import { PrismaClient } from '@prisma/client';

import { env } from '~/env';

const isDevelopment = env.NODE_ENV === 'development';

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
  });

  if (isDevelopment) {
    // Enhanced query logging with performance metrics
    client.$on('query', (e: any) => {
      const duration = e.duration;
      const query = e.query.substring(0, 150); // Truncate long queries

      // Color coding based on performance
      let color = '\x1b[32m'; // Green (fast)
      let icon = '⚡';

      if (duration > 100) {
        color = '\x1b[33m'; // Yellow (medium)
        icon = '⚠️ ';
      }
      if (duration > 500) {
        color = '\x1b[31m'; // Red (slow)
        icon = '🐌';
      }

      console.log(`${icon} ${color}[Prisma] ${duration}ms\x1b[0m - ${query}`);

      // Flag extremely slow queries
      if (duration > 1000) {
        console.error(`\n❌ CRITICAL: Very slow query detected (${duration}ms)`);
        console.error(`   Query: ${e.query}`);
        console.error(`   Params: ${e.params}`);
        console.error(`   🔧 Action Required: Add indexes or optimize this query!\n`);
      }
    });
  }

  return client;
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
