# Notecat

A minimal, local-first note taking app.

This is an app that was made by me to learn TypeScript, and partly due to my frustrations with Notion. The Vanilla TS base is written by me, while the Svelte 5 migration has been _vibe-coded_ - since the initial goal is to make an app that feels decent to use, rather than spending time learning web development as a guy who has more important things to do.

## Features

- **Local-first** - All notes are handled locally and stored in localStorage
- **Multi-note support** - Create, edit, and delete multiple notes
- **Auto-save** - Changes are saved automatically as you type
- **Status bar** - Shows word count, character count, storage usage, and timestamps

## Tech stack

- [TypeScript](https://www.typescriptlang.org/)
- [Svelte 5](https://svelte.dev/)
- [Vite](https://vitejs.dev/) for bundling
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting

## Getting started

### Installation
```bash
# Clone the repo
git clone https://github.com/noodleCats/notecat.git
cd notecat

# Install dependencies
npm install
```

### Development
```bash
# Dev server
npm run dev

# Build using Vite
npm run build

# Lint with oxlint
npm run lint
```
