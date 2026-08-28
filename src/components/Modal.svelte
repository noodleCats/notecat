<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Modal } from "../types/modal";
  import { closeModal } from "../app/state/modal.svelte";

  let { title, content, buttons }: Modal = $props();

  let modalElement = $state<HTMLDivElement>();
  let lastButtonRef = $state<HTMLButtonElement>();
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

  function getButtonStyle(variant?: "default" | "danger") {
    return [
      "text-text py-1.5 px-3 border border-border rounded-md cursor-pointer", 
      "transition-colors",
      variant === "danger" 
        ? "text-neutral-50 bg-rose-700 border-rose-600 hover:bg-rose-600" 
        : "bg-bg-button hover:bg-bg-button-hover"
    ]
  }

  onMount(() => {
    previouslyFocusedElement = document.activeElement as HTMLElement | null;
    (lastButtonRef ?? modalElement)?.focus();
  });

  onDestroy(() => previouslyFocusedElement?.focus());
</script>

<svelte:window {onkeydown} />

<div class="fixed inset-0 bg-[#00000080] flex items-center justify-center z-100" {onclick} role="presentation">
  <div
    bind:this={modalElement}
    class="bg-bg border border-border rounded-xl p-5 max-w-100 shadow-md"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <h2 id="dialog-title" class="mb-2 text-xl text-text">{title}</h2>
    <p class="mb-6 text-text-secondary">{content}</p>
    {#if buttons.length > 0}
      <div class="flex justify-end gap-3">
        {#each buttons.slice(0, -1) as button}
          <button
            class={getButtonStyle(button.variant)}
            onclick={() => closeModal(button.id)}
          >
            {button.label}
          </button>
        {/each}

        {const lastButton = buttons.at(-1)!}
        <button bind:this={lastButtonRef}
          class={getButtonStyle(lastButton.variant)}
          onclick={() => closeModal(lastButton.id)}
        >
          {lastButton.label}
        </button>
      </div>
    {/if}
  </div>
</div>
