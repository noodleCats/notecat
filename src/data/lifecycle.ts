import { requestPersistentStorage, subscribeToNotesChanges } from "./storage";

export function setupLifecycle({
  onNotesChanged,
  hasUnsavedEdits,
}: {
  onNotesChanged: () => void;
  hasUnsavedEdits: () => boolean;
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

  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedEdits()) event.preventDefault();
  };
  window.addEventListener("beforeunload", onBeforeUnload);

  return () => {
    unsubscribe();
    window.removeEventListener("beforeunload", onBeforeUnload);
  };
}
