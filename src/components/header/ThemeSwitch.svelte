<script lang="ts">
  import Monitor from "@lucide/svelte/icons/monitor";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import {
    setThemePreference,
    themeState,
    type ThemePreference,
  } from "@/app/state/theme.svelte";
  import MenuSwitch from "@/components/ui/menu/MenuSwitch.svelte";

  const themes = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] satisfies { value: ThemePreference; label: string; icon: unknown }[];
</script>

<MenuSwitch
  label="Theme"
  options={themes}
  value={themeState.preference}
  onchange={setThemePreference}
/>
