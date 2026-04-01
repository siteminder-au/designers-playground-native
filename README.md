# Designers Playground (Native)

A multi-designer React Native prototyping environment for SiteMinder Platform Property designers. Runs as a web app via React Native Web, deployed to Heroku.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server (web):
```bash
npm run dev
```

The app will be available at `http://localhost:8081`

## Project Structure

```
designers-playground-native/
├── App.tsx                    # Root component (NavigationContainer + linking)
├── index.ts                   # Expo entry point
├── src/
│   ├── HomeScreen.tsx         # Playground home (designer/prototype list)
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Root navigator (managed by repo owner)
│   └── designers/
│       └── {designer-slug}/
│           └── {prototype-slug}/
│               ├── App.tsx    # Prototype root (no NavigationContainer)
│               └── src/       # Screens, components, etc.
├── .claude/
│   └── commands/              # Claude slash commands
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD → Heroku
├── assets/                    # Shared app icons and splash screen
├── app.json
├── package.json
├── server.js                  # Express server for production
└── Procfile
```

## Claude Slash Commands

| Command | Who | Description |
|---|---|---|
| `/sync` | Everyone | Pull latest from `main` into your branch |
| `/add-designer` | Pat only | Set up a new designer's folder and prototype |
| `/import-prototype` | Pat only | Import an existing React Native app |
| `/delete-prototype` | Pat only | Remove a prototype from the playground |
| `/commit` | Everyone | Stage, commit, and deploy changes |
| `/ask` | Everyone | Ask about the code without making changes |

## Deployment

Push to `main` — GitHub Actions builds (`expo export --platform web`) and deploys to Heroku automatically.

**Heroku app:** `sm-native`
**URL:** `https://sm-native.herokuapp.com/`

### First-time Heroku setup (Pat only)

```bash
heroku create sm-native
heroku buildpacks:set heroku/nodejs -a sm-native
```

Add `HEROKU_API_KEY` to GitHub repository secrets (Settings → Secrets → Actions).

## Scripts

- `npm run dev` — Start Expo dev server (web mode, port 8081)
- `npm run build` — Export for web (`dist/`)
- `npm start` — Start production Express server
