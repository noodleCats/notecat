<script lang="ts">
  import { onDestroy, onMount, type Snippet } from "svelte";
  import type { ClassValue, HTMLDialogAttributes } from "svelte/elements";
  import { fade, scale } from "svelte/transition";

  // `oncancel` and `onclose` are handled here, and `...rest` would override them
  interface Props extends Omit<
    HTMLDialogAttributes,
    "class" | "children" | "open" | "oncancel" | "onclose"
  > {
    /** Called on Escape or a click on the backdrop */
    ondismiss: () => void;
    onopen?: () => void;
    /** Positions the panel within the viewport */
    layout?: ClassValue;
    class?: ClassValue;
    children: Snippet;
  }

  let {
    ondismiss,
    onopen,
    layout = "items-center",
    class: panelClass,
    children,
    ...rest
  }: Props = $props();

  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 150;

  let dialog: HTMLDialogElement;
  let previouslyFocused: Element | null = null;

  // Only dismiss when the press both started and ended on the backdrop. A drag
  // between the panel and the backdrop fires `click` on their common
  // ancestor (the backdrop), so `click`'s target alone can't tell them apart
  let pressStartedOnBackdrop = false;
  let pressEndedOnBackdrop = false;

  function onpointerdown(event: PointerEvent) {
    pressStartedOnBackdrop = event.target === event.currentTarget;
  }

  function onpointerup(event: PointerEvent) {
    pressEndedOnBackdrop = event.target === event.currentTarget;
  }

  function onclick() {
    if (pressStartedOnBackdrop && pressEndedOnBackdrop) ondismiss();
    pressStartedOnBackdrop = false;
    pressEndedOnBackdrop = false;
  }

  // Cancelling keeps the dialog open for the outro
  function oncancel(event: Event) {
    event.preventDefault();
    ondismiss();
  }

  // Browsers have an anti-trap rule. If a page cancels Escape on a
  // dialog, the next Escape is still cancellable only if the user did
  // something in between, like a click
  //
  // Otherwise `cancel` is not cancellable, and the browser closes the
  // dialog anyway. That way a page can't block Escape forever. When that
  // happens, the dialog is closed but the app state still thinks it's open
  //
  // `onclose` catches that and calls `ondismiss()` so the state matches.
  // Skipped once this dialog is removed from the page, since a late
  // `close` would otherwise dismiss whichever dialog opened next
  function onclose() {
    if (dialog.isConnected) ondismiss();
  }

  onMount(() => {
    previouslyFocused = document.activeElement;
    dialog.showModal();
    onopen?.();
  });

  onDestroy(() => {
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  });
</script>

<dialog
  bind:this={dialog}
  class="m-0 h-full max-h-none w-full max-w-none bg-transparent backdrop:bg-transparent"
  {oncancel}
  {onclose}
  {...rest}
>
  <div
    class={[
      "flex h-full w-full justify-center bg-black/60 backdrop-blur-xs",
      layout,
    ]}
    {onpointerdown}
    {onpointerup}
    {onclick}
    role="presentation"
    transition:fade={{ duration }}
  >
    <div class={panelClass} transition:scale={{ start: 0.95, duration }}>
      {@render children()}
    </div>
  </div>
</dialog>
