export class Editor {
  private editor: HTMLDivElement;

  private titleInput: HTMLInputElement;
  private textarea: HTMLTextAreaElement;

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

    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;

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
    this.editor.style.display = visible ? "flex" : "none";
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
