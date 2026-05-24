import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@prisma/client", "bullmq", "ioredis", "pino"],
};

export default nextConfig;
