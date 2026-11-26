<script lang="ts" generics="T extends string">
  import type { Component } from "svelte";
  import { blurOnPointerLeave, focusOnPointerMove } from "./hover";

  interface Option {
    value: T;
    /** Names the option for tooltips and screen readers */
    label: string;
    icon: Component<{ size?: number }>;
  }

  interface Props {
    label: string;
    options: Option[];
    value: T;
    onchange: (value: T) => void;
  }

  let { label, options, value, onchange }: Props = $props();

  const index = $derived(
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );

  let focused = $state(false);

  const id = $props.id();
  const hintId = `${id}-hint`;

  function select(next: number) {
    const option = options[next];
    if (option && option.value !== value) onchange(option.value);
  }

  // Left and Right move along the switch, so the menubar leaves them alone
  // here (it skips keys that are already handled)
  function onkeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    switch (event.key) {
      case "ArrowLeft":
        select(Math.max(index - 1, 0));
        break;

      case "ArrowRight":
        select(Math.min(index + 1, options.length - 1));
        break;

      case "Enter":
      case " ":
        select((index + 1) % options.length);
        break;

      default:
        return;
    }

    event.preventDefault();
  }
</script>

<div
  role="menuitem"
  tabindex="-1"
  aria-label="{label}: {options[index]?.label}"
  aria-describedby={hintId}
  class="
    flex w-full cursor-default items-center justify-between gap-4 rounded-lg
    px-2 py-1.5 whitespace-nowrap text-text outline-none
    focus:bg-bg-sidebar-hover
  "
  {onkeydown}
  onpointermove={(event) => focusOnPointerMove(event)}
  onpointerleave={blurOnPointerLeave}
  onfocus={() => (focused = true)}
  onblur={() => (focused = false)}
>
  <span>{label}</span>
  <!-- A plain menuitem doesn't say it can be changed, so spell it out -->
  <span id={hintId} class="sr-only"
    >Use Left and Right arrow keys to change</span
  >

  <span
    class={[
      "relative flex rounded-md p-0.5",
      focused ? "bg-bg-button-hover" : "bg-bg-button",
    ]}
    aria-hidden="true"
  >
    <span
      class="
        absolute inset-y-0.5 left-0.5 w-6 rounded bg-bg shadow-sm
        transition-[translate] duration-150 motion-reduce:transition-none
      "
      style:translate="{index * 100}% 0"
      data-theme-transition
    ></span>

    {#each options as option, optionIndex (option.value)}
      {const Icon = option.icon}
      <!-- Pressing keeps focus on the item rather than moving it here -->
      <button
        type="button"
        tabindex="-1"
        title={option.label}
        class={[
          "relative flex size-6 cursor-pointer items-center justify-center rounded",
          optionIndex === index
            ? "text-text"
            : "text-icon hover:text-icon-hover",
        ]}
        onmousedown={(event) => event.preventDefault()}
        onclick={() => select(optionIndex)}
      >
        <Icon size={14} />
      </button>
    {/each}
  </span>
</div>
