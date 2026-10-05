---
name: erd-schema-designer
title: ERD and Database Normalization Design
description: Use this skill when designing a relational database schema from requirements, drawing ERDs, performing normalization, planning table relationships/constraints/indexes, or adding tenant isolation, soft deletion, and audit fields for multi-tenant systems; outputs include an entity-relationship model (Mermaid ERD), normalized table structures, relationships and constraints, index plans, and draft RLS strategies; not intended for writing business query SQL, cleaning local CSV files, or debugging specific ORM/migration tool syntax; trigger terms: ERD, entity-relationship diagram, database design, table structure design, normal forms, normalization, schema design, multi-tenancy, soft delete, index strategy, RLS
domain: data/sql
triggers: [ERD, entity-relationship diagram, database design, table structure design, normal forms, normalization, schema design, database schema, table relationship design, multi-tenancy, soft delete, index strategy, RLS, audit log, Mermaid ERD]
tags: [database, schema-design, erd, normalization, data-modeling, rls, index, multi-tenancy]
level: advanced
status: stable
agents: [claude-code, codex, cursor, gemini-cli]
tools: [sql, mermaid, prisma, drizzle, alembic]
requires: []
related: [sql-query-builder, nosql-distributed-db, database-design-advisor, postgresql-optimization]
combines_with: [sql-query-builder, postgresql-optimization, database-migration-strategies]
license: MIT
source: alirezarezvani/claude-skills
source_license: MIT
---
# ERD and Database Normalization Design

## When to Use

- Design a new relational database schema from business requirements: identify entities, relationships, constraints, and keys.
- Draw an ERD (Mermaid `erDiagram`) to represent one-to-many and many-to-many relationships between tables.
- Review an existing schema for normalization (1NF → 3NF) and denormalization trade-offs, including duplicate storage, update anomalies, and performance issues.
- Add cross-cutting concerns to multi-tenant SaaS systems, such as tenant isolation, soft deletion, audit fields, optimistic locking, and index/RLS planning.

Out-of-scope cases:

- If you only need to write business query SQL (joins / aggregations / window functions) → use `sql-query-builder`; this skill focuses on schema design, not read queries.
- If the data already exists in local CSV files and the task is cleaning or deduplication rather than modeling → use `csv-data-cleaner`.
- If you only need to debug syntax errors in a specific ORM / migration tool (Prisma/Drizzle/Alembic API details) → refer to the corresponding official documentation; this skill provides structural patterns, and migration code is only a sample scaffold.
- Evaluation of non-relational options such as time-series, document, or graph databases → outside the scope of this skill.

## Steps

```
1. Requirements → Entities
   Extract nouns from the requirement statement: each independent "thing" becomes an entity (table).
   Example: "Users create projects; projects contain tasks; tasks can have labels, be assigned to users, and require full auditing."
   → User, Project, Task, Label, TaskLabel (junction table), TaskAssignment, AuditLog

2. Identify relationships and cardinality
   1──* (one-to-many): add the FK on the "many" side
   *──* (many-to-many): split into a junction table containing the two FKs + relationship attributes
   Example: Task *──* Label via TaskLabel; Task *──* User via TaskAssignment

3. Normalize to 3NF (then denormalize only when necessary)
   1NF: each column is atomic; do not store arrays/comma-separated lists; split repeating groups into child tables
   2NF: every non-key column fully depends on the entire primary key (remove partial dependencies when composite keys are used)
   3NF: remove transitive dependencies (a non-key column must not depend on another non-key column)
   Denormalize only when there is a clear read hotspot + a measured bottleneck, and document who is responsible for synchronizing redundant data

4. Define primary keys and constraints
   Use immutable surrogate keys for PKs: UUID / CUID; never use mutable natural keys such as email / slug as the PK
   Apply UNIQUE constraints to natural keys (e.g. email UNIQUE, (org_id,user_id) UNIQUE)
   Declare all FKs explicitly and define onDelete behavior (Cascade / Restrict / SetNull)

5. Add cross-cutting concerns (as needed)
   Multi-tenancy      : add organization_id to all tenant-scoped tables
   Soft deletion      : add deleted_at TIMESTAMPTZ; do not physically DELETE
   Auditing           : add created_by/updated_by/created_at/updated_at
   Optimistic locking : add version INTEGER and validate it on concurrent updates
   Audit log          : use a separate AuditLog table to store before/after JSON (required in compliance-sensitive domains)

6. Plan indexes
   Create an index for every FK column
   Create composite indexes for frequently combined filters (column order: equality first, range conditions later)
   For "active rows only" queries, use a partial index WHERE deleted_at IS NULL

7. Add RLS for multi-tenancy (see example), and test the policies using a non-superuser role

8. Deliver ERD (Mermaid) + table inventory + index inventory + draft RLS policies, then provide a migration scaffold
```

