import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..", "..");
const migrationPath = join(root, "migrations", "0002_create_mcq_tables.sql");

describe("MCQ migration verification", () => {
	it("defines the mcqs, mcq_choices, and mcq_attempts tables", () => {
		const migration = readFileSync(migrationPath, "utf-8");

		expect(migration).toContain("CREATE TABLE mcqs");
		expect(migration).toContain("CREATE TABLE mcq_choices");
		expect(migration).toContain("CREATE TABLE mcq_attempts");
	});

	it("links MCQs to users and choices to MCQs with cascade deletes", () => {
		const migration = readFileSync(migrationPath, "utf-8");

		expect(migration).toContain("created_by_user_id TEXT NOT NULL");
		expect(migration).toContain("FOREIGN KEY (created_by_user_id) REFERENCES users(id)");
		expect(migration).toContain("FOREIGN KEY (mcq_id) REFERENCES mcqs(id) ON DELETE CASCADE");
		expect(migration).toContain(
			"FOREIGN KEY (selected_choice_id) REFERENCES mcq_choices(id) ON DELETE CASCADE",
		);
	});

	it("defines indexes for ownership, ordering, and attempt lookups", () => {
		const migration = readFileSync(migrationPath, "utf-8");

		expect(migration).toContain("CREATE INDEX idx_mcqs_created_by_user_id");
		expect(migration).toContain("CREATE INDEX idx_mcqs_updated_at");
		expect(migration).toContain("CREATE INDEX idx_mcq_choices_mcq_id");
		expect(migration).toContain("CREATE INDEX idx_mcq_attempts_mcq_id");
		expect(migration).toContain("CREATE INDEX idx_mcq_attempts_user_id");
	});

	it("constrains choice correctness, position, and attempt correctness flags", () => {
		const migration = readFileSync(migrationPath, "utf-8");

		expect(migration).toContain("CHECK (is_correct IN (0, 1))");
		expect(migration).toContain("CHECK (position >= 0 AND position < 6)");
		expect(migration).toContain("UNIQUE (mcq_id, position)");
	});
});
