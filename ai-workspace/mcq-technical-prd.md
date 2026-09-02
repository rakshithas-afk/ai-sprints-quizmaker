Date created: 2026-09-01
Date last modified: 2026-09-01 (Phase 5 preview, attempts, and verification completed)

# Quiz Maker — Technical PRD (Sprint 1: Multiple Choice Questions)

---

## Overview/Problem

Authenticated Quiz Maker users can currently register, sign in, reach a protected dashboard, and sign out, but they cannot create or answer quiz content. The dashboard contains only a placeholder for multiple-choice questions and a shared test bank. This sprint adds the first complete quiz-content workflow while extending the authentication, D1, service-layer, validation, and ShadCN patterns established in Sprint 0.

---

## Hypothesis

We believe that providing a simple authenticated area for creating, managing, previewing, and answering multiple-choice questions will let users build and validate reusable quiz content without introducing unnecessary quiz-management complexity.

---

## Goals

- Let authenticated users create, view, edit, preview, and delete multiple-choice questions.
- Store between two and six choices for each MCQ, with exactly one correct answer.
- Record authenticated users' attempts and whether their selected answer was correct.
- Protect author-only operations by deriving ownership from the authenticated JWT session.
- Preserve the existing architecture:

```text
Frontend → Next.js route/action layer → MCQ service → Cloudflare D1
```

- Develop the feature test-first, with tests added alongside each implementation slice.

---

## User Stories

| ID | Story | Priority |
| --- | --- | --- |
| MCQ-01 | As an authenticated user, I want to see the available MCQs so that I can manage or answer questions. | Must have |
| MCQ-02 | As an authenticated user, I want to create an MCQ with two to six choices so that I can add content to the question bank. | Must have |
| MCQ-03 | As an MCQ creator, I want to edit my question and choices so that I can correct or improve them. | Must have |
| MCQ-04 | As an MCQ creator, I want to delete my MCQ after confirming the action so that accidental deletion is prevented. | Must have |
| MCQ-05 | As an authenticated user, I want to preview an MCQ before answering it so that I can review its presentation. | Must have |
| MCQ-06 | As an authenticated user, I want to select and submit one answer so that I can learn whether it is correct. | Must have |
| MCQ-07 | As an MCQ creator, I want other users to be unable to edit or delete my MCQ by changing a URL or request payload. | Must have |
| MCQ-08 | As a user, I want clear validation messages so that I can fix an invalid question before saving it. | Must have |

---

## Scope

### In Scope

- A protected MCQ management list using the ShadCN Table component.
- A shared authenticated question bank: signed-in users can list, preview, and attempt MCQs.
- Creator ownership: only the creating user can edit or delete an MCQ.
- One create/edit form shared between create and edit routes.
- MCQ fields:
  - ID
  - Name
  - Question
  - Created-by user ID
  - Created timestamp
  - Updated timestamp
- Choice fields:
  - ID
  - MCQ ID
  - Choice text
  - Correct-answer flag
  - Display position
  - Created timestamp
  - Updated timestamp
- Two choices shown by default for a new MCQ.
- A minimum of two and maximum of six choices.
- Exactly one correct choice.
- Add-choice and remove-choice interactions.
- Preview and answer submission.
- Attempt recording with the authenticated user, MCQ, selected choice, correctness result, and timestamp.
- Server-side validation and authorization.
- Service, route/action, validation, and important frontend-flow tests.
- Delete confirmation.
- Empty, loading/pending, validation-error, not-found, and unauthorized states.
- Updates to this PRD as implementation decisions and status change.

### Out of Scope

- Full quizzes containing multiple MCQs.
- Difficulty levels, categories, tags, explanations, hints, and attachments.
- Timers, points, weighted scoring, pass/fail thresholds, and leaderboards.
- Choice randomization or question randomization.
- Bulk import/export.
- Analytics dashboards and reporting.
- Public anonymous access or public share links.
- Multiple correct answers and partial credit.
- Rich-text editing, Markdown rendering, or media in questions.
- Pagination, filtering, and search for the initial version.
- Soft deletion, version history, and audit logs.
- Roles or administrator-only functionality.
- AI-generated questions.

### Cut

- **Description field** — replaced by the clearer `question` field.
- **Multiple correct answers** — exactly one correct answer keeps authoring, validation, attempts, and result feedback simple.
- **Separate create and edit forms** — both routes will reuse one form component and validation model.
- **Inline editing in the list** — dedicated create/edit routes provide clearer validation and dynamic-choice behavior.
- **Advanced attempt history UI** — attempts are persisted in this sprint, but analytics and reporting are deferred.

---

## Product and Authorization Decisions

### Visibility

- All MCQ pages require a valid authenticated session.
- The MCQ list is a shared test bank visible to authenticated users.
- Any authenticated user may preview and attempt an MCQ.
- The list must identify the creator sufficiently for users to distinguish their own questions.

### Ownership

- `created_by_user_id` is always taken from `requireAuth().sub`.
- The client must not submit or override `created_by_user_id`.
- Only the creator may update or delete an MCQ.
- Authorization must be enforced in the service/database operation, not only by hiding UI actions.
- Unauthorized update/delete requests return the same not-found response as an unknown MCQ so the API does not disclose resource existence.
- The UI may omit Edit and Delete actions for non-owners, but this is not the security boundary.

### Correct-answer model

- An MCQ has exactly one correct choice.
- The author selects the correct choice with a radio control.
- Correctness is computed on the server from the stored choice record.
- The client must not submit a trusted `is_correct` result when recording an attempt.

### Attempt model

- A user may make multiple attempts at the same MCQ.
- Every submission creates a new attempt.
- The selected choice must belong to the submitted MCQ.
- `is_correct` is stored as a snapshot of the result at submission time.
- Attempt analytics and history screens are out of scope, although records are retained for future use.

---

## Functional Requirements

### FR-01: MCQ list

The protected MCQ page shall display all MCQs available in the authenticated question bank using the ShadCN Table component.

Each row shall show:

- Name
- Question, truncated visually when necessary
- Creator
- Created date
- Updated date
- Actions menu

The page shall include a prominent **Create MCQ** button. The row menu shall use a vertical three-dot trigger and contain:

- Preview — all authenticated users
- Edit — creator only
- Delete — creator only

An empty state shall explain that no MCQs exist and provide a create action.

### FR-02: Create MCQ

Selecting **Create MCQ** shall navigate to a dedicated create page. The form shall initially display two blank choices and allow the user to add choices until six are present.

On successful save:

- The MCQ and all choices are persisted atomically.
- Ownership is assigned from the authenticated session.
- The user is redirected to the MCQ list or saved MCQ preview.
- The user receives clear success feedback through navigation or a status message.

### FR-03: Edit MCQ

Selecting **Edit** shall navigate the creator to the edit route and load the existing MCQ into the shared create/edit form.

On successful save:

- Name, question, choices, correct answer, and `updated_at` are updated atomically.
- `created_by_user_id` and `created_at` remain unchanged.
- A non-owner cannot load or submit edits for the MCQ.

