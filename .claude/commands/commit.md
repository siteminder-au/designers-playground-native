# Commit

Save the designer's current changes — commits to their branch and pushes. Then asks whether to deploy.

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

4. If there is nothing to stage, tell the designer there are no changes to commit and stop.

5. Write a concise commit message describing the changes. Use the diff to understand what changed.

6. Commit and push to the current branch:
   ```
   git commit -m "{message}"
   git push origin {branch}
   ```

7. Ask the designer: **"Changes committed and pushed to your branch. Would you like to deploy to production now?"**

8. If yes, merge into `main` and push to trigger deployment:
   ```
   git checkout main
   git merge {branch} --no-edit
   git push origin main
   git checkout {branch}
   ```
   Then confirm: "Your changes are live at `https://sm-native-5c5b643660da.herokuapp.com/`"

   If no, confirm: "Changes saved to your branch. You can deploy any time by running `/commit` again."
