// COMP 4537 - Lab 1 - Memory Game
// AI DISCLOSURE: Claude (AI) was used to help write and explain this code.

import { MESSAGES } from "../lang/messages/en/user.js";

class GameButton {
  constructor(order, color) {
    this.order = order;
    this.color = color;
    this.el = document.createElement("button");
    this.el.classList.add("game-button");
    this.el.style.backgroundColor = color;
    this.el.textContent = order;
  }

  setPosition(x, y) {
    this.el.classList.add("scattered");
    this.el.style.left = x + "px";
    this.el.style.top = y + "px";
  }

  showNumber() {
    this.el.textContent = this.order;
  }

  hideNumber() {
    this.el.textContent = "";
  }
}

class MemoryGame {
  constructor(gameArea, messageEl) {
    this.gameArea = gameArea;
    this.messageEl = messageEl;
    this.buttons = [];
    this.n = 0;
    this.expectedIndex = 1;
    this.acceptingClicks = false;
    this.pauseTimeout = null;
    this.scrambleInterval = null;
  }

  reset() {
    if (this.pauseTimeout !== null) {
      clearTimeout(this.pauseTimeout);
    }
    if (this.scrambleInterval !== null) {
      clearInterval(this.scrambleInterval);
    }
    this.gameArea.innerHTML = "";
    this.messageEl.textContent = "";
    this.buttons = [];
    this.expectedIndex = 1;
    this.acceptingClicks = false;
  }

  randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  start(n) {
    this.reset();
    this.n = n;
    this.createButtons(n);
    this.pauseTimeout = setTimeout(() => {
      this.startScramble();
    }, n * 1000);
  }

  createButtons(n) {
    for (let i = 1; i <= n; i++) {
      const button = new GameButton(i, this.randomColor());
      button.el.addEventListener("click", () => {
        this.handleClick(button);
      });
      this.buttons.push(button);
      this.gameArea.appendChild(button.el);
    }
  }

  startScramble() {
    let count = 0;
    this.scrambleInterval = setInterval(() => {
      this.scrambleOnce();
      count++;
      if (count === this.n) {
        clearInterval(this.scrambleInterval);
        this.startGuessing();
      }
    }, 2000);
  }

  scrambleOnce() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    for (const button of this.buttons) {
      let maxX = width - button.el.offsetWidth;
      let maxY = height - button.el.offsetHeight;
      if (maxX < 0) {
        maxX = 0;
      }
      if (maxY < 0) {
        maxY = 0;
      }
      const x = Math.floor(Math.random() * maxX);
      const y = Math.floor(Math.random() * maxY);
      button.setPosition(x, y);
    }
  }

  startGuessing() {
    for (const button of this.buttons) {
      button.hideNumber();
    }
    this.expectedIndex = 1;
    this.acceptingClicks = true;
  }

  handleClick(button) {
    if (this.acceptingClicks === false) {
      return;
    }
    if (button.order === this.expectedIndex) {
      button.showNumber();
      this.expectedIndex++;
      if (this.expectedIndex > this.n) {
        this.acceptingClicks = false;
        this.messageEl.textContent = MESSAGES.WIN;
      }
    } else {
      this.acceptingClicks = false;
      this.messageEl.textContent = MESSAGES.LOSE;
      for (const b of this.buttons) {
        b.showNumber();
      }
    }
  }
}

class UIController {
  constructor() {
    this.label = document.getElementById("promptLabel");
    this.input = document.getElementById("countInput");
    this.goButton = document.getElementById("goButton");
    this.message = document.getElementById("message");
    this.gameArea = document.getElementById("gameArea");

    this.label.textContent = MESSAGES.PROMPT;
    this.goButton.textContent = MESSAGES.GO;

    this.game = new MemoryGame(this.gameArea, this.message);

    this.goButton.addEventListener("click", () => {
      this.handleGo();
    });
  }

  handleGo() {
    const n = this.validate(this.input.value);
    if (n === null) {
      this.message.textContent = MESSAGES.INVALID_INPUT;
      return;
    }
    this.game.start(n);
  }

  validate(rawValue) {
    const n = Number(rawValue);
    if (Number.isInteger(n) && n >= 3 && n <= 7) {
      return n;
    }
    return null;
  }
}

new UIController();
