# room-chores-app

Remix (v2, Vite) frontend for a shared-household chores app. Talks to the Quarkus API in the sibling repo
`room-chores-svc` (default `http://localhost:8080`, override with the `API_URL` env var).

## Status: written but never installed, built or run

This code was authored in an environment with no access to the npm registry, so it has only been
syntax-checked with `tsc`. First job in any session: `npm install`, `npm run typecheck`, `npm run dev`,
then fix whatever breaks. Check that the installed Remix 2.x and Vite versions agree with `vite.config.ts`
(future flags) and `tsconfig.json`.

## Commands

- `npm install`
- `npm run dev` — http://localhost:5173
- `npm run typecheck`
- `npm run build` / `npm start`

## Architecture

- All API calls happen on the Remix server (loaders/actions) through `app/lib/api.server.ts`; the browser never
  calls the API directly, so no CORS is involved here.
- `loaderFailure` throws a Response so the root `ErrorBoundary` can show the real message in production;
  `actionError` returns 4xx messages as form feedback.
- `app/lib/eligibility.ts` mirrors the backend rule (`COOKING` implies `BASIC_PREP`). Keep both in sync.
- Dates use the `Asia/Kolkata` zone (`app/lib/dates.ts`), matching `roomchores.zone` in the backend.

## Pages

`/` fairness dashboard · `/assignments` week view, generate, done/missed/swap · `/chores` catalog, edit points,
enable/disable, add · `/roommates` add, edit capacity and skills, deactivate.

## Isolation: personal project on a work machine

- Stay inside this folder. Do not change global git config, `~/.npmrc`, `~/.ssh`, or system environment variables.
- If `~/.npmrc` points at a work registry or holds a work token, do not edit it. Add a project-level `.npmrc`
  with `registry=https://registry.npmjs.org/` and make sure no work token is sent to the public registry.
- Use repo-local git identity only.
- Port 5173 may clash with work apps; change `server.port` in `vite.config.ts` if so.
