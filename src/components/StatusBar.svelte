<script lang="ts">
  import notekeeper from "../lib/notekeeper.svelte";
  import { getTextStats } from "../utils/stats";
  import { formatTextStats, formatRelativeDate } from "../utils/formatting";
  import Chip from "./Chip.svelte";

  const DATE_UPDATE_INTERVAL_MS = 60000;

  let { chipsHidden = false } = $props();

  // Derived stats from active note
  const textStats = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? getTextStats(note.content) : getTextStats("");
  });

  const formattedStats = $derived(formatTextStats(textStats));

  // Derived formatted dates
  const createdAtFormatted = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? `Created ${formatRelativeDate(note.createdAt)}` : "";
  });

  const updatedAtFormatted = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? `Updated ${formatRelativeDate(note.updatedAt)}` : "";
  });

  // Refresh relative dates every 60 seconds
  $effect(() => {
    const intervalId = setInterval(() => {
      // Force re-evaluation of the derived values by accessing them
      // (Svelte will re-run the $derived blocks)
      void createdAtFormatted;
      void updatedAtFormatted;
    }, DATE_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  });
</script>

<footer id="status-bar" class:chips-hidden={chipsHidden}>
  <div id="status-bar-left">
    <Chip content={createdAtFormatted} />
    <Chip content={updatedAtFormatted} />
  </div>
  <div id="status-bar-right">
    <Chip content={formattedStats.wordCount} />
    <Chip content={formattedStats.characterCount} />
    <Chip content={formattedStats.storageUsed} />
  </div>
</footer>

<style>
  #status-bar {
    display: flex;
    flex-direction: row;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--color-border);

    div {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    :global(&.chips-hidden div > *) {
      opacity: 0;
    }
  }

  #status-bar-left {
    justify-self: flex-start;
  }

  #status-bar-right {
    justify-self: flex-end;
    margin-left: auto;
  }
</style>
