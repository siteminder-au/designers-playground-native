#!/usr/bin/env python3
"""
Design Review pipeline runner.

Bundles every side-effect-producing step of /design-review (clipboard read,
sim screenshot, ImageMagick render, Preview launch) into a single executable
so Claude Code needs only ONE allowlist entry to run the whole flow without
permission prompts.

Subcommands:
  capture
    Save a PNG from the best available source (clipboard, then iOS sim) into
    <repo>/.design-review/<timestamp>-source.png. Print JSON:
      {"source": "...", "width": N, "height": N, "from": "clipboard"|"sim"}

  sample [--source PATH] [--height H] Y [Y ...]
    Crop horizontal strips out of the source PNG at the given y values
    (default: most recent source, 80px strip height, full width). Used to
    verify element positions before drawing markers. Print JSON:
      {"samples": [{"y": N, "path": "..."}, ...]}

  annotate <spec.json>
    Read an annotation spec, render the annotated PNG to spec.output, open it
    in Preview. Print JSON: {"output": "..."}

  See spec format at the bottom of this file.
"""
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ARIAL_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ARIAL_R = "/System/Library/Fonts/Supplemental/Arial.ttf"
ACCENT = "#ff3b30"

BADGE_RADIUS = 22
BADGE_EDGE_PAD = 4  # min distance from canvas edge to badge edge


def clamp_badge(cx: int, cy: int, max_w: int, max_h: int):
    """Keep badge fully inside (max_w x max_h) so the circle + digit aren't clipped."""
    lo_x = BADGE_RADIUS + BADGE_EDGE_PAD
    lo_y = BADGE_RADIUS + BADGE_EDGE_PAD
    hi_x = max_w - BADGE_RADIUS - BADGE_EDGE_PAD
    hi_y = max_h - BADGE_RADIUS - BADGE_EDGE_PAD
    return max(lo_x, min(cx, hi_x)), max(lo_y, min(cy, hi_y))


def digit_offsets(n: int):
    """Pixel offsets from badge center to baseline-start, tuned for Arial Bold pointsize 26."""
    if n < 10:
        # narrow "1" needs slightly less left shift than fatter "2"-"9"
        return (-6 if n == 1 else -8), 9
    return -14, 9


def repo_root() -> Path:
    p = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True
    )
    return Path(p.stdout.strip()) if p.returncode == 0 else Path.cwd()


def outdir() -> Path:
    d = repo_root() / ".design-review"
    d.mkdir(exist_ok=True)
    return d


