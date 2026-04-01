# Sync

Pull the latest updates from `main` into the current branch.

## Steps

1. Detect the current branch:
   ```
   git branch --show-current
   ```

2. If already on `main`, just pull:
   ```
   git pull origin main
   ```
   Done.

3. If on a designer branch:
   a. Stash any uncommitted changes:
      ```
      git stash
      ```
   b. Pull the latest main:
      ```
      git fetch origin main
      git merge origin/main
      ```
   c. If there are merge conflicts, resolve them — prefer `main` for shared infrastructure files (`App.tsx`, `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`) and prefer the designer's version for files inside their own folder.
   d. Restore any stashed changes:
      ```
      git stash pop
      ```

4. Confirm to the user that their branch is up to date with `main`.
