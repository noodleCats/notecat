export function getCharacterCount(text: string): number {
  return text.length;
}

export function getWordCount(text: string): number {
  const words = text
    .trim()
    .split(/[\s.,;;!?/\\()[\]{}"“”—\-`]+/)
    .filter(Boolean);
  return words.length;
}

export function getStorageUsedBytes(text: string): number {
  const blob = new Blob([text]);
  return blob.size;
}
