import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..", "..");

describe("Phase 4 deployment verification", () => {
	it("defines the D1 binding and migrations in wrangler.jsonc", () => {
		const wranglerConfig = readFileSync(join(root, "wrangler.jsonc"), "utf-8");

		expect(wranglerConfig).toContain('"binding": "DB"');
		expect(wranglerConfig).toContain('"database_name": "quizmaker-db"');
		expect(wranglerConfig).toContain('"migrations_dir": "migrations"');
	});

	it("includes the users table migration required for auth", () => {
		const migration = readFileSync(join(root, "migrations", "0001_create_users.sql"), "utf-8");

		expect(migration).toContain("CREATE TABLE users");
		expect(migration).toContain("password_hash TEXT NOT NULL");
		expect(migration).toContain("CREATE UNIQUE INDEX idx_users_email ON users(email)");
	});

	it("includes the MCQ tables migration required for quiz content", () => {
		const migration = readFileSync(join(root, "migrations", "0002_create_mcq_tables.sql"), "utf-8");

		expect(migration).toContain("CREATE TABLE mcqs");
		expect(migration).toContain("CREATE TABLE mcq_choices");
		expect(migration).toContain("CREATE TABLE mcq_attempts");
	});

	it("documents JWT_SECRET for local and production setup", () => {
		const devVarsExample = readFileSync(join(root, ".dev.vars.example"), "utf-8");

		expect(devVarsExample).toContain("JWT_SECRET=");
	});

	it("initializes OpenNext Cloudflare bindings for local development", () => {
		const nextConfig = readFileSync(join(root, "next.config.ts"), "utf-8");

		expect(nextConfig).toContain("initOpenNextCloudflareForDev");
	});

	it("exposes lint, test, build, and deploy scripts", async () => {
		const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as {
			scripts: Record<string, string>;
		};

		expect(pkg.scripts.lint).toBe("eslint .");
		expect(pkg.scripts.test).toBe("vitest run");
		expect(pkg.scripts.build).toBe("next build");
		expect(pkg.scripts.deploy).toContain("opennextjs-cloudflare deploy");
	});
});
