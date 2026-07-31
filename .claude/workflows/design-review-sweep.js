export const meta = {
  name: 'design-review-sweep',
  description: 'Full design review of all LH Housekeeping screens — Playwright capture then parallel analysis',
  phases: [
    { title: 'Capture', detail: 'Sequential Playwright navigation and screenshot of all 6 screens' },
    { title: 'Analyse', detail: '6 parallel design review agents, one per screen' },
    { title: 'Deploy', detail: 'Commit annotation JSONs and push to Heroku' },
  ],
}

const REPO = '/Users/paul.fang/Repos/designers-playground-native'
const PROTO = `${REPO}/src/designers/paul/lh-housekeeping`
const SCREENS = ['Home', 'Calendar', 'Reservations', 'Distribution', 'Notifications', 'Housekeeping']

// Date passed in via args (set by the calling skill from currentDate context)
const DATE = (args && args.date) ? args.date : '2026-06-26'

// ── Phase 1: Capture all screenshots sequentially ──────────────────────────
// Playwright is a shared resource — navigation must be serial.
// We capture-first and analyse-later so the context window stays lean
// during navigation and all 6 analysis agents can start as soon as possible.

phase('Capture')
log('Navigating all 6 screens — capturing screenshots only, no analysis yet')

const LAYOUT_EVAL_FN = `() => {
  const out = [];
  const sx = window.scrollX || 0;
  const sy = window.scrollY || 0;
  document.querySelectorAll('body *').forEach(el => {
    if (el.children.length > 0) return;
    // React Navigation keeps previously-active tabs mounted-but-hidden in the
    // background. Skip anything not actually visible so hidden leftover tabs
    // never pollute the layout data — a design review should only ever look
    // at what the user can actually see or reach by scrolling.
    if (el.checkVisibility ? !el.checkVisibility() : el.offsetParent === null) return;
    const t = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!t) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    out.push({ text: t.slice(0, 80), x: Math.round(r.x + sx), y: Math.round(r.y + sy), w: Math.round(r.width), h: Math.round(r.height) });
  });
  return out;
}`

await agent(`
You are the Playwright capture agent for the LH Housekeeping design review.
Your job is to navigate each screen, take a screenshot, and dump real element
coordinates. Do NOT analyse anything — just capture.

== ENTRY SEQUENCE (run once) ==
1. browser_resize: width 390, height 844
2. browser_navigate to: https://designtest:Thanks4urF33dback!@sm-native-5c5b643660da.herokuapp.com/
3. If the page URL shows about:blank — check open browser tabs; switch to the PlaygroundHome tab or re-navigate.
4. Click the element with text "LH Housekeeping" to enter the prototype. It loads on the Reservations screen.

== PER-SCREEN CAPTURE STEPS (do all 4 for each screen below) ==
For each screen: navigate, screenshot, dump layout, copy both. Move on — do not analyse.
Steps 2 and 3 don't depend on each other's output — issue both tool calls in the
same turn instead of waiting for one before starting the other.

1. Navigate using the method given for that screen.
2. browser_take_screenshot → filename: \`${PROTO}/.playwright-mcp/<Screen>-source.png\`
3. browser_evaluate with this exact function, then Write the returned array as JSON
   to \`${PROTO}/.playwright-mcp/<Screen>-layout.json\`:
   ${LAYOUT_EVAL_FN}
4. Bash: cp both files into \`${REPO}/.design-review/\` as \`${DATE}-<Screen>-source.png\`
   and \`${DATE}-<Screen>-layout.json\`.

HOME: Click tab getByRole('tab', { name: '  Home' })
CALENDAR: Click tab getByRole('tab', { name: '  Calendar' })
RESERVATIONS: Click tab getByRole('tab', { name: '  Reservations' })
DISTRIBUTION: Click tab getByRole('tab', { name: '  Distribution' })
NOTIFICATIONS: Click tab getByRole('tab', { name: '  Notifications' })
HOUSEKEEPING (tab is hidden — use this workaround):
- First click Reservations tab: getByRole('tab', { name: '  Reservations' })
- The cleaning-services button is NOT clickable via ref/role-based clicks — its
  accessibility-tree node gets dropped, and a ref-based browser_click silently
  clicks the wrong element with no error. Instead, find it by computed style
  and dispatch a synthetic click via browser_evaluate:
  \`() => {
    const btn = Array.from(document.querySelectorAll('div')).find(d => {
      const r = d.getBoundingClientRect();
      return r.y < 60 && r.height > 20 && r.height < 50 &&
        getComputedStyle(d).backgroundColor === 'rgb(255, 245, 238)' &&
        r.x < 250; // leftmost of the two orange-background header icons
    });
    if (!btn) return 'not found';
    const r = btn.getBoundingClientRect();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
    const el = document.elementFromPoint(x, y);
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
    return location.pathname;
  }\`
- Confirm URL changed to .../Housekeeping before screenshotting

When all 6 are done, return: "Captured: Home, Calendar, Reservations, Distribution, Notifications, Housekeeping"
`, { label: 'capture:all-screens', phase: 'Capture' })

// ── Phase 2: Parallel analysis ─────────────────────────────────────────────
// All 6 screenshots are now on disk. Spawn one agent per screen simultaneously.
// Each agent reads its screenshot, analyses it, writes the JSON, and returns a count.

