const ScenarioManager = {
  currentIndex: 0,
  current: null,
  attempts: 0,
  awaitingPhysicalAction: false,
  currentPool: [],

  // --- IV PUMP STATE ---
  pumpDigits: [0, 0, 0], // [Hundreds, Tens, Units]
  cursorIndex: 2, // Default to Units column

  init(questionSet) {
    this.currentPool = questionSet || [];
    this.currentIndex = 0;
    this.attempts = 0;
    this.next();
  },

  handleNextClick() {
    this.next();
  },

  next() {
    const nextBtn = document.querySelector("#next-question-btn");
    if (nextBtn) nextBtn.setAttribute("visible", "false");

    this.awaitingPhysicalAction = false;

    if (!this.currentPool || this.currentPool.length === 0) {
      console.error("Questions not loaded into scenario.");
      return;
    }

    const template = this.currentPool[this.currentIndex];
    if (!template) {
      this.currentIndex = 0;
      return this.next();
    }

    const generatedData = template.generate();
    this.current = {
      ...generatedData,
      id: template.id,
      physicalType: template.physicalType,
      isPump: template.isPump, // Capture the pump flag
    };

    // --- IV PUMP RESET ---
    this.resetPump();

    // --- IV PUMP POSITION & VISIBILITY TOGGLE ---
    const pumpDisplay = document.querySelector("#iv-pump-display");
    const mainInputPanel = document.querySelector("#input-panel");

    if (pumpDisplay) {
      if (this.current && this.current.isPump) {
        // 1. Determine the "Active" position (from config, with a fallback)
        const activePos = this.activeConfig
          ? this.activeConfig.ivPumpScreenPos
          : "0 1.45 -0.2";

        pumpDisplay.setAttribute("position", activePos);
        pumpDisplay.setAttribute("visible", "true");

        // 2. Reset the pump state so the user starts at 000
        this.resetPump();

        console.log("Pump activated at:", activePos);

        if (mainInputPanel && mainInputPanel.getAttribute("visible")) {
          GameManager.togglePanel("#input-panel", true);
        }
      } else {
        if (pumpDisplay) {
          pumpDisplay.setAttribute("position", "0 -100 0");
          pumpDisplay.setAttribute("visible", "false");
        }
        // This stops all raycasting/clicks because it's physically out of reach
        console.log("Pump deactivated (moved to abyss).");

        if (mainInputPanel && !mainInputPanel.getAttribute("visible")) {
          GameManager.togglePanel("#input-panel", true);
        }
      }
    }

    if (template.type === "PHYSICAL") {
      this.awaitingPhysicalAction = true;
      this.setupPhysicalAction(this.current);
    } else {
      this.updateUI("[ Wachten op invoer ]", "#ffffff", false);
    }

    this.currentIndex = (this.currentIndex + 1) % this.currentPool.length;
    this.attempts = 0;
  },

  // --- NEW: INFUSOMAT INTERACTION LOGIC ---
  moveCursor(dir) {
    this.cursorIndex += dir;
    if (this.cursorIndex < 0) this.cursorIndex = 0;
    if (this.cursorIndex > 2) this.cursorIndex = 2;
    this.updatePumpVisuals();
  },

  scrollDigit(dir) {
    let val = this.pumpDigits[this.cursorIndex];
    val += dir;
    if (val > 9) val = 0;
    if (val < 0) val = 9;
    this.pumpDigits[this.cursorIndex] = val;
    this.updatePumpVisuals();
  },

  updatePumpVisuals() {
    // Update the numbers
    const d100 = document.querySelector("#digit-100");
    const d10 = document.querySelector("#digit-10");
    const d1 = document.querySelector("#digit-1");

    if (d100) d100.setAttribute("value", this.pumpDigits[0]);
    if (d10) d10.setAttribute("value", this.pumpDigits[1]);
    if (d1) d1.setAttribute("value", this.pumpDigits[2]);

    // Move the yellow cursor underline
    const positions = [-0.08, 0, 0.08];
    const cursor = document.querySelector("#digit-cursor");
    if (cursor) {
      cursor.setAttribute(
        "position",
        `${positions[this.cursorIndex]} -0.06 0.01`,
      );
    }
  },

  resetPump() {
    this.pumpDigits = [0, 0, 0];
    this.cursorIndex = 2;
    this.updatePumpVisuals();
    this.updateIvPump("---", "IDLE");
  },

  submitPump() {
    // Calculate the integer from the 3 digits
    const totalValue =
      this.pumpDigits[0] * 100 + this.pumpDigits[1] * 10 + this.pumpDigits[2];
    this.check(totalValue);
  },

  updateIvPump(rate, status = "RUNNING", color = "#00ff00") {
    const rateEl = document.querySelector("#iv-pump-rate");
    const statusEl = document.querySelector("#iv-pump-status");

    if (rateEl) rateEl.setAttribute("value", `STAND: ${rate} ml/u`);
    if (statusEl) {
      statusEl.setAttribute("value", `STATUS: ${status}`);
      statusEl.setAttribute("color", color);
    }
  },

  setupPhysicalAction(template) {
    const statusEl = document.querySelector("#panel-status");
    if (statusEl) {
      statusEl.setAttribute("value", "[ Keypad geblokkeerd ]");
      statusEl.setAttribute("color", "#888888");
    }

    ["#med-cup", "#bottle-1pc", "#bottle-2pc", "#bottle-5pc"].forEach((id) => {
      const el = document.querySelector(id);
      if (el) {
        el.setAttribute("visible", "false");
        el.removeAttribute("dynamic-body");
        el.removeAttribute("static-body");
        el.setAttribute("position", "0 -10 0");
      }
    });

    if (template.physicalType === "INJECTION") {
      this.spawnInjectionStation();
    } else {
      this.spawnMedicationOnCart();
    }
    this.updateUI("[ Actie vereist ]", "#ffffff", false);
  },

  onPhysicalActionComplete() {
    if (!this.awaitingPhysicalAction) return;
    this.awaitingPhysicalAction = false;
    if (GameManager.uiSoundEntity)
      GameManager.uiSoundEntity.components.sound.playSound();

    ["#bottle-1pc", "#bottle-2pc", "#bottle-5pc"].forEach((id) => {
      const el = document.querySelector(id);
      if (el && !el.getAttribute("static-body")) {
        el.setAttribute("visible", "false");
        el.setAttribute("position", "0 -10 0");
      }
    });
    this.updateUI("[ Bereken de waarde ]", "#ffffff", false);
  },

  spawnMedicationOnCart() {
    const cup = document.querySelector("#med-cup");
    if (!cup) return;

    const spawnPos = { x: 0.8, y: 1.2, z: 0.8 };
    cup.removeAttribute("dynamic-body");
    cup.setAttribute("visible", "true");
    cup.setAttribute("position", spawnPos);
    cup.setAttribute("rotation", "0 0 0");

    cup.object3D.position.set(spawnPos.x, spawnPos.y, spawnPos.z);

    let label = cup.querySelector("a-text");
    if (!label) {
      label = document.createElement("a-text");
      label.setAttribute("align", "center");
      label.setAttribute("width", "0.8"); // Adjust size
      label.setAttribute("position", "0 0.12 0"); // Float above the cup
      label.setAttribute("geometry", {
        primitive: "plane",
        width: 0.3,
        height: 0.08,
      });
      label.setAttribute("material", {
        color: "#000",
        opacity: 0.4,
        transparent: true,
      });
      cup.appendChild(label);
    }

    // Set the name (e.g., "ACETYLCYSTEINE" or "SLIJMOPLOSSING")
    label.setAttribute("value", this.current.id);
    label.setAttribute(
      "color",
      this.current.id === "ACETYLCYSTEINE" ? "#4da6ff" : "#ffffff",
    );
    // ------------------------

    setTimeout(() => {
      cup.setAttribute("dynamic-body", {
        mass: 0.5,
        shape: "box",
        width: 0.05,
        height: 0.05,
        depth: 0.05,
      });

      if (cup.body) {
        cup.body.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
        cup.body.velocity.set(0, 0, 0);
        cup.body.angularVelocity.set(0, 0, 0);
      }
    }, 500);

    const color = this.current.id === "ACETYLCYSTEINE" ? "#4da6ff" : "#a6a6a6";
    cup.setAttribute("water-logic", { color: color });
  },

  spawnInjectionStation() {
    const bottleConfigs = [
      { id: "bottle-1pc", pct: 1, color: "#ff4444", x: 0.55 }, // Red
      { id: "bottle-2pc", pct: 2, color: "#c11fbb", x: 0.66 }, // Purple
      { id: "bottle-5pc", pct: 5, color: "#4444ff", x: 0.77 }, // Blue
    ];

    bottleConfigs.forEach((config) => {
      const bottle = document.querySelector(`#${config.id}`);

      if (bottle) {
        const pos = { x: config.x, y: 1.1, z: 0.6 };
        this.resetPhysicalObject(bottle, pos);

        // 1. Keep the entity visible so the GLTF and Text stay on screen
        bottle.setAttribute("visible", "true");

        // 2. Hide ONLY the box geometry (the 'mesh')
        // We wait a tiny bit to ensure the mesh is loaded
        const mesh = bottle.getObject3D("mesh");
        if (mesh) {
          mesh.visible = false;
        }

        // 3. Update the Text label (Value + Color + Background)
        const textEl = bottle.querySelector("a-text");
        if (textEl) {
          textEl.setAttribute("value", `${config.pct}%`);
          textEl.setAttribute("color", config.color);

          // Add a semi-transparent background plane to the text
          textEl.setAttribute("geometry", {
            primitive: "plane",
            width: 0.6, // Adjust based on text size
            height: 0.3,
          });

          textEl.setAttribute("material", {
            color: "#000",
            opacity: 0.5,
            transparent: true,
          });

          // Ensure text sits slightly in front of its own background
          textEl.setAttribute("align", "center");
        }

        bottle.dataset.pct = config.pct;
      }
    });
  },

  // Helper to safely move physics objects
  resetPhysicalObject(el, pos) {
    el.removeAttribute("dynamic-body");
    el.removeAttribute("static-body");
    el.setAttribute("visible", "true");
    el.setAttribute("position", pos);
    el.setAttribute("rotation", "0 0 0");

    setTimeout(() => {
      el.setAttribute("dynamic-body", "mass: 0.5; shape: box;");
      if (el.body) {
        el.body.position.set(pos.x, pos.y, pos.z);
        el.body.velocity.set(0, 0, 0);
      }
    }, 50);
  },

  updateUI(status, color = "#ffffff", showRationale = false) {
    const panelScenario = document.querySelector("#panel-scenario");
    const panelRationale = document.querySelector("#panel-rationale");
    const statusEl = document.querySelector("#panel-status");
    const nextBtn = document.querySelector("#next-question-btn");

    let currentTaskText = this.awaitingPhysicalAction
      ? this.current.task
      : this.current.mathTask || this.current.task;

    if (this.current.isPump && !this.awaitingPhysicalAction && !showRationale) {
      currentTaskText += `\n\n[ Voer de juiste snelheid in via de infuuspomp en druk vervolgens op 'OK' ]`;
    }

    let leftText = `OPDRACHT\n\n${this.current.patient}\n\n${currentTaskText}`;
    if (panelScenario) {
      panelScenario.setAttribute("value", leftText);

      if (showRationale) {
        // --- ANIMATED SHIFT TO THE LEFT ---
        panelScenario.setAttribute("animation", {
          property: "position",
          to: "-1 0.6 0.02",
          dur: 500,
          easing: "easeOutQuad",
        });
        panelScenario.setAttribute("align", "left");
        panelScenario.setAttribute("anchor", "left");
        panelScenario.setAttribute("width", "1");
        panelScenario.setAttribute("wrap-count", "25");
      } else {
        // --- ANIMATED SHIFT TO CENTER ---
        panelScenario.setAttribute("animation", {
          property: "position",
          to: "0 0.6 0.02",
          dur: 500,
          easing: "easeOutQuad",
        });
        panelScenario.setAttribute("align", "center");
        panelScenario.setAttribute("anchor", "center");
        panelScenario.setAttribute("width", "1.9");
        panelScenario.setAttribute("wrap-count", "35");
      }
    }

    if (showRationale) {
      const isCorrect = !status.includes("Fout");
      const prefix = isCorrect ? "✅ GOED" : "❌ FOUT";

      let rightText = `${prefix}\n${status}\n\n`;
      rightText += `ANTWOORD:\n${this.current.answer} ${this.current.unit}\n\n`;
      rightText += `BEREKENING:\n${this.current.rationale}`;

      if (panelRationale) {
        panelRationale.setAttribute("value", rightText);
        panelRationale.setAttribute("color", isCorrect ? "#00ff00" : "#ff4444");
        panelRationale.setAttribute("visible", "true");

        // --- FADE IN ANIMATION FOR RATIONALE ---
        panelRationale.removeAttribute("animation");
        panelRationale.setAttribute("animation", {
          property: "text.opacity",
          from: 0,
          to: 1,
          dur: 800,
          easing: "linear",
        });
      }

      if (statusEl) statusEl.setAttribute("visible", "false");

      if (nextBtn) {
        nextBtn.setAttribute("visible", "true");
        const btnPlane = nextBtn.querySelector("a-plane") || nextBtn;
        btnPlane.classList.add("interactable");
      }

      if (this.current.isPump) {
        const isCorrect = !status.includes("Fout");
        this.updateIvPump(
          this.current.answer,
          isCorrect ? "FINISHED" : "ERROR",
          isCorrect ? "#00ff00" : "#ff0000",
        );
      }
    } else {
      if (panelRationale) {
        panelRationale.removeAttribute("animation");
        panelRationale.setAttribute("visible", "false");
        panelRationale.setAttribute("text", "opacity", 0);
      }

      if (statusEl) {
        statusEl.setAttribute("visible", "true");
        statusEl.setAttribute("value", status);
        statusEl.setAttribute("color", color);
        StatsManager.showStatus(status, color);
      }
      if (nextBtn) {
        nextBtn.setAttribute("visible", "false");
        const btnPlane = nextBtn.querySelector("a-plane") || nextBtn;
        btnPlane.classList.remove("interactable");
      }
    }
  },

  check(input) {
    this.attempts++;

    if (this.awaitingPhysicalAction) {
      this.updateUI("Plaats eerst de flacon/het object!", "#ffcc00", false);
      return;
    }

    if (this.current.isPump) {
      this.updateIvPump(input, "CHECKING...");
    }

    if (Math.abs(input - this.current.answer) < 0.01) {
      this.awaitingPhysicalAction = false;
      if (typeof StatsManager !== "undefined") StatsManager.addPoints();
      this.updateUI("Goed!", "#00ff88", true);
      if (GameManager.uiSoundEntity)
        GameManager.uiSoundEntity.components.sound.playSound();
    } else if (this.attempts >= 2) {
      this.awaitingPhysicalAction = false;
      if (typeof StatsManager !== "undefined") StatsManager.removePoints();
      this.updateUI("Fout - Bekijk de berekening", "#ff6b6b", true);
    } else {
      this.updateUI("Probeer opnieuw (1/2)", "orange", false);
    }
  },
};
