import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config();
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
    shadowDatabaseUrl:
      process.env.SHADOW_DATABASE_URL ??
      "postgresql://william:postgres@localhost:5432/exam_marketplace_shadow?schema=public",
  },
});
