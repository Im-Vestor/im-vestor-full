# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run check            # Lint + typecheck
npm run lint:fix         # Fix ESLint issues
npm run format:write     # Auto-format with Prettier

npm run db:push          # Push schema changes to DB (no migration)
npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Run migrations (production)
npm run db:studio        # Open Prisma Studio GUI
npm run seed             # Seed database
```

There are no automated tests. Type checking is the primary correctness tool — run `npm run check` before finishing any task.

## Database Safety

**NEVER run any command that can cause data loss without explicit user confirmation.** This includes:

- `npm run db:push` — can drop columns/tables when schema fields are removed. Always confirm with the user before running.
- `npm run db:migrate` — migrations are irreversible in production. Never run without user confirmation.
- `npm run seed` — may overwrite existing data.
- Any raw SQL `DROP`, `TRUNCATE`, `DELETE` without a `WHERE` clause.
- `prisma migrate reset` — wipes the entire database.

When schema changes are needed, describe the change and ask the user to run the command themselves.

## Architecture

This is a **Next.js 15 App** using the **Pages Router** (not App Router), built on the **T3 Stack** (tRPC + Prisma + TypeScript). It's an entrepreneur-investor matchmaking platform.

### Request Flow

1. Frontend calls tRPC procedures via React Query (`src/utils/api.ts`)
2. tRPC routes defined in `src/server/api/routers/` — composed in `src/server/api/root.ts`
3. Prisma ORM talks to PostgreSQL
4. Clerk handles all authentication

### Key Architectural Points

**tRPC Procedures:** Use `publicProcedure` (unauthenticated) or `protectedProcedure` (requires Clerk session) from `src/server/api/trpc.ts`. All inputs use Zod schemas.

**Authentication:** Clerk handles login/signup. `src/middleware.ts` protects routes — `/admin/*` requires `userIsAdmin` in session claims. User types: `ENTREPRENEUR`, `INVESTOR`, `INCUBATOR`, `PARTNER`, `ADMIN`.

**Database:** Prisma schema at `prisma/schema.prisma`. Core entities: `User`, `Entrepreneur`, `Investor`, `VcGroup`, `Incubator`, `Partner`, `Project`. Use `db:push` during development, `db:migrate` for production.

**Environment Variables:** Validated via T3 Env in `src/env.js`. Server-side and client-side vars are separate. Always add new env vars there first or the app will throw at startup.

**Path Alias:** `~/*` maps to `./src/*` — use this for all internal imports.

**Storage:** Cloudflare R2 for file uploads (`src/utils/r2.ts`). Vercel Blob for smaller assets.

**Payments:** Stripe with webhook handling in `src/pages/api/stripe-webhook.ts`. Products: Poke, Boost, Daily Pitch Tickets, HyperTrain Tickets.

**Video:** Daily.co for video meetings (`src/utils/daily.ts`).

**Email:** Resend with React Email templates in `src/components/email/`.

**i18n:** Language context in `src/contexts/LanguageContext.tsx`. Translations in `src/utils/translations.ts`. Supported locales: `en-US`, `pt-PT`, `pt-BR`.

**Content:** Notion API used as CMS for news/blog content (`src/utils/notion.ts`).

### Important Files

| File | Purpose |
|------|---------|
| `src/server/api/root.ts` | Composes all tRPC routers |
| `prisma/schema.prisma` | Database schema |
| `src/pages/_app.tsx` | App providers (Clerk, tRPC, Language) |
| `src/middleware.ts` | Route protection logic |
| `src/env.js` | Environment variable validation |

### Code Style

- Prettier: 100-char line width, single quotes, trailing commas
- TypeScript strict mode + `noUncheckedIndexAccess`
- Husky pre-commit hook runs Prettier on staged files
- shadcn/ui for base UI components (`src/components/ui/`)
- Tailwind CSS for all styling

## Design Patterns

### Visual / UI

**Theme:** Dark background (`#030014`), gold/tan primary gradient (`#EDD689` → `#D3B662`), card backgrounds use `bg-background-card` (dark purple with transparency). Borders use `border-white/10` or `border-white/20`.

**Cards:** Always use `rounded-xl border-2 border-white/10 bg-card` with `hover:border-white/20 transition-all`. Example:
```tsx
className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20"
```

**Buttons:** Use the `Button` component from `~/components/ui/button` with variants (`default`, `outline`, `destructive`, `ghost`). Primary buttons use the gold gradient via `bg-primary`.

**Inputs:** Use `~/components/ui/input` — styled with `bg-white/5`, white text, `placeholder:text-[#aaabad]`.

**Toasts:** Use `sonner`'s `toast.success()` / `toast.error()` (already configured in `_app.tsx` with dark theme).

**Forms:** Always use React Hook Form + Zod + shadcn Form components (`Form`, `FormField`, `FormItem`, `FormControl`, `FormMessage`).

### tRPC Router Pattern

```ts
export const myRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.model.findUniqueOrThrow({ where: { id: input.id } });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.model.update({ where: { id: input.id }, data: { name: input.name } });
    }),
});
```

Use `protectedProcedure` by default, `publicProcedure` only for truly public endpoints, `adminProcedure` for admin-only operations. Throw `TRPCError` with appropriate codes (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`).

Use `Promise.all` for parallel DB queries. Always add new routers to `src/server/api/root.ts`.

### Mutation Pattern (client-side)

```tsx
const utils = api.useUtils();

const { mutate, isPending } = api.myRouter.update.useMutation({
  onSuccess: () => {
    toast.success('Updated successfully!');
    void utils.myRouter.getById.invalidate();
  },
  onError: () => {
    toast.error('Failed to update. Please try again.');
  },
});
```

### Query Pattern (client-side)

```tsx
const { data } = api.myRouter.getById.useQuery(
  { id },
  {
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  }
);
```

### Page Pattern

Pages check auth via `useUser()` from Clerk, redirect to `/login` if unauthenticated, show loading skeleton while Clerk loads. Layout uses `<main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">`. Use `dynamic()` from Next.js for heavy components with `ssr: false`.
