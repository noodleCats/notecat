export const keyboardState = $state({
  shiftKey: false,
});

function onkeydown(event: KeyboardEvent) {
  if (event.key === "Shift") keyboardState.shiftKey = true;
}

function onkeyup(event: KeyboardEvent) {
  if (event.key === "Shift") keyboardState.shiftKey = false;
}

function onblur() {
  keyboardState.shiftKey = false;
}

export function addKeyboardEventListener() {
  window.addEventListener("keydown", onkeydown);
  window.addEventListener("keyup", onkeyup);
  window.addEventListener("blur", onblur);

  return () => {
    window.removeEventListener("keydown", onkeydown);
    window.removeEventListener("keyup", onkeyup);
    window.removeEventListener("blur", onblur);
  };
}
