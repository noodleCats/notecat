/**
 * Interface representing statistics about a text
 */
export interface TextStats {
  wordCount: number;
  characterCount: number;
  storageUsedBytes: number;
}

/**
 * Interface representing formatted statistics about a text
 */
export interface FormattedTextStats {
  wordCount: string;
  characterCount: string;
  storageUsed: string;
}
