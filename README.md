# Notecat

A minimal, local-first note taking app.

This is an app that was made by me to learn TypeScript, and partly due to my frustrations with Notion. The Vanilla TS base is written by me, while the Svelte 5 migration ~~has been~~ _was_ vibe-coded, but went through a bit of a clean-up after that. The ultimate goal with Notecat is to make a web app that feels decent to use and can run on any machine with a browser.

## Features

- **Local-first** - All notes are handled locally and stored in localStorage
- **Multi-note support** - Create, edit, and delete multiple notes
- **Auto-save** - Changes are saved automatically as you type

## Tech stack

- [TypeScript](https://www.typescriptlang.org/)
- [Svelte 5](https://svelte.dev/)
- [Vite 7](https://vitejs.dev/) for dev server and bundling
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
