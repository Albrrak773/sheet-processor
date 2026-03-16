# AGENTS.md - Coding Agent Guidelines

## Project Overview

This is a TanStack Start application with React 19, TypeScript, Tailwind CSS 4, and shadcn/ui. The project uses file-based routing with TanStack Router.

## Build/Lint/Test Commands

```bash
bun run dev          # Start dev server on port 3000
bun run build        # Build for production
bun run test         # Run all tests with vitest
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
bun run typecheck    # Run TypeScript type checking
```

### Running a Single Test

```bash
bun run test path/to/test.test.ts
bun run test -- --grep "test name pattern"
```

### Watch Mode

```bash
bun run test -- --watch
```

## Code Style Guidelines

### Formatting (Prettier)

- **Quotes**: Double quotes (not single quotes)
- **Semicolons**: No semicolons
- **Indentation**: 2 spaces
- **Trailing Commas**: ES5 (commas where valid in ES5)
- **Print Width**: 80 characters
- **End of Line**: LF

### TypeScript

- **Strict mode**: Enabled
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **No unused locals/parameters**: Enforced
- Use `verbatimModuleSyntax` for explicit type imports

### Import Organization

```typescript
import { something } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { localHelper } from "./local-module";
```

1. External packages first
2. Alias imports (`@/`) second
3. Relative imports last

### Path Aliases

- `@/*` maps to `./src/*`
- Use `@/components/ui/...` for UI components
- Use `@/lib/...` for utilities
- Use `@/hooks/...` for custom hooks

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `UserProfile`)
- **Functions**: camelCase (e.g., `getRouter`, `formatDate`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants, camelCase otherwise
- **Files**: kebab-case for utilities, PascalCase for components
- **Route files**: Follow TanStack Router conventions (`__root.tsx`, `index.tsx`)

### React Component Patterns

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
}

function MyComponent({ className, children }: MyComponentProps) {
  return <div className={cn("base-classes", className)}>{children}</div>;
}

export { MyComponent };
```

- Use function declarations, not arrow functions
- Destructure props in the function signature
- Use `cn()` utility for conditional class merging
- Export components as named exports

### shadcn/ui Components

- Location: `src/components/ui/`
- Add new components: `npx shadcn@latest add <component-name>`
- Import pattern: `import { Button } from "@/components/ui/button"`
- Style: `radix-vega` with `hugeicons` icon library
- Use `cn()` from `@/lib/utils` for class composition

### Tailwind CSS

- Tailwind 4 with CSS-first configuration
- Use `cn()` function for conditional classes
- Use `cva()` from class-variance-authority for component variants
- CSS variables for theming (defined in `src/styles.css`)
- Use semantic color tokens: `bg-primary`, `text-foreground`, etc.

### Error Handling

- Use TypeScript's strict null checking
- Prefer explicit error types when catching
- Handle errors at appropriate boundaries
- Use TanStack Router's error boundaries for route errors

### File Structure

```
src/
├── components/
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/
│   └── utils.ts      # Utility functions (cn, etc.)
├── routes/
│   ├── __root.tsx    # Root layout
│   └── index.tsx     # Home page
├── router.tsx        # Router configuration
├── styles.css        # Global styles and CSS variables
└── routeTree.gen.ts  # Generated route tree (do not edit)
```

### Routing (TanStack Router)

- Routes are file-based in `src/routes/`
- Use `createFileRoute()` for route definitions
- Route components are defined inline or referenced
- Generated route tree in `routeTree.gen.ts` - never edit manually

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <div>Home</div>;
}
```

## Pre-commit Checklist

1. Run `bun run typecheck` - no type errors
2. Run `bun run lint` - no lint errors
3. Run `bun run format` - code is formatted
4. Run `bun run test` - all tests pass

## Dependencies

- **Runtime**: React 19, TanStack Router/Start, Radix UI, Tailwind CSS 4
- **Dev**: TypeScript, Vitest, ESLint, Prettier
- **Package Manager**: Bun (bun.lock present)

## Notes

- The `routeTree.gen.ts` file is auto-generated - do not edit
- Use the TanStack DevTools for debugging (included in dev mode)
- always respect lint errors and don't ignore them.
