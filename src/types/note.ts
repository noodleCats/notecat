import type { Timestamp } from "@/shared/time";
import type { UUIDv4 } from "@/shared/uuid";

export interface Note {
  id: UUIDv4;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
