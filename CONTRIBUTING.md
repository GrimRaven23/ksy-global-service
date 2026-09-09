# Contributing — KSY Global Service

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL (via Supabase or local)
- npm

### Steps

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ksy-next
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your database credentials in `.env.local`

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

6. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

7. Seed the database:
   ```bash
   npm run db:seed
   ```

8. Start the dev server:
   ```bash
   npm run dev
   ```

9. Open [http://localhost:3000](http://localhost:3000)

## Branch Strategy

- `main` — Production-ready code
- Feature branches: `feat/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

## Commits

Use clear, descriptive commit messages:

- `feat: add customer export`
- `fix: resolve print preview stale data`
- `docs: update RBAC matrix`
- `test: add authorization tests`
- `refactor: extract document numbering logic`

## Code Quality

Before submitting a PR, ensure:

```bash
npm run lint          # No lint errors
npm run typecheck     # No type errors
npm run test          # All tests pass
npm run build         # Build succeeds
```

## Testing

Run tests:
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass
4. Write a clear PR description
5. Request review
6. Merge after approval

## Security Expectations

- Never commit secrets, credentials, or API keys
- All API routes must enforce authentication and authorization
- Input validation is mandatory on all endpoints
- Follow the existing RBAC patterns
- Report security issues privately (not in public issues)

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/          # API endpoints
│   ├── (pages)       # UI pages
├── components/       # React components
├── lib/              # Shared utilities and services
│   ├── auth/         # Authentication logic
│   ├── services/     # Business logic services
│   └── hooks/        # React hooks
tests/                # Test files
prisma/               # Database schema and migrations
```

## Key Conventions

- **TypeScript**: Strict mode, no `any` types
- **Validation**: Zod schemas for all API inputs
- **Authorization**: Server-side permission checks on every endpoint
- **Snapshots**: Company and customer data snapshotted on document save
- **Audit**: Meaningful business events logged to audit trail
