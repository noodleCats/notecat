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
  loader.style.transition = "opacity 0.1s";
  loader.style.opacity = "0";
  setTimeout(() => loader.remove(), 300);
}