def ts() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def magick_dim(path: Path):
    p = subprocess.run(
        ["magick", "identify", "-format", "%w %h", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    w, h = p.stdout.strip().split()
    return int(w), int(h)


def save_clipboard_png(out: Path) -> bool:
    script = f"""
    try
      set d to (the clipboard as «class PNGf»)
      set f to open for access POSIX file "{out}" with write permission
      write d to f
      close access f
      return "OK"
    on error e
      return "ERR:" & e
    end try
    """
    p = subprocess.run(
        ["osascript", "-e", script], capture_output=True, text=True
    )
    return p.stdout.strip() == "OK" and out.exists()


def sim_booted() -> bool:
    p = subprocess.run(
        ["xcrun", "simctl", "list", "devices", "booted"],
        capture_output=True,
        text=True,
    )
    return "Booted" in p.stdout


def sim_screenshot(out: Path) -> bool:
    p = subprocess.run(
        ["xcrun", "simctl", "io", "booted", "screenshot", str(out)]
    )
    return p.returncode == 0 and out.exists()


def cmd_capture(_args):
    od = outdir()
    src = od / f"{ts()}-source.png"
    if save_clipboard_png(src):
        w, h = magick_dim(src)
        print(json.dumps({"source": str(src), "width": w, "height": h, "from": "clipboard"}))
        return
    if sim_booted() and sim_screenshot(src):
        w, h = magick_dim(src)
        print(json.dumps({"source": str(src), "width": w, "height": h, "from": "sim"}))
        return
    print(
        json.dumps({"error": "No source — clipboard empty and no sim booted"}),
        file=sys.stderr,
    )
    sys.exit(1)


def latest_source() -> Path:
    srcs = list((repo_root() / ".design-review").glob("*-source.png"))
    if not srcs:
        print(json.dumps({"error": "no source PNG in .design-review/"}), file=sys.stderr)
        sys.exit(1)
    return max(srcs, key=lambda p: p.stat().st_mtime)


def cmd_sample(args):
    source: Path = None
    height = 80
    ys = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--source":
            source = Path(args[i + 1])
            i += 2
        elif a == "--height":
            height = int(args[i + 1])
            i += 2
        else:
            ys.append(int(a))
            i += 1
    if not ys:
        print("usage: dr-pipeline.py sample [--source PATH] [--height H] Y [Y ...]", file=sys.stderr)
        sys.exit(2)
    if source is None:
        source = latest_source()
    src_w, _ = magick_dim(source)

    samples_dir = repo_root() / ".design-review" / "samples"
    samples_dir.mkdir(exist_ok=True)
    stamp = ts()

    out = []
    for y in ys:
        path = samples_dir / f"{stamp}-y{y}.png"
        subprocess.run(
            ["magick", str(source), "-crop", f"{src_w}x{height}+0+{y}", "+repage", str(path)],
            check=True,
        )
        out.append({"y": y, "path": str(path)})
    print(json.dumps({"samples": out}))


def esc(s: str) -> str:
    # Replace ASCII apostrophe with Unicode right-single-quote so ImageMagick's
    # -draw text parser doesn't choke on quote escaping.
    return s.replace("'", "’")


def cmd_annotate(args):
    if not args:
        print("usage: dr-pipeline.py annotate <spec.json>", file=sys.stderr)
        sys.exit(2)
    spec = json.loads(Path(args[0]).read_text())

    src = spec["source"]
    out = spec["output"]
    src_w = spec["source_width"]
    src_h = spec["source_height"]
    markers = spec.get("markers", [])
    sidebar = spec.get("sidebar", {})

    canvas_w = src_w + 650
    issues = sidebar.get("issues", [])
    ww = sidebar.get("working_well")
    wc = sidebar.get("worth_considering")

    # Calculate canvas height: bottom of last sidebar element + padding.
    bottom = 80 + max(0, len(issues) - 1) * 230 + 200
    if ww:
        bottom = max(bottom, ww.get("top_y", bottom) + sum(30 * len(b) for b in ww.get("bullets", [])) + 40)
    if wc:
        bottom = max(bottom, wc.get("top_y", bottom) + sum(30 * len(i) for i in wc.get("items", [])) + 40)
    canvas_h = max(src_h, bottom + 30)

    # NorthWest gravity anchors the source to the top-left of the extended canvas
    # so its pixel coordinates stay 1:1 with the source. Using "west" here would
    # vertically centre the source in a taller canvas and shift every marker by
    # (canvas_h - src_h)/2 pixels.
    cmd = [
        "magick",
        src,
        "-background", "white",
        "-gravity", "NorthWest",
        "-extent", f"{canvas_w}x{canvas_h}",
    ]

    # Left pane: marker rectangles (stroked, no fill).
    cmd += ["-fill", "none", "-stroke", ACCENT, "-strokewidth", "5"]
    for m in markers:
        x1, y1, x2, y2 = m["rect"]
        cmd += ["-draw", f"rectangle {x1},{y1} {x2},{y2}"]

    # Left pane: marker badges (white circle, red stroke). Auto-clamp so the
    # badge stays fully inside the screenshot — badges near image edges that
    # would otherwise be clipped get nudged inward by a few pixels.
    for m in markers:
        cx, cy = m["badge"]
        m["badge"] = clamp_badge(cx, cy, src_w, src_h)
    cmd += ["-fill", "white", "-stroke", ACCENT, "-strokewidth", "3"]
    for m in markers:
        cx, cy = m["badge"]
        cmd += ["-draw", f"circle {cx},{cy} {cx},{cy + BADGE_RADIUS}"]

    # Left pane: marker numbers, tuned-offset text for visual centering.
    cmd += ["-fill", ACCENT, "-stroke", "none", "-font", ARIAL_B, "-pointsize", "26"]
    for m in markers:
        cx, cy = m["badge"]
        dx, dy = digit_offsets(m["num"])
        cmd += ["-draw", f"text {cx + dx},{cy + dy} '{m['num']}'"]

    sb_x = src_w  # sidebar left edge

    # Sidebar "ISSUES" label.
    cmd += ["-fill", "#dc2626", "-stroke", "none", "-font", ARIAL_B, "-pointsize", "22"]
    cmd += ["-draw", f"text {sb_x + 25},50 'ISSUES'"]

    # Sidebar issue badges (clamping not needed — sidebar geometry is fixed).
    cmd += ["-fill", "white", "-stroke", ACCENT, "-strokewidth", "3"]
    for e in issues:
        top = e["top_y"]
        cmd += ["-draw", f"circle {sb_x + 55},{top} {sb_x + 55},{top + BADGE_RADIUS}"]
    cmd += ["-fill", ACCENT, "-stroke", "none", "-font", ARIAL_B, "-pointsize", "26"]
    for e in issues:
        dx, dy = digit_offsets(e["num"])
        cmd += ["-draw", f"text {sb_x + 55 + dx},{e['top_y'] + dy} '{e['num']}'"]

    # Sidebar issue titles + body.
    cmd += ["-font", ARIAL_B, "-pointsize", "26", "-fill", "#111"]
    for e in issues:
        cmd += ["-draw", f"text {sb_x + 105},{e['top_y'] + 10} '{esc(e['title'])}'"]
    cmd += ["-font", ARIAL_R, "-pointsize", "22", "-fill", "#333"]
    for e in issues:
        for i, line in enumerate(e.get("body", [])[:3]):
            ly = e["top_y"] + 50 + i * 30
            cmd += ["-draw", f"text {sb_x + 105},{ly} '{esc(line)}'"]

    # WORKING WELL section.
    if ww:
        top = ww["top_y"]
        cmd += ["-stroke", "#d1d5db", "-strokewidth", "1", "-fill", "none"]
        cmd += ["-draw", f"line {sb_x + 25},{top - 30} {canvas_w - 20},{top - 30}"]
        cmd += ["-stroke", "none", "-font", ARIAL_B, "-pointsize", "22", "-fill", "#15803d"]
        cmd += ["-draw", f"text {sb_x + 25},{top} 'WORKING WELL'"]
        cmd += ["-font", ARIAL_R, "-pointsize", "22", "-fill", "#333"]
        y = top + 40
        for bullet in ww.get("bullets", []):
            for i, line in enumerate(bullet):
                prefix = "• " if i == 0 else "  "
                cmd += ["-draw", f"text {sb_x + 25},{y} '{esc(prefix + line)}'"]
                y += 30
            y += 5

    # WORTH CONSIDERING section.
    if wc:
        top = wc["top_y"]
        cmd += ["-stroke", "#d1d5db", "-strokewidth", "1", "-fill", "none"]
        cmd += ["-draw", f"line {sb_x + 25},{top - 30} {canvas_w - 20},{top - 30}"]
        cmd += ["-stroke", "none", "-font", ARIAL_B, "-pointsize", "22", "-fill", "#a16207"]
        cmd += ["-draw", f"text {sb_x + 25},{top} 'WORTH CONSIDERING'"]
        cmd += ["-font", ARIAL_R, "-pointsize", "22", "-fill", "#333"]
        y = top + 40
        for item in wc.get("items", []):
            for i, line in enumerate(item):
                prefix = "• " if i == 0 else "  "
                cmd += ["-draw", f"text {sb_x + 25},{y} '{esc(prefix + line)}'"]
                y += 30
            y += 5

    cmd.append(out)
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(f"magick failed: {p.stderr}", file=sys.stderr)
        sys.exit(1)

    if spec.get("open_after", True):
        subprocess.run(["open", out])
    print(json.dumps({"output": out}))


def main():
    if len(sys.argv) < 2:
        print("usage: dr-pipeline.py <capture|annotate> [args...]", file=sys.stderr)
        sys.exit(2)
    sub = sys.argv[1]
    if sub == "capture":
        cmd_capture(sys.argv[2:])
    elif sub == "sample":
        cmd_sample(sys.argv[2:])
    elif sub == "annotate":
        cmd_annotate(sys.argv[2:])
    else:
        print(f"unknown subcommand: {sub}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()


# ── Spec format for `annotate` ───────────────────────────────────────────────
# {
#   "source": "/abs/path/source.png",
#   "output": "/abs/path/annotated.png",
#   "source_width": 780,
#   "source_height": 1566,
#   "markers": [
#     {"num": 1, "rect": [x1, y1, x2, y2], "badge": [cx, cy]},
#     ...
#   ],
#   "sidebar": {
#     "issues": [
#       {"num": 1, "top_y": 110, "title": "Short title",
#        "body": ["line 1", "line 2", "line 3 (max 3)"]}
#     ],
#     "working_well": {
#       "top_y": 1235,
#       "bullets": [["bullet 1 line 1", "bullet 1 line 2"], ...]
#     },
#     "worth_considering": {
#       "top_y": 1570,
#       "items": [["item 1 line 1", "item 1 line 2"], ...]
#     }
#   },
#   "open_after": true
# }
