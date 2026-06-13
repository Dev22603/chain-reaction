import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		seed: "tsx ./prisma/seed.ts",
	},
	datasource: {
		// Prisma CLI (migrate/studio/seed) needs a session-mode connection.
		// On Supabase that is the session pooler (DIRECT_URL); the runtime app
		// uses the transaction pooler via DATABASE_URL in src/lib/prisma.ts.
		url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
	},
});
