# Request infra change

File a request asking the repository owner (Pat) to change **shared infrastructure** —
anything the current designer is not allowed to edit directly. This is the designer side
of a lightweight in-repo pull-request workflow. It writes a request file to
`infra-requests/open/`, pushes it to `main`, and opens a GitHub issue so Pat is notified.

Use this whenever a designer needs something outside their own prototype folder: a new
GraphQL resolver or database table, a shared dependency, a change to `server.js`,
`src/db/pool.js`, or the screen/home-screen discovery logic (`src/prototypes.ts`), etc.

**Note — screens and home-screen cards are NOT infra changes anymore.** They are
auto-discovered from each prototype's folder, so adding/removing a prototype (and its nav
screen, deep-link path and card) is done with a `prototype.json` / `designer.json` inside the
designer's own folder (see `/add-designer`). Do not file an infra request for those.

**Describe-only:** the request states *what behaviour/interface* the designer needs and
*why*. It must **not** contain the implementation — Pat's Claude writes the actual code.
Do not edit any shared file in this command.

## Steps

1. **Identify the designer.** Use the current branch (their slug, e.g. `radha`) and the
   prototype they're working in. If unclear, ask which designer and prototype this is for.

2. **Confirm it actually needs shared infra.** A request is only warranted if the change
   touches files outside `src/designers/{slug}/` — e.g. `App.tsx`,
   `src/navigation/AppNavigator.tsx`, `src/HomeScreen.tsx`, `server.js`, `src/db/pool.js`,
   shared `src/graphql/` resolvers, `app.json`, `package.json` deps, or CI workflows.
   - If what they want is entirely inside their own prototype folder, tell them they can
     just build it directly (or via `/commit`) — no request needed — and stop.

3. **Interview the designer** to fill out the request. Capture, in plain language:
   - **What I need** — the capability, described by behaviour not implementation.
   - **Why** — what it unblocks.
   - **Desired behaviour / interface** — be concrete about the contract without writing
     code: GraphQL queries/mutations (name + shape), sample request/response payloads,
     data to store (field names + rough types), any screen registration / nav entry / URL
     linking needed.
   - **Acceptance** — how the designer will verify it works once shipped.
   - **Affected infra (best guess)** — which shared files they think are involved. Pat
     confirms the real list; this is just a hint.

4. **Build the request file** from `infra-requests/TEMPLATE.md`:
   - `id` and filename: `{YYYY-MM-DD}-{designer}-{short-slug}.md` using today's date and a
     short kebab-case summary, e.g. `2026-06-16-radha-orders-graphql.md`.
   - Fill in the frontmatter (`designer`, `prototype`, `title`, `status: open`, `created`,
     `affected_infra`) and the body sections. Leave `github_issue` blank for now.

5. **Publish the request to `main`** without dragging in unfinished prototype work:
   ```
   git stash --include-untracked          # protect the designer's working changes
   git checkout main && git pull
   ```
   Write the request file to `infra-requests/open/{id}.md`, then:
   ```
   git add infra-requests/open/{id}.md
   git commit -m "infra-request: {title} ({designer})"
   git push
   ```
   - `infra-requests/open/` is the **one** location a designer's Claude may commit outside
     their own folder. Stage only the single request file — nothing else.

6. **Open a GitHub issue** for notification and tracking (best effort):
   ```
   gh issue create \
     --title "infra-request: {title}" \
     --label infra-request \
     --assignee pat-siteminder \
     --body-file infra-requests/open/{id}.md
   ```
   - Assigning to `pat-siteminder` (the repository owner) is what notifies Pat — GitHub
     emails him and surfaces it in his GitHub inbox. Keep this assignee.
   - If the `infra-request` label doesn't exist yet, create it first:
     `gh label create infra-request --color 1f6feb --description "Shared-infra change request from a designer" 2>/dev/null` then retry.
   - If `gh` is unavailable or not authenticated, skip the issue and note that Pat should
     be pinged manually. Don't fail the whole command.
   - Capture the issue URL, write it into the file's `github_issue:` frontmatter, then
     commit and push that update:
     ```
     git add infra-requests/open/{id}.md
     git commit -m "infra-request: link issue for {id}"
     git push
     ```

7. **Return to the designer's branch and restore their work:**
   ```
   git checkout {slug}
   git stash pop        # only if step 5 stashed something
   ```

8. **Confirm to the designer:** tell them the request is filed, give the GitHub issue link
   (if created), and explain that Pat will be notified, and that once it's shipped they'll
   be notified on the issue and can pull it in with `/sync`.