phase('Analyse')
log('All screenshots captured — launching 6 parallel analysis agents')

const CHECKLIST = `
Run through these dimensions in order. Skip anything clearly not applicable.

Touch targets:
- Tappable elements must be ≥ 44×44 dp (iOS HIG). Flag anything noticeably smaller.
- Adjacent tap targets must have ≥ 8 dp between them.

Color & contrast:
- Body text ≥ 4.5:1 contrast against background.
- Bold/large text (≥ 18pt bold) ≥ 3:1 is acceptable.
- State doesn't rely on colour alone.

Spacing & alignment:
- Consistent padding inside containers.
- Vertical rhythm — repeated rows have predictable spacing.
- Text not crowding container edges.

Hierarchy & legibility:
- Clear focal point — primary content stands out.
- Truncation handled gracefully (not 2-char ellipsis).

Edge cases:
- Empty states are handled (not blank white).
- Long content wraps or truncates sensibly.

Accessibility:
- Interactive elements have visible labels or recognisable icons.
- Colour is not the only signal for state.

Find 3–6 genuine issues. If the screen is strong, say so in working_well and keep markers minimal. Do NOT invent issues.
`

const results = await parallel(SCREENS.map(screen => () => agent(`
You are reviewing the ${screen} screen of the LH Housekeeping prototype — a hotel management app for front-desk staff and housekeepers.

== STEP 1: Read the screenshot and the real layout data ==
Screenshot: ${PROTO}/.playwright-mcp/${screen}-source.png
Layout: ${PROTO}/.playwright-mcp/${screen}-layout.json — an array of every leaf
text element actually rendered on this screen, each with its EXACT bounding box:
{ "text": "...", "x": N, "y": N, "w": N, "h": N }. These coordinates come from
the live DOM (getBoundingClientRect), not an estimate.
Use the Read tool to view both before doing anything else.

== STEP 2: Analyse for design issues ==
${CHECKLIST}

Coordinate system: CSS pixels matching the 390×844 Playwright viewport.
rect.x / rect.y = top-left corner of the flagged element.
rect.w / rect.h = width and height of the element.

For EVERY marker, find the matching entry/entries in layout.json by matching
visible text (substring match is fine — text may be truncated to 80 chars).
Use their real x/y/w/h for rect — do NOT eyeball pixels from the screenshot.
If a marker spans multiple text elements (e.g. a whole row or card), take the
union: x = min(x), y = min(y), and extend w/h to cover max(x+w)/max(y+h) of all
of them. Only fall back to a screenshot estimate if the issue genuinely has no
associated text (e.g. a bare icon, colour region, or pure whitespace gap) —
in that case anchor as tightly as possible to the nearest layout.json entries.

== STEP 3: Write the annotations JSON ==
Use the Write tool to create this file:
${PROTO}/src/annotations/${screen}.json

Required structure:
{
  "screen": "${screen}",
  "generated": "${DATE}",
  "markers": [
    {
      "num": 1,
      "rect": { "x": 0, "y": 0, "w": 100, "h": 44 },
      "title": "Short issue title (≤ 8 words)",
      "body": "What is wrong and how to fix it — 1-2 sentences."
    }
  ],
  "working_well": [
    "One sentence per positive observation."
  ],
  "worth_considering": [
    "One sentence per non-blocking polish idea."
  ]
}

Markers are numbered sequentially from 1. working_well and worth_considering should each have 2–4 entries.

== STEP 4: Return your result ==
Return: { "screen": "${screen}", "issueCount": <number of markers you wrote> }
`, {
  label: `review:${screen}`,
  phase: 'Analyse',
  schema: {
    type: 'object',
    required: ['screen', 'issueCount'],
    properties: {
      screen: { type: 'string' },
      issueCount: { type: 'number' },
    },
  },
})))

// ── Phase 3: Commit and deploy ─────────────────────────────────────────────

phase('Deploy')

const succeeded = results.filter(Boolean)
const summaryLine = succeeded.map(r => `${r.screen}(${r.issueCount})`).join(', ')
log(`Analysis complete: ${summaryLine} — committing and deploying`)

await agent(`
Commit and push the LH Housekeeping annotation JSONs.

Run these git commands in sequence using the Bash tool:

1. git -C "${REPO}" add "${PROTO}/src/annotations/"
2. git -C "${REPO}" diff --cached --stat
3. git -C "${REPO}" commit -m "paul: design review sweep — ${summaryLine}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
4. git -C "${REPO}" push origin notes-exploration
5. git -C "${REPO}" checkout main
6. git -C "${REPO}" merge notes-exploration --no-edit
7. git -C "${REPO}" push origin main
8. git -C "${REPO}" checkout notes-exploration

If step 2 shows nothing staged, skip the commit — the files may already be committed.
Return "Deployed." when done.
`, { label: 'deploy', phase: 'Deploy' })

// ── Final summary ──────────────────────────────────────────────────────────

const table = succeeded
  .map(r => `| ${r.screen} | ${r.issueCount} |`)
  .join('\n')

return `Full sweep complete — ${succeeded.length}/6 screens reviewed and deployed.\n\n| Screen | Issues |\n|---|---|\n${table}`
