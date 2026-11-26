import { subscribeToNotesChanges } from "./channel";
import { requestPersistentStorage } from "./storage";

export function setupLifecycle({
  onNotesChanged,
  hasUnsavedEdits,
  flushUnsavedEdits,
}: {
  onNotesChanged: () => void;
  hasUnsavedEdits: () => boolean;
  flushUnsavedEdits: () => void;
}): () => void {
  const unsubscribe = subscribeToNotesChanges(onNotesChanged);

  void requestPersistentStorage().then((result) => {
    if (!result.ok) {
      console.warn("Could not request persistent storage:", result.error);
    } else if (result.value === "denied") {
      console.warn(
        "Persistent storage was denied; locally stored notes may be removed if the browser needs to free space.",
      );
    }
  });

  // Mobile browsers often discard backgrounded pages without firing
  // beforeunload, so pending edits are saved as soon as the page is hidden.
  // visibilitychange is the last event reliably fired on mobile
  //
  // pagehide covers browsers that skip it on navigation (e.g. older Safari)
  const flushIfNeeded = () => {
    if (hasUnsavedEdits()) flushUnsavedEdits();
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flushIfNeeded();
  };

  // Warn when closing with edits that haven't been saved yet
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedEdits()) event.preventDefault();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", flushIfNeeded);
  window.addEventListener("beforeunload", onBeforeUnload);

  return () => {
    unsubscribe();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", flushIfNeeded);
    window.removeEventListener("beforeunload", onBeforeUnload);
  };
}
