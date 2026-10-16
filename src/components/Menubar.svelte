<script lang="ts">
  // Composes app commands, preferences, and menu primitives.
  // oxlint-disable import/max-dependencies
  import { tick } from "svelte";
  import { innerWidth } from "svelte/reactivity/window";
  import { Menubar } from "bits-ui";
  import Check from "@lucide/svelte/icons/check";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import {
    closeActiveNote,
    createNoteAndFocus,
    exportActiveNoteAsText,
    exportAllNotesAsJson,
    importNoteFromText,
    importAllNotesFromJson,
    requestDeleteActiveNote,
    openRepo,
    toggleSidebar,
  } from "../app/commands";
  import { sidebarState } from "@/app/state/sidebar.svelte";
  import {
    editorFonts,
    editorState,
    isEditorFont,
    setEditorFont,
  } from "@/app/state/editor.svelte";
  import { closeMenu, menuState } from "@/app/state/menu.svelte";
  import { setTheme, themeState } from "@/app/state/theme.svelte";
  import type { ShortcutKeys } from "@/types/shortcut";
  import Kbd from "./Kbd.svelte";

  type MenuItem = {
    label: string;
    action: () => void | Promise<void>;
    shortcut?: ShortcutKeys;
    disabled?: boolean;
    external?: boolean;
  };

  type Menu = { id: string; label: string; items: MenuItem[] };

  const itemClass = `group flex w-full cursor-pointer items-center justify-between gap-4
    rounded-lg px-2 py-1.5 text-text whitespace-nowrap outline-none select-none
    data-highlighted:bg-bg-hover data-disabled:cursor-not-allowed
    data-disabled:text-text-tertiary`;
  const contentClass = `z-10 min-w-44 max-w-[calc(100vw-1rem)] rounded-xl border
    border-border bg-bg-sidebar p-1.5 shadow-md`;

  const activeNote = $derived(notekeeper.activeNote);

  const menus = $derived<Menu[]>([
    {
      id: "file",
      label: "file",
      items: [
        {
          label: "New note",
          shortcut: { key: "N", alt: true },
          action: createNoteAndFocus,
        },
        {
          label: "Close note",
          shortcut: { key: "W", alt: true },
          disabled: activeNote === null,
          action: closeActiveNote,
        },
        {
          label: "Import note from TXT",
          action: importNoteFromText,
        },
        {
          label: "Export note as TXT",
          disabled: activeNote === null,
          action: exportActiveNoteAsText,
        },
        {
          label: "Import all from JSON",
          action: importAllNotesFromJson,
        },
        {
          label: "Export all as JSON",
          disabled: notekeeper.notes.length === 0,
          action: exportAllNotesAsJson,
        },
        {
          label: "Delete note",
          disabled: activeNote === null,
          action: requestDeleteActiveNote,
        },
      ],
    },
    {
      id: "view",
      label: "view",
      items: [
        {
          label:
            sidebarState.visibility === "hidden"
              ? "Show sidebar"
              : "Hide sidebar",
          shortcut: { key: "B", ctrl: true },
          action: toggleSidebar,
        },
      ],
    },
    {
      id: "help",
      label: "help",
      items: [
        {
          label: "View source code",
          action: openRepo,
          external: true,
        },
      ],
    },
  ]);

  async function onItemSelect(item: MenuItem) {
    closeMenu();
    // Restore menu focus before a command focuses the editor or opens a dialog.
    await tick();
    await item.action();
  }

  function onCloseAutoFocus(event: Event, menuId: string) {
    event.preventDefault();
    const activeElement = document.activeElement;
    if (
      activeElement === document.body ||
      activeElement?.closest(
        "[data-menubar-content], [data-menubar-sub-content]",
      )
    ) {
      document.querySelector<HTMLElement>(`#menu-${menuId}`)?.focus();
    }
  }
</script>

{#snippet menuItem(item: MenuItem)}
  <Menubar.Item
    class={itemClass}
    textValue={item.label}
    disabled={item.disabled ?? false}
    onSelect={() => onItemSelect(item)}
  >
    <span>{item.label}</span>
    {#if item.shortcut}
      <Kbd {...item.shortcut} />
    {/if}
    {#if item.external}
      <span class="text-icon">
        <ExternalLink size={16} />
      </span>
    {/if}
  </Menubar.Item>
{/snippet}

<Menubar.Root
  class="flex min-w-0 items-center"
  aria-label="Main menu"
  bind:value={
    () => menuState.open ?? "",
    (value) => {
      menuState.open = value || null;
    }
  }
>
  {#each menus as menu (menu.id)}
    <Menubar.Menu value={menu.id}>
      <Menubar.Trigger
        id={`menu-${menu.id}`}
        class="cursor-pointer rounded-md border-none bg-none px-2 py-1 text-text-secondary
          transition-colors hover:bg-bg-hover focus-visible:outline-2
          focus-visible:outline-icon data-highlighted:bg-bg-hover data-[state=open]:bg-bg-hover"
      >
        {menu.label}
      </Menubar.Trigger>

      <Menubar.Portal>
        <Menubar.Content
          class={contentClass}
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onCloseAutoFocus={(event) => onCloseAutoFocus(event, menu.id)}
        >
          {#each menu.items as item (item.label)}
            {@render menuItem(item)}
          {/each}
          {#if menu.id === "view"}
            <Menubar.Separator class="my-1 h-px bg-border" />
            <Menubar.CheckboxItem
              class={itemClass}
              checked={themeState.theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")}
              textValue="Dark mode"
            >
              {#snippet children({ checked })}
                <span>Dark mode</span>
                <span
                  class="flex size-4 items-center text-icon"
                  aria-hidden="true"
                >
                  {#if checked}<Check size={16} />{/if}
                </span>
              {/snippet}
            </Menubar.CheckboxItem>
            <Menubar.Sub>
              <Menubar.SubTrigger class={itemClass} textValue="Editor font">
                <span>Editor font</span>
                <ChevronRight
                  size={16}
                  class="text-icon max-sm:rotate-90"
                  aria-hidden="true"
                />
              </Menubar.SubTrigger>
              <Menubar.Portal>
                <Menubar.SubContent
                  class={contentClass}
                  side={(innerWidth.current ?? 1280) < 640 ? "bottom" : "right"}
                  align="start"
                  sideOffset={4}
                  collisionPadding={8}
                >
                  <Menubar.RadioGroup
                    value={editorState.font}
                    onValueChange={(value) => {
                      if (isEditorFont(value)) setEditorFont(value);
                    }}
                    aria-label="Editor font"
                  >
                    {#each editorFonts as font (font.value)}
                      <Menubar.RadioItem
                        class={itemClass}
                        value={font.value}
                        textValue={font.label}
                      >
                        {#snippet children({ checked })}
                          <span>{font.label}</span>
                          <span
                            class="flex size-4 items-center text-icon"
                            aria-hidden="true"
                          >
                            {#if checked}<Check size={16} />{/if}
                          </span>
                        {/snippet}
                      </Menubar.RadioItem>
                    {/each}
                  </Menubar.RadioGroup>
                </Menubar.SubContent>
              </Menubar.Portal>
            </Menubar.Sub>
          {/if}
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  {/each}
</Menubar.Root>
