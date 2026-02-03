/** Represents a single note in the application */
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/** Statistics calculated from note content */
export interface TextStats {
  words: number;
  characters: number;
  storageUsed: StorageInfo;
}

/** Storage usage information */
export interface StorageInfo {
  bytes: number;
  kb: number;
  percent: number; // Percentage of localStorage quota (assumed 5MB)
}

/** Application state */
export interface AppState {
  notes: Note[];
  activeNoteId: string | null;
}
