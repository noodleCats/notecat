<script lang="ts">
  import type { Modal } from "@/types/modal";
  import { closeModal } from "@/app/state/modal.svelte";
  import Button from "@/components/ui/Button.svelte";
  import Dialog from "@/components/ui/Dialog.svelte";

  let { title, content, buttons }: Modal = $props();

  const id = $props.id();
  const titleId = `${id}-title`;
  const contentId = `${id}-content`;

  let lastButtonRef = $state<Button>();
</script>

<!-- The last button is the default action, so it takes focus -->
<Dialog
  role="alertdialog"
  aria-labelledby={titleId}
  aria-describedby={contentId}
  ondismiss={() => closeModal(null)}
  onopen={() => lastButtonRef?.focus()}
  class="max-w-100 rounded-2xl border border-border bg-bg p-6 shadow-md"
>
  <h2 id={titleId} class="mb-2 text-xl font-semibold text-text">
    {title}
  </h2>
  <p id={contentId} class="mb-6 text-text-secondary">{content}</p>
  {#if buttons.length > 0}
    <div class="flex flex-wrap justify-end gap-3">
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
</Dialog>
