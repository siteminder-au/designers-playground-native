##################################
# Native Prototyping Environment
##################################

############################################################################################################################
# First-time setup — Confluence MCP
############################################################################################################################

To enable Claude to read SiteMinder's design system documentation directly from Confluence, add the Confluence MCP server to your **global** Claude settings file at `~/.claude/settings.json`.

**Steps:**

1. Generate an Atlassian API token at https://id.atlassian.com/manage-profile/security/api-tokens

2. Edit `~/.claude/settings.json` (your global Claude Code settings) and add the Confluence MCP server:

```json
{
  "mcpServers": {
    "confluence": {
      "command": "npx",
      "args": ["-y", "mcp-atlassian"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://siteminder-jira.atlassian.net",
        "ATLASSIAN_EMAIL": "your.name@siteminder.com",
        "ATLASSIAN_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

3. Replace `your.name@siteminder.com` and `your-api-token-here` with your own values.

4. Restart Claude Code completely (quit and reopen).

**Note:** MCP servers must be configured in the global `~/.claude/settings.json` file. They cannot be configured in project-level settings files.

############################################################################################################################
# Versioning
############################################################################################################################

The version number is stored in `package.json`. It follows semver (MAJOR.MINOR.PATCH).

**Bump the version when Pat changes shared infrastructure:**
- Shared files: `App.tsx`, `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`, `src/prototypes.ts`
- Slash commands: `.claude/commands/`
- Project configuration: `app.json`, `package.json` (deps), `server.js`, CI/CD workflows

**Do NOT bump the version for:**
- A designer modifying files inside their own `src/designers/{slug}/` folder
- Adding a new designer or prototype

Pat decides when and by how much to bump — do not bump it automatically.

############################################################################################################################
# Multi-designer environment
############################################################################################################################

This repository hosts multiple designers' React Native prototypes under `src/designers/`. Each designer owns only their own subfolder.

**Folder structure:** `src/designers/{designer-slug}/{prototype-slug}/`
- e.g. `src/designers/jane/my-proto/` for Jane's prototype
- Each prototype has its own `App.tsx` (root component, no NavigationContainer) and any additional files

**Screens and home-screen cards are auto-discovered — adding a prototype never touches shared files.**
`src/prototypes.ts` discovers every `src/designers/*/*/App.tsx` at build time via Metro's
`require.context`. Each prototype folder is automatically registered as a navigator screen named
`{slug}/{proto}`, gets the same deep-link path, and gets a home-screen card. `AppNavigator.tsx`,
`App.tsx` (linking) and `HomeScreen.tsx` all read from `src/prototypes.ts`. Metadata that can't be
derived from the slug lives in the designer's **own folder**, so editing it is always allowed:
- `src/designers/{slug}/designer.json` → `{ "name": "Jane Smith", "initials": "JS" }`
- `src/designers/{slug}/{proto}/prototype.json` → `{ "label": "My proto", "order": 0 }`, plus
  optional `"headerShown": false` (hide the native header), `"hidden": true` (screen but no card),
  `"disabled": true` (exclude entirely).

Because of this, **a new screen, linking entry or home-screen card is no longer a shared-infra
change** — it is just a `prototype.json` / `designer.json` inside the designer's own folder. A CI
guard (`.github/workflows/guard-shared-infra.yml`) fails any non-owner change to shared files.

**At the start of every conversation with a designer, run `/sync` before doing any other work.**

**If you are helping a designer build their prototype:**
- Only create or modify files inside `src/designers/{their-name}/{prototype-slug}/`
- Do **not** touch shared infrastructure: `App.tsx`, `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`, `src/prototypes.ts`, or any other designer's folder
- Do **not** run `npm run build` — the build runs automatically in GitHub Actions on every push to `main`
- You **may** run `git add`, `git commit`, and `git push` for the designer, but only stage files within `src/designers/{their-name}/` — never stage files outside that folder
- After committing and pushing to the designer's branch, always merge their branch into `main` and push so changes deploy automatically — use the `/commit` command
- Screens and home-screen cards are **not** shared-infra changes — add a prototype by creating its folder and a `prototype.json` (and `designer.json` for a new designer) inside the designer's own folder; never edit `src/navigation/AppNavigator.tsx`, `App.tsx`, or `src/HomeScreen.tsx` for this
- If something genuinely shared is needed (e.g. a new GraphQL resolver or database table, a shared dependency, or a change to the discovery logic or another shared file), **do not edit the shared file** — file a request with `/request-infra-change` so the repository owner can make the change (see *Requesting shared-infra changes* below)

**Exception — repository owner (Pat Kennedy):** The above restrictions do not apply.

**Requesting shared-infra changes (`infra-requests/`)**
Designers can't edit shared infrastructure, but they can *request* changes through a lightweight in-repo pull-request workflow:
- A designer's Claude runs `/request-infra-change`. It interviews the designer, writes a request file into `infra-requests/open/`, pushes it to `main`, and opens a GitHub issue (label `infra-request`) to notify Pat. The request **describes the behaviour/interface needed and why — never the implementation.**
- Pat runs `/review-infra-requests` to list open requests, implement the chosen one in the real shared files, bump the version, ship it, move the request file to `infra-requests/closed/`, and close the issue. The designer is notified via the issue and pulls the change in with `/sync`.
- `infra-requests/open/` is the **one** location a designer's Claude may commit outside `src/designers/{their-slug}/`, and only via `/request-infra-change` (staging just the single request file). All other shared-infra rules still apply.

############################################################################################################################
# Navigation architecture
############################################################################################################################

The playground uses a root `NavigationContainer` in `App.tsx` wrapping a single `NativeStackNavigator` defined in `src/navigation/AppNavigator.tsx`.

- **PlaygroundHome** → `src/HomeScreen.tsx` (the launcher screen, no header)
- **{DesignerProtoScreen}** → `src/designers/{slug}/{proto-slug}/App.tsx` (nested navigator or simple screen)

Each designer's `App.tsx` must NOT include a `NavigationContainer` — that is handled at the root. It should render its own navigator (or a single screen) as a nested component.

**Auto-discovery:** `src/prototypes.ts` enumerates every `src/designers/*/*/App.tsx` via Metro's
`require.context` and is the single source of truth. `AppNavigator.tsx` maps over it to register a
`<Stack.Screen>` per prototype (screen name = `{slug}/{proto}`); `App.tsx` builds `linking.config.screens`
from it (path = `{slug}/{proto}`); `HomeScreen.tsx` builds its designer cards from it. None of these need
editing to add a prototype.

**Screen names** are the route string `{slug}/{proto}` (e.g. `radha/sm-mobile`). Because they can't be
statically enumerated, `RootParamList` is a generic `Record<string, undefined>`.

**Header options:** by default a prototype shows the standard blue native header (title = its
`label`). Set `"headerShown": false` in its `prototype.json` to render without a header.

############################################################################################################################
# Adding a new designer prototype
############################################################################################################################

Adding a prototype is **self-service inside the designer's own folder** — no shared-file edits:

1. Create `src/designers/{slug}/{proto-slug}/App.tsx` — the prototype's root component (no NavigationContainer)
2. Add `src/designers/{slug}/{proto-slug}/prototype.json` with `{ "label": "...", "order": 0 }`
   (optional `"headerShown": false`, `"hidden": true`, `"disabled": true`)
3. For a new designer, add `src/designers/{slug}/designer.json` with `{ "name": "...", "initials": "..." }`

The screen, deep-link path and home-screen card are generated automatically from the above. Use
`/add-designer` (new designer) or just create the folder + manifest (existing designer) — do **not**
edit `src/navigation/AppNavigator.tsx`, `App.tsx`, or `src/HomeScreen.tsx`.

############################################################################################################################
# Deployment
############################################################################################################################

The app deploys as a **React Native Web** app to Heroku (`sm-native`), exactly like the other playgrounds.

- Build: `npx expo export --platform web` → creates `dist/`
- Serve: Express (`server.js`) serves `dist/` with SPA fallback
- CI/CD: GitHub Actions builds and pushes to Heroku on every push to `main`

**Heroku app:** `sm-native`
**Deployed URL:** `https://sm-native-5c5b643660da.herokuapp.com/`

