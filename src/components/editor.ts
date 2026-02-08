export class Editor {
  private editor: HTMLDivElement;
  private editorVisible: boolean;

  private titleInput: HTMLInputElement;
  private textarea: HTMLTextAreaElement;

  private resizeTick = false;
  private resizeCallback = () => {
    if (!this.resizeTick) {
      window.requestAnimationFrame(() => {
        this.resizeTextarea();
        this.resizeTick = false;
      });
      this.resizeTick = true;
    }
  };

  constructor(containerElementId: string) {
    const container = document.getElementById(containerElementId);
    if (!(container instanceof HTMLDivElement)) {
      throw new Error("Editor: container is not a div element");
    }

    container.innerHTML = `
      <input type="text" id="editor-title-input"></input>
      <textarea
        id="editor-textarea"
        autofocus
        spellcheck="false"
        placeholder="Write your notes here..."
      ></textarea>
    `;

    this.editor = container;
    this.editorVisible = true;

    this.titleInput = container.querySelector(
      "#editor-title-input",
    ) as HTMLInputElement;
    this.textarea = container.querySelector(
      "#editor-textarea",
    ) as HTMLTextAreaElement;

    this.titleInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.focus("textarea");
      }
    });
  }

  resizeTextarea(): void {
    const wrapper = this.textarea.parentElement;
    const scrollTop = wrapper?.scrollTop ?? 0;

    const titleInputStyle = window.getComputedStyle(this.titleInput);
    const minHeight =
      wrapper !== null
        ? wrapper.clientHeight -
          this.titleInput.offsetHeight -
          parseFloat(titleInputStyle.marginBottom) -
          1
        : 0;

    this.textarea.style.height = "0px";
    const contentHeight = this.textarea.scrollHeight;
    this.textarea.style.height = `${Math.max(contentHeight, minHeight)}px`;

    if (wrapper !== null) {
      wrapper.scrollTop = scrollTop;
    }
  }

  getTitleInputContent(): string {
    return this.titleInput.value;
  }

  getTextareaContent(): string {
    return this.textarea.value;
  }

  setTitleInputContent(content: string): void {
    this.titleInput.value = content;
  }

  setTextareaContent(content: string): void {
    this.textarea.value = content;
    this.resizeTextarea();
  }

  addInstantInputListener(
    target: "titleInput" | "textarea",
    callback: (content: string) => void,
  ): void {
    const elements = {
      titleInput: this.titleInput,
      textarea: this.textarea,
    } as const;
    const element = elements[target];

    const listener = () => {
      if (target === "textarea") {
        this.resizeTextarea();
      }
      callback(element.value);
    };

    element.addEventListener("input", listener);
  }

  addDebouncedInputListener(
    target: "titleInput" | "textarea",
    callback: (content: string) => void,
    debounceDelayMs: number = 300,
  ): void {
    let timeoutId: number | undefined;

    const elements = {
      titleInput: this.titleInput,
      textarea: this.textarea,
    } as const;
    const element = elements[target];

    const listener = () => {
      if (target === "textarea") {
        this.resizeTextarea();
      }

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        callback(element.value);
      }, debounceDelayMs);
    };

    element.addEventListener("input", listener);
  }

  setEditorVisibility(visible: boolean): void {
    if (this.editorVisible === visible) return;

    this.editorVisible = visible;
    this.editor.style.display = visible ? "flex" : "none";

    if (visible) {
      this.resizeTextarea();
      window.addEventListener("resize", this.resizeCallback);
    } else {
      window.removeEventListener("resize", this.resizeCallback);
    }
  }

  focus(target: "titleInput" | "textarea"): void {
    switch (target) {
      case "titleInput":
        this.titleInput.focus();
        break;
      case "textarea":
        this.textarea.focus();
        break;
      default:
        throw new Error(`focus: ${target} is not a valid target`);
    }
  }

  select(target: "titleInput" | "textarea"): void {
    switch (target) {
      case "titleInput":
        this.titleInput.select();
        break;
      case "textarea":
        this.textarea.select();
        break;
      default:
        throw new Error(`focus: ${target} is not a valid target`);
    }
  }
}
