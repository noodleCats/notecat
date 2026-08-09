class EditorState {
  titleFocusRequest = $state(0);

  requestTitleFocus(): void {
    this.titleFocusRequest += 1;
  }
}

export const editorState = new EditorState();
