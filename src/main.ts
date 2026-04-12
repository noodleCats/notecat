import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { init } from "./lib/notekeeper.svelte";

await init();

mount(App, {
  target: document.getElementById("app")!,
});

const loader = document.getElementById("app-loading");
if (loader) {
  const loadingBar = loader.querySelector(".loading-bar") as HTMLElement;
  if (loadingBar) {
    loadingBar.style.width = "100%";
    loadingBar.style.transition = "width 0.2s ease-out";
  }
  setTimeout(() => {
    loader.style.transition = "opacity 0.1s";
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 300);
  }, 300);
}
