<script lang="ts">
  import Icon from "./Icon.svelte";
  import Menubar from "./Menubar.svelte";
  import notecatLogo from "../assets/logo.svg?raw";
</script>

<header id="header" class="py-2 px-4 border-b border-border flex items-center">
  <div class="flex items-center gap-3">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
    <Menubar />
  </div>
  <div class="flex items-center gap-3 ml-auto">
    <!-- there will be something here one day ok -->
  </div>
</header>
