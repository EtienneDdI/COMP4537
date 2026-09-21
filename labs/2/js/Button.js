// This file was written with the assistance of AI (ChatGPT / Claude).

class Button {
  constructor(label, cssClass, onClick) {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = label;
    this.element.className = cssClass;
    this.element.addEventListener("click", onClick);
  }

  getElement() {
    return this.element;
  }

  destroy() {
    this.element.remove();
  }
}
