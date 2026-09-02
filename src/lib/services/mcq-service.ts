import "server-only";

import { randomBytes } from "node:crypto";

import { getDb } from "@/lib/db";
import {
	InvalidMcqChoiceError,
	McqChoiceConflictError,
	McqNotFoundError,
	McqPersistenceError,
} from "@/lib/errors";
import type { Mcq, McqAttempt, McqChoice, McqListItem, McqPreview } from "@/lib/mcq-types";
import type { CreateMcqInput, UpdateMcqInput } from "@/lib/validation/mcq-schemas";

type Database = Awaited<ReturnType<typeof getDb>>;
type BoundStatement = ReturnType<ReturnType<Database["prepare"]>["bind"]> & {
	sql: string;
	binds: unknown[];
};

interface McqRow {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
	creator_name: string;
}

interface McqChoiceRow {
	id: string;
	mcq_id: string;
	choice: string;
	is_correct: number;
	position: number;
	created_at: string;
	updated_at: string;
}

interface McqAttemptRow {
	id: string;
	mcq_id: string;
	user_id: string;
	selected_choice_id: string;
	is_correct: number;
	created_at: string;
}

function generateId(): string {
	return randomBytes(16).toString("hex");
}

function mapMcqListItem(row: McqRow): McqListItem {
	return {
		id: row.id,
		name: row.name,
		question: row.question,
		createdByUserId: row.created_by_user_id,
		creatorName: row.creator_name,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function mapChoice(row: McqChoiceRow): McqChoice {
	return {
		id: row.id,
		mcqId: row.mcq_id,
		choice: row.choice,
		isCorrect: row.is_correct === 1,
		position: row.position,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function mapMcq(row: McqRow, choices: McqChoice[]): Mcq {
	return {
		id: row.id,
		name: row.name,
		question: row.question,
		createdByUserId: row.created_by_user_id,
		creatorName: row.creator_name,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		choices,
	};
}

function mapAttempt(row: McqAttemptRow): McqAttempt {
	return {
		id: row.id,
		mcqId: row.mcq_id,
		userId: row.user_id,
		selectedChoiceId: row.selected_choice_id,
		isCorrect: row.is_correct === 1,
		createdAt: row.created_at,
	};
}

function bindStatement(db: Database, sql: string, binds: unknown[]): BoundStatement {
	const statement = db.prepare(sql).bind(...binds);
	return Object.assign(statement, { sql, binds });
}

async function loadMcqRow(
	db: Database,
	mcqId: string,
	creatorUserId?: string,
): Promise<McqRow | null> {
	const ownershipClause = creatorUserId ? "AND m.created_by_user_id = ?2" : "";
	const binds = creatorUserId ? [mcqId, creatorUserId] : [mcqId];

	const result = await db
		.prepare(
			`SELECT m.id, m.name, m.question, m.created_by_user_id, m.created_at, m.updated_at, u.full_name AS creator_name
       FROM mcqs m
       JOIN users u ON u.id = m.created_by_user_id
       WHERE m.id = ?1 ${ownershipClause}`,
		)
		.bind(...binds)
		.all<McqRow>();

	return result.results[0] ?? null;
}

async function loadChoices(db: Database, mcqId: string): Promise<McqChoice[]> {
	const result = await db
		.prepare(
			`SELECT id, mcq_id, choice, is_correct, position, created_at, updated_at
       FROM mcq_choices
       WHERE mcq_id = ?1
       ORDER BY position ASC`,
		)
		.bind(mcqId)
		.all<McqChoiceRow>();

	return result.results.map(mapChoice);
}

export async function listMcqs(db: Database, viewerUserId: string): Promise<McqListItem[]> {
	void viewerUserId;
	const result = await db
		.prepare(
			`SELECT m.id, m.name, m.question, m.created_by_user_id, m.created_at, m.updated_at, u.full_name AS creator_name
       FROM mcqs m
       JOIN users u ON u.id = m.created_by_user_id
       ORDER BY m.updated_at DESC`,
		)
		.bind()
		.all<McqRow>();

	return result.results.map(mapMcqListItem);
}

export async function getMcqForPreview(db: Database, mcqId: string): Promise<McqPreview | null> {
	const row = await loadMcqRow(db, mcqId);
	if (!row) {
		return null;
	}

	const choices = await loadChoices(db, mcqId);

	return {
		...mapMcq(row, choices),
		choices: choices.map(({ id, mcqId, choice, position, createdAt, updatedAt }) => ({
			id,
			mcqId,
			choice,
			position,
			createdAt,
			updatedAt,
		})),
	};
}

export async function getMcqById(
	db: Database,
	mcqId: string,
	creatorUserId: string,
): Promise<Mcq> {
	const row = await loadMcqRow(db, mcqId, creatorUserId);
	if (!row) {
		throw new McqNotFoundError();
	}

	const choices = await loadChoices(db, mcqId);
	return mapMcq(row, choices);
}

export async function createMcq(
	db: Database,
	creatorUserId: string,
	input: CreateMcqInput,
): Promise<Mcq> {
	const mcqId = generateId();
	const statements = [
		bindStatement(
			db,
			`INSERT INTO mcqs (id, name, question, created_by_user_id)
       VALUES (?1, ?2, ?3, ?4)`,
			[mcqId, input.name, input.question, creatorUserId],
		),
		...input.choices.map((choice, position) =>
			bindStatement(
				db,
				`INSERT INTO mcq_choices (id, mcq_id, choice, is_correct, position)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
				[generateId(), mcqId, choice.choice, choice.isCorrect ? 1 : 0, position],
			),
		),
	];

	try {
		await db.batch(statements);
	} catch (error) {
		throw new McqPersistenceError(error);
	}

	return getMcqById(db, mcqId, creatorUserId);
}

export async function updateMcq(
	db: Database,
	mcqId: string,
	creatorUserId: string,
	input: UpdateMcqInput,
): Promise<Mcq> {
	const existingMcq = await loadMcqRow(db, mcqId, creatorUserId);
	if (!existingMcq) {
		throw new McqNotFoundError();
	}

	const existingChoices = await db
		.prepare(`SELECT id FROM mcq_choices WHERE mcq_id = ?1`)
		.bind(mcqId)
		.all<{ id: string }>();

	const existingChoiceIds = new Set(existingChoices.results.map((choice) => choice.id));
	const payloadChoiceIds = input.choices.flatMap((choice) => (choice.id ? [choice.id] : []));

	for (const choiceId of payloadChoiceIds) {
		if (!existingChoiceIds.has(choiceId)) {
			throw new McqChoiceConflictError();
		}
	}

	const payloadChoiceIdSet = new Set(payloadChoiceIds);
	const choiceIdsToDelete = [...existingChoiceIds].filter((id) => !payloadChoiceIdSet.has(id));

	const statements: BoundStatement[] = [
		bindStatement(
			db,
			`UPDATE mcqs
       SET name = ?1, question = ?2, updated_at = datetime('now')
       WHERE id = ?3 AND created_by_user_id = ?4`,
			[input.name, input.question, mcqId, creatorUserId],
		),
		...choiceIdsToDelete.map((choiceId) =>
			bindStatement(db, `DELETE FROM mcq_choices WHERE id = ?1 AND mcq_id = ?2`, [
				choiceId,
				mcqId,
			]),
		),
		...input.choices.map((choice, position) => {
			if (choice.id) {
				return bindStatement(
					db,
					`UPDATE mcq_choices
           SET choice = ?1, is_correct = ?2, position = ?3, updated_at = datetime('now')
           WHERE id = ?4 AND mcq_id = ?5`,
					[choice.choice, choice.isCorrect ? 1 : 0, position, choice.id, mcqId],
				);
			}

			return bindStatement(
				db,
				`INSERT INTO mcq_choices (id, mcq_id, choice, is_correct, position)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
				[generateId(), mcqId, choice.choice, choice.isCorrect ? 1 : 0, position],
			);
		}),
	];

	try {
		await db.batch(statements);
	} catch (error) {
		throw new McqPersistenceError(error);
	}

	return getMcqById(db, mcqId, creatorUserId);
}

export async function deleteMcq(
	db: Database,
	mcqId: string,
	creatorUserId: string,
): Promise<boolean> {
	const result = await db
		.prepare(`DELETE FROM mcqs WHERE id = ?1 AND created_by_user_id = ?2`)
		.bind(mcqId, creatorUserId)
		.run();

	if (!result.meta?.changes) {
		throw new McqNotFoundError();
	}

	return true;
}

export async function recordMcqAttempt(
	db: Database,
	mcqId: string,
	userId: string,
	selectedChoiceId: string,
): Promise<McqAttempt> {
	const mcqResult = await db
		.prepare(`SELECT id FROM mcqs WHERE id = ?1`)
		.bind(mcqId)
		.all<{ id: string }>();

	if (!mcqResult.results[0]) {
		throw new McqNotFoundError();
	}

	const choiceResult = await db
		.prepare(
			`SELECT id, is_correct
       FROM mcq_choices
       WHERE id = ?1 AND mcq_id = ?2`,
		)
		.bind(selectedChoiceId, mcqId)
		.all<{ id: string; is_correct: number }>();

	const selectedChoice = choiceResult.results[0];
	if (!selectedChoice) {
		throw new InvalidMcqChoiceError();
	}

	const attemptId = generateId();
	const isCorrect = selectedChoice.is_correct === 1 ? 1 : 0;

	await db
		.prepare(
			`INSERT INTO mcq_attempts (id, mcq_id, user_id, selected_choice_id, is_correct)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
		)
		.bind(attemptId, mcqId, userId, selectedChoiceId, isCorrect)
		.run();

	const attemptResult = await db
		.prepare(
			`SELECT id, mcq_id, user_id, selected_choice_id, is_correct, created_at
       FROM mcq_attempts
       WHERE id = ?1`,
		)
		.bind(attemptId)
		.all<McqAttemptRow>();

	const attemptRow = attemptResult.results[0];
	if (!attemptRow) {
		throw new McqPersistenceError();
	}

	return mapAttempt(attemptRow);
}
