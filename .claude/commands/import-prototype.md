# Import Standalone Prototype

Bring a designer's existing standalone React Native prototype into this multi-designer environment.

## Steps

1. Ask for:
   - **Designer's full name** and **slug** (lowercase first name)
   - **Source**: GitHub URL or local path
   - **Proto slug**: short identifier (e.g. `sm-mobile`)
   - **Label**: short description for the home screen card

2. If a GitHub URL was provided, clone it:
   ```
   git clone {url} /tmp/{repo-name}
   ```

3. Explore the prototype's structure — read `App.tsx`, `package.json`, and the src/ folder.

4. Check for missing dependencies:
   - Compare the prototype's `package.json` against this playground's `package.json`
   - For any missing packages, add them and run `npm install`

5. Copy source files into `src/designers/{slug}/{proto-slug}/`:
   - `App.tsx` → adapted root component (see below)
   - All other files copied verbatim

   **Adapting `App.tsx`:**
   - Remove `<NavigationContainer>` wrapper — it is handled at the playground root
   - The component should render its own navigator or screens directly

6. Fix any broken imports in copied files (check relative paths, casing on Linux CI).

7. Write the prototype metadata file `src/designers/{slug}/{proto-slug}/prototype.json`. The
   screen, its deep-link path and the home-screen card are auto-discovered from this — **do not
   edit `src/navigation/AppNavigator.tsx`, `App.tsx`, or `src/HomeScreen.tsx`.**
   ```json
   {
     "label": "{description}",
     "order": 0
   }
   ```
   Add `"headerShown": false` if the prototype renders its own chrome and wants no native header.

8. If this is a **new** designer, write `src/designers/{slug}/designer.json`:
   ```json
   {
     "name": "{Full Name}",
     "initials": "{INITIALS}"
   }
   ```
   (If the designer already exists, skip — their `designer.json` is already present.)

9. Run a build to check for errors:
    ```
    npx expo export --platform web
    ```
    Fix any errors.

10. Commit and push. The prototype folder needs no shared-file edits; the only shared file that
    may legitimately change here is `package.json` if new dependencies were added (step 4) — if
    so, the repo owner should make/approve that part (the CI guard blocks non-owner shared-infra
    edits).
    ```
    git add src/designers/{slug}/
    git commit -m "Import {Full Name}'s {proto-slug} prototype"
    git push
    ```
