import './style.css';
import type { AppState } from './types.ts';

// Application state
const state: AppState = {
  notes: [],
  activeNoteId: null,
};

function init(): void {
  console.log('Notecat initialized', state);
  // TODO: Load notes from storage
  // TODO: Initialize components
  // TODO: Set up event listeners
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
