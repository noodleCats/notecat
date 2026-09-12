<script lang="ts">
  import type { Note } from "../types/note";

  interface Props {
    note: Note;
  }

  let { note }: Props = $props();
</script>

<article class="print">
  {#if note.title}
    <h1>{note.title}</h1>
  {/if}
  <div class="print-content">{note.content}</div>
</article>

<style>
  .print {
    display: none;
  }

  @page {
    margin: 18mm;
  }

  @media print {
    :global(#app) {
      position: static;
      inset: auto;
      display: block;
      width: auto;
      height: auto;
      color: #000;
      background: #fff;
    }

    :global(main) {
      display: block;
    }

    :global(#header),
    :global(#sidebar),
    :global(#resizer),
    :global(#status-bar),
    :global(#editor),
    :global(#empty) {
      display: none !important;
    }

    .print {
      display: block;
      max-width: 44rem;
      margin: 0;
      color: #000;
      background: #fff;
    }

    .print h1 {
      margin: 0 0 12pt;
      font-size: 20pt;
      line-height: 1.2;
    }

    .print-content {
      font-size: 12pt;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
  }
</style>
