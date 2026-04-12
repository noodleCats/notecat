import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { init } from "./lib/notekeeper.svelte";

await init();

const loader = document.getElementById("app-loading");

declare global {
  interface Window {
    __loaderTimer: ReturnType<typeof setTimeout>;
  }
}
clearTimeout(window.__loaderTimer);

try {
  mount(App, {
    target: document.getElementById("app")!,
  });
} finally {
  if (loader) {
    if (parseFloat(loader.style.opacity) > 0 || loader.style.opacity === "") {
      loader.style.transition = "opacity 0.15s ease-out";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 150);
    } else {
      loader.remove();
    }
  }
}
