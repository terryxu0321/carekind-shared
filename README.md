# carekind-shared

Shared code: design tokens (CSS variables), zod schemas and TypeScript types, API client — part of **CareKind AI**.

- Stack: TypeScript
- Requirements, boundaries and module guidance: [design-system](https://github.com/terryxu0321/JRAgedCareProject/tree/main/company-os/06-app-development/design-system)
- **All documentation lives in the meta repo** [terryxu0321/JRAgedCareProject](https://github.com/terryxu0321/JRAgedCareProject) (PRD, specs, rules, decisions, changelog). This repo holds only code, tests and config.
- Before working here (people or AI agents), read the meta repo's root `AGENTS.md` and the module guidance linked above.

Formatting follows `.editorconfig` (tabs, width 4). Never commit secrets or real resident / personal data — this repo is public.

## Development

```sh
npm install
npm run build      # tsc → dist/ (run before other repos import it)
npm run typecheck
npm run lint       # ESLint + Prettier check
npm test           # Vitest
npm run tokens     # regenerate src/styles/tokens.css from the meta repo's DESIGN.md
```

Other repos in the meta repo depend on it with `"@carekind/shared": "file:../../packages/carekind-shared"` and import `@carekind/shared` or `@carekind/shared/tokens.css`.
