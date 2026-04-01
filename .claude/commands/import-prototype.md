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

7. Register the screen in `src/navigation/AppNavigator.tsx`:
   - Add to `RootParamList`: `{ScreenName}: undefined`
   - Import and add `<Stack.Screen>`

8. Add the linking entry in `App.tsx`.

9. Add the designer card to `src/HomeScreen.tsx`.

10. Run a build to check for errors:
    ```
    npx expo export --platform web
    ```
    Fix any errors.

11. Commit and push:
    ```
    git add src/designers/{slug}/ src/navigation/AppNavigator.tsx src/HomeScreen.tsx App.tsx package.json
    git commit -m "Import {Full Name}'s {proto-slug} prototype"
    git push
    ```
