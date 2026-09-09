<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Modal } from "../types/modal";
  import { closeModal } from "../app/state/modal.svelte";
  import { fade, scale } from "svelte/transition";
  import Button from "./Button.svelte";

  let { title, content, buttons }: Modal = $props();

  let modalElement = $state<HTMLDivElement>();
  let lastButtonRef = $state<Button>();
  let previouslyFocusedElement: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    if (!modalElement) return [];
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalElement.querySelectorAll<HTMLElement>(selector));
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== "Tab" && event.key !== "Escape") return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeModal(null);
      return;
    }

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (focusableElements.length === 0) {
      event.preventDefault();
    }
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  function onclick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeModal(null);
  }

  onMount(() => {
    previouslyFocusedElement = document.activeElement as HTMLElement | null;
    (lastButtonRef ?? modalElement)?.focus();
  });

  onDestroy(() => previouslyFocusedElement?.focus());
</script>

<svelte:window {onkeydown} />

<div
  class="fixed inset-0 z-100 flex items-center justify-center bg-black/50"
  {onclick}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    bind:this={modalElement}
    class="max-w-100 rounded-xl border border-border bg-bg p-5 shadow-md"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
    transition:scale={{
      start: 0.95,
      duration: 150,
    }}
  >
    <h2 id="dialog-title" class="mb-2 text-xl text-text">{title}</h2>
    <p class="mb-6 text-text-secondary">{content}</p>
    {#if buttons.length > 0}
      <div class="flex justify-end gap-3">
        {#each buttons.slice(0, -1) as button}
          <Button onclick={() => closeModal(button.id)} variant={button.variant}
            >{button.label}</Button
          >
        {/each}

        {const lastButton = buttons.at(-1)!}
        <Button
          bind:this={lastButtonRef}
          onclick={() => closeModal(lastButton.id)}
          variant={lastButton.variant}>{lastButton.label}</Button
        >
      </div>
    {/if}
  </div>
</div>