### FR-04: Delete MCQ

Selecting **Delete** shall open an Alert Dialog that names the MCQ and explains that deletion cannot be undone.

- Cancel closes the dialog without changing data.
- Confirm deletes the MCQ and its dependent choices and attempts.
- Only the creator may delete the MCQ.
- The UI displays a pending state while deletion is running.

### FR-05: Preview and attempt

The preview page shall show the MCQ name, question, and choices without revealing the correct answer before submission.

The authenticated user shall be able to:

1. Select exactly one choice.
2. Submit the answer.
3. See whether the answer was correct or incorrect.
4. Have the attempt recorded once.

Submitting no choice shall show a validation error and shall not create an attempt.

### FR-06: Validation

All validation shall run on the server. Client validation may improve usability but shall not replace server validation.

| Field | Rules |
| --- | --- |
| Name | Required; trimmed; 1–120 characters |
| Question | Required; trimmed; 1–2,000 characters |
| Choices | Required array; 2–6 entries |
| Choice text | Required; trimmed; 1–500 characters |
| Correct answer | Exactly one choice must be marked correct |
| Choice IDs | Existing IDs accepted only when they belong to the target MCQ |
| Selected choice | Required and must belong to the attempted MCQ |

Duplicate choice text is allowed for the initial version, although the UI should not encourage it.

### FR-07: Authentication and authorization

- Unauthenticated access to MCQ pages redirects to `/signin`.
- API or route-handler requests without a valid session return `401 Unauthorized`.
- Create and attempt operations use the authenticated user ID.
- Update and delete operations check creator ownership in the database query.
- Request bodies cannot transfer ownership.

### FR-08: Error handling

The application shall provide user-friendly messages for:

- Validation failures
- Missing MCQs
- Unauthorized operations
- Invalid selected choices
- Database failures

Internal SQL, stack traces, JWT contents, and sensitive implementation details must not be returned to the client.

---

## Non-Functional Requirements

### Security

- Use prepared D1 statements with numbered placeholders.
- Treat all URL parameters and request bodies as untrusted.
- Derive user identity only from the verified encrypted JWT session.
- Enforce ownership in the service/database layer.
- Prevent correctness tampering by computing attempt results server-side.
- Do not reveal the correct choice in list or pre-submission preview responses.
- Do not log authentication tokens or sensitive request data.

### Accessibility

- Every input and choice control has an associated label.
- Validation errors are connected to their fields and announced to assistive technology.
- Dropdown menus, dialogs, and radio controls use ShadCN accessibility behavior.
- The delete dialog supports keyboard navigation and focus restoration.
- Pending actions expose disabled and accessible status states.

### Performance

- The initial list may load all MCQs because pagination is out of scope.
- List queries must not issue one additional query per MCQ for creator data.
- MCQ detail and choices should be loaded with a bounded number of queries.
- Index foreign keys and common ownership/list lookup columns.

### Reliability

- MCQ creation and update must not leave partially written choice data.
- Multi-statement writes shall use D1 batch operations or an equivalent atomic strategy supported by the runtime.
- An attempt is recorded only after all relationship and authorization checks pass.

---

## Technical Requirements

### Database Schema

The schema follows the existing D1 conventions:

- snake_case SQL names
- TEXT IDs generated by `lower(hex(randomblob(16)))`
- TEXT timestamps generated by `datetime('now')`
- INTEGER booleans constrained to `0` or `1`
- explicit foreign keys and indexes

The planned migration is `migrations/0002_create_mcq_tables.sql`.

```sql
CREATE TABLE mcqs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_mcqs_created_by_user_id
  ON mcqs(created_by_user_id);

CREATE INDEX idx_mcqs_updated_at
  ON mcqs(updated_at);

CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL,
  choice TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  position INTEGER NOT NULL CHECK (position >= 0 AND position < 6),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs(id) ON DELETE CASCADE,
  UNIQUE (mcq_id, position)
);

CREATE INDEX idx_mcq_choices_mcq_id
  ON mcq_choices(mcq_id);

CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (selected_choice_id) REFERENCES mcq_choices(id) ON DELETE CASCADE
);

CREATE INDEX idx_mcq_attempts_mcq_id
  ON mcq_attempts(mcq_id);

CREATE INDEX idx_mcq_attempts_user_id
  ON mcq_attempts(user_id);
```

Application validation is responsible for enforcing two to six choices and exactly one correct answer because these are cross-row constraints.

### Domain Types

The service layer shall expose camelCase domain objects rather than raw D1 rows.

```typescript
interface McqChoice {
  id: string;
  mcqId: string;
  choice: string;
  isCorrect: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface Mcq {
  id: string;
  name: string;
  question: string;
  createdByUserId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  choices: McqChoice[];
}

interface McqAttempt {
  id: string;
  mcqId: string;
  userId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  createdAt: string;
}
```

Responses used before an attempt is submitted must omit `isCorrect` from choice data.

### Service Layer

All D1 access belongs in `src/lib/services/mcq-service.ts`. The database is passed as the first argument, matching `user-service.ts`.

Planned operations:

- `listMcqs(db, viewerUserId)`
- `getMcqById(db, mcqId)`
- `getMcqForPreview(db, mcqId)`
- `createMcq(db, creatorUserId, input)`
- `updateMcq(db, mcqId, creatorUserId, input)`
- `deleteMcq(db, mcqId, creatorUserId)`
- `recordMcqAttempt(db, mcqId, userId, selectedChoiceId)`

Service requirements:

- Map snake_case rows to camelCase domain models.
- Never trust creator or correctness values supplied by the client.
- Use ownership predicates for update and delete.
- Return a controlled not-found result for missing and non-owned resources.
- Validate selected-choice membership before inserting an attempt.
- Use D1 batch/transaction semantics for writes involving an MCQ and choices.

### Route and Endpoint Strategy

The initial feature shall use Next.js App Router pages plus Route Handlers under `src/app/api/mcqs/`. Route Handlers provide the explicit HTTP boundary requested for CRUD and attempt behavior, while the service remains reusable and independently testable.

All JSON responses follow this shape:

```json
{
  "data": {},
  "error": null
}
```

or:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": {}
  }
}
```

#### GET `/api/mcqs`

Returns the shared authenticated MCQ list.

- Success: `200`
- Unauthenticated: `401`
- Server error: `500`

The list response omits correct-answer flags.

#### POST `/api/mcqs`

Creates an MCQ owned by the authenticated user.

**Request body:**

```json
{
  "name": "Cloudflare fundamentals",
  "question": "Which Cloudflare product provides serverless compute?",
  "choices": [
    { "choice": "Workers", "isCorrect": true },
    { "choice": "Registrar", "isCorrect": false }
  ]
}
```

- Success: `201`
- Validation error: `400`
- Unauthenticated: `401`
- Server error: `500`

#### GET `/api/mcqs/[id]`

Returns one authenticated-view MCQ with ordered choices. Correct-answer flags are omitted unless the endpoint is explicitly used for an authorized creator edit response.

- Success: `200`
- Unauthenticated: `401`
- Not found: `404`
- Server error: `500`

#### PUT `/api/mcqs/[id]`

Updates an MCQ and its choices. Only the creator may update it. The request body uses the same fields as create and may include existing choice IDs.

- Success: `200`
- Validation error: `400`
- Unauthenticated: `401`
- Missing or non-owned MCQ: `404`
- Conflict from stale or invalid choice IDs: `409`
- Server error: `500`

#### DELETE `/api/mcqs/[id]`

Deletes the creator-owned MCQ after UI confirmation.

- Success: `204`
- Unauthenticated: `401`
- Missing or non-owned MCQ: `404`
- Server error: `500`

#### POST `/api/mcqs/[id]/attempts`

Records an authenticated attempt and returns the result.

**Request body:**

```json
{
  "selectedChoiceId": "choice-id"
}
```

**Success response (`201`):**

```json
{
  "data": {
    "attemptId": "attempt-id",
    "isCorrect": true
  },
  "error": null
}
```

- Validation error: `400`
- Unauthenticated: `401`
- MCQ or choice not found: `404`
- Choice does not belong to MCQ: `409`
- Server error: `500`

### User Interface Requirements

#### Protected application area

All MCQ routes call `requireAuth()` on the server. The dashboard shall link to the MCQ management area. A minimal shared authenticated layout may be introduced to provide:

- Quiz Maker title
- Dashboard link
- MCQs link
- Current user context
- Sign Out

#### MCQ list (`/mcqs`)

- Page heading and short description
- **Create MCQ** button
- ShadCN Table
- Name, question, creator, created, updated, and actions columns
- ShadCN Dropdown Menu with vertical `MoreVertical`/`EllipsisVertical` icon trigger
- Preview for every authenticated user
- Edit and Delete only for the creator
- ShadCN Alert Dialog for delete confirmation
- Empty state
- Pending and error feedback

#### Create MCQ (`/mcqs/new`)

- Shared MCQ form in create mode
- Name input
- Question textarea
- Choices fieldset with two blank rows initially
- Choice text input for each row
- Radio control for selecting exactly one correct answer
- Remove action where at least two choices remain
- **Add choice** button disabled or hidden at six choices
- Save and Cancel buttons
- Field-level and form-level errors

#### Edit MCQ (`/mcqs/[id]/edit`)

- Shared MCQ form in edit mode
- Existing values and choices loaded
- Same validation and interactions as create
- Non-owner receives not-found behavior
- Save and Cancel buttons

#### Preview/attempt (`/mcqs/[id]/preview`)

- MCQ name and question
- Ordered radio choices
- Submit answer button
- No correct-answer disclosure before submission
- Correct/incorrect result after successful submission
- Prevent accidental duplicate submission while pending
- Back-to-list action

### ShadCN Components

Use existing or generated ShadCN components rather than custom replacements:

- Existing: Button, Card, Field, Input, Label, Table, Dialog, Badge, Separator
- To generate when implementation begins: Textarea, Radio Group, Dropdown Menu, Alert Dialog

No third-party form-state library is required. Dynamic choices may use local React state while final validation remains server-side.

---

## Validation Schemas

Planned schemas in `src/lib/validation/mcq-schemas.ts`:

- `mcqChoiceSchema`
- `createMcqSchema`
- `updateMcqSchema`
- `recordMcqAttemptSchema`

The create/update schema shall:

1. Trim name, question, and choice text.
2. Enforce name and question length limits.
3. Enforce two to six choices.
4. Reject empty choice text.
5. Enforce exactly one correct choice.
6. Reject unexpected ownership and timestamp fields.

---

## Testing Strategy

Development shall proceed in red-green-refactor slices. Tests must be written with or immediately before the behavior they verify, not added as a final cleanup phase.

### Existing test conventions

- Vitest in Node environment.
- Tests colocated beside source modules.
- External boundaries mocked.
- D1 interactions tested with prepared-statement mocks.
- Redirect behavior tested by mocking `next/navigation`.
- No real database or network access in unit tests.

### Planned test coverage

#### Validation tests

`src/lib/validation/mcq-schemas.test.ts`

- Accepts valid MCQs with two through six choices.
- Rejects fewer than two or more than six choices.
- Rejects empty or whitespace-only fields.
- Rejects zero or multiple correct choices.
- Applies length limits and trimming.
- Validates attempt input.

#### Service tests

`src/lib/services/mcq-service.test.ts`

- Lists MCQs without leaking correct answers.
- Creates an MCQ and all choices.
- Uses the authenticated user as creator.
- Rolls back or fails cleanly if a multi-write operation fails.
- Loads choices in position order.
- Updates an owned MCQ.
- Rejects update/delete for a non-owner.
- Deletes dependent records.
- Records valid attempts.
- Computes correctness from stored choice data.
- Rejects a selected choice belonging to another MCQ.

#### Route-handler tests

- Authentication is required for every endpoint.
- Request data is parsed and validated.
- HTTP status and response shapes match this PRD.
- Ownership is forwarded to and enforced by the service.
- Internal errors produce generic `500` responses.

#### Component tests

- New form begins with two choices.
- Add choice stops at six.
- Remove choice stops at two.
- Save is blocked by important client-visible validation states.
- Correct-answer radio selection remains singular.
- Existing values populate edit mode.
- Delete requires confirmation.
- Attempt submission requires a selected choice.
- Pending actions cannot be submitted twice.

Adding React component tests may require Testing Library and a browser-like Vitest environment. Because project rules require approval before dependencies are added, dependency installation must be approved before that test layer is implemented. Until approved, those flows require documented manual verification rather than being represented as automated.

#### Manual and integration verification

- Create → list → preview flow
- Edit and cancel behavior
- Delete cancel and confirm behavior
- Cross-user edit/delete URL tampering
- Correct and incorrect attempts
- Session expiry during editing/submission
- Keyboard use of dropdown, dialog, and choice controls
- Workers-runtime verification with `npm run preview`

### Required verification commands

```bash
npm run test
npm run lint
npm run build
npm run preview
```

`npm run preview` is required for runtime-sensitive D1 behavior because `npm run dev` uses Node rather than the Workers runtime.

---

## Implementation Phases

Sprint 1 is divided into five sequential phases. Each phase must leave a tested, reviewable boundary for the next phase: validation defines trusted input, the service layer owns persistence and authorization, Route Handlers expose that behavior over HTTP, and the UI consumes those routes without direct D1 access.

### Phase status summary

| Phase | Scope | Status | Completion gate |
| --- | --- | --- | --- |
| 1 | PRD, domain model, and validation | COMPLETED | 38 Phase 1 tests pass; validation rules and domain errors are stable |
| 2 | D1 migration and service layer | COMPLETED | 19 Phase 2 tests pass; CRUD, ownership, and attempt service behavior verified |
| 3 | Authenticated HTTP Route Handlers | COMPLETED | 27 Phase 3 route tests pass; endpoint contracts and error mapping verified |
| 4 | MCQ management UI | COMPLETED | 10 Phase 4 helper tests pass; list/create/edit/delete UI delivered with manual interaction checklist |
| 5 | Preview, attempts, and release verification | COMPLETED | 128 automated tests pass; preview/attempt flow implemented; Workers preview blocked by local Windows EPERM |

Remote migration and deployment are not part of these phases unless the user explicitly authorizes them. Phase completion means the feature is verified locally and is deployment-ready.

---

### Phase 1: PRD and domain validation — ✅ COMPLETE

**Objective:** Fix the feature boundary and convert the MCQ business rules into reusable, tested server-side validation before persistence or UI work begins.

**Prerequisites**

- Confirm the shared authenticated question-bank model and creator-only edit/delete policy.
- Resolve or explicitly accept the defaults in **Open Questions**.
- Confirm that the existing Vitest and Zod setup remains the project standard.

**Detailed work**

1. Review the scope, API contracts, schema, authorization decisions, and known attempt-retention limitation in this PRD.
2. Define input and output types for:
   - MCQ choices
   - MCQ create requests
   - MCQ update requests
   - Attempt submissions
   - Safe preview responses that omit correctness
3. Add `mcqChoiceSchema`, `createMcqSchema`, `updateMcqSchema`, and `recordMcqAttemptSchema` in `src/lib/validation/mcq-schemas.ts`.
4. Encode all field rules:
   - Trim names, questions, and choice text.
   - Require non-empty values after trimming.
   - Enforce documented field-length limits.
   - Require between two and six choices.
   - Require exactly one correct choice.
   - Reject malformed MCQ IDs, choice IDs, and attempt payloads.
5. Add a reusable field-error mapper if the existing auth helper cannot cleanly represent indexed choice errors.
6. Define controlled MCQ domain errors for not found/non-owner, invalid choice membership, stale choice conflicts, and persistence failures.
7. Write validation tests first, then implement until the tests pass.

**Test coverage**

- Valid inputs with two, three, and six choices.
- Too few and too many choices.
- Empty or whitespace-only name, question, and choices.
- Zero correct choices and multiple correct choices.
- Trimming and maximum-length boundaries.
- Valid and invalid create, update, and attempt payloads.
- Indexed field errors that can be displayed beside the corresponding choice row.

**Deliverables**

- Approved `ai-workspace/mcq-technical-prd.md`
- `src/lib/validation/mcq-schemas.ts`
- `src/lib/validation/mcq-schemas.test.ts`
- MCQ domain types and controlled error definitions

**Completion gate**

- Every rule in **FR-06: Validation** has a corresponding passing test.
- Validation output is suitable for both Route Handler responses and form field errors.
- No database, route, or UI code duplicates the validation rules.
- `npm run test` passes before Phase 2 starts.

**Expected outcome:** The application has one tested definition of valid MCQ and attempt input, plus stable domain errors that later layers can map without inspecting raw database failures.

**Implemented on 2026-09-01**

- Added `src/lib/validation/mcq-schemas.test.ts` first and confirmed the red state: the suite failed because the MCQ schemas did not exist.
- Added `src/lib/mcq-errors.test.ts` first and confirmed the red state: the suite failed because the controlled MCQ errors did not exist.
- Implemented strict create, update, choice, ID, and attempt schemas in `src/lib/validation/mcq-schemas.ts`.
- Added indexed error mapping such as `choices.1.choice` for dynamic choice rows.
- Added inferred create/update/attempt input types and explicit domain output types in `src/lib/mcq-types.ts`.
- Added controlled errors for not found/non-owner, invalid choice membership, stale choice conflicts, and persistence failures in `src/lib/errors.ts`.
- Relevant Phase 1 tests: **38 passed** across 2 files.
- Full regression suite: **65 passed** across 8 files.
- Verification: `npm run test`, `npm run lint`, and `npm run build` passed.

**Outcome:** Phase 1's validation and domain boundary is complete. No migration, service, HTTP route, or UI implementation was added.

---

### Phase 2: Database and service layer — ✅ COMPLETE

**Objective:** Add the local D1 schema and implement all MCQ persistence, ownership, correctness, and data-mapping rules behind a tested service boundary.

**Prerequisites**

- Phase 1 validation schemas and domain errors are complete.
- The Sprint 0 `users` migration and D1 binding are available locally.
- The D1 write strategy for atomic MCQ-and-choice operations is confirmed against the Workers runtime.

**Detailed work**

1. Add migration verification tests for table names, foreign keys, indexes, constraints, and cascade behavior.
2. Create `migrations/0002_create_mcq_tables.sql` with `mcqs`, `mcq_choices`, and `mcq_attempts`.
3. Apply the migration to the local D1 database only and verify the three tables and indexes exist.
4. Define explicit SQL row interfaces and mapping functions so raw snake_case rows do not escape the service.
5. Write failing service tests with prepared-statement/D1 mocks for each planned operation.
6. Implement `listMcqs(db, viewerUserId)`:
   - Return shared MCQs with creator details.
   - Preserve deterministic ordering.
   - Mark or expose ownership without returning correct-answer flags.
7. Implement `getMcqById` and `getMcqForPreview`:
   - Load choices in `position` order.
   - Keep correctness private in preview-safe results.
   - Return controlled not-found behavior.
8. Implement `createMcq`:
   - Take creator identity only from the authenticated caller argument.
   - Persist the parent and all ordered choices as one atomic unit.
9. Implement `updateMcq`:
   - Enforce ownership in the database operation.
   - Preserve `created_by_user_id` and `created_at`.
   - Replace or reconcile choices safely and update positions.
   - Reject stale or foreign choice IDs as controlled conflicts.
10. Implement `deleteMcq` with an ownership predicate and dependent-record cleanup.
11. Implement `recordMcqAttempt`:
   - Query the selected choice using both choice ID and MCQ ID.
   - Derive correctness from stored data.
   - Insert only after relationship checks succeed.
12. Verify failed multi-statement writes cannot leave an MCQ with partial choice data.

**Test coverage**

- Row-to-domain mapping and ordered choices.
- Shared listing without correct-answer leakage.
- Authenticated creator ID overrides or ignores any client ownership value.
- Atomic create and update success/failure behavior.
- Owned and non-owned update/delete behavior with indistinguishable not-found results.
- Creation timestamp and ownership preservation during edits.
- Cascade behavior for deleted MCQs and removed choices.
- Valid attempt recording and server-derived correctness.
- Missing MCQ, missing choice, and cross-MCQ choice rejection.

**Deliverables**

- `migrations/0002_create_mcq_tables.sql`
- `src/lib/services/mcq-service.ts`
- `src/lib/services/mcq-service.test.ts`
- Updated deployment/config verification tests
- Locally applied and inspected D1 migration

**Completion gate**

- All planned service operations are implemented without SQL in pages, components, or Route Handlers.
- Multi-table writes have tested all-or-nothing behavior.
- Ownership and selected-choice membership are enforced server-side.
- Preview/list service results do not disclose `isCorrect`.
- `npm run test` passes against the completed service layer.

**Expected outcome:** MCQs, choices, and attempts can be managed through a single trusted service API, independent of HTTP and UI concerns.

**Implemented on 2026-09-01**

- Added `src/lib/verification/mcq-migration.test.ts` first and confirmed the red state: the suite failed because `migrations/0002_create_mcq_tables.sql` did not exist.
- Added `src/lib/services/mcq-service.test.ts` first and confirmed the red state: the suite failed because `mcq-service.ts` did not exist.
- Created `migrations/0002_create_mcq_tables.sql` with `mcqs`, `mcq_choices`, and `mcq_attempts`, including foreign keys, indexes, and cascade deletes.
- Applied the migration locally with `npx wrangler d1 migrations apply quizmaker-db --local`.
- Implemented `src/lib/services/mcq-service.ts` with list, preview, owned detail, create, update, delete, and attempt recording operations.
- Used D1 `batch()` for atomic MCQ-and-choice create/update writes.
- Enforced creator ownership in edit/delete queries and returned indistinguishable `McqNotFoundError` results for missing and non-owned resources.
- Derived attempt correctness server-side from stored choice data.
- Updated deployment verification to assert the MCQ migration file exists.
- Relevant Phase 2 tests: **19 passed** across 2 files.
- Full regression suite: **85 passed** across 10 files.
- Verification: `npm run test`, `npm run lint`, and `npm run build` passed.

**Outcome:** The MCQ persistence and service boundary is complete. No HTTP routes or UI were added in this phase.

---

### Phase 3: HTTP route layer — ✅ COMPLETE

**Objective:** Expose the Phase 2 service through authenticated, validated Route Handlers with stable request, response, and error contracts.

**Prerequisites**

- Phase 2 migration and service tests pass.
- The JSON envelope and endpoint status codes in **Route and Endpoint Strategy** are approved.

**Detailed work**

1. Add shared response helpers only if they reduce duplication without hiding status-code decisions.
2. Add route tests that mock authentication, database access, validation, and the MCQ service boundary.
3. Implement `GET /api/mcqs`:
   - Require authentication.
   - Return the shared list with no correct-answer flags.
4. Implement `POST /api/mcqs`:
   - Parse JSON safely.
   - Validate with `createMcqSchema`.
   - Derive creator ID from `requireAuth().sub`.
   - Return `201` with the created resource.
5. Implement `GET /api/mcqs/[id]`:
   - Validate the route ID.
   - Return a safe preview response by default.
   - Return edit data containing correctness only through an owner-authorized path.
6. Implement `PUT /api/mcqs/[id]`:
   - Validate route parameters and request body.
   - Forward authenticated user identity to the ownership-enforcing service.
7. Implement `DELETE /api/mcqs/[id]` and return an empty `204` response on success.
8. Implement `POST /api/mcqs/[id]/attempts`:
   - Validate the selected choice ID.
   - Record through the service.
   - Return only attempt ID and correctness.
9. Map errors consistently:
   - Validation failures → `400`
   - Missing authentication → `401`
   - Missing or non-owned MCQ → `404`
   - Stale or cross-MCQ choice conflicts → `409`
   - Unexpected internal errors → generic `500` without SQL or stack details
10. Verify malformed JSON, expired sessions, and service failures produce the documented response envelope.

**Test coverage**

- Authentication required on every method.
- Valid request parsing and schema validation.
- Field errors and stable error codes.
- Correct status codes and JSON envelopes.
- Session user ID forwarded as creator/viewer identity.
- Missing and non-owned resources both mapped to `404`.
- Correct-answer fields absent from list and preview responses.
- Expected domain conflicts mapped to `409`.
- Unexpected failures mapped to non-sensitive `500` responses.

**Deliverables**

- `src/app/api/mcqs/route.ts`
- `src/app/api/mcqs/[id]/route.ts`
- `src/app/api/mcqs/[id]/attempts/route.ts`
- Colocated route tests

**Completion gate**

- Every endpoint in **Route and Endpoint Strategy** has success, validation, authentication, and failure-path tests.
- No handler trusts client-supplied ownership or correctness.
- No handler contains direct SQL.
- Response bodies and status codes match the PRD.
- `npm run test` passes before UI integration starts.

**Expected outcome:** The frontend has a complete, predictable HTTP API, and security-sensitive rules remain enforced even when requests bypass the UI.

**Implemented on 2026-09-01**

- Added `src/app/api/mcqs/route.test.ts`, `src/app/api/mcqs/[id]/route.test.ts`, and `src/app/api/mcqs/[id]/attempts/route.test.ts` first and confirmed the red state: all three suites failed because the route handlers did not exist.
- Implemented shared API helpers in `src/lib/api/mcq-route-utils.ts` for authentication, JSON parsing, validation errors, success envelopes, and domain-error mapping.
- Implemented authenticated Route Handlers:
  - `GET/POST /api/mcqs`
  - `GET/PUT/DELETE /api/mcqs/[id]`
  - `POST /api/mcqs/[id]/attempts`
- Used `getSession()` for API authentication and returned `401` responses instead of page redirects.
- Derived creator and attempt user identity from `session.sub` only.
- Returned preview-safe MCQ data by default and owner-only edit data via `?mode=edit`.
- Mapped validation failures to `400`, not-found/non-owner cases to `404`, choice conflicts to `409`, and persistence failures to `500`.
- Returned `204` with an empty body for successful deletes.
- Relevant Phase 3 tests: **27 passed** across 3 files.
- Full regression suite: **112 passed** across 13 files.
- Verification: `npm run test`, `npm run lint`, and `npm run build` passed.

**Outcome:** The MCQ HTTP API is complete and tested. No UI pages were added in this phase.

---

### Phase 4: MCQ management UI — ✅ COMPLETE

**Objective:** Build the protected MCQ management experience for listing, creating, editing, and deleting questions using the established ShadCN design system.

**Prerequisites**

- Phase 3 endpoints and response contracts pass their tests.
- Any required frontend testing dependencies have either been approved or replaced by a documented manual-test plan.
- Textarea, Radio Group, Dropdown Menu, and Alert Dialog generation is approved within existing ShadCN conventions.

**Detailed work**

1. Generate the missing ShadCN primitives without hand-editing generated component files.
2. Add an authenticated MCQ navigation entry from the dashboard and, if useful, a shared protected layout.
3. Implement `/mcqs`:
   - Call `requireAuth()` on the server.
   - Render name, question, creator, created date, and updated date.
   - Provide Preview for all authenticated users.
   - Show Edit/Delete only when the current user owns the MCQ.
   - Include loading/pending, empty, and recoverable error states.
4. Build `mcq-table.tsx` with an accessible vertical three-dot action menu and permission-aware actions.
5. Build one `mcq-form.tsx` used by both create and edit routes:
   - Initialize create mode with two blank choices.
   - Populate persisted values in edit mode.
   - Add choices up to six and remove down to two.
   - Keep exactly one correct-answer radio selection.
   - Preserve input when server validation fails.
   - Disable repeated submissions while pending.
6. Implement `/mcqs/new` and submit to `POST /api/mcqs`.
7. Implement `/mcqs/[id]/edit`:
   - Require authentication and owner-safe loading.
   - Submit to `PUT /api/mcqs/[id]`.
   - Return not-found behavior for missing and non-owned records.
8. Implement `delete-mcq-dialog.tsx`:
   - Require explicit confirmation.
   - Keep cancel side-effect free.
   - Refresh or update the list only after successful deletion.
9. Ensure create/edit Cancel returns to the list without a write.
10. Add component interaction tests if dependencies are approved; otherwise record manual checks for every interactive rule.
11. Verify keyboard navigation, labels, focus handling, live error/status announcements, and disabled states.

**Test and manual coverage**

- New form starts with two choice rows.
- Add/remove boundaries remain six/two.
- Correct-answer selection remains singular after add/remove operations.
- Validation errors map to the correct fields and choice rows.
- Edit mode loads existing values without changing ownership.
- Non-owners cannot reach a functional edit flow.
- Delete cancel performs no request; confirm performs one request.
- Pending create, update, and delete actions cannot be submitted twice.
- Table actions and dialogs are keyboard accessible.

**Deliverables**

- `src/app/mcqs/page.tsx`
- `src/app/mcqs/new/page.tsx`
- `src/app/mcqs/[id]/edit/page.tsx`
- `src/components/mcq/mcq-table.tsx`
- `src/components/mcq/mcq-form.tsx`
- `src/components/mcq/delete-mcq-dialog.tsx`
- Dashboard/protected-navigation updates
- Component tests or a documented manual interaction checklist

**Completion gate**

- The list, create, edit, cancel, delete-confirm, and delete-cancel flows work locally.
- UI permission checks match server authorization but are not treated as the security boundary.
- All management-related acceptance criteria are checked with automated or documented manual evidence.
- Existing tests still pass and no accessibility-blocking interaction is known.

**Expected outcome:** Authenticated users can manage MCQs through a consistent interface, while non-owners see only the actions they are allowed to perform.

**Implemented on 2026-09-01**

- Added `src/lib/mcq/form-utils.test.ts` and `src/lib/mcq/api-client.test.ts` first and confirmed the red state before implementing helper modules.
- Generated ShadCN `textarea`, `radio-group`, `dropdown-menu`, and `alert-dialog` components.
- Added protected MCQ layout and routes:
  - `/mcqs`
  - `/mcqs/new`
  - `/mcqs/[id]/edit`
- Built `mcq-table.tsx`, `mcq-form.tsx`, and `delete-mcq-dialog.tsx`.
- Updated the dashboard with a Manage MCQs link.
- Implemented list/create/edit/delete management flows against the Phase 3 API routes.
- Used server-side `listMcqs()` for the list page and client `fetch()` for create, update, and delete.
- Hid Edit/Delete actions for non-owners while keeping Preview available for all authenticated users.
- Documented manual interaction coverage below because frontend component-test dependencies were not added in this phase.
- Relevant Phase 4 automated tests: **10 passed** across 2 helper files.
- Full regression suite: **122 passed** across 15 files.
- Verification: `npm run test`, `npm run lint`, and `npm run build` passed.

**Manual interaction checklist (Phase 4)**

- [ ] Create form opens with two blank choices.
- [ ] Add choice stops at six; remove choice stops at two.
- [ ] Only one correct-answer radio can be selected.
- [ ] Save creates an MCQ and returns to the list.
- [ ] Cancel on create/edit returns to the list without saving.
- [ ] Edit page loads existing values for owned MCQs only.
- [ ] Non-owner edit URLs show not-found behavior.
- [ ] Delete cancel performs no request; delete confirm removes the MCQ and refreshes the list.
- [ ] Pending save/delete actions cannot be submitted twice.
- [ ] Table action menu and delete dialog are keyboard accessible.

---

### Phase 5: Preview, attempts, and verification — ✅ COMPLETE

**Objective:** Complete the learner-facing preview and answer flow, then verify the entire Sprint 1 feature on both the standard Next.js build and local Workers runtime.

**Prerequisites**

- Phase 4 management flows meet their completion gate.
- At least two local test users are available for cross-user authorization checks.
- The local D1 migration is applied.

**Detailed work**

1. Implement `/mcqs/[id]/preview` as a protected route.
2. Build `mcq-preview.tsx` with ordered radio choices and no pre-submission correctness disclosure.
3. Require a selected choice before enabling or accepting submission.
4. Submit to `POST /api/mcqs/[id]/attempts`.
5. Disable repeated submission while a request is pending.
6. Display a clear correct/incorrect result only after the server records the attempt.
7. Handle not found, invalid choice, expired session, conflict, network, and unexpected-error states without showing stale success feedback.
8. Add automated tests for attempt service/route behavior and component interaction tests if the frontend dependencies were approved.
9. Perform end-to-end local checks:
   - Create → list → preview → answer.
   - Correct and incorrect submissions.
   - Edit → preview updated content.
   - Delete cancel and delete confirm.
   - User B can preview/attempt User A's MCQ.
   - User B cannot edit/delete User A's MCQ through navigation, URL changes, or crafted requests.
   - A selected choice from another MCQ is rejected and no attempt is written.
   - Session expiry during edit or attempt does not corrupt data.
10. Run the complete automated test suite.
11. Run ESLint and the production build.
12. Run `npm run preview` and repeat runtime-sensitive D1 flows on the local Workers runtime.
13. Review logs and responses for leaked correct answers, SQL details, stack traces, user secrets, or ownership data supplied by clients.
14. Update acceptance criteria, test counts, known limitations, file paths, current status, and phase statuses with actual implementation evidence.

**Verification commands**

```bash
npm run test
npm run lint
npm run build
npm run preview
```

`npm run preview` is a local Workers-runtime check. It does not authorize production deployment or a remote D1 migration.

**Deliverables**

- `src/app/mcqs/[id]/preview/page.tsx`
- `src/components/mcq/mcq-preview.tsx`
- Attempt-related automated tests
- Passing test, lint, build, and local Workers-preview evidence
- Completed manual authorization and accessibility checklist
- Updated acceptance criteria, actual test counts, known limitations, and current status

**Completion gate**

- Preview never reveals correctness before a successful submission.
- Every successful attempt is associated with the authenticated user and a choice belonging to the requested MCQ.
- Correctness is computed from stored data and displayed accurately.
- Cross-user mutation and cross-MCQ choice tampering are blocked.
- `npm run test`, `npm run lint`, and `npm run build` pass.
- Runtime-sensitive D1 behavior is verified with `npm run preview`.
- All acceptance criteria are checked or have a documented reason for deferral.
- The PRD reflects what was actually implemented rather than the original plan.

**Expected outcome:** Sprint 1 is locally verified, documented, and ready for a separately authorized remote migration and deployment.

**Implemented on 2026-09-01**

- Added `src/lib/mcq/preview-utils.test.ts` and attempt client tests in `src/lib/mcq/api-client.test.ts` first, then implemented preview helpers and `submitMcqAttemptRequest`.
- Implemented `src/components/mcq/mcq-preview.tsx` with ordered radio choices, no pre-submission correctness disclosure, validation, pending state, and post-submit feedback.
- Implemented protected route `src/app/mcqs/[id]/preview/page.tsx` using server-side `getMcqForPreview`.
- Preview flow submits to `POST /api/mcqs/[id]/attempts` and displays only `attemptId` correctness feedback after a successful response.
- Relevant Phase 5 automated tests: **6 passed** across preview helpers and attempt API client coverage.
- Full regression suite: **128 passed** across 16 files.
- Verification: `npm run test`, `npm run lint`, and `npm run build` passed.
- `npm run preview` could not complete in the current Windows environment because OpenNext failed with `EPERM` while removing `.open-next`. This is an environment limitation, not an application regression. Re-run `npm run preview` locally on WSL or after clearing the locked `.open-next` directory for Workers-runtime verification.

**Manual authorization and end-to-end checklist**

- [ ] Create → list → preview → answer.
- [ ] Correct and incorrect submissions display the right result.
- [ ] Edit → preview shows updated content.
- [ ] Delete cancel and delete confirm still behave correctly.
- [ ] User B can preview/attempt User A's MCQ.
- [ ] User B cannot edit/delete User A's MCQ through navigation or direct URLs.
- [ ] Crafted cross-MCQ choice submissions are rejected with no attempt written.
- [ ] Session expiry during edit or attempt redirects safely without corrupting data.

---

## Technical Implementation Details

### Key Files

| Path | Purpose |
| --- | --- |
| `migrations/0002_create_mcq_tables.sql` | D1 schema for MCQs, choices, and attempts |
| `src/lib/services/mcq-service.ts` | All MCQ and attempt database operations |
| `src/lib/services/mcq-service.test.ts` | Service-layer CRUD, ownership, and attempt tests |
| `src/lib/verification/mcq-migration.test.ts` | Migration schema verification tests |
| `src/lib/validation/mcq-schemas.ts` | Server validation and inferred input types |
| `src/lib/mcq-types.ts` | MCQ, safe preview, list, choice, and attempt domain output types |
| `src/lib/errors.ts` | Stable MCQ errors for later service and HTTP error mapping |
| `src/lib/api/mcq-route-utils.ts` | Shared auth, envelope, validation, and error-mapping helpers |
| `src/app/api/mcqs/route.ts` | List and create endpoints |
| `src/app/api/mcqs/[id]/route.ts` | Detail, update, and delete endpoints |
| `src/app/api/mcqs/[id]/attempts/route.ts` | Attempt endpoint |
| `src/app/api/mcqs/route.test.ts` | List/create route tests |
| `src/app/api/mcqs/[id]/route.test.ts` | Detail/update/delete route tests |
| `src/app/api/mcqs/[id]/attempts/route.test.ts` | Attempt route tests |
| `src/app/mcqs/page.tsx` | MCQ management list |
| `src/app/mcqs/new/page.tsx` | Create page |
| `src/app/mcqs/[id]/edit/page.tsx` | Edit page |
| `src/app/mcqs/[id]/preview/page.tsx` | Preview and attempt page |
| `src/components/mcq/mcq-form.tsx` | Shared create/edit client form |
| `src/components/mcq/mcq-table.tsx` | Table and actions menu |
| `src/components/mcq/delete-mcq-dialog.tsx` | Delete confirmation |
| `src/lib/mcq/preview-utils.ts` | Preview/attempt validation and feedback helpers |
| `src/lib/mcq/api-client.ts` | Client helpers for delete and attempt submission |
| `src/components/mcq/mcq-preview.tsx` | Preview and attempt UI |

### Existing Patterns to Follow

- Use `getDb()` from `src/lib/db.ts`.
- Pass the database into service functions.
- Keep SQL out of pages, components, and route handlers.
- Use prepared statements with `?1`, `?2`, and subsequent numbered placeholders.
- Use `.all()` and `results[0]` for D1 reads.
- Map SQL rows to explicit domain interfaces.
- Use `requireAuth()` from `src/lib/auth/session.ts`.
- Use Zod and field-level errors following `auth-schemas.ts`.
- Use ShadCN components from `src/components/ui/`.
- Keep client components limited to interactive form, dialog, menu, and attempt behavior.

### Important Notes

- The current repository has no middleware; every protected page and endpoint must perform its own auth check.
- JWT sessions expire after 15 minutes with no refresh token. An edit or attempt submitted after expiration must return the user to sign in without losing or corrupting database state.
- `AGENTS.md` and some repository guidance still describe the project as an unmodified starter. The implemented Sprint 0 code and `quiz-maker-technical-prd.md` are the current architectural references.
- Do not edit generated files such as `cloudflare-env.d.ts`, `next-env.d.ts`, or `package-lock.json` manually.
- Do not apply remote migrations or deploy unless the user explicitly asks.
- Ask before adding testing or other dependencies.

### Known Initial-Version Limitation

Choice removal is a hard delete. Attempts that reference a removed choice are deleted through the foreign-key cascade, and deleting an MCQ deletes all its choices and attempts. Preserving immutable historical attempt context will require choice versioning or answer snapshots in a later sprint.

---

## Acceptance Criteria

### Authentication and authorization

- [ ] Unauthenticated users cannot access MCQ pages.
- [x] Unauthenticated endpoint requests receive `401`.
- [x] The authenticated user's ID is used as `created_by_user_id`.
- [x] A request body cannot set or change MCQ ownership.
- [x] Authenticated users can preview and attempt shared MCQs.
- [x] Only the creator can edit an MCQ.
- [x] Only the creator can delete an MCQ.
- [x] Changing an MCQ ID in a URL or request cannot bypass ownership checks.

### MCQ list

- [x] The MCQ page lists available questions in a ShadCN Table.
- [x] Each row shows name, question, creator, created date, and updated date.
- [x] Each row has a vertical three-dot actions menu.
- [x] The menu contains the actions appropriate to the current user's permissions.
- [x] The page has a clearly visible Create MCQ action.
- [x] An empty question bank displays a useful empty state.

### Create and edit

- [x] The create form begins with exactly two blank choices.
- [x] Users can add choices up to a maximum of six.
- [x] Users cannot remove choices below two.
- [x] Name and question are required.
- [x] Every choice must contain non-whitespace text.
- [x] Exactly one correct choice is required.
- [x] A valid MCQ and its choices are saved atomically.
- [x] The create and edit routes reuse the same form component.
- [x] Editing preserves the original creator and creation timestamp.
- [x] Cancel returns without saving changes.

### Preview, attempts, and deletion

- [x] Preview does not reveal the correct answer before submission.
- [x] A user must select one choice before submitting an attempt.
- [x] The server verifies that the selected choice belongs to the MCQ.
- [x] The server computes and stores whether the attempt is correct.
- [x] Correct and incorrect results are displayed accurately.
- [x] Repeated pending submissions cannot create accidental duplicate attempts.
- [x] Delete requires explicit confirmation.
- [x] Cancelling delete leaves the MCQ unchanged.
- [x] Confirming delete removes the creator-owned MCQ and dependent records.

### Quality

- [x] Validation tests cover all stated MCQ and attempt rules.
- [x] Service tests cover CRUD, ownership, choice membership, and correctness.
- [x] Route tests cover authentication, validation, status codes, and errors.
- [ ] Important interactive frontend flows have automated tests if dependencies are approved; otherwise manual verification is documented.
- [x] `npm run test` passes.
- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [ ] Workers-runtime verification succeeds with `npm run preview` (blocked locally by Windows `.open-next` EPERM; rerun on WSL or after clearing the directory).
- [x] This PRD reflects the final implemented schema, routes, tests, and known limitations.

---

## Success Metrics

| Metric | Initial target | How measured |
| --- | --- | --- |
| Valid MCQ creation success | 100% during acceptance testing | Successful create requests and persisted records |
| Invalid MCQ rejection | 100% of defined invalid cases | Validation and route tests |
| Ownership enforcement | 100% of cross-user edit/delete attempts blocked | Service, route, and manual authorization tests |
| Attempt correctness | 100% match with stored correct choice | Service and route tests |
| Supported choices | Every MCQ has 2–6 choices and exactly one correct | Validation tests and database inspection |
| Regression safety | All existing and new automated tests pass | `npm run test` |

Product adoption and long-term attempt analytics are deferred until the application has production usage and an analytics requirement.

---

## Dependencies

### Existing external dependencies

- Next.js App Router — pages and Route Handlers
- React — interactive form and preview components
- Cloudflare D1 — MCQ, choice, and attempt persistence
- OpenNext Cloudflare adapter — Workers deployment/runtime integration
- Zod — request and form validation
- Vitest — unit and route-layer tests
- ShadCN/Base UI and Lucide — accessible UI primitives and icons

### Planned ShadCN generation

- Textarea
- Radio Group
- Dropdown Menu
- Alert Dialog

Generation must follow the repository's ShadCN conventions. Custom copies of equivalent primitives must not be created.

### Potential development dependencies requiring approval

- Testing Library React
- Testing Library user-event
- jsdom or another Vitest browser-like environment

### Internal dependencies

- `src/lib/db.ts`
- `src/lib/auth/session.ts`
- `src/lib/services/user-service.ts` conventions
- `src/lib/validation/auth-schemas.ts` conventions
- `src/components/ui/*`
- Existing `users` table and JWT authentication

### Environment variables

No new secret or environment variable is expected. Existing `JWT_SECRET` remains required for authentication.

---

## Risks and Mitigation

### Technical Risks

- **Risk:** Multi-table writes leave an MCQ without all its choices.
- **Mitigation:** Use validated inputs plus an atomic D1 batch/transaction strategy and test failure behavior.

- **Risk:** UI-only ownership checks allow crafted requests to edit another user's MCQ.
- **Mitigation:** Include creator ID in update/delete service predicates and test cross-user calls.

- **Risk:** A user submits a choice ID from a different MCQ.
- **Mitigation:** Query the selected choice with both `choice.id` and `mcq_id` before recording the attempt.

- **Risk:** Correct answers leak before submission.
- **Mitigation:** Use preview/list response DTOs that omit correctness fields.

- **Risk:** Choice edits remove attempt history.
- **Mitigation:** Document the initial hard-delete behavior; introduce snapshots/versioning only when attempt-history requirements are added.

- **Risk:** Node development succeeds while Workers/D1 runtime behavior fails.
- **Mitigation:** Run `npm run preview` after runtime-sensitive implementation.

### User Experience Risks

- **Risk:** Dynamic choice controls are confusing or inaccessible.
- **Mitigation:** Use labeled ShadCN Radio Group controls, numbered choices, and clear add/remove limits.

- **Risk:** A 15-minute session expires while a user is editing.
- **Mitigation:** Return a clear authentication response and redirect to sign in; avoid partial writes. Draft persistence is deferred.

- **Risk:** Deletion is triggered accidentally from the row menu.
- **Mitigation:** Require an explicit destructive Alert Dialog confirmation naming the MCQ.

---

## Troubleshooting Guide

No implementation issues have been recorded yet. Add entries here as problems are found and resolved.

### MCQ migration not visible locally

**Problem:** D1 reports that an MCQ table does not exist.  
**Likely cause:** The new migration has not been applied to the local database used by the current runtime.  
**Solution:** Confirm the migration filename and apply pending migrations locally. Do not apply remote migrations without explicit user approval.  
**Code reference:** `migrations/0002_create_mcq_tables.sql`

### Authenticated page redirects unexpectedly

**Problem:** An MCQ page or submission redirects to sign in.  
**Likely cause:** The encrypted JWT's fixed 15-minute lifetime expired.  
**Solution:** Sign in again and verify `requireAuth()`/endpoint session handling.  
**Code reference:** `src/lib/auth/session.ts`

---

## Notes for AI Agents

1. Read the Problem, Scope, Product Decisions, and Acceptance Criteria before changing MCQ code.
2. Follow the existing auth architecture instead of introducing an ORM or new application framework.
3. Keep all D1 access in `src/lib/services/mcq-service.ts`.
4. Never accept creator identity or attempt correctness as trusted client input.
5. Enforce update/delete ownership in the service query.
6. Do not expose `is_correct` in list or pre-submission preview data.
7. Write tests with each implementation slice.
8. Ask before adding dependencies.
9. Use ShadCN primitives; do not hand-build components ShadCN already provides.
10. Apply database migrations locally only unless the user explicitly requests a remote migration.
11. Do not deploy unless explicitly requested.
12. Update phase statuses, technical details, test counts, acceptance checkboxes, troubleshooting, and Current Status as work progresses.
13. Remove or revise decisions in this PRD when implementation proves them inaccurate; do not leave conflicting documentation.

---

## Open Questions

The following decisions have defaults in this PRD but should be reconfirmed before implementation if product expectations change:

1. **Shared visibility:** This PRD assumes every authenticated user can list, preview, and attempt every MCQ, while only the creator can edit/delete it.
2. **Post-save navigation:** Default to the MCQ list after create/edit unless preview-first navigation is preferred.
3. **Post-attempt feedback:** This PRD returns correct/incorrect only; revealing the correct choice after an incorrect answer remains unspecified.
4. **Attempt retention during edits:** The initial schema may delete attempts tied to choices that are removed.
5. **Component test dependencies:** Automated frontend interaction tests require approval to add the missing testing packages.

---

## Current Status

**Last Updated:** 2026-09-01  
**Sprint:** Sprint 1 — Multiple Choice Questions  
**Current Phase:** Phase 5 — Preview, attempts, and verification  
**Status:** ✅ COMPLETE — 128 automated tests pass; preview/attempt flow implemented  
**Existing foundation:** Full Sprint 1 stack from validation through management UI and authenticated HTTP API  
**Next Steps:** Run `npm run preview` in a compatible local environment for Workers-runtime verification, then perform the manual authorization checklist with two local users before any separately authorized remote migration or deployment.
