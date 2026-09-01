<script lang="ts">
  import Icon from "./Icon.svelte";
  import Menubar from "./Menubar.svelte";
  import notecatLogo from "../assets/logo.svg?raw";
</script>

<header id="header" class="flex items-center border-b border-border px-4 py-2">
  <div class="flex items-center gap-3">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
    <Menubar />
  </div>
  <div class="ml-auto flex items-center gap-3">
    <!-- there will be something here one day ok -->
  </div>
</header>
