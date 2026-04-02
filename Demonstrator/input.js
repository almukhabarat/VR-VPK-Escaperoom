const KeypadManager = {
  currentInput: "",

  init() {
    const container = document.querySelector("#keypad-container");

    const labels = {
      SUBMIT: "INVOEREN",
      BKSP: "BKSP",
      CLEAR: "C",
      COMMA: ",",
      MINUS: "-", // Added label
    };

    const buttons = [
      "1", "2", "3",
      "4", "5", "6",
      "7", "8", "9",
      labels.COMMA, "0", labels.MINUS, // Replaced labels.CLEAR here to keep 3x4 grid
      labels.CLEAR, labels.BKSP, labels.SUBMIT, // Move C, BKSP, and SUBMIT to bottom
    ];

    buttons.forEach((label, index) => {
      const btn = document.createElement("a-entity");

      const isSubmit = label === labels.SUBMIT;
      const isBksp = label === labels.BKSP;
      const isClear = label === labels.CLEAR;

      let x, y, width, height;
      height = 0.22;

      const colSpacing = 0.35;
      const rowSpacing = 0.28;

      // Adjusted logic for 3 bottom buttons instead of 2
      if (isSubmit || isBksp || isClear) {
        width = 0.95;
        x = 0;
        // Stack the three special buttons vertically at the end
        if (isClear) y = -1.15;
        if (isBksp) y = -1.42;
        if (isSubmit) y = -1.69;
      } else {
        width = 0.3;
        x = ((index % 3) - 1) * colSpacing;
        y = Math.floor(index / 3) * -rowSpacing;
      }

      // ... Geometry and Colors logic ...
      let btnColor = "#aeaeae";
      if (isSubmit) btnColor = "#26d896"; 
      if (isBksp) btnColor = "#cb9696"; 
      if (isClear) btnColor = "#d21f1f"; 

      const hoverColor = isSubmit ? "#45f5b3" : (isClear || isBksp ? "#ff6666" : "#e0e0e0");

      btn.setAttribute("geometry", `primitive: plane; width: ${width}; height: ${height}`);
      btn.setAttribute("material", `color: ${btnColor}`);
      btn.setAttribute("position", `${x} ${y} 0`);
      btn.setAttribute("class", "interactable");

      // Text setup
      const txt = document.createElement("a-text");
      txt.setAttribute("value", label);
      txt.setAttribute("align", "center");
      txt.setAttribute("width", (isSubmit || isBksp || isClear) ? 2.2 : 3);
      txt.setAttribute("font", "dejavu");
      txt.setAttribute("position", "0 0 0.01");
      btn.appendChild(txt);

      btn.setAttribute(
        "event-set__mouseenter",
        `_event: mouseenter; material.color: ${hoverColor}`,
      );

      btn.setAttribute(
        "event-set__mouseleave",
        `_event: mouseleave; material.color: ${btnColor}`,
      );

      // Event listeners
      btn.addEventListener("click", () => {
        let internalVal = label;
        if (label === labels.SUBMIT) internalVal = "SUBMIT";
        if (label === labels.BKSP) internalVal = "BKSP";
        if (label === labels.CLEAR) internalVal = "C";
        this.handleInput(internalVal);
      });

      container.appendChild(btn);
    });
  },

  handleInput(val) {
    // Logic remains clean using the internal "SUBMIT", "BKSP", "C" strings
    if (val === "C") {
      this.currentInput = "";
    } else if (val === "BKSP") {
      this.currentInput = this.currentInput.slice(0, -1);
    } else if (val === "SUBMIT") {
      if (this.currentInput === "") return;
      const mathValue = parseFloat(this.currentInput.replace(",", "."));
      ScenarioManager.check(mathValue);
      this.currentInput = "";
    } else if (val === "-") {
      // Toggle minus sign at the start
      if (this.currentInput.startsWith("-")) {
        this.currentInput = this.currentInput.substring(1);
      } else {
        this.currentInput = "-" + this.currentInput;
      }
    } else if (val === ",") {
      if (!this.currentInput.includes(",")) {
        // Handle case where comma is pressed after minus or empty
        if (this.currentInput === "" || this.currentInput === "-") {
            this.currentInput += "0,";
        } else {
            this.currentInput += ",";
        }
      }
    } else if (!isNaN(val) && this.currentInput.length < 8) {
      this.currentInput += val;
    }

    if (val !== "SUBMIT") {
      ScenarioManager.updateUI(this.currentInput || "0", "#26d896", false);
    }
  },
};
