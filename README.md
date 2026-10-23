# D-Day 1961

A web app recreating Avalon Hill's 1961 _D-Day_ boardgame. See [docs/SPEC.md](docs/SPEC.md) for the specification and milestone plan.

## Packages

| Package           | Role                                                      |
| ----------------- | --------------------------------------------------------- |
| `packages/engine` | Pure rules engine shared by client, server and AI         |
| `packages/client` | React UI and editor (Vite)                                |
| `packages/server` | Game server: links, dice, hidden information, persistence |
| `packages/ai`     | Computer opponents                                        |

## Commands

Requires Node 22 or later.

```sh
npm install        # install all workspaces
npm run dev        # client dev server at http://localhost:5173
npm test           # run all tests (Vitest)
npm run lint       # ESLint
npm run typecheck  # TypeScript, every package
npm run check      # lint + typecheck + test
npm run build      # production build of the client
npm run format     # Prettier
```
