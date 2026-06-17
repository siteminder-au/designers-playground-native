# Review infra requests

The owner side of the in-repo request workflow. Lists the shared-infrastructure change
requests designers have filed, implements the chosen one in the real shared files, ships
it, and closes the loop. **For the repository owner (Pat) only** — only Pat may edit
shared infrastructure.

Pairs with `/request-infra-change` (the designer side).

## Steps

1. **Confirm you're the owner.** This command edits shared infrastructure, which only Pat
   may do. If the session is a designer, stop and tell them to use `/request-infra-change`
   instead.

2. **Get the latest and list open requests:**
   ```
   git checkout main && git pull
   ```
   List from both sources and reconcile:
   ```
   ls infra-requests/open/
   gh issue list --label infra-request --state open
   ```
   Summarise each open request: designer, prototype, title, and a one-line "what / why".
   If there are none, say so and stop.

3. **Pick a request** to work on (ask Pat which, or take the one named in the invocation).
   Read the full file from `infra-requests/open/{id}.md` and the linked GitHub issue.

4. **Decide the path:**
   - **Need clarification?** Append your question to the request's `## Owner log`, set
     `status: needs-info`, commit and push the file, and post the question as a comment on
     the issue (`gh issue comment {n} --body "..."`). Tell Pat you've bounced it back to
     the designer, and stop. (The designer answers by editing the file / replying on the
     issue, then it returns to `open` for another pass.)
   - **Declining?** Move the file to `closed/`, set `status: declined`, record the reason
     in the `## Owner log`, commit and push, then close the issue with the reason
     (`gh issue close {n} --comment "..."`). Stop.
   - **Proceeding?** Continue to step 5.

5. **Implement the change** in the real shared files (`App.tsx`,
   `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`, `server.js`, `src/db/pool.js`,
   shared `src/graphql/` resolvers, etc.) per the request's desired behaviour/interface.
   Follow the repo's conventions and the rules in `CLAUDE.md`. Validate before shipping:
   - For `server.js`: `node --check server.js`.
   - For TypeScript / navigation / shared changes: make sure the app still type-checks and
     compiles (`npx tsc --noEmit` and/or that `npx expo export --platform web` succeeds for
     significant changes).

6. **Bump the version.** Shared-infra changes bump `package.json` `version` (semver). Pat
   decides how much — ask if unsure; default to a patch for additive, behaviour-preserving
   changes.

7. **Commit and ship to `main`:**
   ```
   git add {changed shared files} package.json
   git commit -m "{what changed} (infra-request: {designer}/{slug})"
   git push
   ```

8. **Close out the request record:**
   - Move the file: `git mv infra-requests/open/{id}.md infra-requests/closed/{id}.md`.
   - Set `status: applied` and append to `## Owner log`: what was implemented, the version
     bump, and the commit SHA.
   - Commit and push:
     ```
     git add infra-requests/
     git commit -m "infra-request: mark {id} applied"
     git push
     ```

9. **Close the GitHub issue** with a summary so the designer is notified:
   ```
   gh issue close {n} --comment "Shipped in {sha} (v{new version}). {one-line summary}. Run /sync to pull it into your branch."
   ```
   If `gh` is unavailable, note that the designer should be told manually.

10. **Confirm to Pat** what shipped, the new version, and that the designer needs to
    `/sync`. If more requests remain open, offer to handle the next one.
