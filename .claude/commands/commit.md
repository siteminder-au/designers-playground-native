# Commit

Save the designer's current changes — commits to their branch and pushes. Then asks whether to deploy.

## Shared-infra blocklist (never commit these as a designer)

These files/paths are **shared infrastructure** and must never be staged, committed, or carried to `main` by a designer's commit. Only the repo owner (Pat) changes them, via a version bump.

```
App.tsx           index.ts           src/navigation/    src/HomeScreen.tsx
src/prototypes.ts app.json           metro.config.cjs   babel.config.*
tsconfig.json     package.json       package-lock.json  server.js
.github/          .claude/commands/
```

The single most common way to break the deploy is committing `package.json` or
`package-lock.json`: a designer runs `npm install` (which rewrites the lockfile
against a stale `package.json`), the file gets swept into a commit, and after the
merge `main`'s `package.json` and lockfile disagree — `npm ci` then fails on
every deploy. Guard against this at **both** the staging step and the merge step
below. (These restrictions apply to designers on their own branch — not to Pat
committing directly on `main`.)

## Steps

1. Detect the current branch:
   ```
   git branch --show-current
   ```

2. Determine which designer's folder to stage:
   - If on a named designer branch (e.g. `radha`), stage only `src/designers/{branch-name}/`
   - If on `main` (Pat), stage whatever files were changed — the blocklist and checks below do not apply to Pat.

3. **Stage the relevant files by explicit path.** On a designer branch, do **not** use `git add -A`, `git add .`, or `git add -u`; stage the designer's folder only:
   ```
   git add src/designers/{slug}/
   ```
   Never stage files outside the designer's folder unless you are Pat on `main`. Do **not** bump the version in `package.json` on a designer branch — version increments only happen when Pat changes shared infrastructure.

4. **Verify nothing shared slipped into the staging area** (designer branches only). Run:
   ```
   git diff --cached --name-only
   ```
   Every path listed must be inside `src/designers/{slug}/`. If any path is outside that folder — especially anything on the shared-infra blocklist above — **unstage it and warn the designer**:
   ```
   git restore --staged {stray-file}
   ```
   In particular, if `package.json` or `package-lock.json` appears, always unstage it and tell the designer: *"I skipped `package.json`/`package-lock.json` — these are shared and can't be committed from a prototype. If you changed a dependency, run `/request-infra-change` so Pat can update them safely."* Never commit these even if the designer insists.

5. If there is nothing left staged, tell the designer there are no (allowed) changes to commit and stop.

6. Write a concise commit message describing the changes. Use the diff to understand what changed.

7. Commit and push to the current branch:
   ```
   git commit -m "{message}"
   git push origin {branch}
   ```

8. Ask the designer: **"Changes committed and pushed to your branch. Would you like to deploy to production now?"**

9. If yes, **before merging, verify the branch carries no shared-infra changes into `main`** (designer branches only). A stray shared file committed earlier on the branch (e.g. a lockfile from a past `npm install`) would reach `main` through the merge even though step 4 kept it out of *this* commit. Check the full branch-vs-main diff:
   ```
   git fetch origin main
   git diff --name-only origin/main...{branch}
   ```
   If any listed path matches the shared-infra blocklist above, **do not merge.** Tell the designer which shared file(s) the branch would change and stop — those changes must be removed from the branch first (or go through Pat via `/request-infra-change`). Committing a desynced `package-lock.json` to `main` breaks every deploy until it's fixed, so this check is mandatory.

   Only if the branch-vs-main diff is clean, merge into `main` and push to trigger deployment:
   ```
   git checkout main
   git merge {branch} --no-edit
   git push origin main
   git checkout {branch}
   ```
   Then confirm: "Your changes are live at `https://sm-native-5c5b643660da.herokuapp.com/`"

   If no, confirm: "Changes saved to your branch. You can deploy any time by running `/commit` again."
