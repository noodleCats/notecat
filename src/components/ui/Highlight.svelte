<script lang="ts">
  import type { TextRange } from "@/lib/search";

  interface Props {
    text: string;
    /** Sorted, non-overlapping ranges of `text` to mark */
    ranges?: TextRange[];
  }

  let { text, ranges = [] }: Props = $props();

  const segments = $derived.by(() => {
    const result: { text: string; marked: boolean }[] = [];
    let index = 0;

    for (const { start, end } of ranges) {
      if (start > index)
        result.push({ text: text.slice(index, start), marked: false });

      result.push({ text: text.slice(start, end), marked: true });
      index = end;
    }

    if (index < text.length)
      result.push({ text: text.slice(index), marked: false });

    return result;
  });
</script>

{#each segments as segment, index (index)}
  {#if segment.marked}
    <mark class="rounded-xs bg-highlight text-text">{segment.text}</mark>
  {:else}
    {segment.text}
  {/if}
{/each}
