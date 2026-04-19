# Notecat

a minimal, local-first note taking app in your browser

<img 
  width="1918" 
  height="1151" 
  alt="image" 
  src="https://github.com/user-attachments/assets/deed33ce-1df9-4f47-823c-a9c9c416dc68"
/>

## Usage

You can use Notecat by going [here](https://notecat.ncats.xyz/).

You can also build and host it yourself:
```bash
git clone https://github.com/noodleCats/notecat.git
cd notecat
bun install
bun run build
# build in dist/, can be served from a static host like Neocities
```

## Features

- Create and edit plain text notes
- Lightweight (<35 kB gzip)
- Local-first - notes are stored in the browser via IndexedDB

## Why does this exist

Notecat was built to be a simple and easy to use app, that is able to load fast and run on any machine with a browser on it.

This app is small (less than 3,000 lines of code). Most of the maintenance
work focuses on bugfixes and essential note-taking app features.
