import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Point this to your actual schema file
  schema: "prisma/prisma.schema", 
  datasource: {
    // This is where the migration tool looks for the URL now
    url: env("DATABASE_URL"),
  },
});