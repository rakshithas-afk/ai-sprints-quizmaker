import "server-only";

import { DuplicateEmailError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { SignUpInput } from "@/lib/validation/auth-schemas";

type Database = Awaited<ReturnType<typeof getDb>>;

export interface User {
	id: string;
	fullName: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}

interface UserRow {
	id: string;
	full_name: string;
	email: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
}

function mapUser(row: Omit<UserRow, "password_hash">): User {
	return {
		id: row.id,
		fullName: row.full_name,
		email: row.email,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export async function createUser(db: Database, input: SignUpInput): Promise<User> {
	const passwordHash = await hashPassword(input.password);

	try {
		await db
			.prepare(
				`INSERT INTO users (full_name, email, password_hash)
         VALUES (?1, ?2, ?3)`,
			)
			.bind(input.fullName, input.email, passwordHash)
			.run();

		const result = await db
			.prepare(
				`SELECT id, full_name, email, created_at, updated_at
         FROM users
         WHERE email = ?1`,
			)
			.bind(input.email)
			.all<Omit<UserRow, "password_hash">>();

		const row = result.results[0];
		if (!row) {
			throw new Error("Failed to create user.");
		}

		return mapUser(row);
	} catch (error) {
		if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
			throw new DuplicateEmailError();
		}
		throw error;
	}
}

export async function getUserByEmail(db: Database, email: string): Promise<User | null> {
	const result = await db
		.prepare(
			`SELECT id, full_name, email, created_at, updated_at
       FROM users
       WHERE email = ?1`,
		)
		.bind(email.toLowerCase())
		.all<Omit<UserRow, "password_hash">>();

	const row = result.results[0];
	return row ? mapUser(row) : null;
}

export async function verifyCredentials(
	db: Database,
	email: string,
	password: string,
): Promise<User | null> {
	const result = await db
		.prepare(
			`SELECT id, full_name, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = ?1`,
		)
		.bind(email.toLowerCase())
		.all<UserRow>();

	const row = result.results[0];
	if (!row) {
		return null;
	}

	const isValid = await verifyPassword(password, row.password_hash);
	if (!isValid) {
		return null;
	}

	return mapUser(row);
}

export async function getUserById(db: Database, id: string): Promise<User | null> {
	const result = await db
		.prepare(
			`SELECT id, full_name, email, created_at, updated_at
       FROM users
       WHERE id = ?1`,
		)
		.bind(id)
		.all<Omit<UserRow, "password_hash">>();

	const row = result.results[0];
	return row ? mapUser(row) : null;
}

export async function deleteUser(db: Database, id: string): Promise<boolean> {
	const result = await db.prepare(`DELETE FROM users WHERE id = ?1`).bind(id).run();
	return result.success;
}

export async function updateUser(
	db: Database,
	id: string,
	input: Partial<{ fullName: string; email: string; password: string }>,
): Promise<User | null> {
	const existing = await getUserById(db, id);
	if (!existing) {
		return null;
	}

	const fullName = input.fullName ?? existing.fullName;
	const email = input.email?.toLowerCase() ?? existing.email;
	let passwordHash: string | undefined;

	if (input.password) {
		passwordHash = await hashPassword(input.password);
	}

	if (passwordHash) {
		await db
			.prepare(
				`UPDATE users
         SET full_name = ?1, email = ?2, password_hash = ?3, updated_at = datetime('now')
         WHERE id = ?4`,
			)
			.bind(fullName, email, passwordHash, id)
			.run();
	} else {
		await db
			.prepare(
				`UPDATE users
         SET full_name = ?1, email = ?2, updated_at = datetime('now')
         WHERE id = ?3`,
			)
			.bind(fullName, email, id)
			.run();
	}

	return getUserById(db, id);
}