## Instructions

Normalization and modeling decision rules:

- Nouns → tables; verbs/associations → relationships; always resolve many-to-many relationships with a junction table.
- Store the same fact in only one place (3NF); if redundancy is introduced, document who is responsible for synchronization.
- PKs must be immutable and should not expose ordering (avoid auto-increment integers that could reveal business volume through enumeration).
- Create an index for every FK; combinations such as `WHERE org_id=? AND status=?` should use a composite index.
- Use soft deletion instead of physical deletion for auditable data; pair active-row queries with partial indexes.

RLS (Postgres, multi-tenant isolation + soft-delete filtering + delete permissions):

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE ROLE app_user;

-- Only allow access to tasks under projects belonging to the current organization
CREATE POLICY tasks_org_isolation ON tasks
  FOR ALL TO app_user
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = current_setting('app.current_user_id')::text
    )
  );

-- Soft deletion: never return deleted rows
CREATE POLICY tasks_no_deleted ON tasks
  FOR SELECT TO app_user
  USING (deleted_at IS NULL);

-- Inject user context at the beginning of each request
SELECT set_config('app.current_user_id', $1, true);
```

ERD generation commands (from Prisma):

```bash
npx prisma-erd-generator
# Or: npx @dbml/cli prisma2dbml -i schema.prisma | npx dbml-to-mermaid
```

## Example

Task-management SaaS ERD (Mermaid `erDiagram`):

```
erDiagram
    Organization ||--o{ OrganizationMember : has
    Organization ||--o{ Project : owns
    User ||--o{ OrganizationMember : joins
    User ||--o{ Task : "created by"
    Project ||--o{ Task : contains
    Task ||--o{ TaskAssignment : has
    Task ||--o{ TaskLabel : has
    Label ||--o{ TaskLabel : "applied to"
    User ||--o{ TaskAssignment : assigned

    Task {
        string id PK
        string project_id FK
        string title
        string status
        string priority
        timestamp due_date
        timestamp deleted_at
        int version
    }
```

Table structure with cross-cutting fields + indexes (Prisma snippet, including a partial index and optimistic locking):

```prisma
model Task {
  id          String     @id @default(cuid())
  projectId   String     @map("project_id")
  title       String
  status      TaskStatus @default(TODO)
  version     Int        @default(1)              // Optimistic locking
  createdById String     @map("created_by_id")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  deletedAt   DateTime?  @map("deleted_at")       // Soft deletion

  project     Project    @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([projectId, status])                     // Composite index
  @@index([dueDate], where: { deletedAt: null })   // Partial index: active rows only
  @@map("tasks")
}
```

Migration scaffolds can be generated with Drizzle / Prisma / TypeORM / Alembic. Generate them only after the structure is finalized to avoid repeated rewrites.

## Notes

- Soft deletion without a partial index → `WHERE deleted_at IS NULL` may require a full-table scan; always pair it with a partial index on active rows.
- Missing composite indexes → multi-condition filters may not use an index effectively; order columns with equality predicates first and range predicates later.
- Using mutable natural keys (email/slug) as PKs → changing the value becomes dangerous; standardize on UUID/CUID surrogate keys.
- Adding a NOT NULL column to an existing table without a default value → migration may fail; add a default first or backfill in stages.
- No optimistic locking → concurrent updates can overwrite each other; add a `version` column and validate it during UPDATE.
- RLS not tested with a non-superuser role → superusers bypass all policies, so omissions may go unnoticed.
- Use denormalization sparingly: only after measured read hotspots appear, and clearly define responsibility for synchronizing redundant data; otherwise, update anomalies will be introduced.

## See Also

- requires: none.
- related: `sql-query-builder` — write queries after the schema is finalized; `csv-data-cleaner` — clean imported data before table creation; `dbt-transformation-modeler` — modeling for the analytics layer.
- combines_with: `sql-query-builder` — design the structure first, then write queries, forming a complete "design → data retrieval" workflow.

---

This skill was adapted from alirezarezvani/claude-skills (MIT License).
