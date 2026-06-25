# Delete Prototype

**Pat only. This is destructive and irreversible.**

Removes a prototype from the playground completely. Its screen, deep-link path and home-screen card are auto-discovered from the folder, so deleting the folder removes them all automatically — no shared-file edits.

## Steps

1. Confirm with Pat: which designer slug and proto slug to delete.

2. Delete the folder:
   ```
   rm -rf src/designers/{slug}/{proto-slug}/
   ```
   The screen registration, linking path and home card are auto-discovered, so removing the
   folder removes all of them. **Do not edit `src/navigation/AppNavigator.tsx`, `App.tsx`, or
   `src/HomeScreen.tsx`** — they need no changes.

3. If it was the designer's only prototype, also delete their folder (this removes their
   `designer.json`, so they no longer appear on the home screen):
   ```
   rm -rf src/designers/{slug}/
   ```

4. Commit and push:
   ```
   git add -A
   git commit -m "Delete {slug}/{proto-slug} prototype"
   git push
   ```
