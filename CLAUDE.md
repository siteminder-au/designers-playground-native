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
- Shared files: `App.tsx`, `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`
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
- The prototype is registered as a screen in `src/navigation/AppNavigator.tsx`

**At the start of every conversation with a designer, run `/sync` before doing any other work.**

**If you are helping a designer build their prototype:**
- Only create or modify files inside `src/designers/{their-name}/{prototype-slug}/`
- Do **not** touch shared infrastructure: `App.tsx`, `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`, or any other designer's folder
- Do **not** run `npm run build` — the build runs automatically in GitHub Actions on every push to `main`
- You **may** run `git add`, `git commit`, and `git push` for the designer, but only stage files within `src/designers/{their-name}/` — never stage files outside that folder
- After committing and pushing to the designer's branch, always merge their branch into `main` and push so changes deploy automatically — use the `/commit` command
- If something is needed outside the designer's folder (e.g. a new route or home page entry), tell the designer to ask the repository owner

**Exception — repository owner (Pat Kennedy):** The above restrictions do not apply.

############################################################################################################################
# Navigation architecture
############################################################################################################################

The playground uses a root `NavigationContainer` in `App.tsx` wrapping a single `NativeStackNavigator` defined in `src/navigation/AppNavigator.tsx`.

- **PlaygroundHome** → `src/HomeScreen.tsx` (the launcher screen, no header)
- **{DesignerProtoScreen}** → `src/designers/{slug}/{proto-slug}/App.tsx` (nested navigator or simple screen)

Each designer's `App.tsx` must NOT include a `NavigationContainer` — that is handled at the root. It should render its own navigator (or a single screen) as a nested component.

**Linking config** (for web URL routing) is in `App.tsx`. When adding a new prototype, add its URL mapping there too.

**Screen naming convention:** `{FirstName}{ProtoSlugPascalCase}` — e.g. `RadhaSmMobile`.

############################################################################################################################
# Adding a new designer prototype
############################################################################################################################

When Pat adds a new designer or prototype:

1. Create `src/designers/{slug}/{proto-slug}/App.tsx` — the prototype's root component (no NavigationContainer)
2. Register the screen in `src/navigation/AppNavigator.tsx`:
   - Add to `RootParamList` type
   - Add `<Stack.Screen name="{ScreenName}" component={...} options={{ title: '...', headerBackTitle: 'Playground', ... }} />`
3. Add the linking entry in `App.tsx` under `linking.config.screens`
4. Add the designer card to `src/HomeScreen.tsx` in the `designers` array (alphabetical order by first name)

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
# Overarching directives
############################################################################################################################

1. Keep prototypes self-contained within the designer's folder — no cross-designer imports.
2. Each prototype's `App.tsx` must NOT wrap itself in a `NavigationContainer`.
3. Use `StyleSheet.create` for styles — no shared component library.
4. Each prototype should be a standalone React Native component tree.
