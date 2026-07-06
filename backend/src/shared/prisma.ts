import { PrismaClient } from "@prisma/client";

// Singleton pattern — a single PrismaClient instance shared across the app,
// per Prisma's own recommendation (avoids exhausting DB connections under
// hot-reload in development).
export const prisma = new PrismaClient();
