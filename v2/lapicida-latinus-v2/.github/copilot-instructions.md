## Purpose
This file gives concise, actionable context for AI coding agents working on lapicida-latinus-v2 so they can be productive immediately.

## Quick facts
- Project type: React (v19) + Vite. Entry: `index.html` -> `src/main.jsx` -> `App.jsx`.
- Module type: ES modules (package.json has "type": "module").
- Build/dev commands (package.json):
  - `npm run dev` — start Vite dev server (HMR)
  - `npm run build` — produce production build
  - `npm run preview` — preview built app
  - `npm run lint` — run ESLint

## Where to look first
- `src/` — app source. Notable subfolders: `components/`, `layout/`, `questions/`, `quiz/`, `start/`, `core/`, `generators/`, `data/`.
- `src/core/roundFactory.js` — central factory for generating quiz rounds. Example export: `buildRound(config)`.
- Generator modules: code that creates question rounds lives near `src/core/generators/` (example import in `roundFactory.js`: `./generators/nouns`). Look for files named like `nouns.js` or similar.
- `src/data/` — static or seed data used by generators.

## Key patterns and conventions (concrete)
- Rounds are produced by a factory pattern: `buildRound(config)` in `src/core/roundFactory.js`.
  - The config object uses fields like: `category`, `lemmas` (array), `numQuestions` (number), `includeHelp` (boolean).
  - Example behaviour: `category: "nouns"` calls `generateNounRound({ lemmas, numQuestions, includeHelp })` and returns `{ category, questions }`.
- Generators return a plain object shape (category + questions). Follow existing shape when adding new generators.
- Exports are named ES module exports (prefer `export function` / `export const`).

## How to add a new round category (practical steps)
1. Create a generator file with a named export, e.g. `src/core/generators/verbs.js` exporting `generateVerbRound(opts)` that returns `{ category: 'verbs', questions: [...] }`.
2. Register it in `src/core/roundFactory.js` by adding a new `case 'verbs':` that calls the generator with the config and returns the result.

Minimal example (follow existing style in repo):

```js
// src/core/roundFactory.js (add case)
case 'verbs':
  return generateVerbRound({ lemmas, numQuestions, includeHelp, verbSettings });
```

## Build, lint, debug notes
- Use `npm run dev` for fast local development with Vite's HMR.
- If making structural or lint changes, run `npm run lint` and follow rules in `eslint.config.js`.
- There are no project tests in the repository root (none found). Prefer small manual checks in the browser during development.

## Files and locations worth referencing in PRs
- `package.json` — scripts and core deps (React, Vite).
- `eslint.config.js` — repo lint rules.
- `src/core/roundFactory.js` — round dispatch logic.
- `src/core/generators/*` — concrete round generators (nouns, etc.).
- `src/data/` — data used by generators.

## Integration & external points
- Static assets served from `public/` and `src/assets/`.
- No external backend services referenced in source (static single-page app). If adding APIs, document new env variables and where they are injected.

## Things AI agents should not assume
- No TypeScript types in the repo — code is plain JS. Don't add TS unless the author requests it.
- Tests are not present; do not add wide-ranging test scaffolding without asking.

## When you change public behavior
- Update `README.md` with any new dev or build steps.
- Keep export names and plain object shapes compatible with existing consumers (components that render rounds expect `{ category, questions }`).

---
If you want, I can expand this with examples from specific generator files (e.g. `nouns`), or adapt the tone/length. What should I add or clarify?
