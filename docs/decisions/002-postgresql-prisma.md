# ADR-002: PostgreSQL with Prisma ORM

## Status
Accepted

## Context
The application needs a reliable relational database for structured commercial documents, user management, and audit trails. The deployment target is Vercel with Supabase as the database provider.

## Decision
We use **PostgreSQL** (via Supabase) as the sole database, accessed through **Prisma ORM** for type-safe queries and migrations.

Key choices:
- **Connection pooling**: PgBouncer via Supabase pooler (port 6543) with `prepared_statement_cache_size=0` for compatibility
- **Schema management**: Prisma Migrate with versioned migration files in `prisma/migrations/`
- **Direct connection** (port 5432) reserved for migrations only; runtime uses pooler
- **No raw SQL** except where Prisma cannot express the query (audit filtering, sequence increments)

We rejected:
- **MongoDB**: Document model is relational (documents → items, users → roles, audit events → users)
- **SQLite**: Not suitable for production; lacks advanced features (JSON, full-text search)
- **Drizzle/TypeORM**: Prisma's migration system and type generation provide the best DX for this team size

## Consequences
- **Positive**: Full ACID compliance, JSON support for audit details, Prisma's type inference eliminates most runtime type errors, migration history is version-controlled
- **Negative**: Prisma's query engine adds overhead for complex joins; connection pooling requires careful configuration
- **Mitigation**: Use `select` to limit returned fields; pooler URL with `prepared_statement_cache_size=0` handles PgBouncer compatibility
