import {
  getCurrentTime,
  isValidTimestamp,
  type Timestamp,
} from "@/shared/time";
import { getRandomUUID, isValidUUID, type UUIDv4 } from "@/shared/uuid";

export interface Note {
  id: UUIDv4;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function newNote(title = "Untitled", content = ""): Note {
  const now = getCurrentTime();
  return {
    id: getRandomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export function isNote(object: unknown): object is Note {
  const isObject = typeof object === "object" && object !== null;
  if (!isObject) return false;

  const hasNoteProperties =
    "id" in object &&
    "title" in object &&
    "content" in object &&
    "createdAt" in object &&
    "updatedAt" in object;
  if (!hasNoteProperties) return false;

  const hasValidTypes =
    typeof object.id === "string" &&
    typeof object.title === "string" &&
    typeof object.content === "string" &&
    typeof object.createdAt === "number" &&
    typeof object.updatedAt === "number";
  if (!hasValidTypes) return false;

  const hasValidTimestamps =
    isValidTimestamp(object.createdAt) && isValidTimestamp(object.updatedAt);
  if (!hasValidTimestamps) return false;

  const hasValidUUID = isValidUUID(object.id);
  if (!hasValidUUID) return false;

  return true;
}

export function isNoteArray(value: unknown): value is Note[] {
  return Array.isArray(value) && value.every((note) => isNote(note));
}
