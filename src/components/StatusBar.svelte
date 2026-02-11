<script lang="ts">
  import { getActiveNote } from '../lib/notes.svelte';
  import { stats } from '../utils/stats.ts';
  import { formatting } from '../utils/formatting.ts';

  const DATE_UPDATE_INTERVAL_MS = 60000;

  // Derived stats from active note
  const textStats = $derived.by(() => {
    const note = getActiveNote();
    return note ? stats.getTextStats(note.content) : stats.getTextStats('');
  });

  const formattedStats = $derived(
    formatting.stat.formatTextStats(textStats)
  );

  // Derived formatted dates
  const createdAtFormatted = $derived.by(() => {
    const note = getActiveNote();
    return note ? `Created ${formatting.time.formatRelativeDate(note.createdAt)}` : '';
  });

  const updatedAtFormatted = $derived.by(() => {
    const note = getActiveNote();
    return note ? `Updated ${formatting.time.formatRelativeDate(note.updatedAt)}` : '';
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

<footer id="status-bar">
  <div id="status-bar-left">
    <span class="status">{createdAtFormatted}</span>
    <span class="status">{updatedAtFormatted}</span>
  </div>
  <div id="status-bar-right">
    <span class="status">{formattedStats.wordCount}</span>
    <span class="status">{formattedStats.characterCount}</span>
    <span class="status">{formattedStats.storageUsed}</span>
  </div>
</footer>

<style>
  #status-bar {
    display: flex;
    flex-direction: row;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--border-color);
  }

  #status-bar div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  #status-bar-left {
    justify-self: flex-start;
  }

  #status-bar-right {
    justify-self: flex-end;
    margin-left: auto;
  }

  :global(.status) {
    color: var(--secondary-color);
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
  }
</style>
