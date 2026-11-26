<script lang="ts">
  import PanelLeft from "@lucide/svelte/icons/panel-left";
  import { toggleSidebar } from "@/app/commands";
  import { sidebarState } from "@/app/state/sidebar.svelte";
  import Icon from "@/components/ui/Icon.svelte";
  import MainMenu from "@/components/header/MainMenu.svelte";
  import NoteStatus from "@/components/header/NoteStatus.svelte";
  import notecatLogo from "@/assets/logo.svg?raw";

  const sidebarVisible = $derived(sidebarState.visibility === "visible");
</script>

<header id="header" class="flex items-center border-b border-border px-4 py-2">
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="cursor-pointer rounded-sm p-1.5 text-icon transition-colors hover:bg-bg-hover hover:text-icon-hover"
      title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
      aria-label="Sidebar"
      aria-expanded={sidebarVisible}
      aria-controls="sidebar"
      aria-keyshortcuts="Control+B"
      onclick={toggleSidebar}
    >
      <PanelLeft size={20} />
    </button>
    <Icon icon={notecatLogo} label="Notecat" --size="32px" />
    <MainMenu />
  </div>
  <div class="ml-auto flex items-center gap-3">
    <NoteStatus />
  </div>
</header>
