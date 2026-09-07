import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { init } from "./app/notekeeper.svelte";

declare global {
  interface Window {
    __loaderTimer: ReturnType<typeof setTimeout>;
  }
}

function configureServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      );
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

function hideLoader() {
  const loader = document.getElementById("app-loading");
  if (!loader) return;

  if (loader.style.opacity === "0") {
    loader.remove();
    return;
  }

  loader.style.transition = "opacity 0.15s ease-out";
  loader.style.opacity = "0";
  setTimeout(() => loader.remove(), 150);
}

configureServiceWorker();
await init();

clearTimeout(window.__loaderTimer);

try {
  mount(App, { target: document.getElementById("app")! });
} finally {
  hideLoader();
}
