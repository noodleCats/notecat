<script lang="ts">
  import { formatDate, formatShortDate } from "@/lib/formatting";
  import type { Timestamp } from "@/shared/timestamp";

  const buildTimestamp = Date.parse(__BUILD_DATE__) as Timestamp;
  const buildDateShort = formatShortDate(buildTimestamp);
  const buildDateFull = formatDate(buildTimestamp);
  const commitShort = __APP_COMMIT__?.slice(0, 7);
</script>

<p
  role="none"
  class="px-2 pt-1 pb-1 text-sm whitespace-nowrap text-text-tertiary"
>
  <span class="text-text-secondary">
    Notecat {__APP_VERSION__}
    {#if __APP_COMMIT__}
      (<span title={__APP_COMMIT__}>{commitShort}</span>)
    {/if}
  </span>
  <br />
  Built
  <time
    datetime={__BUILD_DATE__}
    title={buildDateFull}
    class="transition hover:text-text">{buildDateShort}</time
  >
</p>
