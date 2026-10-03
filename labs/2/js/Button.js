class Button {
  constructor(label, cssClass, onClick) {
    this.element = document.createElement("button"); // When a new Button instance is created, it's create a html button element with document.createElement("button") 
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
