import { createStore } from "idb-keyval";

export const NOTES_DB_NAME = "NotecatStorage";
export const NOTES_STORE_NAME = "notes";

export const notesStore = createStore(NOTES_DB_NAME, NOTES_STORE_NAME);
