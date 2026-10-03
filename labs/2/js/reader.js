// This file was written with the assistance of AI .

class ReaderApp {
  constructor(listContainer, timestampElement) {
    this.listContainer = listContainer;
    this.timestampElement = timestampElement;

    this.retrieve();

    setInterval(() => this.retrieve(), CONFIG.RETRIEVE_INTERVAL_MS);

    window.addEventListener("storage", (event) => {
      if (event.key === CONFIG.STORAGE_KEY) {
        this.retrieve();
      }
    });
  }

  retrieve() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    const notes = raw ? JSON.parse(raw) : [];
    this.render(notes);
    this.updateTimestamp();
  }

  render(notes) {
    this.listContainer.innerHTML = "";

    if (notes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = USER_MESSAGES.NO_NOTES;
      this.listContainer.appendChild(empty);
      return;
    }

    notes.forEach((item) => {
      const view = document.createElement("div");
      view.className = "note-view";
      view.textContent = item.content;
      this.listContainer.appendChild(view);
    });
  }

  updateTimestamp() {
    const now = new Date();
    this.timestampElement.textContent =
      USER_MESSAGES.RETRIEVED_PREFIX + now.toLocaleTimeString();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("heading").textContent = USER_MESSAGES.READER_HEADING;
  document.getElementById("back-link").textContent = USER_MESSAGES.BACK_BUTTON;

  const listContainer = document.getElementById("notes-list");
  const timestamp = document.getElementById("timestamp");
  new ReaderApp(listContainer, timestamp);
});
