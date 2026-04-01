# Delete Prototype

**Pat only. This is destructive and irreversible.**

Removes a prototype from the playground completely.

## Steps

1. Confirm with Pat: which designer slug and proto slug to delete.

2. Remove from `src/navigation/AppNavigator.tsx`:
   - Remove the `import`
   - Remove from `RootParamList`
   - Remove the `<Stack.Screen>` entry

3. Remove from `App.tsx` linking config.

4. Remove from `src/HomeScreen.tsx` designers array:
   - Remove the prototype entry from the designer's `prototypes` array
   - If it was their only prototype, remove the whole designer entry

5. Delete the folder:
   ```
   rm -rf src/designers/{slug}/{proto-slug}/
   ```
   If it was the designer's only proto, also delete:
   ```
   rm -rf src/designers/{slug}/
   ```

6. Commit and push:
   ```
   git add -A
   git commit -m "Delete {slug}/{proto-slug} prototype"
   git push
   ```
