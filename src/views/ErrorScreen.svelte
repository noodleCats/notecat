<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import Button from "../components/Button.svelte";

  interface Props {
    title: string;
    content: string;
    error: Error;
  }

  let { title, content, error }: Props = $props();
</script>

<div
  class="flex min-h-0 grow items-center justify-center overflow-y-auto p-4 sm:p-8"
  transition:fade={{ duration: 150 }}
>
  <div
    class="w-full max-w-lg rounded-xl border border-border bg-bg p-5 shadow-md sm:p-6"
    role="alert"
    aria-labelledby="error-title"
    tabindex="-1"
    transition:scale={{
      start: 0.95,
      duration: 150,
    }}
  >
    <h2 id="error-title" class="mb-2 text-xl font-medium text-text">{title}</h2>
    <p class="mb-5 text-text-secondary">{content}</p>
    <hr class="border-border" />
    <h3 class="mt-5 mb-2 text-sm font-semibold text-danger">Error message</h3>
    <div
      class="mb-6 max-h-40 overflow-y-auto rounded-md border-2 border-danger-border bg-bg-sidebar px-3 py-2 font-mono text-sm wrap-break-word text-danger"
    >
      {error.message}
    </div>
    <div class="flex justify-end">
      <Button onclick={() => window.location.reload()}>Reload</Button>
    </div>
  </div>
</div>
