import type { ComponentType } from 'react';

// Prototypes are auto-discovered from the filesystem. Each prototype is a folder
// at src/designers/{slug}/{prototype}/App.tsx and is registered as a screen at
// route "{slug}/{prototype}" automatically — no edit to the navigator, the
// linking config, or the home screen is needed to add one.
//
// Optional per-prototype config lives in the prototype's own prototype.json:
//   { "label": "SM Mobile", "order": 0 }
//   { "headerShown": false }  -> hide the native nav header (prototype owns its chrome)
//   { "hidden": true }        -> registered as a screen but no home-screen card
//   { "disabled": true }      -> excluded entirely (no screen, no card)
// Per-designer name/initials live in src/designers/{slug}/designer.json.
//
// To change THIS discovery logic is a shared-infra change (owner only).

// require.context is provided by Metro (enabled by default in Expo). It is not in
// the TS lib, so we describe the shape we use.
type RequireContext = {
  keys(): string[];
  (id: string): any;
};
declare const require: NodeRequire & {
  context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): RequireContext;
};

const appCtx = require.context('./designers', true, /\/App\.(tsx|jsx)$/);
const protoManifestCtx = require.context('./designers', true, /\/prototype\.json$/);
const designerManifestCtx = require.context('./designers', true, /\/designer\.json$/);

function readJson(ctx: RequireContext, key: string): Record<string, any> {
  try {
    const m = ctx(key);
    return (m && (m.default || m)) || {};
  } catch {
    return {};
  }
}

function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export type Prototype = {
  slug: string;
  proto: string;
  route: string; // screen name and deep-link path: "{slug}/{proto}"
  label: string;
  order: number;
  hidden: boolean;
  headerShown: boolean;
  component: ComponentType<any>;
};

export const prototypes: Prototype[] = appCtx
  .keys()
  .map((key): Prototype | null => {
    const match = key.match(/^\.\/([^/]+)\/([^/]+)\/App\.(?:tsx|jsx)$/);
    if (!match) return null;
    const [, slug, proto] = match;
    const manifest = readJson(protoManifestCtx, `./${slug}/${proto}/prototype.json`);
    if (manifest.disabled) return null;
    const mod = appCtx(key);
    return {
      slug,
      proto,
      route: `${slug}/${proto}`,
      label: manifest.label || titleCase(proto),
      order: typeof manifest.order === 'number' ? manifest.order : 999,
      hidden: !!manifest.hidden,
      headerShown: manifest.headerShown !== false,
      component: mod.default || mod,
    };
  })
  .filter((p): p is Prototype => p !== null);

export type DesignerEntry = {
  name: string;
  initials: string;
  prototypes: { route: string; label: string }[];
};

export const designers: DesignerEntry[] = (() => {
  const bySlug: Record<string, Prototype[]> = {};
  for (const p of prototypes) {
    if (p.hidden) continue;
    (bySlug[p.slug] ||= []).push(p);
  }
  return Object.keys(bySlug)
    .map((slug) => {
      const meta = readJson(designerManifestCtx, `./${slug}/designer.json`);
      const name = meta.name || titleCase(slug);
      return {
        name,
        initials: meta.initials || deriveInitials(name),
        prototypes: bySlug[slug]
          .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
          .map((p) => ({ route: p.route, label: p.label })),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
})();
