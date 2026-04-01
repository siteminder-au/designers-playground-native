# Commit

Stage, commit, and deploy the designer's changes.

## Steps

1. Detect the current branch:
   ```
   git branch --show-current
   ```

2. Determine which designer's folder to stage:
   - If on a named designer branch (e.g. `radha`), stage only `src/designers/{branch-name}/`
   - If on `main` (Pat), stage whatever files were changed

3. Stage the relevant files:
   ```
   git add src/designers/{slug}/
   ```
   Never stage files outside the designer's folder unless you are Pat on `main`.

4. Write a concise commit message describing the changes. Use the diff to understand what changed.

5. Commit:
   ```
   git commit -m "{message}"
   ```

6. Push to the current branch:
   ```
   git push origin {branch}
   ```

7. If on a designer branch, merge into `main` and push to trigger deployment:
   ```
   git checkout main
   git merge {branch} --no-edit
   git push origin main
   git checkout {branch}
   ```

8. Confirm to the user:
   - Their changes are deployed
   - The playground URL: `https://sm-native-5c5b643660da.herokuapp.com/`
