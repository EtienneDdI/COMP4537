// This file was written with the assistance of AI (ChatGPT / Claude).

class WriterApp {
  constructor(listContainer, addButtonContainer, timestampElement) {
    this.listContainer = listContainer;
    this.timestampElement = timestampElement;
    this.notes = [];

    this.addButton = new Button(
      USER_MESSAGES.ADD_BUTTON,
      "btn btn-add",
      () => this.addNote("")
    );
    addButtonContainer.appendChild(this.addButton.getElement());

    this.loadFromStorage();

    setInterval(() => this.save(), CONFIG.SAVE_INTERVAL_MS);
  }

  generateId() {
    return "note-" + Math.floor(performance.now() * 1000) + "-" + this.notes.length;
  }

  loadFromStorage() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) {
      return;
    }
    const stored = JSON.parse(raw);
    stored.forEach((item) => this.addNote(item.content, item.id));
  }

  addNote(content, id) {
    const note = new Note(
      id || this.generateId(),
      content,
      (removed) => this.handleRemove(removed)
    );
    this.notes.push(note);
    this.listContainer.appendChild(note.getElement());
  }

  handleRemove(note) {
    this.notes = this.notes.filter((n) => n !== note);
    this.save();
  }

  save() {
    const data = this.notes.map((note) => note.toData());
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    this.updateTimestamp();
  }

  updateTimestamp() {
    const now = new Date();
    this.timestampElement.textContent =
      USER_MESSAGES.STORED_PREFIX + now.toLocaleTimeString();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("heading").textContent = USER_MESSAGES.WRITER_HEADING;
  document.getElementById("back-link").textContent = USER_MESSAGES.BACK_BUTTON;

  const listContainer = document.getElementById("notes-list");
  const addContainer = document.getElementById("add-container");
  const timestamp = document.getElementById("timestamp");
  new WriterApp(listContainer, addContainer, timestamp);
});
