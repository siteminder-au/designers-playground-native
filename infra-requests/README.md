# Infra change requests

This folder is the request queue designers use to ask the repository owner (Pat) to
change **shared infrastructure** — anything a designer is not allowed to edit directly:

- `App.tsx`, `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`
- `server.js`, `src/db/pool.js`, shared `src/graphql/` resolvers (API endpoints, database tables)
- `app.json`, `package.json` (deps), CI/CD workflows
- the home screen, navigation, URL linking, or anything outside a designer's own prototype folder

Think of it as a lightweight pull-request workflow that lives **inside** the playground.
Two Claude sessions can't talk in real time, so the repo + a GitHub issue are the
message bus: a designer's Claude files a request here, the owner's Claude reads it,
implements it, and closes the loop.

## How it works

1. **Designer side** — run `/request-infra-change`. The designer's Claude interviews
   them, writes a request file into `open/`, pushes it to `main`, and opens a GitHub
   issue (label `infra-request`) so Pat is notified. The request **describes the
   behaviour/interface needed and why** — it does not contain the implementation.
   Designers never edit the shared files themselves.

2. **Owner side** — Pat runs `/review-infra-requests`. Pat's Claude lists open
   requests, implements the chosen one in the real shared files, bumps the version,
   commits to `main`, then moves the request file to `closed/` and closes the issue
   with a summary of what shipped.

3. **Back to the designer** — the designer is notified via the closed GitHub issue and
   picks up the change by running `/sync`.

## This folder is the one sanctioned exception to folder ownership

Designers may normally only write inside `src/designers/{their-slug}/`. Writing a request
file into `infra-requests/open/` is the **only** place a designer's Claude may commit
outside their own folder — and only via the `/request-infra-change` command.

## Statuses

| status      | meaning                                                        |
|-------------|----------------------------------------------------------------|
| `open`      | filed, awaiting owner review (file lives in `open/`)           |
| `needs-info`| owner asked a question; waiting on the designer to respond     |
| `applied`   | implemented and shipped (file moved to `closed/`)              |
| `declined`  | owner decided not to do it; reason in the owner log (`closed/`)|

Use `TEMPLATE.md` as the starting point for a request file.
