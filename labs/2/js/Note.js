// This file was written with the assistance of AI (ChatGPT / Claude).

class Note {
  constructor(id, content, onRemove) {
    this.id = id;
    this.content = content;
    this.onRemove = onRemove;

    this.row = document.createElement("div");
    this.row.className = "note-row";

    this.textarea = document.createElement("textarea");
    this.textarea.className = "note-text";
    this.textarea.value = content;
    this.textarea.placeholder = USER_MESSAGES.NOTE_PLACEHOLDER;
    this.textarea.addEventListener("input", () => {
      this.content = this.textarea.value;
    });

    this.removeButton = new Button(
      USER_MESSAGES.REMOVE_BUTTON,
      "btn btn-remove",
      () => this.remove()
    );

    this.row.appendChild(this.textarea);
    this.row.appendChild(this.removeButton.getElement());
  }

  getElement() {
    return this.row;
  }

  toData() {
    return { id: this.id, content: this.content };
  }

  remove() {
    this.row.remove();
    this.onRemove(this);
  }
}
