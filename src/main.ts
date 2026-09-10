import { mount } from "svelte";
import "./app.css";
import { init } from "./app/notekeeper.svelte";
import { toError } from "./shared/result";
import App from "./views/App.svelte";
import ErrorScreen from "./views/ErrorScreen.svelte";

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

try {
  configureServiceWorker();
  await init();

  // oxlint-disable-next-line no-underscore-dangle
  clearTimeout(window.__loadingTimer);

  mount(App, {
    target: document.querySelector<HTMLElement>("#app")!,
  });
} catch (err) {
  mount(ErrorScreen, {
    props: {
      title: "Failed to launch",
      content:
        "Notecat encountered an unexpected error when trying to launch. Please try again.",
      error: toError(err),
    },
    target: document.querySelector<HTMLElement>("#app")!,
  });
} finally {
  hideLoader();
}