############################################################################################################################
# Shared Postgres database
############################################################################################################################

A shared Heroku Postgres database (`postgresql-colorful-67130`) is attached to the `sm-native` app. Heroku injects `DATABASE_URL` at runtime.

- **Shared pool:** `src/db/pool.js` exports a single `pg.Pool` plus a `query(text, params)` helper. Import from any server-side resolver/route.
- **Table naming:** Every designer **must** prefix their tables with their slug, e.g. `paul_bookings`, `radha_orders`. No unprefixed tables.
- **Access pattern:** Prototypes (client) can't reach Postgres directly. Add resolvers under `src/graphql/{your-name}/` (see `paul/` for reference), use the shared pool, and query from the prototype via Apollo Client at `/graphql`.
- **Local dev:** `heroku config:get DATABASE_URL -a sm-native` and export it, or run a local Postgres and point `DATABASE_URL` at it.
- **Migrations:** Run ad-hoc `CREATE TABLE` via `heroku pg:psql -a sm-native`. Always include the designer prefix.

############################################################################################################################
# Overarching directives
############################################################################################################################

1. Keep prototypes self-contained within the designer's folder — no cross-designer imports.
2. Each prototype's `App.tsx` must NOT wrap itself in a `NavigationContainer`.
3. Use `StyleSheet.create` for styles — no shared component library.
4. Each prototype should be a standalone React Native component tree.
