import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { init } from "./app/notekeeper.svelte";

declare global {
  interface Window {
    __loadingTimer: ReturnType<typeof setTimeout>;
  }
}

function configureServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      );
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

function hideLoader() {
  const loadingScreen = document.querySelector<HTMLElement>("#loading");
  if (!loadingScreen) return;

  if (loadingScreen.style.opacity === "0") {
    loadingScreen.remove();
    return;
  }

  loadingScreen.style.transition = "opacity 0.15s ease-out";
  loadingScreen.style.opacity = "0";
  setTimeout(() => loadingScreen.remove(), 150);
}

configureServiceWorker();
await init();

// oxlint-disable-next-line no-underscore-dangle
clearTimeout(window.__loadingTimer);

try {
  mount(App, { target: document.querySelector<HTMLElement>("#app")! });
} finally {
  hideLoader();
}
