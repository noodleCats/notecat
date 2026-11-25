<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { time } from "@/app/state/time.svelte";
  import { formatDate, formatShortRelativeDate } from "@/lib/formatting";
  import type { Timestamp } from "@/shared/timestamp";
  import type { TextRange } from "@/lib/search";
  import Highlight from "@/components/ui/Highlight.svelte";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title: string;
    /** Parts of the title to mark, e.g. search matches */
    titleRanges?: TextRange[];
    /** Second line, omitted for single-line rows */
    preview?: string;
    /** Parts of the preview to mark */
    previewRanges?: TextRange[];
    timestamp: Timestamp;
    /** Describes the timestamp in its tooltip, e.g. "Edited" */
    timestampLabel: string;
    active?: boolean;
    /** Secondary rows (e.g. trashed notes) recede behind live ones */
    dimmed?: boolean;
    /** Revealed on hover/focus in place of the timestamp */
    actions: Snippet;
  }

  let {
    title,
    titleRanges,
    preview,
    previewRanges,
    timestamp,
    timestampLabel,
    active = false,
    dimmed = false,
    actions,
    class: className,
    ...rest
  }: Props = $props();

  const age = $derived(formatShortRelativeDate(timestamp, time.now));
  const fullDate = $derived(`${timestampLabel} ${formatDate(timestamp)}`);
</script>

<div
  {...rest}
  class={[
    "row rounded-md px-3 py-2.5 transition-colors",
    active ? "bg-bg-active" : "hover:bg-bg-hover focus-visible:bg-bg-hover",
    className,
  ]}
>
  <div class="flex items-center gap-2">
    <p
      class={[
        "min-w-0 flex-1 truncate",
        dimmed ? "text-sm text-text-secondary" : "text-text",
        !title && "text-text-secondary",
        active && "font-semibold",
      ]}
    >
      {#if title}
        <Highlight text={title} ranges={titleRanges} />
      {:else}
        Untitled
      {/if}
    </p>
    <!-- Timestamp and actions share one slot, so hovering never reflows -->
    <div class="relative flex shrink-0 items-center justify-end">
      <time
        class="age text-xs text-text-tertiary tabular-nums"
        datetime={new Date(timestamp).toISOString()}
        title={fullDate}
      >
        {age}
      </time>
      <div class="actions absolute right-0 flex">
        {@render actions()}
      </div>
    </div>
  </div>
  {#if preview}
    <p class="mt-0.5 truncate text-sm text-text-secondary">
      <Highlight text={preview} ranges={previewRanges} />
    </p>
  {/if}
</div>

<style>
  .age,
  .actions {
    transition: opacity var(--default-transition-duration);
  }

  .actions {
    opacity: 0;
    margin-right: -0.25rem;
  }

  .row:is(:hover, :focus-visible, :focus-within) {
    & .age {
      opacity: 0;
    }

    & .actions {
      opacity: 1;
    }
  }

  /* Action buttons, rendered by the parent through the snippet */
  .actions :global(button) {
    cursor: pointer;
    border-radius: var(--radius-sm);
    padding: 0.125rem 0.25rem;
    color: var(--color-icon);
    transition: color var(--default-transition-duration);
  }

  .actions :global(button:is(:hover, :focus-visible)) {
    color: var(--color-icon-hover);
  }

  .actions :global(button.danger:is(:hover, :focus-visible)) {
    color: var(--color-danger-hover);
  }

  @media (prefers-reduced-motion: reduce) {
    .age,
    .actions,
    .actions :global(button) {
      transition: none;
    }
  }
</style>
